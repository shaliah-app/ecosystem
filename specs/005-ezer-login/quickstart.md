# Quickstart: Ezer Bot Authentication Link

**Feature**: 005-ezer-login  
**Date**: 2025-01-16  
**Purpose**: Manual integration testing scenarios for acceptance validation

## Prerequisites

### Environment Setup
```bash
# 1. Ensure both apps are running
cd apps/shaliah-next && pnpm dev  # Port 3000
cd apps/ezer-bot && pnpm dev      # Long polling mode

# 2. Verify environment variables
# shaliah-next/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TELEGRAM_BOT_USERNAME=ezer_dev_bot

# ezer-bot/.env
BOT_TOKEN=your-telegram-bot-token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Test Accounts
- **Shaliah Account**: test-user@example.com (or create new)
- **Telegram Account**: Your personal Telegram account for testing
- **Database**: Development/staging database (NOT production)

### Browser DevTools Setup
- Install Chrome DevTools MCP for testing QR code display
- Enable network throttling to test performance (< 2s target)

---

## Test Scenario 1: Display Authentication QR Code and Link in Profile

**User Story**: As a Shaliah user, I want to see a QR code and link in my profile to connect my Telegram account.

**Acceptance Criteria**: Acceptance Scenario #1 from spec.md

### Steps

1. **Sign in to Shaliah**
   ```
   Navigate to: http://localhost:3000
   Sign in with: test-user@example.com
   ```

2. **Navigate to Profile Page**
   ```
   Click: Profile / Settings menu
   URL should be: /[locale]/profile (e.g., /pt-BR/profile or /en-US/profile)
   ```

3. **Verify QR Code Section Exists**
   - [ ] Section titled "Connect to Ezer Bot" or "Conectar ao Bot Ezer" is visible
   - [ ] QR code is displayed (200x200px SVG)
   - [ ] QR code renders without pixelation

4. **Verify Link Text**
   - [ ] Below QR code: "Or you might use this [link]" (English)
   - [ ] Or in Portuguese: "Ou você pode usar este [link]"
   - [ ] Link is clickable
   - [ ] Link URL starts with `https://t.me/ezer_dev_bot?start=`
   - [ ] Token in URL is 32 characters alphanumeric

5. **Verify QR Code Content**
   - [ ] Use QR code scanner app to decode
   - [ ] Decoded URL matches the text link exactly
   - [ ] URL format: `https://t.me/ezer_dev_bot?start=<32-char-token>`

6. **Performance Check**
   - [ ] Open Chrome DevTools → Network tab
   - [ ] Reload profile page
   - [ ] Page load time < 2s (NFR-003)
   - [ ] No console errors related to QR generation

### Expected Results

✅ **Pass**: QR code and link both displayed correctly with matching tokens  
❌ **Fail**: Missing section, broken QR code, mismatched tokens, or errors

---

## Test Scenario 2: First-Time Ezer Authentication via QR Code

**User Story**: As a Shaliah user, I want to scan a QR code to authenticate with the Ezer bot.

**Acceptance Criteria**: Acceptance Scenario #2 from spec.md

### Steps

1. **Generate Fresh QR Code**
   - Sign in to Shaliah profile (if not already)
   - Ensure user has NOT linked Telegram account yet
   - Verify `telegram_user_id` is NULL in database:
     ```sql
     SELECT telegram_user_id FROM user_profiles WHERE user_id = '<user-id>';
     -- Should return: NULL
     ```

2. **Scan QR Code with Telegram**
   - Open Telegram app on mobile device
   - Use built-in QR scanner (or camera app)
   - Scan QR code from Shaliah profile page
   - Telegram should open Ezer bot chat

3. **Verify Bot Response**
   - [ ] Bot sends welcome message immediately
   - [ ] Message language matches Shaliah profile language
   - [ ] If profile is pt-BR: "✅ Conta vinculada com sucesso!"
   - [ ] If profile is en-US: "✅ Account linked successfully!"
   - [ ] Bot displays main menu/overview

4. **Verify Database State**
   ```sql
   SELECT telegram_user_id FROM user_profiles WHERE user_id = '<user-id>';
   -- Should return: <telegram-user-id> (e.g., 123456789)
   
   SELECT used_at, is_active FROM auth_tokens WHERE token = '<token>';
   -- Should return: used_at = <timestamp>, is_active = true
   ```

5. **Verify Subsequent Bot Interaction**
   - Send any message to Ezer bot (e.g., "Hello")
   - [ ] Bot responds normally (no re-authentication prompt)
   - [ ] Bot remembers user context

### Expected Results

✅ **Pass**: Account linked, bot responds in correct language, database updated  
❌ **Fail**: Token rejected, wrong language, database not updated, or errors

---

## Test Scenario 3: First-Time Ezer Authentication via Link

