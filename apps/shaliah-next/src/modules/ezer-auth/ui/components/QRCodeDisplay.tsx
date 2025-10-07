"use client"

import React from 'react'
import { useQRCode } from 'next-qrcode'

export interface QRCodeDisplayProps {
  deepLink: string
  size?: number
  className?: string
}

export function QRCodeDisplay({ deepLink, size = 200, className }: QRCodeDisplayProps) {
  const { svg, isLoading, error } = useQRCode({
    text: deepLink,
    options: {
      margin: 2,
      width: size,
      height: size,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    },
  }) as unknown as { svg: string; isLoading: boolean; error: Error | null }

  if (isLoading) {
    return <div className={className}>Loading...</div>
  }

  if (error) {
    return <div className={className}>Failed to generate QR code</div>
  }

  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />
  )
}

export default QRCodeDisplay


