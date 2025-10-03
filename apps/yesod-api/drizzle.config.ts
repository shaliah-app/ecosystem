import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'

// Load environment variables
config()

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || '',
  },
} as any)