**User Story**: As a Shaliah user, I want to click a link to authenticate with the Ezer bot (alternative to QR).

**Acceptance Criteria**: Acceptance Scenario #3 from spec.md

### Steps

1. **Prepare Test**
   - Unlink Telegram account (set `telegram_user_id = NULL` in database)
   - Generate new token in Shaliah profile

2. **Click Authentication Link**
   - Right-click link in profile: "Or you might use this [link]"
   - Copy link URL
   - Paste in Telegram app search bar (or send to Saved Messages)
   - Click link in Telegram

3. **Verify Bot Response**
   - [ ] Bot opens with `/start <token>` command
   - [ ] Bot sends success message in correct language
   - [ ] No errors or "invalid token" messages

4. **Verify Database State**
   ```sql
   SELECT telegram_user_id FROM user_profiles WHERE user_id = '<user-id>';
   -- Should return: <telegram-user-id>
   ```

### Expected Results

✅ **Pass**: Same result as QR code scan (account linked successfully)  
❌ **Fail**: Token rejected, wrong behavior, or errors

---

## Test Scenario 4: Returning Ezer User (Already Linked)

**User Story**: As a returning user, I want the bot to recognize me without re-authentication.

**Acceptance Criteria**: Acceptance Scenario #4 from spec.md

### Steps

1. **Ensure Account is Linked**
   - Complete Scenario 2 or 3 first
   - Verify `telegram_user_id` is set in database

2. **Close and Reopen Telegram**
   - Close Telegram app completely
   - Reopen and navigate to Ezer bot chat

3. **Send Message to Bot**
   - Send: `/start`
   - Or send any message: "Hello"

4. **Verify Bot Response**
   - [ ] Bot responds immediately (no authentication prompt)
   - [ ] Bot displays content in current language preference
   - [ ] No "You need to link your account" messages

5. **Test from Different Device**
   - Open Telegram on desktop (if tested on mobile)
   - Send message to Ezer bot
   - [ ] Same authentication-free experience

### Expected Results

✅ **Pass**: Bot recognizes user on all devices, no re-authentication needed  
❌ **Fail**: Bot asks for re-authentication, or doesn't recognize user

---

## Test Scenario 5: Unlinked Telegram User Attempts to Use Ezer

**User Story**: As a new Telegram user, I should be prompted to authenticate via Shaliah.

**Acceptance Criteria**: Acceptance Scenario #5 from spec.md

### Steps

1. **Prepare Test**
   - Use a different Telegram account (not linked)
   - Or unlink current account:
     ```sql
     UPDATE user_profiles SET telegram_user_id = NULL WHERE user_id = '<user-id>';
     ```

2. **Start Bot Conversation**
   - Send: `/start` (no token)
   - Or send any message: "Hi"

3. **Verify Bot Response**
   - [ ] Bot sends authentication prompt message
   - [ ] Message explains need to authenticate via Shaliah first
   - [ ] Message provides instructions (e.g., "Visit shaliah.app/profile")
   - [ ] No errors or crashes

4. **Verify Bot Behavior**
   - [ ] Bot doesn't provide access to features
   - [ ] Bot doesn't crash or ignore user
   - [ ] Bot response is in Telegram app language (fallback)

### Expected Results

✅ **Pass**: Bot politely explains authentication requirement  
❌ **Fail**: Bot crashes, provides access without auth, or gives unclear message

---

## Test Scenario 6: Authentication Token Expiry

**User Story**: As a security measure, old authentication links should expire.

**Acceptance Criteria**: Acceptance Scenario #6 from spec.md

### Steps

1. **Generate Token**
   - Sign in to Shaliah profile
   - Copy authentication link
   - Note timestamp

2. **Wait for Expiration**
   - **Option A (Fast)**: Manually update database:
     ```sql
     UPDATE auth_tokens 
     SET expires_at = now() - interval '1 minute' 
     WHERE user_id = '<user-id>' AND is_active = true;
     ```
   - **Option B (Real-time)**: Wait 16 minutes (if 15-minute expiry)

3. **Attempt to Use Expired Token**
   - Open Telegram
   - Click/scan the old authentication link
   - Bot should receive `/start <token>`

4. **Verify Bot Response**
   - [ ] Bot sends error message
   - [ ] Portuguese: "⏰ Link expirado"
   - [ ] English: "⏰ Link expired"
   - [ ] Message explains link is valid for only 15 minutes
   - [ ] Message instructs to generate new link

5. **Verify Database State**
   ```sql
   SELECT used_at FROM auth_tokens WHERE token = '<token>';
   -- Should return: NULL (not consumed)
   ```

6. **Generate New Token and Retry**
   - Return to Shaliah profile
   - Generate new QR code/link
   - [ ] New token works successfully

### Expected Results

