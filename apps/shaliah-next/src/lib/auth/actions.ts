/**
 * Authentication server actions
 * Feature: 005-ezer-login extension
 *
 * Server actions for authentication operations including sign-out with Telegram unlinking
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { userProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { getDatabaseInstance } from '@/lib/database-injection'

/**
 * Sign out user from Supabase and unlink Telegram account
 *
 * This extends the standard Supabase sign-out to also remove the Telegram linkage
 * by setting telegram_user_id to NULL. This ensures that when a user signs out
 * from Shaliah, their Ezer bot session is also invalidated.
 */
export async function signOutAction() {
  try {
    const supabase = await createClient()
    
    // Get current user before signing out
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      try {
        // Get database instance (allows injection for testing)
        const database = getDatabaseInstance('sign-out')
        
        // Unlink Telegram account by setting telegram_user_id to NULL
        await database
          .update(userProfiles)
          .set({ telegramUserId: null })
          .where(eq(userProfiles.userId, user.id))

        logger.info('ezer.auth.signout_propagated', {
          userId: user.id,
          action: 'telegram_unlinked',
        })
      } catch (dbError) {
        // Log the error but don't block sign-out
        // Sign-out should succeed even if Telegram unlinking fails
        logger.error('ezer.auth.signout_unlink_failed', {
          userId: user.id,
          error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        })
      }
    }

    // Proceed with standard Supabase sign-out
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      logger.error('ezer.auth.signout_failed', {
        userId: user?.id,
        error: error.message,
      })
      throw error
    }

    logger.info('ezer.auth.signout_completed', {
      userId: user?.id,
    })
    
  } catch (error) {
    logger.error('ezer.auth.signout_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    
    // Re-throw to let the caller handle it
    throw error
  }
  
  // Redirect to home page after successful sign-out
  redirect('/')
}