import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from './env'
import * as schema from '@/db/schema'

// Create the connection
const client = postgres(env.database.url, { prepare: false })

// Create the Drizzle instance
export const db = drizzle(client, { schema })

// Export the schema for convenience
export * from '@/db/schema'