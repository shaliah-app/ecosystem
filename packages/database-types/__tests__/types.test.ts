import { describe, it, expect } from 'vitest'
import { AuthToken, UserProfile, AuthTokenRow, UserProfileRow } from '../src/index'

describe('Database Types', () => {
  it('should export AuthToken type', () => {
    const token: AuthToken = {
      id: 'test-id',
      token: 'test-token',
      user_id: 'user-id',
      created_at: '2024-01-01T00:00:00Z',
      expires_at: '2024-01-01T00:15:00Z',
      used_at: null,
      is_active: true
    }
    
    expect(token.id).toBe('test-id')
    expect(token.token).toBe('test-token')
  })

  it('should export UserProfile type', () => {
    const profile: UserProfile = {
      id: 'profile-id',
      user_id: 'user-id',
      full_name: 'Test User',
      language: 'en-US',
      telegram_user_id: 123456789,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
    
    expect(profile.id).toBe('profile-id')
    expect(profile.user_id).toBe('user-id')
  })

  it('should have legacy type aliases', () => {
    const tokenRow: AuthTokenRow = {
      id: 'test-id',
      token: 'test-token',
      user_id: 'user-id',
      created_at: '2024-01-01T00:00:00Z',
      expires_at: '2024-01-01T00:15:00Z',
      used_at: null,
      is_active: true
    }
    
    const profileRow: UserProfileRow = {
      id: 'profile-id',
      user_id: 'user-id',
      full_name: 'Test User',
      language: 'en-US',
      telegram_user_id: 123456789,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
    
    expect(tokenRow).toBeDefined()
    expect(profileRow).toBeDefined()
  })
})
