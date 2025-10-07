import { createClient } from '@/lib/supabase/server'

export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user?.id) return null
  return user.id
}


