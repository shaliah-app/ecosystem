import { NextResponse } from 'next/server'
import { generateAuthTokenAction } from '@/modules/ezer-auth/ui/server/actions'
import { getAuthenticatedUserId } from '@/lib/auth/getUser'

// Simple in-memory rate limiter per user (process-local; sufficient for tests/dev)
const rateBuckets: Map<string, { count: number; resetAt: number }> = new Map()
const MAX_REQUESTS_PER_MINUTE = 5

function checkRateLimit(userId: string) {
  const now = Date.now()
  const bucket = rateBuckets.get(userId)
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(userId, { count: 1, resetAt: now + 60_000 })
    return { ok: true }
  }
  if (bucket.count < MAX_REQUESTS_PER_MINUTE) {
    bucket.count += 1
    return { ok: true }
  }
  const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000)
  return { ok: false, retryAfterSec }
}

export async function POST() {
  try {
    // Authenticate and get user id for rate limiting
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be signed in to generate an authentication token',
        },
        { status: 401 }
      )
    }

    const rl = checkRateLimit(userId)
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: 'TooManyRequests',
          message: 'Too many token generation attempts. Please wait before trying again.',
          retryAfter: rl.retryAfterSec,
        },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      )
    }

    const result = await generateAuthTokenAction()
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be signed in to generate an authentication token',
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        error: 'InternalServerError',
        message: 'Failed to generate authentication token',
      },
      { status: 500 }
    )
  }
}

// Test helper: allow tests to clear the per-process limiter between test cases
export function __resetRateLimiterForTests() {
  rateBuckets.clear()
}


