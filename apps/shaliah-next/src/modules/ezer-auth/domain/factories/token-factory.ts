/**
 * Token factory functions for Ezer authentication
 * Feature: 005-ezer-login
 */

import { randomUUID } from 'crypto'

/**
 * Generates a cryptographically secure authentication token
 * Uses crypto.randomUUID() for security and uniqueness
 * Removes hyphens for cleaner URLs (32-character alphanumeric string)
 */
export function generateAuthToken(): string {
  return randomUUID().replace(/-/g, '')
}

/**
 * Calculates token expiration time (15 minutes from now)
 */
export function calculateExpiration(): Date {
  return new Date(Date.now() + 15 * 60 * 1000) // 15 minutes in milliseconds
}