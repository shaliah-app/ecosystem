/**
 * Test Database Setup Utility
 * 
 * Shared utilities for setting up database dependency injection in tests.
 * This eliminates code duplication across integration tests.
 */

import { getTestDb, closeTestDb } from './test-db'
import { setupTestUsers, cleanupTestUsers } from './test-helpers'
import { setDatabaseInstance, resetDatabaseInstance } from '@/lib/database-injection'

/**
 * Set up test database for a specific context
 * @param context - Database injection context (e.g., 'generate-token', 'sign-out')
 * @returns Test database instance
 */
export async function setupTestDatabase(context: string) {
  // Get test database instance
  const db = getTestDb()
  
  // Set the test database instance for the context
  setDatabaseInstance(context, db)
  
  // Set up test users in database
  await setupTestUsers()
  
  return db
}

/**
 * Clean up test database for a specific context
 * @param context - Database injection context
 */
export async function cleanupTestDatabase(context: string) {
  // Clean up test users
  await cleanupTestUsers()
  
  // Reset database instance
  resetDatabaseInstance(context)
  
  // Close database connections to prevent Jest hanging
  await closeTestDb()
}

/**
 * Higher-order function for test database lifecycle management
 * @param context - Database injection context
 * @param testFn - Test function to wrap
 */
export function withTestDatabase<T extends any[], R>(
  context: string,
  testFn: (...args: T) => R
) {
  return async (...args: T): Promise<R> => {
    await setupTestDatabase(context)
    try {
      return await testFn(...args)
    } finally {
      await cleanupTestDatabase(context)
    }
  }
}