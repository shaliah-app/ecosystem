# Shaliah Authentication Configuration

This document outlines the Supabase Auth configuration for the Shaliah onboarding feature.

## Auth Settings

### Magic Link Configuration
Run the following SQL in the Supabase SQL Editor:

```sql
-- Enable magic link with 15-minute expiry
UPDATE auth.config SET
  enable_signup = true,
  external_email_enabled = true,
  mailer_autoconfirm = false,
  email_link_expiry_time = 900; -- 15 minutes
```

### JWT Expiry Settings
Configure via Supabase Dashboard > Settings > API > JWT Settings:
- Access token expiry: 3600 seconds (1 hour)
- Refresh token expiry: 604800 seconds (7 days idle + 30 days absolute)

## Google OAuth Provider

### Setup Steps
1. Go to Supabase Dashboard > Authentication > Providers > Google
2. Enable Google provider
3. Enter Client ID and Client Secret from Google Cloud Console
4. Set Redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`

### Google Cloud Console Setup
1. Create a new project or select existing
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`

## Storage Bucket: user-avatars

### Bucket Creation
- Name: `user-avatars`
- Public: No (RLS enabled)

### RLS Policies
```sql
-- Allow users to insert/update their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to read avatars (for display)
CREATE POLICY "Authenticated users can view avatars" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated'
);
```

### Bucket Settings
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/webp

## Verification

After configuration:
1. Test magic link flow
2. Test Google OAuth flow
3. Verify JWT expiry behavior
4. Test avatar upload/download