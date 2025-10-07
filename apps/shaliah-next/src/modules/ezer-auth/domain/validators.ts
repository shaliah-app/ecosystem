/**
 * Validation functions and schemas for Ezer authentication tokens
 * Feature: 005-ezer-login
 */

import { z } from 'zod'
import type { AuthToken } from './types'

/**
 * Validates if an authentication token is valid for use
 * Token is valid if:
 * - is_active is true
 * - used_at is null (not already used)
 * - expires_at is in the future
 */
export function isTokenValid(token: AuthToken): boolean {
  return (
    token.isActive === true &&
    token.usedAt === null &&
    new Date(token.expiresAt) > new Date()
  )
}

/**
 * Zod schema for AuthToken validation
 * Enforces all business rules and data integrity constraints
 */
export const authTokenSchema = z.object({
  id: z.string().uuid(),
  token: z.string()
    .length(32)
    .regex(/^[a-zA-Z0-9]+$/, 'Token must be 32 alphanumeric characters'),
  userId: z.string().uuid(),
  createdAt: z.date(),
  expiresAt: z.date().refine(
    (date) => date > new Date(),
    { message: 'Token must expire in the future' }
  ),
  usedAt: z.date().nullable(),
  isActive: z.boolean(),
})

/**
 * Schema for validating token strings (without full AuthToken object)
 * Used for input validation in API endpoints and bot commands
 */
export const tokenStringSchema = z.string()
  .length(32)
  .regex(/^[a-zA-Z0-9]+$/, 'Token must be 32 alphanumeric characters')