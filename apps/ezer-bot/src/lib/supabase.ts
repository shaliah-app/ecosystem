import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

// Ensure environment variables are loaded even when running from monorepo root
// 1) Try to load the app-local .env (apps/ezer-bot/.env)
config({ path: path.resolve(__dirname, '..', '..', '.env') })
// 2) Fallback to default lookup from process.cwd()
config()

// Create Supabase client with service role key for privileged operations
// Used for token validation and user profile updates in bot commands
export const supabase = createClient(
  (() => {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url) throw new Error('SUPABASE_URL is required (check apps/ezer-bot/.env)')
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required (check apps/ezer-bot/.env)')
    return url
  })(),
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)