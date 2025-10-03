import { create } from 'zustand'
import React from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null; url?: string }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    try {
      const supabase = createClient()

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      set({ user: session?.user ?? null, loading: false, initialized: true })

      // Listen for auth changes
      supabase.auth.onAuthStateChange(
        async (event, session) => {
          set({ user: session?.user ?? null, loading: false })
        }
      )

      // Note: In a real app, you might want to store the unsubscribe function
      // and call it when the store is destroyed, but for simplicity we'll skip that here
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ loading: false, initialized: true })
    }
  },

  signInWithMagicLink: async (email: string) => {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Redirect to auth callback after clicking magic link
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    return { error }
  },

  signInWithGoogle: async () => {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirect to auth callback after OAuth completion
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    return { error, url: data?.url }
  },

  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  },
}))

// Hook for direct access to auth store (alternative to useSupabaseAuth)
export const useAuth = () => {
  const store = useAuthStore()

  // Auto-initialize on first use
  React.useEffect(() => {
    if (!store.initialized) {
      store.initialize()
    }
  }, [store])

  return store
}