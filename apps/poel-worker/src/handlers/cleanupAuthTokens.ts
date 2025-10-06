import type { Job } from 'pg-boss'
import { Client } from 'pg'
import { logger } from '../logger.js'

// Job data interface for cleanup_auth_tokens (empty since it's a scheduled cleanup)
interface CleanupAuthTokensData {}

// Handler function for cleaning up expired auth tokens
export async function cleanupAuthTokens(job: Job<CleanupAuthTokensData>) {
  logger.info('🧹 Starting cleanup of expired auth tokens...')

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()

    // Delete expired tokens
    const result = await client.query(
      'DELETE FROM public.auth_tokens WHERE expires_at < NOW()'
    )

    logger.info(`✅ Cleaned up ${result.rowCount} expired auth tokens`)

    // Return success
    return { success: true, deletedCount: result.rowCount }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('❌ Error cleaning up auth tokens', { error: errorMessage })

    // Throw error to let pg-boss handle retries/failures
    throw new Error(`Failed to cleanup auth tokens: ${error}`)
  } finally {
    await client.end()
  }
}