import { Composer } from "grammy";
import { Context } from "../types/context";
import { logger } from "../logger";
import { getEnvConfig } from "../lib/env";
import { createHealthCheckClient } from "../lib/health-check";

/**
 * Dependency middleware for checking Shaliah availability
 *
 * This middleware ensures that Ezer bot can only operate when Shaliah is online.
 * In development/test mode (NODE_ENV=development or NODE_ENV=test),
 * this check is bypassed.
 */
export const dependencyComposer = new Composer<Context>();

/**
 * Export the middleware function for testing
 */
export const dependencyMiddleware = async (
  ctx: Context,
  next: () => Promise<void>,
) => {
  const startTime = Date.now();
  const userId = ctx.from?.id;
  const username = ctx.from?.username;
  const messageId = ctx.message?.message_id;

  try {
    // Load current configuration (always reload to support dynamic environment changes in tests)
    const config = getEnvConfig();

    // Skip dependency check if disabled or in development/test mode
    if (!config.dependency.checksEnabled) {
      logger.info("Dependency checks disabled, bypassing check", {
        nodeEnv: config.app.environment,
        dependencyChecksEnabled: config.dependency.checksEnabled,
        userId,
        username,
        messageId,
      });
      return next();
    }

    logger.info("Starting dependency check", {
      userId,
      username,
      messageId,
      healthUrl: config.shaliah.healthUrl,
      timeout: config.dependency.checkTimeout,
    });

    // Check if Shaliah is online
    const healthCheckClient = createHealthCheckClient();
    const healthResult = await healthCheckClient.checkHealth();
    const checkDuration = Date.now() - startTime;

    if (!healthResult.isOnline) {
      logger.warn("Shaliah is offline, blocking user interaction", {
        userId,
        username,
        messageId,
        error: healthResult.error,
        responseTime: healthResult.responseTime,
        checkDuration,
        healthUrl: config.shaliah.healthUrl,
      });

      try {
        // Send offline message to user
        const offlineMessage = ctx.t
          ? ctx.t("shaliah-offline-message")
          : "🔧 *Shaliah is currently offline*\n\nI need Shaliah to be running to help you. Please try again later.";
        await ctx.reply(offlineMessage, { parse_mode: "Markdown" });
        logger.info("Offline message sent to user", {
          userId,
          username,
          messageId,
        });
      } catch (replyError) {
        logger.error("Failed to send offline message to user", {
          userId,
          username,
          messageId,
          error:
            replyError instanceof Error
              ? replyError.message
              : String(replyError),
        });
      }
      return; // Don't call next() - stop processing
    }

    // Shaliah is online, continue processing
    logger.info("Shaliah is online, processing message", {
      userId,
      username,
      messageId,
      responseTime: healthResult.responseTime,
      checkDuration,
    });

    return next();
  } catch (error) {
    const checkDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Reload config in case it was not loaded before the error
    const config = getEnvConfig();

    logger.error("Dependency check failed with unexpected error", {
      userId,
      username,
      messageId,
      error: errorMessage,
      checkDuration,
      healthUrl: config.shaliah.healthUrl,
    });

    try {
      // Send error message to user
      const offlineMessage = ctx.t
        ? ctx.t("shaliah-offline-message")
        : "🔧 *Shaliah is currently offline*\n\nI need Shaliah to be running to help you. Please try again later.";
      await ctx.reply(offlineMessage, { parse_mode: "Markdown" });
      logger.info("Error fallback message sent to user", {
        userId,
        username,
        messageId,
      });
    } catch (replyError) {
      logger.error("Failed to send error fallback message to user", {
        userId,
        username,
        messageId,
        error:
          replyError instanceof Error ? replyError.message : String(replyError),
      });
    }

    return; // Don't call next() - stop processing
  }
};

/**
 * Dependency middleware that checks Shaliah availability before processing messages
 */
dependencyComposer.use(dependencyMiddleware);
