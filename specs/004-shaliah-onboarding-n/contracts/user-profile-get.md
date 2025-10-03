# API Contract: Get Current User Profile

**Endpoint**: `GET /api/user/profile`  
**Purpose**: Retrieve authenticated user's profile data.  
**Authentication**: Required (Supabase session).

---

## Request

### Headers
```
Authorization: Bearer <supabase_access_token>
```

### Query Parameters
None.

---

## Response

### Success (200 OK)
```json
{
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "Paulo Santos",
    "avatar_url": "https://storage.supabase.co/avatars/abc123.jpg",
    "language": "pt-BR",
    "telegram_user_id": null,
    "active_space_id": null,
    "created_at": "2025-10-01T10:00:00Z",
    "updated_at": "2025-10-01T12:30:00Z"
  }
}
```

**Schema**:
```typescript
{
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    language: string;
    telegram_user_id: number | null;
    active_space_id: number | null;
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

### Not Found (404 Not Found)
```json
{
  "error": "profile_not_found",
  "message": "User profile does not exist"
}
```

*Note: Should be rare if trigger auto-creates profile on user creation.*

---

### Server Error (500 Internal Server Error)
```json
{
  "error": "server_error",
  "message": "Failed to fetch profile"
}
```

---

## Contract Test Assertions

```typescript
describe('GET /api/user/profile', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Create test user
    const { data } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpass'
    });
    authToken = data.session!.access_token;
    userId = data.user!.id;
  });

  it('should return user profile when authenticated', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(response.body.profile).toMatchObject({
      id: userId,
      language: expect.any(String),
      created_at: expect.any(String)
    });
  });

  it('should return 401 without auth token', async () => {
    await request(app)
      .get('/api/user/profile')
      .expect(401);
  });

  it('should return 401 with invalid token', async () => {
    await request(app)
      .get('/api/user/profile')
      .set('Authorization', 'Bearer invalid_token')
      .expect(401);
  });

  it('should include null fields when not set', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    // New user without onboarding completion
    expect(response.body.profile.full_name).toBeNull();
    expect(response.body.profile.telegram_user_id).toBeNull();
  });
});
```

---

## Implementation Notes

- **Authentication**: Extract user ID from Supabase JWT via middleware.
- **Query**: `SELECT * FROM user_profiles WHERE id = auth.uid()`.
- **RLS**: Supabase RLS policy ensures users can only read their own profile.
- **Logging**: Optional — log `user.profile.fetched` for analytics.
