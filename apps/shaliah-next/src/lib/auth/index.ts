/**
 * Unified Authentication System
 * 
 * This provides a clean, consistent authentication interface across the app.
 * Combines client-side state management with server-side operations.
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { signOutAction } from './actions'

// Types
export interface AuthState {
  user: User | null
  loading: boolean
  storageBlocked: boolean
}

export interface AuthActions {
  signInWithOtp: (email: string) => Promise<{ error: any }>
  signInWithOAuth: (provider: 'google') => Promise<{ error: any }>
  signOut: () => Promise<void>
  getUser: () => Promise<User | null>
}

export type AuthContextType = AuthState & AuthActions

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
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
  }, [supabase])

  // Actions
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
    // Use server action for proper Telegram unlinking
    await signOutAction()
  }

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  const value: AuthContextType = {
    user,
    loading,
    storageBlocked,
    signInWithOtp,
    signInWithOAuth,
    signOut,
    getUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook for using auth
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Convenience hooks for specific use cases
export function useUser() {
  const { user, loading } = useAuth()
  return { user, loading }
}

export function useAuthActions() {
  const { signInWithOtp, signInWithOAuth, signOut, getUser } = useAuth()
  return { signInWithOtp, signInWithOAuth, signOut, getUser }
}
