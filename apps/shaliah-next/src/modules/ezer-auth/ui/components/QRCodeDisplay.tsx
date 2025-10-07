"use client"

import React from 'react'
import { useQRCode } from 'next-qrcode'

export interface QRCodeDisplayProps {
  deepLink: string
  size?: number
  className?: string
}

export function QRCodeDisplay({ deepLink, size = 200, className }: QRCodeDisplayProps) {
  const { Image } = useQRCode()

  return (
    <div className={className}>
      <Image
        text={deepLink}
        options={{
          type: 'image/png',
          quality: 0.9,
          errorCorrectionLevel: 'M',
          margin: 2,
          scale: 4,
          width: size,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        }}
      />
    </div>
  )
}

export default QRCodeDisplay


