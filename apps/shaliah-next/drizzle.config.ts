import { defineConfig } from 'drizzle-kit'

// For test environment, use DATABASE_URL from process.env
// For development, this will use the test database when running migrations in test mode
const getDatabaseUrl = () => {
  // In test environment, use the DATABASE_URL from environment
  if (process.env.NODE_ENV === 'test' || process.env.DATABASE_URL) {
    return process.env.DATABASE_URL!
  }

  // For development/migrations, try to load from env files
  try {
    // This is a simple fallback - in production you'd want proper env loading
    const fs = require('fs')
    const path = require('path')

    // Try local test env first, then regular test env
    const envFiles = ['.env.test.local', '.env.test', '.env.local']
    for (const envFile of envFiles) {
      try {
        const envPath = path.join(process.cwd(), envFile)
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8')
          const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/)
          if (dbUrlMatch) {
            return dbUrlMatch[1]
          }
        }
      } catch (e) {
        // Continue to next file
      }
    }
  } catch (e) {
    // Fallback to env
  }

  throw new Error('DATABASE_URL not found in environment or env files')
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
})