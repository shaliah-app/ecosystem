import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'

// Create the connection
const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString, { prepare: false })

// Create the Drizzle instance
export const db = drizzle(client, { schema })

// Export the schema for convenience
export * from '@/db/schema'