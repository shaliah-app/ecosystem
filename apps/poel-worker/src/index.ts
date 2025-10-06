import { boss, stopBoss } from "./boss.js";
import { processNewRecord } from "./handlers/processNewRecord.js";
import { cleanupAuthTokens } from "./handlers/cleanupAuthTokens.js";
import { logger } from "./logger.js";

// Job handler registry - maps job names to handler functions
const jobHandlers = {
  "process_new_record": processNewRecord,
  "cleanup_auth_tokens": cleanupAuthTokens,
  // Add more job handlers here as needed:
  // 'process_audio_fingerprint': processAudioFingerprint,
  // 'separate_audio_stems': separateAudioStems,
} as const;

// Type for job names
type JobName = keyof typeof jobHandlers;

async function startWorker() {
  try {
    logger.info("🚀 Starting Yesod Worker...");

    // Start pg-boss
    await boss.start();
    logger.info("✅ Connected to database and started job queue");

    // Register all job handlers
    for (const [jobName, handler] of Object.entries(jobHandlers)) {
      await boss.work(jobName as JobName, handler);
      logger.info(`📋 Registered handler for job: ${jobName}`);
    }

    // Schedule recurring jobs
    await boss.schedule("cleanup_auth_tokens", "* * * * *"); // Every minute for testing; adjust to e.g., '0 */6 * * *' for every 6 hours
    logger.info("📅 Scheduled recurring job: cleanup_auth_tokens");

    logger.info("🎯 Worker is ready and listening for jobs!");
    logger.info("Press Ctrl+C to stop the worker gracefully");
  } catch (error) {
    logger.captureException(error as Error, { operation: "startWorker" });
    process.exit(1);
  }
}

// Graceful shutdown handlers
async function gracefulShutdown(signal: string) {
  logger.info(`🛑 Received ${signal}, initiating graceful shutdown...`);

  try {
    // Stop accepting new jobs
    await boss.stop({ graceful: true });
    logger.info("✅ Worker stopped accepting new jobs");

    // Give running jobs time to complete (configurable)
    const gracePeriodMs = 10000; // 10 seconds
    logger.info(
      `⏳ Waiting up to ${
        gracePeriodMs / 1000
      }s for running jobs to complete...`,
    );

    // Wait for running jobs to complete
    await new Promise((resolve) => setTimeout(resolve, gracePeriodMs));

    logger.info("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    logger.captureException(error as Error, { operation: "gracefulShutdown" });
    process.exit(1);
  }
}

// Register shutdown handlers
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.captureException(error, { type: "uncaughtException" });
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.captureException(new Error(`Unhandled Rejection: ${reason}`), {
    type: "unhandledRejection",
    promise: promise.toString(),
    reason,
  });
  process.exit(1);
});

// Start the worker
startWorker();
