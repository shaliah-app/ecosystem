import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export interface UseAuthReturn {
  user: User | null
  loading: boolean
  signInWithOtp: (email: string) => Promise<{ error: any }>
  signInWithOAuth: (provider: 'google') => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  getUser: () => Promise<User | null>
  storageBlocked: boolean
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [storageBlocked, setStorageBlocked] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    // Detect storage blocked
    try {
      localStorage.setItem('test', '1')
      localStorage.removeItem('test')
    } catch (error) {
      setStorageBlocked(true)
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })
    return { error }
  }

  const signInWithOAuth = async (provider: 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  return {
    user,
    loading,
    signInWithOtp,
    signInWithOAuth,
    signOut,
    getUser,
    storageBlocked,
  }
}