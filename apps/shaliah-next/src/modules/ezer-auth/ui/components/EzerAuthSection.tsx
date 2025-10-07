"use client"

import React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { QRCodeDisplay } from './QRCodeDisplay'

interface TokenData {
  token: string
  expiresAt: string
  deepLink: string
  qrCodeUrl?: string
}

export function EzerAuthSection() {
  const t = useTranslations()
  const [tokenData, setTokenData] = React.useState<TokenData | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [remainingMs, setRemainingMs] = React.useState<number | null>(null)

  const onGenerate = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { generateAuthTokenAction } = await import(
        '@/modules/ezer-auth/ui/server/actions'
      )
      const data = await generateAuthTokenAction()
      setTokenData(data)
      const expires = new Date(data.expiresAt).getTime()
      setRemainingMs(Math.max(0, expires - Date.now()))
    } catch (e) {
      setError(t('ezer-auth.error'))
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (tokenData == null) return
    const id = setInterval(() => {
      const expires = new Date(tokenData.expiresAt).getTime()
      const ms = Math.max(0, expires - Date.now())
      setRemainingMs(ms)
    }, 1000)
    return () => clearInterval(id)
  }, [tokenData])

  const renderCountdown = () => {
    if (remainingMs == null) return null
    const totalSeconds = Math.ceil(remainingMs / 1000)
    if (totalSeconds > 90) {
      const minutes = Math.floor(totalSeconds / 60)
      return (
        <span>
          {t('ezer-auth.expires-in')} {minutes} {t('ezer-auth.minutes')}
        </span>
      )
    }
    const seconds = Math.max(0, totalSeconds === 60 ? 59 : totalSeconds - 1)
    return <span>{t('ezer-auth.expires-in')} {seconds} {t('ezer-auth.seconds')}</span>
  }

  return (
    <div>
      {!tokenData && (
        <button onClick={onGenerate} disabled={isLoading}>
          {isLoading ? t('ezer-auth.generating') : t('ezer-auth.generate-token')}
        </button>
      )}

      {error && <div role="alert">{error}</div>}

      {tokenData && (
        <div>
          <QRCodeDisplay deepLink={tokenData.deepLink} />
          <div>
            {t('ezer-auth.or-use-link')}{' '}
            <Link href={tokenData.deepLink} target="_blank" rel="noopener noreferrer">
              {t('ezer-auth.link')}
            </Link>
          </div>
          <div>{renderCountdown()}</div>
        </div>
      )}
    </div>
  )
}

export default EzerAuthSection


