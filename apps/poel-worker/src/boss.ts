import PgBoss from 'pg-boss'
import { config } from 'dotenv'

// Load environment variables
config()

// Validate required environment variables
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create and configure pg-boss instance
const boss = new PgBoss(databaseUrl)

// Export the boss instance
export { boss }

// Graceful shutdown helper
export const stopBoss = async () => {
  console.log('🛑 Stopping pg-boss...')
  await boss.stop()
  console.log('✅ pg-boss stopped successfully')
}