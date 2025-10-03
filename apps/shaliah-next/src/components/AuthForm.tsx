'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icon } from '@/components/ui/icon'
import { useAuth } from '@/hooks/useAuth'
import { useCooldownTimer } from '@/hooks/useCooldownTimer'
import { CooldownTimer } from '@/components/CooldownTimer'
import { StorageBlockedError } from '@/components/StorageBlockedError'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signInWithOtp, signInWithOAuth, loading, storageBlocked } = useAuth()
  const { secondsRemaining, canResend, startCooldown } = useCooldownTimer(email)
  const t = useTranslations('auth')

  const handleResend = () => {
    handleMagicLinkRequest({} as React.FormEvent)
  }

  const handleRetryStorage = () => {
    // Force re-render to re-check storage
    window.location.reload()
  }

  if (storageBlocked) {
    return <StorageBlockedError onRetry={handleRetryStorage} />
  }

  const handleMagicLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canResend) {
      setError(t('cooldownMessage'))
      return
    }

    setError(null)

    const { error } = await signInWithOtp(email)

    if (error) {
      setError(error.message)
    } else {
      setMagicLinkSent(true)
      startCooldown()
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)

    const { error } = await signInWithOAuth('google')

    if (error) {
      setError(error.message)
    }
  }

  const handleBackToProviders = () => {
    setShowEmailInput(false)
    setMagicLinkSent(false)
    setEmail('')
    setError(null)
  }

  // If storage is blocked, show error (but task doesn't specify, so maybe handle in parent)
  // For now, proceed with the form

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <Icon name="person" size={28} />
          {t('continueWith')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!showEmailInput && !magicLinkSent && (
          <div className="space-y-4">
            <Button
              onClick={() => setShowEmailInput(true)}
              className="w-full"
              variant="outline"
              disabled={loading}
            >
              <Icon name="mail" size={20} className="mr-2" />
              {t('continueWithEmail')}
            </Button>

            <Button
              onClick={handleGoogleSignIn}
              className="w-full"
              disabled={loading}
            >
              {t('continueWithGoogle')}
            </Button>
          </div>
        )}

        {showEmailInput && !magicLinkSent && (
          <form onSubmit={handleMagicLinkRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Icon name="mail" size={16} />
                {t('email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t('emailPlaceholder')}
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading || !canResend}>
              {loading ? t('loading') : t('sendMagicLink')}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleBackToProviders}
              className="w-full"
            >
              {t('back')}
            </Button>
          </form>
        )}

        {magicLinkSent && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                {t('magicLinkSent', { email })}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="email-display">{t('email')}</Label>
              <Input
                id="email-display"
                type="email"
                value={email}
                disabled
              />
            </div>

            <CooldownTimer
              email={email}
              onResend={handleResend}
              disabled={loading}
            />

            <Button
              variant="ghost"
              onClick={handleBackToProviders}
              className="w-full"
            >
              {t('back')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}