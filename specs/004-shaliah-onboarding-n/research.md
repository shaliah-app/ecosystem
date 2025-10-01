# Research: Shaliah Unified Onboarding & Authentication

**Feature**: 004-shaliah-onboarding-n  
**Date**: 2025-10-01  
**Purpose**: Consolidate technical decisions, patterns, and best practices for implementing unified authentication with magic links, OAuth, conditional onboarding, and cross-app sessions.

---

## 1. Authentication Strategy: Supabase Auth with Magic Links + Google OAuth

### Decision
Use **Supabase Auth** as the single authentication provider, leveraging its built-in magic link and Google OAuth support.

### Rationale
- **Constitution Principle VII**: Supabase-First integration mandates Supabase Auth.
- **Implicit account creation/linking**: Supabase Auth automatically handles user creation via `auth.users` table; we extend with `public.user_profiles`.
- **Magic link validity**: Supabase supports configurable expiry (15 minutes as per FR-003).
- **OAuth providers**: Google OAuth configured in Supabase dashboard; returns verified email for account matching.
- **Session management**: Supabase SDK manages JWT tokens, refresh logic, and cookie persistence natively.

### Alternatives Considered
- **Custom JWT implementation**: Rejected — violates Supabase-First principle, increases security surface.
- **Auth0/Clerk**: Rejected — not aligned with ecosystem constitution.

### Implementation Notes
- Use `supabase.auth.signInWithOtp({ email })` for magic links.
- Use `supabase.auth.signInWithOAuth({ provider: 'google' })` for Google.
- Magic link callback: `supabase.auth.onAuthStateChange()` triggers after link click.
- Store rate-limit state (10/hour) in Supabase DB or server-side cache (Redis/Upstash if available).

---

## 2. Rate Limiting: 60s Cooldown + 10/Hour Cap

### Decision
Implement **client-side cooldown timer** (60s) + **server-side rate limit** (10 sends/hour per email).

### Rationale
- **FR-004**: 60-second cooldown per email (global).
- **FR-004a**: 10 sends per rolling hour per email.
- **Client-side cooldown**: Improves UX (immediate feedback, countdown display) without server round-trip.
- **Server-side enforcement**: Prevents abuse via API replay or browser manipulation.

### Alternatives Considered
- **Client-only cooldown**: Rejected — easily bypassed.
- **Server-only rate limit**: Rejected — poor UX (no countdown until request).

### Implementation Notes
- **Client**: Store `lastSentTimestamp` in `localStorage` per email; calculate remaining cooldown on mount.
- **Server (yesod-api)**: Track sends in a `magic_link_attempts` table or cache (email, timestamp array). Enforce 10-count within 1-hour sliding window. Return `429 Too Many Requests` with `Retry-After` header.
- **Edge case**: If user clears `localStorage`, server-side limit still prevents abuse.

---

## 3. Language Inference: Browser + Profile Fallback

### Decision
Infer user language from:
1. **Browser `Accept-Language` header** (initial visit).
2. **Existing `user_profiles.language` field** (returning user).
3. **Default to `pt-BR`** if both unavailable.

### Rationale
- **FR-009**: Language inferred automatically without explicit onboarding step.
- **NFR-003**: Must support EN + PT-BR; PT-BR is primary.
- **next-intl best practice**: Server-side middleware reads `Accept-Language` → sets locale cookie → renders localized UI.

### Alternatives Considered
- **Explicit language selector in onboarding**: Rejected — spec mandates inference to minimize friction.
- **IP-based geolocation**: Rejected — less reliable, privacy concerns.

### Implementation Notes
- **Next.js middleware**: Use `next-intl/middleware` to detect locale from request headers.
- **Profile update**: On first successful auth, write inferred language to `user_profiles.language`.
- **Profile dashboard**: Allow user to change language; update `user_profiles.language` and set new locale cookie.

---

## 4. Conditional Onboarding: Skip When Profile Complete

### Decision
Show onboarding **only if `user_profiles.full_name` is `NULL`** after authentication.

