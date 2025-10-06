import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from './config.ts'

// Create Supabase client for database operations
export function createSupabaseClient(): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey || "", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Export singleton client
export const supabase = createSupabaseClient();
