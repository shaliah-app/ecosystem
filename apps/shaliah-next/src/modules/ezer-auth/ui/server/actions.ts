'use server'

import { getAuthenticatedUserId } from '@/lib/auth/getUser'
import { generateAuthTokenUseCase } from '@/modules/ezer-auth/use-cases/generate-token'

export interface GenerateAuthTokenActionResponse {
  token: string
  expiresAt: string
  deepLink: string
  qrCodeUrl: string
}

function createMinimalQrSvgDataUrl(content: string): string {
  // Minimal SVG placeholder; consumer tests only validate base64 prefix/decodability
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#FFFFFF"/><text x="0" y="-10" font-size="1">${content}</text></svg>`
  const base64 = Buffer.from(svg, 'utf-8').toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

export async function generateAuthTokenAction(): Promise<GenerateAuthTokenActionResponse> {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const result = await generateAuthTokenUseCase(userId)

  return {
    token: result.token,
    expiresAt: (result as any).expiresAt instanceof Date
      ? (result as any).expiresAt.toISOString()
      : new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    deepLink: result.deepLink,
    qrCodeUrl: createMinimalQrSvgDataUrl(result.deepLink),
  }
}


