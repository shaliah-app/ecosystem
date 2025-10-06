import { supabase } from "../supabase.ts";
import { logger } from "../utils/logger.ts";

// PGMQ message structure from Supabase Queues
interface PGMQMessage {
  msg_id: number;
  message: any;
  read_ct: number;
  enqueued_at: string;
  vt: string; // visibility timeout
}

// Job queue interface for the worker
export interface JobMessage {
  id: string; // msg_id as string for compatibility
  type: string;
  payload: any;
  readCount: number;
}

export class SupabaseQueueManager {
  private isRunning = false;
  private pollInterval: number;
  private queueName: string;

  constructor(queueName: string = 'background_tasks', pollIntervalMs: number = 5000) {
    this.queueName = queueName;
    this.pollInterval = pollIntervalMs;
  }

  async start() {
    this.isRunning = true;
    logger.info("Starting Supabase Queues consumer", {
      queueName: this.queueName,
      pollInterval: this.pollInterval
    });

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

  stop() {
    this.isRunning = false;
    logger.info("Stopping Supabase Queues consumer", { queueName: this.queueName });
  }

  private async processNextJob() {
    // Pop message from Supabase Queues (PGMQ)
    const { data, error } = await supabase
      .schema('pgmq_public')
      .rpc('pop', { queue_name: this.queueName });

    if (error) {
      logger.error("Failed to pop message from queue", {
        queueName: this.queueName,
        error: error.message
      });
      return;
    }

    if (!data || data.length === 0) {
      return; // No messages available
    }

    const pgmqMessage = data[0] as PGMQMessage;

    // Transform PGMQ message to our JobMessage format
    const jobMessage: JobMessage = {
      id: pgmqMessage.msg_id.toString(),
      type: pgmqMessage.message.type,
      payload: pgmqMessage.message.payload,
      readCount: pgmqMessage.read_ct,
    };

    try {
      logger.info("Processing job", {
        msgId: jobMessage.id,
        type: jobMessage.type,
        readCount: jobMessage.readCount
      });

      // Dispatch to job handler
      const { dispatchJob } = await import("../jobs/index.ts");

      try {
        await dispatchJob(jobMessage.id, jobMessage.type, jobMessage.payload);

        // Message is automatically removed by pop() on success
        logger.info("Job completed successfully", {
          msgId: jobMessage.id,
          type: jobMessage.type,
        });

      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);

        // Handle job failure with retry logic
        await this.handleJobFailure(jobMessage, errorMessage);

        logger.warn("Job failed, retry scheduled", {
          msgId: jobMessage.id,
          type: jobMessage.type,
          readCount: jobMessage.readCount,
          error: errorMessage,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      logger.error("Error processing job", {
        msgId: jobMessage.id,
        type: jobMessage.type,
        error: errorMessage,
      });
    }
  }

  private async handleJobFailure(jobMessage: JobMessage, errorMessage: string) {
    const maxRetries = 5;
    const currentReadCount = jobMessage.readCount;

    if (currentReadCount >= maxRetries) {
      // Archive failed message after max retries
      const { error: archiveError } = await supabase
        .schema('pgmq_public')
        .rpc('archive', {
          queue_name: this.queueName,
          msg_id: parseInt(jobMessage.id)
        });

      if (archiveError) {
        logger.error("Failed to archive message", {
          msgId: jobMessage.id,
          error: archiveError.message
        });
      } else {
        logger.warn("Job archived after max retries", {
          msgId: jobMessage.id,
          type: jobMessage.type,
          maxRetries,
          finalError: errorMessage,
        });
      }
    } else {
      // Re-queue with exponential backoff
      const backoffSeconds = this.calculateBackoff(currentReadCount);
      const runAt = new Date(Date.now() + backoffSeconds * 1000);

      const { error: sendError } = await supabase
        .schema('pgmq_public')
        .rpc('send', {
          queue_name: this.queueName,
          message: {
            type: jobMessage.type,
            payload: jobMessage.payload,
          },
          sleep_seconds: backoffSeconds,
        });

      if (sendError) {
        logger.error("Failed to re-queue message", {
          msgId: jobMessage.id,
          error: sendError.message
        });
      } else {
        logger.info("Job re-queued with backoff", {
          msgId: jobMessage.id,
          type: jobMessage.type,
          readCount: currentReadCount,
          backoffSeconds,
          nextRunAt: runAt.toISOString(),
        });
      }
    }
  }

  private calculateBackoff(readCount: number): number {
    // Exponential backoff: 2^readCount seconds, capped at 1 hour
    return Math.min(Math.pow(2, readCount), 3600);
  }

  // Method to enqueue a new job (for testing or manual enqueueing)
  async enqueueJob(type: string, payload: any, options: {
    sleepSeconds?: number;
  } = {}) {
    const { data, error } = await supabase
      .schema('pgmq_public')
      .rpc('send', {
        queue_name: this.queueName,
        message: { type, payload },
        sleep_seconds: options.sleepSeconds || 0,
      });

    if (error) {
      logger.error("Failed to enqueue job", { type, error: error.message });
      throw error;
    }

    logger.info("Job enqueued", { msgId: data?.[0]?.msg_id, type });
    return { msgId: data?.[0]?.msg_id };
  }
}

// Export singleton instance
export const queueManager = new SupabaseQueueManager();
