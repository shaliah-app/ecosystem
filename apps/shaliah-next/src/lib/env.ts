import { z } from 'zod'

// Environment variable schema validation
const envSchema = z.object({
  // Supabase Configuration (Required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // Database Configuration (Required)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Telegram Bot Configuration (Required for Ezer integration)
  TELEGRAM_BOT_USERNAME: z.string().min(1, 'TELEGRAM_BOT_USERNAME is required'),

  // Optional Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SENTRY_DSN: z.string().url().optional(),
})

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format())
  throw new Error('Invalid environment configuration')
}

// Export validated environment constants
export const env = {
  // Supabase
  supabase: {
    url: parsedEnv.data.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: parsedEnv.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: parsedEnv.data.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Database
  database: {
    url: parsedEnv.data.DATABASE_URL,
  },

  // Telegram Bot
  telegram: {
    botUsername: parsedEnv.data.TELEGRAM_BOT_USERNAME,
  },

  // Application
  app: {
    environment: parsedEnv.data.NODE_ENV,
    isDevelopment: parsedEnv.data.NODE_ENV === 'development',
    isProduction: parsedEnv.data.NODE_ENV === 'production',
    isTest: parsedEnv.data.NODE_ENV === 'test',
  },

  // Monitoring
  sentry: {
    dsn: parsedEnv.data.SENTRY_DSN,
  },
} as const

// Type exports for better TypeScript support
export type Env = typeof env