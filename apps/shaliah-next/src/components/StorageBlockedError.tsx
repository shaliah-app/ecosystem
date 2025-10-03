'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface StorageBlockedErrorProps {
  onRetry: () => void
}

export function StorageBlockedError({ onRetry }: StorageBlockedErrorProps) {
  const [retrying, setRetrying] = useState(false)
  const t = useTranslations('auth')

  const handleRetry = async () => {
    setRetrying(true)
    try {
      localStorage.setItem('test', '1')
      localStorage.removeItem('test')
      onRetry()
    } catch {
      // Still blocked
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md p-6 bg-card border rounded-lg shadow-lg">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">{t('storageBlockedTitle')}</h2>
          <p className="text-muted-foreground">{t('storageBlockedMessage')}</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{t('storageBlockedInstructions')}</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>{t('storageBlockedStep1')}</li>
              <li>{t('storageBlockedStep2')}</li>
              <li>{t('storageBlockedStep3')}</li>
            </ul>
          </div>
          <Button onClick={handleRetry} disabled={retrying} className="w-full">
            {retrying ? t('retrying') : t('retry')}
          </Button>
        </div>
      </div>
    </div>
  )
}