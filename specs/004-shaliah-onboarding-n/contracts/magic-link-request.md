# API Contract: Request Magic Link

**Status**: DEPRECATED - Magic link functionality moved to Supabase Auth directly

**Previous Endpoint**: `POST /api/auth/magic-link/request`
**Purpose**: Send a magic link email for password-less authentication.
**Rate Limit**: 60-second cooldown per email; 10 requests per rolling hour.

---

## Deprecation Notice

This API contract has been deprecated. Magic link authentication is now handled directly by Supabase Auth in the client application (shaliah-next). The yesod-api no longer provides magic link endpoints.

**Migration**: Update client applications to use Supabase Auth SDK directly:
- `supabase.auth.signInWithOtp({ email })` for magic links
- `supabase.auth.signInWithOAuth({ provider: 'google' })` for OAuth

**Reason**: Aligns with Constitution Principle IV "Supabase-First Integration" - Supabase provides battle-tested authentication infrastructure.

---

## Legacy Implementation Details

### Request
```
Content-Type: application/json
Body: { "email": "user@example.com" }
```

### Response
```json
{
  "success": true,
  "message": "Magic link sent to user@example.com",
  "cooldown_seconds": 60
}
```

### Error Responses
- `rate_limit_cooldown` (429): Please wait before requesting another magic link
- `rate_limit_exceeded` (429): Too many requests. Please try again later
- `invalid_email` (400): Email address is invalid

---

## Implementation Notes

**Current**: Supabase Auth handles magic links natively with built-in rate limiting and security.
**Previous**: Custom implementation with database tracking and rate limiting logic.
