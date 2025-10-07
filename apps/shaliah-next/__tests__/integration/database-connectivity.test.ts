/**
 * Database Connectivity Test
 *
 * Tests that the local PostgreSQL database is accessible and
 * that the test helpers work correctly.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { db } from '@/lib/db'
import { userProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { setupTestUsers, cleanupTestUsers, TEST_USER_1, TEST_USER_2 } from './test-helpers'

describe('Database Connectivity Test', () => {
  beforeAll(async () => {
    await setupTestUsers()
  })

  afterAll(async () => {
    await cleanupTestUsers()
  })

  it('should connect to local PostgreSQL database', async () => {
    // Simple query to test database connection
    const result = await db.execute('SELECT 1 as test')
    expect(result).toBeDefined()
    expect(result[0]?.test).toBe(1)
  })

  it('should create test users with test helpers', async () => {
    // Verify test users were created
    const user1 = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, TEST_USER_1)
    })
    expect(user1).toBeDefined()
    expect(user1?.userId).toBe(TEST_USER_1)
    expect(user1?.telegramUserId).toBeNull()

    const user2 = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, TEST_USER_2)
    })
    expect(user2).toBeDefined()
    expect(user2?.userId).toBe(TEST_USER_2)
    expect(user2?.telegramUserId).toBeNull()
  })

  it('should be able to update user profiles', async () => {
    // Test that we can update a user profile (simulate linking Telegram)
    const testTelegramId = 123456789

    await db.update(userProfiles)
      .set({ telegramUserId: testTelegramId })
      .where(eq(userProfiles.userId, TEST_USER_1))

    // Verify the update worked
    const updatedUser = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, TEST_USER_1)
    })
    expect(updatedUser?.telegramUserId).toBe(testTelegramId)
  })

  it('should clean up test users properly', async () => {
    // This will run after the test due to afterAll
    // We can't directly test cleanup here, but we can verify users exist before cleanup
    const user1BeforeCleanup = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, TEST_USER_1)
    })
    expect(user1BeforeCleanup).toBeDefined()
  })
})