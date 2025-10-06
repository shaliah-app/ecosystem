/**
 * Deep link service for generating Telegram bot links
 * Feature: 005-ezer-login
 */

/**
 * Generates a deep link URL for the Telegram bot
 * Format: https://t.me/{bot_username}?start={token}
 *
 * @param token - The authentication token to include in the deep link
 * @returns The complete deep link URL
 * @throws Error if TELEGRAM_BOT_USERNAME environment variable is not set
 */
export function generateDeepLink(token: string): string {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME

  if (!botUsername) {
    throw new Error('TELEGRAM_BOT_USERNAME environment variable is required')
  }

  // Validate token format (should be 32 alphanumeric characters)
  if (!/^[a-zA-Z0-9]{32}$/.test(token)) {
    throw new Error('Invalid token format')
  }

  return `https://t.me/${botUsername}?start=${token}`
}