### Rationale
- **FR-010**: Minimal onboarding — require `full_name` only if missing.
- **FR-006**: Google OAuth pre-fills `full_name` and `avatar_url` → onboarding skipped.
- **FR-010a**: Avatar optional; default placeholder if not provided.

### Alternatives Considered
- **Always show onboarding**: Rejected — poor UX for Google users with complete profiles.
- **Multi-step wizard**: Rejected — contradicts "skip when possible" requirement.

### Implementation Notes
- **Auth callback handler**:
  1. After Supabase auth success, query `user_profiles` by `auth.users.id`.
  2. If `full_name IS NULL` → redirect to `/onboarding`.
  3. Else → redirect to `/profile` (dashboard).
- **Onboarding form**: Single-step form with `full_name` (required), `avatar_url` (optional file upload), language dropdown (pre-filled from inference, editable).

---

## 5. Cross-App Sessions: Shared Login, App-Local Logout

### Decision
Sessions are **shared across Shaliah apps** (shaliah-next, future Ezer web UI) via **Supabase session cookie**. Logout is **app-local** (logging out in one app does not affect others).

### Rationale
- **Clarification Session 2025-10-01**: User selected option B (shared login, app-local logout).
- **FR-012**: Sessions work across ecosystem apps (initially Shaliah + Ezer).
- **Supabase behavior**: Session cookie is domain-scoped; apps on same domain share session automatically.

### Alternatives Considered
- **Global logout**: Rejected — user preference for app-local.
- **Token exchange protocol**: Deferred — mechanism (cookie domain vs token exchange) remains open; implementation will use Supabase default (cookie-based) unless cross-domain required.

### Implementation Notes
- **Same-domain apps**: Supabase session cookie (`.supabase.co` or custom domain) shared by default.
- **Logout**: Call `supabase.auth.signOut()` in current app only; other apps retain session until idle timeout (7 days) or absolute expiry (30 days).
- **Future cross-domain**: If Ezer deployed on different domain, implement token exchange or PKCE flow.

---

## 6. Session Lifetime: 30 Days Absolute, 7 Days Idle

### Decision
Supabase session configured with:
- **Absolute lifetime**: 30 days.
- **Idle timeout**: 7 days (refresh token expires after 7 days of inactivity).

### Rationale
- **Clarification Session 2025-10-01**: User selected option B.
- **NFR-005**: Session duration policy.
- **Supabase config**: Set `JWT_EXPIRY` and `REFRESH_TOKEN_ROTATION` in Supabase dashboard.

### Alternatives Considered
- **Shorter lifetimes (7/24h)**: Rejected — too restrictive for pastoral/volunteer use case.
- **Infinite session**: Rejected — security risk.

### Implementation Notes
- **Supabase dashboard**: Configure `JWT expiry` = 1 hour (short-lived access token), `Refresh token expiry` = 7 days idle + 30 days absolute.
- **Client**: Supabase SDK automatically refreshes access token using refresh token until expiry.
- **Acceptance scenario 10**: User idle >7 days or session >30 days → `supabase.auth.getSession()` returns `null` → redirect to auth screen.

---

## 7. Avatar Handling: Optional with Placeholder

### Decision
Avatar is **optional** during onboarding. Use a **default placeholder image** if not provided.

### Rationale
- **Clarification Session 2025-10-01**: User selected option A (optional avatar edit; default placeholder).
- **FR-010a**: Avatar optional; placeholder if missing.
- **UX**: Reduces onboarding friction; users can update later in profile dashboard.

### Alternatives Considered
- **Required avatar**: Rejected — too high friction for MVP.
- **No avatar support**: Rejected — spec explicitly mentions `avatar_url` field.

