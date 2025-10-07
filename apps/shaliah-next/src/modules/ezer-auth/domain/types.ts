/**
 * Domain types for Ezer authentication tokens
 * Feature: 005-ezer-login
 */

export interface AuthToken {
  id: string
  token: string
  userId: string
  createdAt: Date
  expiresAt: Date
  usedAt: Date | null
  isActive: boolean
}

export type TokenStatus = 'created' | 'active' | 'expired' | 'used' | 'invalidated'