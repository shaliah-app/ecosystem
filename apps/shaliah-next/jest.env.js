// Load test environment variables
import { loadEnvConfig } from '@next/env'

const projectDir = process.cwd()
// Prefer local test environment if available, fallback to remote
const envFiles = [
  '.env.test.local', // Local PostgreSQL for fast testing
  '.env.test'        // Remote Supabase for integration testing
]

loadEnvConfig(projectDir, true, { envFiles })