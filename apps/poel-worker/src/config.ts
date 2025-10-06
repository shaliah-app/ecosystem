import { z } from 'zod'

// Environment configuration schema
const configSchema = z.object({
  databaseUrl: z.string().url(),
  supabaseUrl: z.string().url(),
  supabaseServiceRoleKey: z.string().optional(),
  sentryDsn: z.string().optional(),
  environment: z.enum(["development", "production", "test"]).default(
    "development",
  ),
  workerConcurrency: z.number().int().positive().default(2),
  jobTimeoutMs: z.number().int().positive().default(300000), // 5 minutes
  healthCheckPort: z.number().int().positive().default(8080),
});

// Load environment variables
const env = {
  databaseUrl: Deno.env.get("DATABASE_URL"),
  supabaseUrl: Deno.env.get("SUPABASE_URL"),
  supabaseServiceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  sentryDsn: Deno.env.get("SENTRY_DSN"),
  environment: Deno.env.get("NODE_ENV") || Deno.env.get("DENO_ENV") ||
    "development",
  workerConcurrency: Deno.env.get("WORKER_CONCURRENCY"),
  jobTimeoutMs: Deno.env.get("JOB_TIMEOUT_MS"),
  healthCheckPort: Deno.env.get("HEALTH_CHECK_PORT"),
};

// Parse and validate configuration
export const config = configSchema.parse({
  ...env,
  environment: env.environment === "production"
    ? "production"
    : env.environment === "test"
    ? "test"
    : "development",
  workerConcurrency: env.workerConcurrency
    ? parseInt(env.workerConcurrency)
    : undefined,
  jobTimeoutMs: env.jobTimeoutMs ? parseInt(env.jobTimeoutMs) : undefined,
  healthCheckPort: env.healthCheckPort
    ? parseInt(env.healthCheckPort)
    : undefined,
});

// Export individual config values for convenience
export const {
  databaseUrl,
  supabaseUrl,
  supabaseServiceRoleKey,
  sentryDsn,
  environment,
  workerConcurrency,
  jobTimeoutMs,
  healthCheckPort,
} = config;
