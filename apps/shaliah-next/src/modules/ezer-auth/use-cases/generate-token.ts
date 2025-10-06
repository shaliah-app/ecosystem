/**
 * Use Case: Generate Authentication Token
 * Feature: 005-ezer-login
 *
 * Generates a new authentication token for linking Shaliah account to Ezer bot.
 * Invalidates any existing active tokens for the user before creating new one.
 */

import { authTokens } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { generateAuthToken as generateTokenValue, calculateExpiration } from '../domain/factories/token-factory'
import { generateDeepLink } from '../domain/services/deep-link-service'
import { logger } from '@/lib/logger'
import { getDatabaseInstance } from '@/lib/database-injection'

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
    // Get database instance (allows injection for testing)
    const database = getDatabaseInstance('generate-token')
    
    // Step 1: Generate new token value and calculate expiration
    const token = generateTokenValue()
    const expiresAt = calculateExpiration()

    logger.info('ezer.auth.token_generation_started', {
      userId,
      expiresAt: expiresAt.toISOString(),
    })

    // Step 2: Invalidate all existing active, unused tokens for this user
    // This ensures only one active token per user at a time
    await database
      .update(authTokens)
      .set({ isActive: false })
      .where(
        and(
          eq(authTokens.userId, userId),
          eq(authTokens.isActive, true),
          isNull(authTokens.usedAt)
        )
      )

    // Step 3: Insert the new token record
    await database.insert(authTokens).values({
      token,
      userId,
      expiresAt,
      isActive: true,
    })

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
