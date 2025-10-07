import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/lib/env'
import * as schema from '@/db/schema'

// Create a test-specific database client that can be closed
let testClient: ReturnType<typeof postgres> | null = null
let testDb: ReturnType<typeof drizzle> | null = null

export function getTestDb() {
  if (!testDb) {
    testClient = postgres(env.database.url, { 
      prepare: false,
      max: 1, // Limit connections for tests
    })
    testDb = drizzle(testClient, { schema })
  }
  return testDb
}

export async function closeTestDb() {
  if (testClient) {
    await testClient.end()
    testClient = null
    testDb = null
  }
}

// Re-export schema for convenience
export * from '@/db/schema'