// Load test environment variables
import { loadEnvConfig } from '@next/env'

const projectDir = process.cwd()
// Prefer local test environment if available, fallback to remote
const envFiles = [
  '.env.test.local', // Local PostgreSQL for fast testing
  '.env.test'        // Remote Supabase for integration testing
]

loadEnvConfig(projectDir, true, { envFiles })

// Set default test values for required environment variables if not present
if (!process.env.TELEGRAM_BOT_USERNAME) {
  process.env.TELEGRAM_BOT_USERNAME = 'test_ezer_bot'
}