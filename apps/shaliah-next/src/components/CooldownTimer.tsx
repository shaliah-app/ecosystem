'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface CooldownTimerProps {
  secondsRemaining: number
  onResend: () => void | Promise<void>
  disabled?: boolean
}

export function CooldownTimer({ secondsRemaining, onResend, disabled }: CooldownTimerProps) {
  const t = useTranslations('auth')

  return (
    <div className="space-y-2">
      <div className="text-center text-sm text-muted-foreground">
        {t('cooldownTimer', { seconds: secondsRemaining })}
      </div>

      <Button
        onClick={onResend}
        variant="outline"
        className="w-full"
        disabled={secondsRemaining > 0 || disabled}
      >
        {t('resendMagicLink')}
      </Button>
    </div>
  )
}