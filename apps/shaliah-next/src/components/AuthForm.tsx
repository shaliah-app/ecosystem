'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/store'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icon } from '@/components/ui/icon'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  const { signInWithMagicLink, signInWithGoogle } = useAuth()
  const t = useTranslations('AuthForm')

  const handleMagicLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check cooldown
    if (cooldownSeconds > 0) {
      setError(t('cooldownActive'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await signInWithMagicLink(email)

      if (error) {
        setError(error.message)
      } else {
        setMagicLinkSent(true)
        // Start 60-second cooldown
        setCooldownSeconds(60)
        const interval = setInterval(() => {
          setCooldownSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        // Store in localStorage for persistence
        localStorage.setItem('magicLinkCooldown', String(Date.now() + 60000))
      }
    } catch {
      setError(t('unexpectedError'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error, url } = await signInWithGoogle()

      if (error) {
        setError(error.message)
      } else if (url) {
        // Redirect to Google OAuth
        window.location.href = url
      }
    } catch {
      setError(t('unexpectedError'))
    } finally {
      setLoading(false)
    }
  }

  const handleBackToProviders = () => {
    setShowEmailInput(false)
    setMagicLinkSent(false)
    setEmail('')
    setError(null)
  }

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

            <Button type="submit" className="w-full" disabled={loading || cooldownSeconds > 0}>
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

            {cooldownSeconds > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                {t('cooldownMessage', { seconds: cooldownSeconds })}
              </div>
            )}

            <Button
              onClick={handleMagicLinkRequest}
              variant="outline"
              className="w-full"
              disabled={cooldownSeconds > 0 || loading}
            >
              {t('resendMagicLink')}
            </Button>

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