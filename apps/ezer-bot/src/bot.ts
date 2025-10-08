import { env } from "./lib/env.js";
import { Bot } from "grammy";
import { run, sequentialize } from "@grammyjs/runner";
import type { Context } from "./types/context.js";
import welcomeComposer from "./modules/menu.js";
import { authComposer } from "./modules/authentication/authentication.js";
import unlinkComposer from "./modules/unlink.js";
import { dependencyComposer } from "./modules/dependency.js";
import { logger, logBotError } from "./logger.js";
import { session } from "./modules/session";
import { i18n } from "./modules/i18n.js";

// Create the bot instance
export const bot = new Bot<Context>(env.bot.token);

bot.use(session);

bot.use(i18n);

const constraint = (ctx: Context) => [
  String(ctx.chat?.id),
  String(ctx.from?.id),
];

// Sequentialize middleware to ensure updates from the same chat are processed in order
bot.use(sequentialize(constraint));

// Register modules in order: sequentialize → session → i18n → dependency → auth-link → others
bot.use(dependencyComposer);
bot.use(authComposer);
bot.use(unlinkComposer);
bot.use(welcomeComposer);

// Global error handler
bot.catch(logBotError);

// Setup graceful shutdown handlers
const shutdown = async (signal: string) => {
  logger.info(`🛑 Received ${signal}, shutting down gracefully...`);

  try {
    // Stop the bot runner
    await bot.stop();
    logger.info("✅ Bot stopped successfully");
  } catch (error) {
    logger.error("❌ Error during bot shutdown", { error });
  }

  process.exit(0);
};

// Register shutdown handlers
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("💥 Uncaught exception", { error });
  shutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("💥 Unhandled promise rejection", { reason, promise });
  shutdown("unhandledRejection");
});

// Start the bot with the high-performance runner
logger.info("🤖 Starting Ezer Bot...");

run(bot);

logger.info("✅ Ezer Bot is running!");