### Implementation Notes
- **Placeholder Design**: Use shadcn/ui Avatar component with user initials (first 2 characters of `full_name`) displayed on a colored background. Background color determined by hashing user ID to ensure consistency. Example: "Paulo Santos" → "PS" on blue background.
- **Upload flow**: Optional file input in onboarding form → upload to Supabase Storage bucket `user-avatars` → store URL in `user_profiles.avatar_url`.
- **Storage Configuration**:
  - Bucket: `user-avatars`
  - Path: `/public/{user_id}/avatar.{ext}`
  - Max file size: 5MB
  - Allowed types: `image/jpeg`, `image/png`, `image/webp`
  - RLS: Public read, user-writable (INSERT/UPDATE where `auth.uid() = user_id`)
- **Profile dashboard**: Allow avatar change via file upload.

---

## 8. Storage/Cookie Restrictions: Non-Dismissible Error

### Decision
Detect blocked cookies/localStorage and show a **non-dismissible error overlay** with instructions.

### Rationale
- **FR-013**: Prominent, non-dismissible error if storage blocked.
- **Supabase SDK requirement**: Relies on cookies/localStorage for session persistence.

### Alternatives Considered
- **Silent fallback**: Rejected — user left in broken state.
- **Dismissible warning**: Rejected — violates "non-dismissible" requirement.

### Implementation Notes
- **Detection**: On app load, test `localStorage.setItem()` and `document.cookie` access.
- **Error UI**: Full-screen overlay with:
  - "Cookies/Storage Required" heading.
  - Instructions: "Enable cookies in browser settings."
  - "Retry" button (re-checks storage).
- **No dismiss**: Overlay blocks all interaction until storage enabled.

---

## 9. UI Framework: shadcn/ui + next-intl

### Decision
Use **shadcn/ui** components (Button, Input, Dialog, Avatar) + **next-intl** for i18n.

### Rationale
- **Constitution stack**: shadcn/ui is mandated UI library for shaliah-next.
- **next-intl**: Constitution Principle IX mandates next-intl for i18n.
- **Consistency**: Maintains design system across Shaliah.

### Alternatives Considered
- **Custom components**: Rejected — violates constitution, increases maintenance.
- **react-i18next**: Rejected — next-intl is constitutional choice.

### Implementation Notes
- **Auth form**: `<Button>`, `<Input>`, `<Label>` from shadcn/ui.
- **Cooldown timer**: `<Badge>` or custom countdown component with `useEffect` timer.
- **Translations**: Define `en.json` and `pt-BR.json` in `messages/` directory (next-intl pattern).

---

## 10. Logging & Monitoring: Pino + Sentry

### Decision
Use **packages/logger** (Pino) for structured logging + **Sentry** for error tracking.

### Rationale
- **Constitution**: All apps must use shared logger; each app initializes own Sentry SDK.
- **FR-015**: Log authentication attempts and critical events (link send, link consume, identity link).

### Alternatives Considered
- **console.log**: Rejected — forbidden by constitution.
- **No monitoring**: Rejected — FR-015 mandates audit logging.

### Implementation Notes
- **Logger**: Import `packages/logger` in shaliah-next; log events:
  - `auth.magic_link.sent` (email, timestamp).
  - `auth.magic_link.consumed` (email, success/failure).
  - `auth.oauth.google.success` (email, linked/new).
  - `auth.rate_limit.exceeded` (email, timestamp).
- **Sentry**: Initialize `@sentry/nextjs` in `instrumentation.ts`; capture auth errors.

---

## Summary of Key Patterns

| Area | Pattern | Source |
|------|---------|--------|
| Auth | Supabase Auth (magic link + Google OAuth) | Constitution VII |
| Rate Limit | Client countdown + server 10/hr cap | FR-004, FR-004a |
| Language | Browser header → profile → default pt-BR | FR-009, NFR-003 |
| Onboarding | Conditional (skip if full_name exists) | FR-010 |
| Session | 30d absolute, 7d idle, app-local logout | NFR-005, Clarifications |
| Avatar | Optional with placeholder | FR-010a, Clarifications |
| UI | shadcn/ui + next-intl | Constitution IX |
| Logging | Pino + Sentry | Constitution, FR-015 |

---

**Phase 0 Complete**: All technical unknowns resolved. Ready for Phase 1 (Design & Contracts).
