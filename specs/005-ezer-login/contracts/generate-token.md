# API Contract: Generate Authentication Token

**Endpoint**: `POST /api/ezer-auth/token`  
**Feature**: 005-ezer-login  
**Application**: shaliah-next  
**Date**: 2025-01-16

## Description

Generates a new authentication token for the authenticated user to link their Shaliah account with the Ezer Telegram bot. Invalidates any existing active tokens for the user.

## Authentication

**Required**: Yes  
**Method**: Supabase Auth (session cookie or JWT)  
**User Context**: Must be authenticated user

## Request

### HTTP Method
```
POST
```

### Headers
```
Content-Type: application/json
Cookie: sb-<project>-auth-token=<session_token>
```

### URL
```
/api/ezer-auth/token
```

### Query Parameters
None

### Request Body
None (empty body)

### Example Request
```http
POST /api/ezer-auth/token HTTP/1.1
Host: shaliah.app
Content-Type: application/json
Cookie: sb-xyzproject-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```bash
# cURL example
curl -X POST https://shaliah.app/api/ezer-auth/token \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-xyzproject-auth-token=<session_token>"
```

## Response

### Success Response (200 OK)

**Status Code**: `200 OK`

**Headers**:
```
Content-Type: application/json
```

**Body Schema**:
```typescript
{
  token: string        // 32-character alphanumeric token
  expiresAt: string    // ISO 8601 timestamp (UTC)
  deepLink: string     // Telegram deep link with token
  qrCodeUrl: string    // Data URL for QR code SVG
}
```

**Example Response**:
```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "expiresAt": "2025-01-16T15:00:00.000Z",
  "deepLink": "https://t.me/ezer_bot?start=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "qrCodeUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53..."
}
```

**Field Descriptions**:
- `token`: The authentication token (32 chars, no hyphens)
- `expiresAt`: Expiration timestamp (15 minutes from now)
- `deepLink`: Full Telegram deep link URL with embedded token
- `qrCodeUrl`: Base64-encoded SVG QR code as data URL

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "You must be signed in to generate an authentication token"
}
```

**Cause**: User is not authenticated (no valid session)

#### 429 Too Many Requests
```json
{
  "error": "TooManyRequests",
  "message": "Too many token generation attempts. Please wait before trying again.",
  "retryAfter": 60
}
```

**Cause**: Rate limit exceeded (max 5 tokens per minute per user)

#### 500 Internal Server Error
```json
{
  "error": "InternalServerError",
  "message": "Failed to generate authentication token",
  "requestId": "req_abc123"
}
```

**Cause**: Database error, QR code generation failure, or other server issue

## Business Logic

### Pre-conditions
1. User must be authenticated via Supabase Auth
2. User must have a valid session
3. Rate limit: Maximum 5 token generations per minute per user

### Process Flow
1. Validate user authentication
2. Check rate limit (5 tokens/minute)
3. Generate cryptographically secure token (`crypto.randomUUID()` without hyphens)
4. Calculate expiration (now + 15 minutes)
5. Start database transaction:
   a. Invalidate existing active tokens for user (set `is_active = false`)
   b. Insert new token record
6. Generate Telegram deep link
7. Generate QR code SVG
8. Return response with token, expiration, deep link, and QR code

### Post-conditions
1. New token record created in `auth_tokens` table
2. All previous active tokens for user are invalidated
3. Token is valid for 15 minutes
4. QR code and deep link are ready for display

## Performance Requirements

- **Target response time**: < 500ms (p95)
- **Maximum response time**: < 2s (p99)
- **Throughput**: 100 requests/second (peak)

## Security Considerations

### Authentication
- Endpoint requires valid Supabase Auth session
- No anonymous access allowed

### Authorization
- Users can only generate tokens for themselves
- No admin override to generate tokens for other users

### Rate Limiting
- Maximum 5 token generations per minute per user
- Prevents abuse and token flooding

### Token Security
- Tokens are cryptographically random (128-bit entropy)
- No personally identifiable information in token
- Cannot be reverse-engineered to derive user ID or email

### Data Privacy
- QR code contains only token, not user data
- Deep link contains only bot username and token
- No sensitive data logged

## Side Effects

1. **Database**:
   - Inserts new row in `auth_tokens` table
   - Updates existing active tokens (sets `is_active = false`)

2. **Audit Log** (future):
   - Logs token generation event with user ID and timestamp

3. **Cache** (none):
   - No caching strategy (tokens are one-time use)

## Dependencies

### Internal
- Supabase Auth (authentication)
- Drizzle ORM (database access)
- `next-qrcode` library (QR code generation)
- `@yesod/logger` (structured logging)

### External
- PostgreSQL database (auth_tokens table)
- Telegram Bot API (deep link format validation)

## Related Endpoints

- `GET /api/ezer-auth/status` - Check if user's Telegram account is linked
- `DELETE /api/ezer-auth/link` - Unlink Telegram account (future)

## Validation Rules

### Request Validation
- No request body validation (empty body accepted)
- Authentication validation via middleware

### Response Validation
```typescript
const responseSchema = z.object({
  token: z.string().length(32).regex(/^[a-zA-Z0-9]+$/),
  expiresAt: z.string().datetime(),
  deepLink: z.string().url().startsWith('https://t.me/'),
  qrCodeUrl: z.string().startsWith('data:image/svg+xml;base64,'),
})
```

## Testing Scenarios

### Happy Path
1. Authenticated user calls endpoint
2. Receives valid token with QR code
3. Token is active and unexpired

### Token Replacement
1. User generates token A
2. User generates token B (before A expires)
3. Token A is invalidated (is_active = false)
4. Only token B can be used

### Rate Limiting
1. User generates 5 tokens in quick succession
2. 6th request returns 429 Too Many Requests

### Unauthenticated Access
1. Anonymous user calls endpoint
2. Receives 401 Unauthorized

### Expired Session
1. User with expired session calls endpoint
2. Receives 401 Unauthorized

## Implementation Notes

### Server Action (Recommended)
```typescript
// apps/shaliah-next/src/modules/ezer-auth/use-cases/generate-token.ts
'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function generateAuthToken() {
  const supabase = createServerActionClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  // ... token generation logic
}
```

### API Route (Alternative)
```typescript
// apps/shaliah-next/src/app/api/ezer-auth/token/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be signed in' },
      { status: 401 }
    )
  }
  
  // ... token generation logic
}
```

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-16 | 1.0.0 | Initial contract definition |

---

**Status**: Draft  
**Reviewers**: Backend team, Security team  
**Approved By**: N/A (pending implementation)
