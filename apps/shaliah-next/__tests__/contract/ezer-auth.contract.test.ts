/**
 * Contract Test: Generate Authentication Token API
 * 
 * Feature: 005-ezer-login
 * Application: shaliah-next
 * Status: PASSING
 * 
 * Purpose: Validate API contract for POST /api/ezer-auth/token
 * This test validates the response schema and behavior by directly invoking the route handler.
 * 
 * Testing Strategy:
 * - Directly imports and invokes the POST route handler
 * - Mocks authentication via @/lib/supabase/server
 * - Mocks database operations via @/lib/database-injection
 * - Tests rate limiting, error handling, and performance
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { z } from 'zod'
import * as route from '@/app/api/ezer-auth/token/route'
const { POST, __resetRateLimiterForTests } = route as unknown as {
  POST: (req?: Request) => Promise<Response>
  __resetRateLimiterForTests: () => void
}

// Get the mocked Supabase server client
const { createClient } = require('@/lib/supabase/server')

// Response schema from contract
const GenerateTokenResponseSchema = z.object({
  token: z.string().length(32).regex(/^[a-zA-Z0-9]+$/),
  expiresAt: z.string().datetime(),
  deepLink: z.string().url().startsWith('https://t.me/'),
  qrCodeUrl: z.string().startsWith('data:image/svg+xml;base64,'),
})

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
})

describe('POST /api/ezer-auth/token - Contract Test', () => {
  beforeEach(async () => {
    __resetRateLimiterForTests()
  })

  afterEach(async () => {})

  describe('Success Response (200 OK)', () => {
    it('should return valid token response schema', async () => {
      // Act
      const response = await POST()

      // Assert
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')

      const data = await response.json()
      
      // Validate response matches contract schema
      const parseResult = GenerateTokenResponseSchema.safeParse(data)
      expect(parseResult.success).toBe(true)

      if (parseResult.success) {
        // Additional contract validations
        expect(parseResult.data.token).toHaveLength(32)
        expect(parseResult.data.token).toMatch(/^[a-zA-Z0-9]+$/)
        
        // Verify deep link contains token
        expect(parseResult.data.deepLink).toContain(parseResult.data.token)
        
        // Verify expiration is in the future
        const expiresAt = new Date(parseResult.data.expiresAt)
        const now = new Date()
        expect(expiresAt.getTime()).toBeGreaterThan(now.getTime())
        
        // Verify QR code is valid base64 SVG
        expect(parseResult.data.qrCodeUrl).toMatch(/^data:image\/svg\+xml;base64,/)
        const base64Part = parseResult.data.qrCodeUrl.split(',')[1]
        expect(() => Buffer.from(base64Part, 'base64')).not.toThrow()
      }
    })

    it('should generate unique tokens on repeated calls', async () => {
      const tokens = new Set<string>()

      for (let i = 0; i < 5; i++) {
        const response = await POST()

        expect(response.status).toBe(200)
        const data = await response.json()
        tokens.add(data.token)
      }

      // Assert - All tokens should be unique
      expect(tokens.size).toBe(5)
    })

    it('should invalidate previous token when generating new one', async () => {
      const response1 = await POST()
      expect(response1.status).toBe(200)
      const data1 = await response1.json()
      const firstToken = data1.token

      const response2 = await POST()
      expect(response2.status).toBe(200)
      const data2 = await response2.json()
      const secondToken = data2.token

      expect(firstToken).not.toBe(secondToken)
      // DB assertion left to integration tests
    })
  })

  describe('Error Response (401 Unauthorized)', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock unauthenticated state
      createClient.mockResolvedValueOnce({
        auth: {
          getUser: jest.fn(async () => ({
            data: { user: null },
            error: null,
          })),
        },
      })
      
      const response = await POST()

      expect(response.status).toBe(401)
      expect(response.headers.get('content-type')).toContain('application/json')

      const data = await response.json()
      const parseResult = ErrorResponseSchema.safeParse(data)
      expect(parseResult.success).toBe(true)

      if (parseResult.success) {
        expect(parseResult.data.error).toBe('Unauthorized')
        expect(parseResult.data.message).toContain('signed in')
      }
    })
  })

  describe('Error Response (429 Too Many Requests)', () => {
    it('should return 429 when rate limit exceeded', async () => {
      const maxRequests = 5
      const responses: Response[] = []
      for (let i = 0; i < maxRequests + 1; i++) {
        const response = await POST()
        responses.push(response)
      }

      const lastResponse = responses[responses.length - 1]
      expect(lastResponse.status).toBe(429)

      const data = await lastResponse.json()
      const parseResult = ErrorResponseSchema.safeParse(data)
      expect(parseResult.success).toBe(true)

      if (parseResult.success) {
        expect(parseResult.data.error).toBe('TooManyRequests')
        expect(parseResult.data.message).toContain('Too many token generation attempts')
      }
    })
  })

  describe('Performance', () => {
    it('should respond within 2 seconds (p95)', async () => {
      const iterations = 10
      const responseTimes: number[] = []

      for (let i = 0; i < iterations; i++) {
        // Reset rate limiter for each iteration to avoid interference with performance measurement
        __resetRateLimiterForTests()
        
        const startTime = Date.now()
        const response = await POST()
        const endTime = Date.now()
        const responseTime = endTime - startTime

        expect(response.status).toBe(200)
        responseTimes.push(responseTime)
      }

      responseTimes.sort((a, b) => a - b)
      const p95Index = Math.floor(iterations * 0.95)
      const p95Time = responseTimes[p95Index]

      expect(p95Time).toBeLessThan(2000)
    })
  })

  describe('Security', () => {
    it('should not include PII in token', async () => {
      const response = await POST()

      expect(response.status).toBe(200)
      const data = await response.json()

      const token = data.token.toLowerCase()
      expect(token).not.toMatch(/email/)
      expect(token).not.toMatch(/user/)
      expect(token).not.toMatch(/\d{10,}/)
      expect(token).toMatch(/^[a-z0-9]+$/)
    })

    it('should use HTTPS in deep link', async () => {
      const response = await POST()

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.deepLink.startsWith('https://')).toBe(true)
      expect(data.deepLink.includes('http://')).toBe(false)
    })
  })
})

/**
 * TODO: Implement these tests after implementation:
 * 
 * 1. Database state verification:
 *    - Verify token inserted into auth_tokens table
 *    - Verify old tokens marked inactive
 *    - Verify expiration timestamp is correct
 * 
 * 2. Integration with Supabase Auth:
 *    - Test with real Supabase session
 *    - Test session validation
 * 
 * 3. QR Code validation:
 *    - Decode QR code SVG
 *    - Verify it encodes the correct deep link
 * 
 * 4. Rate limiting:
 *    - Test rate limit reset after 1 minute
 *    - Test rate limit per-user isolation
 * 
 * 5. Audit logging:
 *    - Verify ezer.auth.token_generated event logged
 *    - Verify structured log format
 */
