/**
 * Database Dependency Injection Utility
 * 
 * Shared utility for allowing database dependency injection in use cases and actions.
 * This enables testable code by allowing tests to inject a test database instance.
 */

import { db } from '@/lib/db'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '@/db/schema'

type DatabaseInstance = PostgresJsDatabase<typeof schema>

// Global database instance registry for dependency injection
const dbRegistry = new Map<string, DatabaseInstance>()

/**
 * Set database instance for a specific context (use case, action, etc.)
 * @param context - Unique identifier for the context (e.g., 'generate-token', 'sign-out')
 * @param database - Database instance to inject
 */
export function setDatabaseInstance(context: string, database: DatabaseInstance) {
  dbRegistry.set(context, database)
}

/**
 * Reset database instance for a specific context back to default
 * @param context - Unique identifier for the context
 */
export function resetDatabaseInstance(context: string) {
  dbRegistry.delete(context)
}

/**
 * Get database instance for a specific context
 * Falls back to default db if no instance is set for the context
 * @param context - Unique identifier for the context
 * @returns Database instance to use
 */
export function getDatabaseInstance(context: string): DatabaseInstance {
  return dbRegistry.get(context) || db
}

/**
 * Reset all database instances (useful for test cleanup)
 */
export function resetAllDatabaseInstances() {
  dbRegistry.clear()
}