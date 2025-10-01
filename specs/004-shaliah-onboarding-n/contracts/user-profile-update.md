# API Contract: Update User Profile

**Endpoint**: `PATCH /api/user/profile`  
**Purpose**: Update authenticated user's profile (full_name, avatar_url, language).  
**Authentication**: Required (Supabase session).

---

## Request

### Headers
```
Content-Type: application/json
Authorization: Bearer <supabase_access_token>
```

### Body (JSON)
```json
{
  "full_name": "Paulo Santos",
  "avatar_url": "https://storage.supabase.co/avatars/abc123.jpg",
  "language": "pt-BR"
}
```

**Schema**:
```typescript
{
  full_name?: string;    // 2-100 chars
  avatar_url?: string;   // Valid URL or null
  language?: string;     // One of: en-US, pt-BR, es, fr, de, uk, ru
}
```

**Validation**:
- `full_name`: Optional, 2-100 characters if provided.
- `avatar_url`: Optional, valid URL format if provided; `null` to clear.
- `language`: Optional, must be supported language code.
- At least one field must be provided.

---

## Response

### Success (200 OK)
```json
{
  "success": true,
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "Paulo Santos",
    "avatar_url": "https://storage.supabase.co/avatars/abc123.jpg",
    "language": "pt-BR",
    "created_at": "2025-10-01T10:00:00Z",
    "updated_at": "2025-10-01T12:30:00Z"
  }
}
```

**Schema**:
```typescript
{
  success: true;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    language: string;
    created_at: string;
    updated_at: string;
  };
}
```

---

### Unauthorized (401 Unauthorized)
```json
{
  "error": "unauthorized",
  "message": "Authentication required"
}
```

---

### Bad Request (400 Bad Request)
```json
{
  "error": "validation_error",
  "message": "Invalid input",
  "details": {
    "full_name": "Must be between 2 and 100 characters",
    "language": "Unsupported language code"
  }
}
```

**Schema**:
```typescript
{
  error: "validation_error";
  message: string;
  details: Record<string, string>;
}
```

---

### Server Error (500 Internal Server Error)
```json
{
  "error": "server_error",
  "message": "Failed to update profile"
}
```

---

## Contract Test Assertions

```typescript
describe('PATCH /api/user/profile', () => {
  let authToken: string;

  beforeEach(async () => {
    // Create test user and get auth token
    const { data } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpass'
    });
    authToken = data.session!.access_token;
  });

  it('should update full_name successfully', async () => {
    const response = await request(app)
      .patch('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ full_name: 'New Name' })
      .expect(200);
    
    expect(response.body.profile.full_name).toBe('New Name');
  });

  it('should update language successfully', async () => {
    const response = await request(app)
      .patch('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ language: 'en-US' })
      .expect(200);
    
    expect(response.body.profile.language).toBe('en-US');
  });

  it('should return 401 without auth token', async () => {
    await request(app)
      .patch('/api/user/profile')
      .send({ full_name: 'Test' })
      .expect(401);
  });

  it('should return 400 on invalid full_name length', async () => {
    const response = await request(app)
      .patch('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ full_name: 'A' }) // Too short
      .expect(400);
    
    expect(response.body.error).toBe('validation_error');
  });

  it('should return 400 on unsupported language', async () => {
    const response = await request(app)
      .patch('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ language: 'xx-XX' })
      .expect(400);
    
    expect(response.body.details.language).toContain('Unsupported');
  });

  it('should clear avatar_url when set to null', async () => {
    const response = await request(app)
      .patch('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ avatar_url: null })
      .expect(200);
    
    expect(response.body.profile.avatar_url).toBeNull();
  });
});
```

---

## Implementation Notes

- **Authentication**: Use Supabase RLS or middleware to verify `auth.uid()` matches profile `id`.
- **Validation**: Use Zod schema for input validation.
- **Logging**: Log event `user.profile.updated` (user_id, fields_changed).
- **Locale update**: If `language` changed, set new `NEXT_LOCALE` cookie for i18n.
