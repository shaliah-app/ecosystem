import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { jobQueue } from "@yesod/shaliah-next/db/schema";
import { eq } from "drizzle-orm";
import type { Job } from "../types/job.ts";
import { config } from "../config.ts";
import { logger } from "../utils/logger.ts";

// Create database connection
const client = postgres(config.databaseUrl);
const db = drizzle(client);

export class QueueManager {
  private isRunning = false;
  private pollInterval: number;

  constructor(pollIntervalMs: number = 5000) {
    this.pollInterval = pollIntervalMs;
  }

  async start() {
    this.isRunning = true;
    logger.info("Starting queue manager", { pollInterval: this.pollInterval });

    while (this.isRunning) {
      try {
        await this.processNextJob();
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        logger.error("Error in queue processing loop", { error: errorMessage });
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, this.pollInterval));
    }
  }

  async stop() {
    this.isRunning = false;
    logger.info("Stopping queue manager");
    await client.end();
  }

  private async processNextJob() {
    // Use FOR UPDATE SKIP LOCKED to safely get next job
    const query = `
      SELECT id, type, payload, status, attempts, priority, run_at, created_at, updated_at
      FROM job_queue
      WHERE status = 'pending'
        AND (run_at IS NULL OR run_at <= NOW())
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    const result = await client.unsafe(query);

    if (result.length === 0) {
      return; // No jobs available
    }

    const job = result[0] as unknown as Job;

    try {
      // Mark job as processing
      await db
        .update(jobQueue)
        .set({
          status: "processing",
          updatedAt: new Date(),
        })
        .where(eq(jobQueue.id, job.id));

      logger.info("Job marked as processing", {
        jobId: job.id,
        type: job.type,
      });

      // Here we would dispatch to the appropriate handler
      // This will be implemented in the jobs dispatcher
      const { dispatchJob } = await import("../jobs/index.ts");

      try {
        await dispatchJob(job.id, job.type, job.payload);

        // Mark job as done
        await db
          .update(jobQueue)
          .set({
            status: "done",
            updatedAt: new Date(),
          })
          .where(eq(jobQueue.id, job.id));

        logger.info("Job completed successfully", {
          jobId: job.id,
          type: job.type,
        });
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);

        // Increment attempts and decide next status
        const newAttempts = job.attempts + 1;
        const maxAttempts = 3; // Configure this
        const nextStatus = newAttempts >= maxAttempts ? "failed" : "retrying";

        // Calculate backoff delay (exponential backoff)
        const backoffMs = Math.pow(2, newAttempts) * 1000; // 2^attempts seconds
        const runAt = new Date(Date.now() + backoffMs);

        await db
          .update(jobQueue)
          .set({
            status: nextStatus,
            attempts: newAttempts,
            runAt: nextStatus === "retrying" ? runAt : null,
            updatedAt: new Date(),
          })
          .where(eq(jobQueue.id, job.id));

        logger.warn("Job failed, scheduled for retry", {
          jobId: job.id,
          type: job.type,
          attempts: newAttempts,
          nextStatus,
          runAt: runAt.toISOString(),
          error: errorMessage,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      logger.error("Error processing job", {
        jobId: job.id,
        type: job.type,
        error: errorMessage,
      });
    }
  }

  // Method to enqueue a new job
  async enqueueJob(type: string, payload: any, options: {
    priority?: number;
    runAt?: Date;
  } = {}) {
    const newJob = {
      type,
      payload,
      priority: options.priority || 0,
      runAt: options.runAt,
    };

    const result = await db
      .insert(jobQueue)
      .values(newJob)
      .returning();

    logger.info("Job enqueued", { jobId: result[0].id, type });
    return result[0];
  }
}

// Export singleton instance
export const queueManager = new QueueManager();
