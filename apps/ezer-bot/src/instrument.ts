import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { env } from "./lib/env";

// Ensure to call this before requiring any other modules!
if (env.sentry.dsn) {
  Sentry.init({
    dsn: env.sentry.dsn,

    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#sendDefaultPii
    sendDefaultPii: true,

    integrations: [
      // Add our Profiling integration
      nodeProfilingIntegration(),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for tracing.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    // Set profilesSampleRate to 1.0 to profile 100%
    // of sampled transactions.
    // This is relative to tracesSampleRate
    profilesSampleRate: 1.0,

    environment: env.app.environment || 'development',
  });
}