import { z } from 'zod'
import { logger } from '../logger'

// Environment variables schema
const envSchema = z.object({
  // Bot Configuration
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  
  // Supabase Configuration
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  
  // Shaliah Configuration
  SHALIAH_BASE_URL: z
    .url('SHALIAH_BASE_URL must be a valid URL')
    .optional(),
  
  // Dependency Check Configuration
  DEPENDENCY_CHECK_TIMEOUT: z
    .string()
    .regex(/^\d+$/, 'DEPENDENCY_CHECK_TIMEOUT must be a number')
    .optional(),
  
  // Environment
  NODE_ENV: z.enum(['production', 'development', 'test']).default('development'),
  
  // Optional: Sentry Configuration
  SENTRY_DSN: z.string().url().optional(),
}).refine(
  (data) => {
    // SHALIAH_BASE_URL is required in production mode
    if (data.NODE_ENV === 'production') {
      return data.SHALIAH_BASE_URL && data.SHALIAH_BASE_URL.trim() !== ''
    }
    return true
  },
  {
    message: 'SHALIAH_BASE_URL environment variable is required in production mode',
    path: ['SHALIAH_BASE_URL'],
  }
)

// Environment configuration getter
function getEnv() {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    logger.error('❌ Invalid environment variables:', {
      errors: parsed.error.format(),
    })
    throw new Error('Invalid environment configuration')
  }

  const data = parsed.data

  // Construct health URL from base URL
  const shaliahHealthUrl = data.SHALIAH_BASE_URL ? `${data.SHALIAH_BASE_URL}/api/health` : ''

  // Parse timeout with fallback
  const dependencyCheckTimeout = data.DEPENDENCY_CHECK_TIMEOUT
    ? parseInt(data.DEPENDENCY_CHECK_TIMEOUT, 10)
    : 2000

  // Validate timeout
  if (
    isNaN(dependencyCheckTimeout) ||
    dependencyCheckTimeout < 1000 ||
    dependencyCheckTimeout > 30000
  ) {
    logger.warn('Invalid DEPENDENCY_CHECK_TIMEOUT, using default 2000ms', {
      provided: data.DEPENDENCY_CHECK_TIMEOUT,
      default: 2000,
    })
  }

  // Determine if dependency checks are enabled
  const dependencyChecksEnabled = data.NODE_ENV === 'production' && !!data.SHALIAH_BASE_URL

  // Log configuration warnings for non-production
  if (!data.SHALIAH_BASE_URL && data.NODE_ENV !== 'production') {
    logger.warn('SHALIAH_BASE_URL not configured - dependency checks will be disabled', {
      nodeEnv: data.NODE_ENV,
    })
  }

  return {
    bot: {
      token: data.BOT_TOKEN,
    },
    supabase: {
      url: data.SUPABASE_URL,
      anonKey: data.SUPABASE_ANON_KEY,
      serviceRoleKey: data.SUPABASE_SERVICE_ROLE_KEY,
    },
    shaliah: {
      baseUrl: data.SHALIAH_BASE_URL || '',
      healthUrl: shaliahHealthUrl,
    },
    dependency: {
      checkTimeout: dependencyCheckTimeout,
      checksEnabled: dependencyChecksEnabled,
    },
    app: {
      environment: data.NODE_ENV,
      isDevelopment: data.NODE_ENV === 'development',
      isProduction: data.NODE_ENV === 'production',
      isTest: data.NODE_ENV === 'test',
    },
    sentry: {
      dsn: data.SENTRY_DSN,
    },
  }
}

// Export environment configuration
export const env = getEnv()

// Export getter for dynamic reloading (useful for tests)
export const getEnvConfig = getEnv

// Type exports
export type Env = ReturnType<typeof getEnv>
export type BotConfig = Env['bot']
export type SupabaseConfig = Env['supabase']
export type ShaliahConfig = Env['shaliah']
export type DependencyConfig = Env['dependency']
export type AppConfig = Env['app']
export type SentryConfig = Env['sentry']