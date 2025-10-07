# Testing Guide: Tasks T047 & T048

**Feature**: 005-ezer-login  
**Date**: 2025-10-07  
**Status**: Ready for Manual Testing

## Overview

This guide walks through the manual testing requirements for tasks T047 and T048. These tasks validate the end-to-end functionality of the Ezer Bot authentication linking feature.

## Prerequisites

### 1. Start Both Applications

```bash
# Terminal 1: Start Shaliah Next.js app
cd /home/patrickkmatias/repos/yesod-ecosystem/apps/shaliah-next
pnpm dev

# Terminal 2: Start Ezer Bot
cd /home/patrickkmatias/repos/yesod-ecosystem/apps/ezer-bot
pnpm dev
```

### 2. Verify Environment Variables

**Shaliah (.env.local)**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TELEGRAM_BOT_USERNAME=ezer_dev_bot
```

**Ezer Bot (.env)**:
```bash
BOT_TOKEN=your-telegram-bot-token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SHALIAH_BASE_URL=http://localhost:3000
```

### 3. Test Accounts Needed
- Shaliah user account (create via email or Google OAuth)
- Telegram account for testing
- Development/staging database (NOT production)

---

## T047: Manual End-to-End Testing

### Test Execution Order

Execute tests in this order to avoid dependencies:

1. Scenario 1: Display QR Code
2. Scenario 2: First-time authentication via QR
3. Scenario 4: Returning user (already linked)
4. Scenario 8: Language synchronization
5. Scenario 6: Token expiration
6. Scenario 7: Single-use enforcement
7. Scenario 9: Sign-out propagation
8. Scenario 3: Authentication via link
9. Scenario 5: Unlinked user detection
10. Scenario 10: Profile page consistency

### Detailed Test Scenarios

#### Scenario 1: Display QR Code ✅

**Steps**:
1. Navigate to http://localhost:3000
2. Sign in with test account
3. Click Profile/Settings
4. Locate "Connect to Ezer Bot" section

**Verify**:
- [ ] QR code displays (200x200px SVG)
- [ ] No pixelation or rendering errors
- [ ] Link text: "Or you might use this [link]"
- [ ] Link URL format: `https://t.me/ezer_dev_bot?start=<32-char-token>`
- [ ] Token is 32 alphanumeric characters
- [ ] Countdown timer shows "Expires in X minutes"

**Performance**:
- [ ] Page load < 2s (check Network tab)
- [ ] No console errors

**Result**: _____ (PASS/FAIL)  
**Notes**: _____________________

---

#### Scenario 2: First-time QR Authentication ✅

**Steps**:
1. Ensure user NOT linked (check DB: `telegram_user_id IS NULL`)
2. Open Telegram mobile app
3. Scan QR code from profile page
4. Bot should open automatically

**Verify**:
- [ ] Bot sends success message in correct language
- [ ] Portuguese: "✅ Conta vinculada com sucesso!"
- [ ] English: "✅ Account linked successfully!"
- [ ] Database updated:
  ```sql
  SELECT telegram_user_id FROM user_profiles WHERE user_id = '<user-id>';
  -- Should return Telegram ID (e.g., 123456789)
  
  SELECT used_at FROM auth_tokens WHERE token = '<token>';
  -- Should return timestamp (not NULL)
  ```

**Result**: _____ (PASS/FAIL)  
**Notes**: _____________________

---

#### Scenario 3: Authentication via Link ✅

**Steps**:
1. Unlink account: `UPDATE user_profiles SET telegram_user_id = NULL WHERE user_id = '<user-id>'`
2. Generate new token in profile
3. Right-click link → Copy
4. Paste in Telegram (send to Saved Messages or search bar)
5. Click link

**Verify**:
- [ ] Same result as QR scan
- [ ] Account linked successfully
- [ ] Success message in correct language

**Result**: _____ (PASS/FAIL)  
**Notes**: _____________________

---

#### Scenario 4: Returning User ✅

**Steps**:
1. Ensure account is linked (from Scenario 2/3)
2. Close Telegram app completely
3. Reopen Telegram
4. Send message to bot: "Hello"

**Verify**:
- [ ] Bot responds normally (no auth prompt)
- [ ] No "You need to link your account" messages
- [ ] Bot recognizes user on desktop and mobile

**Result**: _____ (PASS/FAIL)  
**Notes**: _____________________

---

#### Scenario 5: Unlinked User Detection ✅

**Steps**:
1. Unlink account: `UPDATE user_profiles SET telegram_user_id = NULL`
2. Send message to bot: "Hi"

**Verify**:
- [ ] Bot sends authentication prompt
- [ ] Message explains need to authenticate via Shaliah
- [ ] Message includes link to profile: `http://localhost:3000/profile`
- [ ] Bot doesn't crash or ignore user

**Result**: _____ (PASS/FAIL)  
**Notes**: _____________________

---

#### Scenario 6: Token Expiration ✅

