import { Composer } from "grammy";
import { Context } from "../types/context";
import { logger } from "../logger";
import { dependencyConfig } from "../lib/config";
import { createHealthCheckClient } from "../lib/health-check";

/**
 * Dependency middleware for checking Shaliah availability
 * 
 * This middleware ensures that Ezer bot can only operate when Shaliah is online.
 * In development/test mode (NODE_ENV=development or NODE_ENV=test), 
 * this check is bypassed.
 */
export const dependencyComposer = new Composer<Context>();

// Create health check client
const healthCheckClient = createHealthCheckClient();

/**
 * Dependency middleware that checks Shaliah availability before processing messages
 */
dependencyComposer.use(async (ctx, next) => {
  // Skip dependency check if disabled or in development/test mode
  if (!dependencyConfig.dependencyChecksEnabled) {
    logger.info("Dependency checks disabled, bypassing check", { 
      nodeEnv: dependencyConfig.nodeEnv,
      dependencyChecksEnabled: dependencyConfig.dependencyChecksEnabled,
    });
    return next();
  }

  // Check if Shaliah is online
  const healthResult = await healthCheckClient.checkHealth();
  
  if (!healthResult.isOnline) {
    logger.warn("Shaliah is offline, blocking user interaction", {
      userId: ctx.from?.id,
      username: ctx.from?.username,
      error: healthResult.error,
      responseTime: healthResult.responseTime,
    });

    // Send offline message to user
    await ctx.reply(ctx.t("shaliah-offline-message"));
    return; // Don't call next() - stop processing
  }

  // Shaliah is online, continue processing
  logger.info("Shaliah is online, processing message", {
    userId: ctx.from?.id,
    username: ctx.from?.username,
    responseTime: healthResult.responseTime,
  });
  
  return next();
});
