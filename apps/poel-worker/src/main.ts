import { config } from "./config.ts";
import { logger } from "./utils/logger.ts";
import { queueManager } from "./queue/index.ts";
import { dispatchJob, registerJobHandler } from "./jobs/index.ts";
import {
  jobType as processNewRecordType,
  process,
  schema as processNewRecordSchema,
} from "./jobs/processNewRecord.ts";
import {
  jobType as cleanupAuthTokensType,
  process as cleanupProcess,
  schema as cleanupAuthTokensSchema,
} from "./jobs/cleanupAuthTokens.ts";

// Register job handlers
registerJobHandler({
  type: processNewRecordType,
  schema: processNewRecordSchema,
  handler: process,
});

registerJobHandler({
  type: cleanupAuthTokensType,
  schema: cleanupAuthTokensSchema,
  handler: cleanupProcess,
});

// Health check server
let healthServer: { shutdown: () => Promise<void> } | null = null;

async function startHealthServer() {
  healthServer = Deno.serve(
    { port: config.healthCheckPort },
    (req: Request) => {
      if (req.url.endsWith("/health")) {
        return new Response(
          JSON.stringify({
            status: "healthy",
            timestamp: new Date().toISOString(),
            service: "poel-worker",
            environment: config.environment,
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return new Response("Not Found", { status: 404 });
    },
  );

  logger.info("Health check server started", { port: config.healthCheckPort });
  return healthServer;
}

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, initiating graceful shutdown...`);

  try {
    await queueManager.stop();
    logger.info("Queue manager stopped");

    // Close health server if it exists
    if (healthServer) {
      await healthServer.shutdown();
      logger.info("Health server stopped");
    }

    logger.info("Graceful shutdown completed");
    Deno.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error during graceful shutdown", { error: errorMessage });
    Deno.exit(1);
  }
}

// Register shutdown handlers
Deno.addSignalListener("SIGINT", () => gracefulShutdown("SIGINT"));
Deno.addSignalListener("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle uncaught exceptions
globalThis.addEventListener("unhandledrejection", (event) => {
  logger.error("Unhandled rejection", { reason: event.reason });
  event.preventDefault();
});

globalThis.addEventListener("error", (event) => {
  logger.error("Uncaught error", { error: event.error });
  event.preventDefault();
});

// Start the application
async function main() {
  try {
    logger.info("🚀 Starting Poel Worker...");

    // Start health check server
    const healthServer = await startHealthServer();

    // Start queue processing
    await queueManager.start();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to start worker", { error: errorMessage });
    Deno.exit(1);
  }
}

// Run the application
if (import.meta.main) {
  main();
}