**Steps**:
1. Generate token
2. **Fast option**: Update DB to expire token
   ```sql
   UPDATE auth_tokens 
   SET expires_at = now() - interval '1 minute' 
   WHERE user_id = '<user-id>' AND is_active = true;
   ```
3. Attempt to use expired token in bot

**Verify**:
- [ ] Bot sends expiration error
- [ ] Portuguese: "⏰ Link expirado"
- [ ] English: "⏰ Link expired"
- [ ] Message explains 15-minute validity
- [ ] Database shows token NOT used (`used_at IS NULL`)

**Result**: _____ (PASS/FAIL)  
**Notes**: _____________________

---

#### Scenario 7: Single-Use Token ✅

**Steps**:
1. Use token successfully (link account)
2. Copy same authentication link
3. Try to use same token again

**Verify**:
- [ ] Bot sends "already used" error
- [ ] Portuguese: "🔒 Link já utilizado"
- [ ] English: "🔒 Link already used"
- [ ] Database shows `used_at IS NOT NULL`

**Result**: _____ (PASS/FAIL)  
**Notes**: _____________________

---

#### Scenario 8: Language Synchronization ✅

**Steps**:
1. In Shaliah profile, set language to Portuguese
2. Link Telegram account via QR/link
3. Verify bot message in Portuguese
4. Change Shaliah language to English
5. Send message to bot

**Verify**:
- [ ] Initial bot message in Portuguese
- [ ] After language change, bot responds in English
- [ ] No re-linking required
- [ ] Database shows correct language:
  ```sql
  SELECT language FROM user_profiles WHERE user_id = '<user-id>';
  ```

**Result**: _____ (PASS/FAIL)  
**Notes**: _____________________

---

#### Scenario 9: Sign-out Propagation ✅

**Steps**:
1. Ensure account is linked
2. Click "Sign Out" in Shaliah profile
3. Verify redirect to sign-in page
4. Send message to bot

**Verify**:
- [ ] Database shows account unlinked:
  ```sql
  SELECT telegram_user_id FROM user_profiles WHERE user_id = '<user-id>';
  -- Should return NULL
  ```
- [ ] Bot detects unlink
- [ ] Bot sends unlinked message
- [ ] Re-linking works successfully

**Result**: _____ (PASS/FAIL)  
**Notes**: _____________________

---

#### Scenario 10: Profile Page Consistency ✅

**Steps**:
1. Sign out, then sign in with email magic link
2. Navigate to profile, verify QR section present
3. Sign out, then sign in with Google OAuth
4. Navigate to profile again

**Verify**:
- [ ] Both auth methods show same profile layout
- [ ] Same "Connect to Ezer Bot" section
- [ ] Same QR code and link display
- [ ] No UI differences between auth methods

**Result**: _____ (PASS/FAIL)  
**Notes**: _____________________

---

### Edge Cases

#### EC-1: Multiple Token Generation

**Steps**:
1. Generate token A
2. Immediately generate token B (before using A)
3. Try to use token A

**Verify**:
- [ ] Token A invalidated
- [ ] Token B works successfully
- [ ] Database shows only token B active

**Result**: _____ (PASS/FAIL)

---

#### EC-2: Telegram Account Collision

**Steps**:
1. User A links Telegram account
2. User B tries to link same Telegram account

**Verify**:
- [ ] Bot returns collision error
- [ ] Message: "⚠️ Esta conta do Telegram já está vinculada"

**Result**: _____ (PASS/FAIL)

---

#### EC-3: Invalid Token Format

**Steps**:
1. Manually send: `/start abc123` (only 6 chars)

**Verify**:
- [ ] Bot returns invalid token error
- [ ] No crash or database corruption

**Result**: _____ (PASS/FAIL)

---

#### EC-4: Network Failure

**Steps**:
1. Enable network throttling (offline)
2. Attempt to generate token
3. Re-enable network and retry

**Verify**:
- [ ] Error message shown during offline
- [ ] Retry succeeds after network restored

**Result**: _____ (PASS/FAIL)

---

#### EC-5: Concurrent Token Usage

**Steps**:
1. Generate single token
2. Open link on two devices simultaneously
3. Click both at nearly same time

**Verify**:
- [ ] First request wins (account linked)
- [ ] Second request gets "already used" error

**Result**: _____ (PASS/FAIL)

---

### Performance Benchmarks

#### PB-1: Token Generation Time

```bash
curl -X POST http://localhost:3000/api/ezer-auth/token \
  -H "Cookie: sb-token=..." \
  -w "\nTime: %{time_total}s\n"
```

**Target**: < 2s  
**Actual**: _____ s  
**Result**: _____ (PASS/FAIL)

---

#### PB-2: Profile Page Load Time

**Steps**:
1. Open Chrome DevTools → Network tab
2. Clear cache
3. Reload profile page
4. Check DOMContentLoaded time

