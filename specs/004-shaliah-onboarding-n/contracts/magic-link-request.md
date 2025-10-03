# API Contract: Request Magic Link

**Endpoint**: `POST /api/auth/magic-link/request`  
**Purpose**: Send a magic link email for password-less authentication.  
**Rate Limit**: 60-second cooldown per email; 10 requests per rolling hour.

---

## Request

### Headers
```
Content-Type: application/json
```

### Body (JSON)
```json
{
  "email": "user@example.com"
}
```

**Schema**:
```typescript
{
  email: string; // Valid email format, trimmed, case-insensitive
}
```

**Validation**:
- `email`: Required, valid email format.

---

## Response

### Success (200 OK)
```json
{
  "success": true,
  "message": "Magic link sent to user@example.com",
  "cooldown_seconds": 60
}
```

**Schema**:
```typescript
{
  success: true;
  message: string;
  cooldown_seconds: number; // Always 60
}
```

---

### Rate Limit Exceeded (429 Too Many Requests)

**Case 1: Cooldown active (<60s since last send)**
```json
{
  "error": "rate_limit_cooldown",
  "message": "Please wait before requesting another magic link",
  "retry_after_seconds": 45
}
```

**Case 2: Hourly limit exceeded (>10 sends in 1 hour)**
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after_seconds": 1800
}
```

**Schema**:
```typescript
{
  error: "rate_limit_cooldown" | "rate_limit_exceeded";
  message: string;
  retry_after_seconds: number;
}
```

---

### Bad Request (400 Bad Request)
```json
{
  "error": "invalid_email",
  "message": "Email address is invalid"
}
```

**Schema**:
```typescript
{
  error: "invalid_email";
  message: string;
}
```

---

### Server Error (500 Internal Server Error)
```json
{
  "error": "server_error",
  "message": "Failed to send magic link"
}
```

---

## Contract Test Assertions

```typescript
describe('POST /api/auth/magic-link/request', () => {
  it('should return 200 and cooldown on valid email', async () => {
    const response = await request(app)
      .post('/api/auth/magic-link/request')
      .send({ email: 'test@example.com' })
      .expect(200);
    
    expect(response.body).toMatchObject({
      success: true,
      cooldown_seconds: 60
    });
  });

  it('should return 429 if request within 60s cooldown', async () => {
    await request(app).post('/api/auth/magic-link/request').send({ email: 'test@example.com' });
    
    const response = await request(app)
      .post('/api/auth/magic-link/request')
      .send({ email: 'test@example.com' })
      .expect(429);
    
    expect(response.body).toMatchObject({
      error: 'rate_limit_cooldown',
      retry_after_seconds: expect.any(Number)
    });
  });

  it('should return 429 after 10 requests in 1 hour', async () => {
    // Send 10 requests (with time manipulation or mock)
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/auth/magic-link/request').send({ email: 'abuse@example.com' });
    }
    
    const response = await request(app)
      .post('/api/auth/magic-link/request')
      .send({ email: 'abuse@example.com' })
      .expect(429);
    
    expect(response.body).toMatchObject({
      error: 'rate_limit_exceeded'
    });
  });

  it('should return 400 on invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/magic-link/request')
      .send({ email: 'not-an-email' })
      .expect(400);
    
    expect(response.body).toMatchObject({
      error: 'invalid_email'
    });
  });
});
```

---

## Implementation Notes

- **Supabase integration**: Call `supabase.auth.signInWithOtp({ email })`.
- **Rate limit tracking**: Insert row in `magic_link_attempts` table; query for counts.
- **Logging**: Log event `auth.magic_link.sent` (email, timestamp, IP).
