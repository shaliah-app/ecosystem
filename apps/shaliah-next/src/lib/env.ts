import { z } from 'zod'

// Client-side environment variables (NEXT_PUBLIC_* are available in browser)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
})

// Server-side environment variables (only available on server)
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  TELEGRAM_BOT_USERNAME: z.string().min(1, 'TELEGRAM_BOT_USERNAME is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SENTRY_DSN: z.string().url().optional(),
})

// Client-side env (safe to use in browser)
function getClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:', parsed.error.format())
    throw new Error('Invalid client environment configuration')
  }

  return {
    supabase: {
      url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  }
}

// Server-side env (only available on server)
function getServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() can only be called on the server')
  }

  const parsed = serverEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid server environment variables:', parsed.error.format())
    throw new Error('Invalid server environment configuration')
  }

  return {
    supabase: {
      serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    },
    database: {
      url: parsed.data.DATABASE_URL,
    },
    telegram: {
      botUsername: parsed.data.TELEGRAM_BOT_USERNAME,
    },
    app: {
      environment: parsed.data.NODE_ENV,
      isDevelopment: parsed.data.NODE_ENV === 'development',
      isProduction: parsed.data.NODE_ENV === 'production',
      isTest: parsed.data.NODE_ENV === 'test',
    },
    sentry: {
      dsn: parsed.data.SENTRY_DSN,
    },
  }
}

// Export client env for browser usage
export const clientEnv = getClientEnv()

// Export server env getter (will throw if called on client)
export const getEnv = getServerEnv

// Legacy export for backward compatibility (client-safe)
export const env = {
  supabase: clientEnv.supabase,
  // Server-only properties will be undefined on client
  database: typeof window === 'undefined' ? getServerEnv().database : undefined,
  telegram: typeof window === 'undefined' ? getServerEnv().telegram : undefined,
  app: typeof window === 'undefined' ? getServerEnv().app : { environment: 'development' as const, isDevelopment: true, isProduction: false, isTest: false },
  sentry: typeof window === 'undefined' ? getServerEnv().sentry : undefined,
} as const

// Type exports
export type ClientEnv = ReturnType<typeof getClientEnv>
export type ServerEnv = ReturnType<typeof getServerEnv>