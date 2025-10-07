'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { checkAndCreateProfile } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTranslations } from 'next-intl'

export default function AuthCallbackPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const t = useTranslations('auth')

  const handleAuthError = useCallback((error: { message?: string }) => {
    // Handle specific auth errors for magic links
    const message = error.message?.toLowerCase() || ''
    
    if (message.includes('expired') || message.includes('token has expired')) {
      setError(t('linkExpired'))
    } else if (message.includes('used') || message.includes('already used') || message.includes('consumed')) {
      setError(t('linkUsed'))
    } else if (message.includes('invalid') || message.includes('malformed')) {
      setError(t('linkInvalid'))
    } else {
      setError(t('linkInvalid'))
    }
    setLoading(false)
  }, [t])

  const handleCallback = useCallback(async () => {
    try {
      const supabase = createClient()

      // Handle the auth callback - Supabase automatically processes the URL hash
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth callback error:', error)
        handleAuthError(error)
        return
      }

      if (!data.session) {
        setError(t('linkInvalid'))
        setLoading(false)
        return
      }

      const user = data.session.user

      // Check if profile exists (trigger should have created it)
      // Use server action to avoid importing server-only code
      const result = await checkAndCreateProfile(user.id, user.user_metadata || {})

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      const profile = result.profile

      // Redirect logic: if full_name is null, go to onboarding, else profile
      if (!profile.full_name) {
        router.push('/onboarding')
      } else {
        router.push('/profile')
      }

    } catch (err) {
      console.error('Callback handling error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }, [router, handleAuthError, t])

  useEffect(() => {
    handleCallback()
  }, [handleCallback])

  const handleRequestNewLink = () => {
    router.push('/auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Completing sign in...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={handleRequestNewLink} className="w-full">
              Request New Link
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // This shouldn't be reached, but just in case
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting...</p>
    </div>
  )
}