✅ **Pass**: Expired token rejected with clear message, new token works  
❌ **Fail**: Expired token accepted, unclear error, or system crash

---

## Test Scenario 7: Single-Use Token Enforcement

**User Story**: As a security measure, authentication links should work only once.

**Acceptance Criteria**: Acceptance Scenario #7 from spec.md

### Steps

1. **Use Token Successfully**
   - Complete Scenario 2 or 3 (link account)
   - Note the token used
   - Verify account is now linked

2. **Attempt to Reuse Same Token**
   - Copy the same authentication link
   - Click link again in Telegram
   - Or manually send: `/start <same-token>`

3. **Verify Bot Response**
   - [ ] Bot sends error message
   - [ ] Portuguese: "🔒 Link já utilizado"
   - [ ] English: "🔒 Link already used"
   - [ ] Message confirms account is already authenticated
   - [ ] No crashes or unexpected behavior

4. **Verify Database State**
   ```sql
   SELECT used_at FROM auth_tokens WHERE token = '<token>';
   -- Should return: <timestamp> (not NULL)
   ```

### Expected Results

✅ **Pass**: Reused token rejected with clear message  
❌ **Fail**: Token accepted again, or unclear error

---

## Test Scenario 8: Language Synchronization

**User Story**: As a user, the bot should use my preferred language from Shaliah.

**Acceptance Criteria**: Acceptance Scenario #8 from spec.md

### Steps

1. **Set Language to Portuguese**
   - Sign in to Shaliah
   - Go to Profile
   - Change language to "Português (pt-BR)"
   - [ ] Page reloads in Portuguese

2. **Link Bot Account**
   - Generate QR code/link
   - Scan/click to link Telegram account

3. **Verify Bot Language**
   - [ ] Bot welcome message in Portuguese
   - [ ] "✅ Conta vinculada com sucesso!"

4. **Change Language to English**
   - Return to Shaliah profile
   - Change language to "English (en-US)"
   - [ ] Page reloads in English

5. **Test Bot Language Update**
   - Send message to Ezer bot: "Hello"
   - [ ] Bot responds in English
   - [ ] Language changed automatically (no re-linking needed)

6. **Verify Database State**
   ```sql
   SELECT language FROM user_profiles WHERE user_id = '<user-id>';
   -- Should return: 'en-US' (or 'pt-BR')
   ```

### Expected Results

✅ **Pass**: Bot language matches Shaliah preference at all times  
❌ **Fail**: Bot stuck in wrong language, or requires re-linking

---

## Test Scenario 9: Sign Out from Shaliah Cascades to Ezer

**User Story**: As a user, signing out from Shaliah should unlink my Telegram account.

**Acceptance Criteria**: Acceptance Scenario #9 from spec.md

### Steps

1. **Ensure Account is Linked**
   - Complete Scenario 2 or 3
   - Verify bot recognizes you

2. **Sign Out from Shaliah**
   - Click "Sign Out" button in profile
   - [ ] Redirected to sign-in page
   - [ ] Session cleared

3. **Verify Database State**
   ```sql
   SELECT telegram_user_id FROM user_profiles WHERE user_id = '<user-id>';
   -- Should return: NULL (unlinked)
   ```

4. **Test Bot Interaction**
   - Send message to Ezer bot: "Hello"
   - [ ] Bot detects account is unlinked
   - [ ] Bot sends unlinked message
   - [ ] Portuguese: "⚠️ Sua conta Shaliah não está mais vinculada"
   - [ ] English: "⚠️ Your Shaliah account is no longer linked"

5. **Re-Link Account**
   - Sign in to Shaliah again
   - Generate new QR code/link
   - Link account
   - [ ] Account successfully re-linked

### Expected Results

✅ **Pass**: Sign-out unlinks account, bot detects unlink, re-linking works  
❌ **Fail**: Account still linked after sign-out, or bot crashes

---

## Test Scenario 10: Profile Page Consistency (Bug Fix)

**User Story**: As a user, I should see the same profile page regardless of authentication method.

**Acceptance Criteria**: Acceptance Scenario #10 from spec.md (FR-014)

### Steps

1. **Test Email Authentication**
   - Sign out if signed in
   - Sign in using email magic link
   - Navigate to profile page
   - [ ] Profile displays user info
   - [ ] Language selector visible
   - [ ] "Connect to Ezer Bot" section visible
   - [ ] QR code and link displayed

2. **Test Google OAuth Authentication**
   - Sign out
   - Sign in using "Continue with Google"
   - Navigate to profile page
   - [ ] Same profile layout as email auth
   - [ ] Same language selector
   - [ ] Same "Connect to Ezer Bot" section

3. **Compare Layouts**
   - [ ] Both paths lead to same URL: `/[locale]/profile`
   - [ ] No UI differences between auth methods
   - [ ] All features accessible in both cases

