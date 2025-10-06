import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for privileged operations
// Used for token validation and user profile updates in bot commands
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)