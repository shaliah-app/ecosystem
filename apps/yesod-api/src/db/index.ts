import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { env } from '../config/env.js'

// Database connection
const connectionString = env.DATABASE_URL

// Create the connection
const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })

// Export for cleanup
export { client }