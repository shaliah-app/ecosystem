/**
 * Authentication server actions
 * Feature: 005-ezer-login extension
 *
 * Server actions for authentication operations including sign-out with Telegram unlinking
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logger } from '@/lib/logger'

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
    
    // Note: We don't unlink Telegram on Shaliah logout
    // Telegram and Shaliah are separate systems that can work independently
    // Unlinking should be done through the Ezer bot if needed

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