**Target**: < 2s  
**Actual**: _____ s  
**Result**: _____ (PASS/FAIL)

---

#### PB-3: Bot Token Validation Time

**Steps**:
1. Send `/start <token>` to bot
2. Measure time from send to first bot response

**Target**: < 500ms  
**Actual**: _____ ms  
**Result**: _____ (PASS/FAIL)

---

### Security Validations

#### SV-1: Token Entropy

**Verify**:
- [ ] Tokens are cryptographically random
- [ ] No collisions in 1000 generated tokens
- [ ] Pattern: `[a-zA-Z0-9]{32}`

**Result**: _____ (PASS/FAIL)

---

#### SV-2: No PII in Token

**Verify**:
```sql
SELECT token FROM auth_tokens WHERE user_id = '<user-id>';
-- Decode token, check it doesn't contain:
-- - Email address
-- - User ID (in plaintext)
-- - Telegram ID
-- - Timestamps
```

**Result**: _____ (PASS/FAIL)

---

#### SV-3: HTTPS Only

**Verify**:
- [ ] All Telegram deep links use `https://t.me/...`
- [ ] No `http://` links generated
- [ ] QR code contains HTTPS URL

**Result**: _____ (PASS/FAIL)

---

## T048: Chrome DevTools MCP UI Validation

### Test 1: QR Code Display

**Steps**:
1. Open profile page in Chrome
2. Open DevTools (F12)
3. Inspect QR code element

**Verify**:
- [ ] QR code is SVG format
- [ ] Size: 200x200px (or specified)
- [ ] No pixelation when zoomed
- [ ] SVG renders without errors
- [ ] Accessible via screen readers (alt text present)

**Screenshot**: _____  
**Result**: _____ (PASS/FAIL)

---

### Test 2: Link Clickability and Formatting

**Steps**:
1. Inspect link element in DevTools
2. Verify link attributes
3. Click link and observe behavior

**Verify**:
- [ ] Link text: "Or you might use this [link]"
- [ ] Link is `<a>` tag with proper href
- [ ] href format: `https://t.me/ezer_dev_bot?start=<token>`
- [ ] Opens in new tab (`target="_blank"`)
- [ ] `rel="noopener noreferrer"` present
- [ ] Link is keyboard accessible (tab navigation)

**Result**: _____ (PASS/FAIL)

---

### Test 3: Expiration Countdown Display

**Steps**:
1. Generate token
2. Observe countdown in UI
3. Check DevTools → Elements for countdown element

**Verify**:
- [ ] Countdown updates every second
- [ ] Format: "Expires in X minutes" or "Expires in X seconds"
- [ ] Switches to seconds when < 90 seconds remaining
- [ ] Reaches 0 and stops (doesn't go negative)
- [ ] No memory leaks (check Performance tab)

**Result**: _____ (PASS/FAIL)

---

### Test 4: Linked Status Indicator

**Steps**:
1. Link account successfully
2. Return to profile page
3. Observe linked status

**Verify**:
- [ ] Shows linked status (e.g., "✓ Linked to @username")
- [ ] Different UI state than unlinked
- [ ] Clear visual distinction
- [ ] Accessible (proper ARIA labels)

**Result**: _____ (PASS/FAIL)

---

### Test 5: Performance Measurement

**Steps**:
1. Open DevTools → Network tab
2. Clear cache (Hard reload)
3. Load profile page
4. Check Lighthouse performance score

**Verify**:
- [ ] DOMContentLoaded < 2s
- [ ] Load time < 2s
- [ ] No blocking resources
- [ ] Lighthouse score > 90
- [ ] No layout shifts (CLS < 0.1)

**Performance Metrics**:
- DOMContentLoaded: _____ ms
- Load: _____ ms
- First Contentful Paint: _____ ms
- Lighthouse Score: _____ / 100

**Result**: _____ (PASS/FAIL)

---

## Test Completion Checklist

### T047: Manual E2E Testing
- [ ] All 10 acceptance scenarios completed
- [ ] All 5 edge cases tested
- [ ] All 3 performance benchmarks met
- [ ] All 3 security validations passed
- [ ] Results documented in this file

### T048: Chrome DevTools UI Validation
- [ ] QR code display validated
- [ ] Link clickability validated
- [ ] Countdown display validated
- [ ] Linked status indicator validated
- [ ] Performance measurements completed

---

## Summary

**Total Tests**: 21 scenarios  
**Passed**: _____ / 21  
**Failed**: _____ / 21  
**Blocked**: _____ / 21

**Overall Status**: _____ (PASS/FAIL)

**Date Completed**: _____________________  
**Tester**: _____________________  
**Notes**: _____________________________________________________

---

## Next Steps

If all tests pass:
1. Mark T047 and T048 as complete in tasks.md
2. Proceed to Phase 5: Code Quality Validation (T049-T052)

If any tests fail:
1. Document failures in GitHub issues
2. Fix issues
3. Retest failed scenarios
4. Update this guide with results