### Expected Results

✅ **Pass**: Identical profile page for both authentication methods  
❌ **Fail**: Different pages, missing features, or layout inconsistencies

---

## Edge Case Testing

### EC-1: QR Code Fails to Scan

**Steps**:
1. Generate QR code in profile
2. Attempt to scan with QR scanner app
3. If scanner fails:
   - [ ] Click text link as alternative
   - [ ] Link opens Telegram successfully

**Expected**: Text link works as fallback

---

### EC-2: Multiple Token Generation

**Steps**:
1. Generate token A
2. Immediately generate token B (before using A)
3. Attempt to use token A

**Expected**: Token A is invalidated, token B works

**Verify**:
```sql
SELECT token, is_active FROM auth_tokens 
WHERE user_id = '<user-id>' 
ORDER BY created_at DESC;
-- Should show only one active token (B)
```

---

### EC-3: Concurrent Token Usage (Race Condition)

**Steps**:
1. Generate single token
2. Open token link on two devices simultaneously
3. Click both links at nearly same time

**Expected**: 
- First request wins (account linked)
- Second request gets "already used" error

**Verify**:
```sql
SELECT used_at FROM auth_tokens WHERE token = '<token>';
-- Should have timestamp (used only once)
```

---

### EC-4: Network Failure During Linking

**Steps**:
1. Enable network throttling in Chrome DevTools (offline mode)
2. Attempt to scan QR code
3. Re-enable network
4. Retry

**Expected**: Error message shown, retry succeeds

---

### EC-5: User Deletes Telegram Account

**Steps**:
1. Link account successfully
2. Delete Telegram account (or use different account)
3. Generate new token with same Shaliah account
4. Link new Telegram account

**Expected**: Old `telegram_user_id` replaced, no errors

---

## Performance Benchmarks

### PB-1: Token Generation Time

**Test**:
```bash
# Measure time to generate token + QR code
curl -X POST http://localhost:3000/api/ezer-auth/token \
  -H "Cookie: sb-token=..." \
  -w "\nTime: %{time_total}s\n"
```

**Target**: < 2s (NFR-003)

---

### PB-2: Profile Page Load Time

**Test**:
1. Open Chrome DevTools → Network tab
2. Clear cache
3. Reload profile page
4. Check DOMContentLoaded time

**Target**: < 2s total page load

---

### PB-3: Bot Token Validation Time

**Test**:
1. Send `/start <token>` to bot
2. Measure time from send to first bot response

**Target**: < 500ms (token validation + DB query)

---

## Security Validation

### SV-1: Token Entropy

**Test**:
```typescript
// Check tokens are unique and random
const tokens = new Set()
for (let i = 0; i < 1000; i++) {
  const token = generateAuthToken()
  tokens.add(token)
}
console.assert(tokens.size === 1000, 'Tokens are not unique')
```

**Expected**: No collisions in 1000 tokens

---

### SV-2: No PII in Token

**Test**:
```sql
SELECT token FROM auth_tokens WHERE user_id = '<user-id>';
-- Decode token, check it doesn't contain:
-- - Email address
-- - User ID (in plaintext)
-- - Telegram ID
-- - Timestamps
```

**Expected**: Token is opaque random string

---

### SV-3: HTTPS Only

**Test**:
- All Telegram deep links use `https://t.me/...`
- No `http://` links generated

**Expected**: All links secure

---

## Regression Checklist

After implementation, verify these scenarios still work:

- [ ] Existing Shaliah authentication (email + Google OAuth)
- [ ] Profile page loads for all users
- [ ] Language switching in Shaliah still works
- [ ] Sign-out flow completes successfully
- [ ] No impact on other bot features (if any)
- [ ] Database migrations apply cleanly
- [ ] No console errors in production

---

## Test Data Cleanup

After testing, clean up:

```sql
-- Remove test tokens
DELETE FROM auth_tokens WHERE user_id = '<test-user-id>';

-- Unlink test account
UPDATE user_profiles SET telegram_user_id = NULL WHERE user_id = '<test-user-id>';
```

---

## Summary

**Total Scenarios**: 10 acceptance + 5 edge cases + 3 performance + 3 security = 21 tests

**Estimated Time**: 2-3 hours for complete manual testing

**Pass Criteria**:
- All 10 acceptance scenarios PASS
- At least 4/5 edge cases PASS
- All performance benchmarks met
- All security validations PASS

**Next Steps After Quickstart**:
1. ✅ All manual tests PASS → Proceed to implementation
2. ❌ Any test FAILS → Fix issue, retest
3. Document any discovered bugs in GitHub issues
4. Automate scenarios in Jest/Vitest (contract + integration tests)

---

*Based on spec.md acceptance scenarios and constitution testing requirements*
