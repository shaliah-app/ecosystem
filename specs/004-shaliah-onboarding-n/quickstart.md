# Quickstart: Shaliah Unified Onboarding & Authentication

**Feature**: 004-shaliah-onboarding-n  
**Date**: 2025-10-01  
**Purpose**: Manual testing guide and acceptance validation steps for the authentication and onboarding flow.

---

## Prerequisites

1. **Development environment running**:
   ```bash
   cd apps/shaliah-next
   pnpm dev
   ```

2. **Supabase configured**:
   - Magic link enabled in Supabase dashboard.
   - Google OAuth provider configured with valid client ID/secret.
   - Test users created or able to create new accounts.

3. **Test email inbox access**: Use a real email or Supabase local dev email capture.

4. **Browser dev tools open**: Monitor network requests, console logs, and cookies.

---

## Scenario 1: Email Magic Link (Happy Path)

**Goal**: Validate magic link authentication flow with cooldown timer.

### Steps

1. **Navigate to auth page**:
   - Open browser to `http://localhost:3000/auth`.
   - Verify page shows "Continue with Email" and "Continue with Google" buttons.

2. **Enter email and request magic link**:
   - Click "Continue with Email".
   - Enter a valid test email (e.g., `test@example.com`).
   - Click "Send Magic Link".

3. **Verify UI state transition**:
   - ✅ Page shows confirmation message: "Check your email for a magic link."
   - ✅ Email input is disabled and displays entered address.
   - ✅ Cooldown timer shows "Wait 60s before requesting another link" and counts down.
   - ✅ "Back" button is visible and functional (returns to provider selection).

4. **Check email inbox**:
   - ✅ Magic link email received within 10 seconds.
   - ✅ Email contains clickable link with valid Supabase token.

5. **Click magic link**:
   - ✅ Browser redirects to app (e.g., `/auth/callback`).
   - ✅ User is authenticated (check `supabase.auth.getUser()` returns user).

6. **Verify redirect logic**:
   - **If profile incomplete** (`full_name = NULL`):
     - ✅ Redirects to `/onboarding`.
   - **If profile complete**:
     - ✅ Redirects to `/profile` (dashboard).

### Expected Logs
```
[INFO] auth.magic_link.sent { email: "test@example.com", timestamp: "2025-10-01T..." }
[INFO] auth.magic_link.consumed { email: "test@example.com", success: true }
```

---

## Scenario 2: Magic Link Cooldown Enforcement

**Goal**: Validate 60-second cooldown prevents rapid resends.

### Steps

1. **Request first magic link**:
   - Enter email, click "Send Magic Link".
   - ✅ Success message shown, cooldown timer starts at 60s.

2. **Attempt immediate resend**:
   - Click "Resend" button (should be disabled).
   - ✅ Button remains disabled, countdown continues.

3. **Wait for cooldown expiry**:
   - Monitor timer counting down: 59s, 58s, ..., 1s, 0s.
   - ✅ At 0s, "Resend" button becomes enabled.

4. **Send second magic link after cooldown**:
   - Click "Resend".
   - ✅ New magic link sent successfully.
   - ✅ Cooldown timer resets to 60s.

### Expected Behavior
- Client-side cooldown prevents UI interaction.
- Server-side cooldown returns `429` if bypassed (test via API curl).

---

## Scenario 3: Rate Limit (10 Per Hour)

**Goal**: Validate hourly rate limit of 10 sends per email.

### Steps

1. **Send 10 magic links for same email**:
   - Use a script or manual loop to send 10 requests (wait 61s between each to bypass cooldown).
   - ✅ All 10 requests succeed.

2. **Attempt 11th request**:
   - Enter same email, click "Send Magic Link".
   - ✅ Receive error: "Too many requests. Please try again later."
   - ✅ Error shows `retry_after` time (e.g., "Try again in 45 minutes").

3. **Verify different email works**:
   - Enter a different email address.
   - ✅ Magic link sends successfully (rate limit is per-email).

### Expected API Response (11th request)
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after_seconds": 2700
}
```

---

## Scenario 4: Google OAuth First-Time Signup

**Goal**: Validate Google OAuth creates account and prefills profile.

### Steps

1. **Navigate to auth page**:
   - Open `http://localhost:3000/auth`.

2. **Click "Continue with Google"**:
   - ✅ Redirects to Google consent screen.

3. **Select Google account and authorize**:
   - Choose a Google account with name and avatar.
   - ✅ Redirects back to app.

4. **Verify account creation**:
   - ✅ New user created in `auth.users`.
   - ✅ `user_profiles` row created with:
     - `full_name` = Google display name.
     - `avatar_url` = Google profile picture URL.
     - `language` = inferred from browser (or default `pt-BR`).

5. **Verify redirect**:
   - ✅ Since `full_name` is populated, user redirected to `/profile` (dashboard).
   - ✅ Onboarding screen skipped.

### Expected Logs
```
[INFO] auth.oauth.google.success { email: "user@gmail.com", linked: false, full_name: "John Doe" }
```

---

## Scenario 5: Google OAuth Account Linking

**Goal**: Validate Google OAuth links to existing magic link account.

### Steps

1. **Create account via magic link**:
   - Use email `paulo@example.com` to create account via magic link.
   - Complete onboarding (enter full name).

2. **Log out**:
   - Navigate to profile, click "Log Out".
   - ✅ Session cleared.

3. **Return to auth page and use Google OAuth**:
   - Click "Continue with Google".
   - Choose Google account with same email (`paulo@example.com`).

4. **Verify account linking**:
   - ✅ No duplicate account created.
   - ✅ Google identity linked to existing `auth.users` record.
   - ✅ `raw_user_meta_data` updated with Google avatar/name (if missing).

