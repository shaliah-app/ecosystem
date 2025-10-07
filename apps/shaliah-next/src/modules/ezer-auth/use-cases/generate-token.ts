/**
 * Use Case: Generate Authentication Token
 * Feature: 005-ezer-login
 *
 * Generates a new authentication token for linking Shaliah account to Ezer bot.
 * Invalidates any existing active tokens for the user before creating new one.
 */

'use server'

import { createClient } from '@supabase/supabase-js'
import { generateAuthToken as generateTokenValue, calculateExpiration } from '../domain/factories/token-factory'
import { generateDeepLink } from '../domain/services/deep-link-service'
import { logger } from '@/lib/logger'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export interface GenerateTokenResult {
  token: string
  expiresAt: Date
  deepLink: string
}

/**
 * Generates authentication token for a user
 *
 * @param userId - The authenticated user's ID from Supabase auth
 * @returns Token details including the token string, expiration, and deep link
 * @throws Error if database operation fails
 */
export async function generateAuthTokenUseCase(userId: string): Promise<GenerateTokenResult> {
  try {
    // Step 1: Generate new token value and calculate expiration
    const token = generateTokenValue()
    const expiresAt = calculateExpiration()

    logger.info('ezer.auth.token_generation_started', {
      userId,
      expiresAt: expiresAt.toISOString(),
    })

    // Step 2: Invalidate all existing active, unused tokens for this user
    // This ensures only one active token per user at a time
    await supabase
      .from('auth_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('used_at', null)

    // Step 3: Insert the new token record
    const { error: insertError } = await supabase
      .from('auth_tokens')
      .insert({
        token,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })

    if (insertError) throw insertError

    // Step 4: Generate deep link for Telegram bot
    const deepLink = generateDeepLink(token)

    logger.info('ezer.auth.token_generated', {
      userId,
      tokenId: token.substring(0, 8) + '...', // Log only first 8 chars for security
      expiresAt: expiresAt.toISOString(),
    })

    return {
      token,
      expiresAt,
      deepLink,
    }
  } catch (error) {
    logger.error('ezer.auth.token_generation_failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    throw new Error('Failed to generate authentication token')
  }
}
