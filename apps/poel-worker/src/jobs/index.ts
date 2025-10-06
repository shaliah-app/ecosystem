import type { JobContext, JobHandlerEntry } from "../types/job.ts";
import { logger } from "../utils/logger.ts";
import { supabase } from "../supabase.ts";
import { config } from "../config.ts";

// Job handler registry
const jobHandlers = new Map<string, JobHandlerEntry>();

// Register a job handler
export function registerJobHandler(entry: JobHandlerEntry) {
  jobHandlers.set(entry.type, entry);
  logger.info("Job handler registered", { type: entry.type });
}

// Get all registered job types
export function getRegisteredJobTypes(): string[] {
  return Array.from(jobHandlers.keys());
}

// Dispatch a job to its handler
export async function dispatchJob(
  jobId: string,
  type: string,
  payload: any,
): Promise<void> {
  const handlerEntry = jobHandlers.get(type);

  if (!handlerEntry) {
    throw new Error(`No handler registered for job type: ${type}`);
  }

  // Validate payload with Zod schema
  const validationResult = handlerEntry.schema.safeParse(payload);
  if (!validationResult.success) {
    throw new Error(
      `Invalid payload for job type ${type}: ${validationResult.error.message}`,
    );
  }

  // Create job context
  const jobContext: JobContext = {
    jobId,
    logger: logger.child({ jobId, jobType: type }),
    supabase,
  };

  // Execute handler with timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Job timeout after ${config.jobTimeoutMs}ms`)),
      config.jobTimeoutMs,
    );
  });

  try {
    await Promise.race([
      handlerEntry.handler(validationResult.data, jobContext),
      timeoutPromise,
    ]);

    logger.info("Job completed successfully", { jobId, type });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Job failed", { jobId, type, error: errorMessage });
    throw error;
  }
}