5. **Verify redirect**:
   - ✅ User redirected to `/profile` (existing profile complete).

### Expected Logs
```
[INFO] auth.oauth.google.success { email: "paulo@example.com", linked: true }
```

---

## Scenario 6: Conditional Onboarding

**Goal**: Validate onboarding shown only when `full_name` missing.

### Steps

1. **Create account via magic link**:
   - Use email without prior account.
   - ✅ After magic link click, redirected to `/onboarding`.

2. **Verify onboarding form**:
   - ✅ Form shows:
     - `full_name` input (required).
     - `avatar_url` file upload (optional, shows default placeholder).
     - `language` dropdown (pre-filled with inferred language, editable).

3. **Submit with only `full_name`**:
   - Enter name, leave avatar empty.
   - Click "Continue".
   - ✅ Profile updated: `full_name` saved, `avatar_url` remains NULL (placeholder used).

4. **Verify redirect**:
   - ✅ User redirected to `/profile`.

5. **Log out and back in**:
   - ✅ On next login, onboarding skipped → direct to `/profile`.

---

## Scenario 7: Profile Dashboard Language Change

**Goal**: Validate language change in profile dashboard.

### Steps

1. **Navigate to profile dashboard**:
   - Log in and go to `/profile`.
   - ✅ Page displays user's `full_name`, `avatar_url` (or placeholder), current `language`.

2. **Change language to English**:
   - Click language dropdown, select "English (en-US)".
   - Click "Save".

3. **Verify update**:
   - ✅ Profile updated in DB: `language = 'en-US'`.
   - ✅ Page reloads with English UI strings (via next-intl).
   - ✅ Locale cookie set to `en-US`.

4. **Verify persistence**:
   - Refresh page.
   - ✅ Language remains English.

---

## Scenario 8: Session Expiry (30 Days / 7 Days Idle)

**Goal**: Validate session expiry triggers re-authentication.

### Steps (Manual Time Manipulation Required)

1. **Log in and record session timestamp**:
   - Authenticate and verify session active.

2. **Fast-forward time**:
   - **Option A**: Set system clock forward 8 days (idle timeout).
   - **Option B**: Set system clock forward 31 days (absolute expiry).
   - **Option C**: Mock Supabase session expiry in dev tools.

3. **Attempt to access protected page**:
   - Navigate to `/profile`.

4. **Verify re-authentication required**:
   - ✅ Session expired error.
   - ✅ Redirected to `/auth` with message: "Session expired. Please sign in again."

### Expected Behavior
- Supabase SDK detects expired token.
- Middleware/auth guard redirects to login.

---

## Scenario 9: Storage/Cookie Blocked Error

**Goal**: Validate non-dismissible error when cookies disabled.

### Steps

1. **Disable cookies in browser**:
   - Chrome: Settings > Privacy > Block third-party cookies.
   - Or use Incognito mode with strict settings.

2. **Navigate to auth page**:
   - Open `http://localhost:3000/auth`.

3. **Verify error overlay**:
   - ✅ Full-screen error shown: "Cookies and Local Storage Required".
   - ✅ Instructions displayed: "Enable cookies in browser settings."
   - ✅ "Retry" button present.
   - ✅ No way to dismiss error (blocks all interaction).

4. **Enable cookies and retry**:
   - Re-enable cookies.
   - Click "Retry".
   - ✅ Error disappears, auth page functional.

---

## Scenario 10: App-Local Logout

**Goal**: Validate logout is app-local (other apps stay logged in).

### Steps (Requires Multiple Apps or Tabs)

1. **Log in to shaliah-next**:
   - Authenticate at `http://localhost:3000`.
   - ✅ Session active.

2. **Open second tab/window** (simulating another app):
   - Open `http://localhost:3000/profile` in new tab.
   - ✅ Session shared, user still logged in.

3. **Log out in first tab**:
   - Click "Log Out" in first tab.
   - ✅ First tab redirected to `/auth`.

4. **Check second tab**:
   - Refresh second tab.
   - ✅ Session still active (logout is app-local, but in same app it affects all tabs).
   - *Note: True cross-app test requires deploying to separate domains/apps.*

### Expected Behavior
- `supabase.auth.signOut()` clears session in current app.
- Other apps (e.g., future Ezer web UI on different subdomain) retain session.

---

## Validation Checklist

After running all scenarios, verify:

- [ ] Magic link authentication works (Scenario 1).
- [ ] Cooldown enforced (Scenario 2).
- [ ] Rate limit enforced (Scenario 3).
- [ ] Google OAuth creates account (Scenario 4).
- [ ] Google OAuth links existing account (Scenario 5).
- [ ] Onboarding conditional (Scenario 6).
- [ ] Language change works (Scenario 7).
- [ ] Session expiry triggers re-auth (Scenario 8).
- [ ] Storage blocked shows error (Scenario 9).
- [ ] Logout is app-local (Scenario 10).
- [ ] All UI strings support EN + PT-BR.
- [ ] Performance: Auth UI loads < 2s on 3G Fast.
- [ ] Accessibility: Keyboard navigation, screen reader labels.

---

## Troubleshooting

### Magic Link Not Received
- Check Supabase email logs in dashboard.
- Verify SMTP settings configured.
- Check spam/junk folder.

### Google OAuth Fails
- Verify OAuth credentials in Supabase dashboard.
- Check authorized redirect URIs include `http://localhost:3000/auth/callback`.

### Cooldown Timer Not Working
- Check `localStorage` not cleared between requests.
- Verify server-side rate limit table populated.

### Session Not Persisting
- Verify cookies enabled in browser.
- Check Supabase cookie domain configuration.

---

**Quickstart Complete**: All acceptance scenarios documented and ready for manual validation.
