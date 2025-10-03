'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useCooldownTimer } from '@/hooks/useCooldownTimer'

interface CooldownTimerProps {
  email: string
  onResend: () => void | Promise<void>
  disabled?: boolean
}

export function CooldownTimer({ email, onResend, disabled }: CooldownTimerProps) {
  const { secondsRemaining, canResend } = useCooldownTimer(email)
  const t = useTranslations('auth')

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-2">
      {!canResend && (
        <div className="text-center text-sm text-muted-foreground">
          {t('cooldownTimer', { time: formatTime(secondsRemaining) })}
        </div>
      )}

      <Button
        onClick={onResend}
        variant="outline"
        className="w-full"
        disabled={!canResend || disabled}
      >
        {t('resendMagicLink')}
      </Button>
    </div>
  )
}