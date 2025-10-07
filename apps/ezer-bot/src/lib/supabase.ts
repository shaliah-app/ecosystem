import { createClient } from "@supabase/supabase-js";
import { getEnvConfig } from "./env";

// Create Supabase client with service role key for privileged operations
// Used for token validation and user profile updates in bot commands
export const supabase = createClient(
  getEnvConfig().supabase.url,
  getEnvConfig().supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
