# Feature Specification: Shaliah Unified Onboarding & Authentication

**Feature Branch**: `004-shaliah-onboarding-n`  
**Created**: 2025-10-01  
**Status**: Draft  
**Input**: User description: "shaliah onboarding — unify sign-in/sign-up into a single step with email magic link and Google, infer account existence, add magic-link cooldown and gentle UI, infer language automatically, conditional onboarding for missing profile data only, skip Ezer connect from onboarding, provide a basic user profile dashboard with language change, support cross-app auth across ecosystem (including Ezer bot), and honor specified Q&A constraints."

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a new or returning user, I can authenticate to Shaliah in a single step by continuing with Email (magic link) or Google. The system decides whether to create or reuse my account based on the verified email identity. If my profile is complete (e.g., from Google), I’m taken directly to my profile dashboard; otherwise, I’m prompted once to provide the minimal info (full name). My session works for Shaliah app, and will extend to the Ezer bot.

### Acceptance Scenarios
1. Email magic link happy path
   - Given I’m on the authentication screen and choose "Continue with Email" and enter a valid email
   - When I request a magic link
   - Then I see a confirmation state with my email shown read-only, a back button, and a resend control disabled by a visible cooldown timer
   - And when I click the link in my email within 15 minutes
   - Then I’m authenticated and redirected based on my profile completeness

2. Magic link cooldown and resend
   - Given I requested a magic link less than the 60-second cooldown interval ago
   - When I try to request another link
   - Then the system prevents the action and shows the remaining cooldown time clearly
   - And after 60 seconds have passed, I can request another link successfully
   - And if I exceed 10 sends within a rolling 1-hour window for the same email, I’m temporarily blocked and shown a clear rate-limit message with time to retry

3. Google first-time signup (implicit account creation)
   - Given I click "Continue with Google" and complete Google auth for an email with no existing Shaliah account
   - Then a new account is created and linked to that verified email
   - And my full name and avatar are pre-filled from Google
   - And if full name is available, onboarding is skipped and I’m taken to the profile dashboard

4. Google sign-in to existing email account (account linking)
   - Given I previously authenticated via Email magic link using paulo@email.com
   - When I authenticate via Google using the same verified email
   - Then the system recognizes the match and links the Google identity to the same account without creating a duplicate

5. Different Google email creates a distinct account
   - Given I have an existing account for email A
   - When I authenticate via Google using a different verified email B
   - Then the system creates a new account for email B (subject to future multi-email linking up to 3 verified emails)

6. Language inference and onboarding skip
   - Given language is inferred automatically from environment or prior profile
   - When I authenticate and my profile already includes a full name
   - Then onboarding is skipped and I’m taken directly to the profile dashboard

7. Minimal onboarding when required
   - Given my profile lacks a full name after authentication
   - When I land on the onboarding step
   - Then I can enter my full name and (optionally) add or change my avatar; a default placeholder is used if none is provided
   - And upon submission, I’m taken to the profile dashboard

8. Storage/cookie restrictions
   - Given my browser blocks cookies or local storage preventing session persistence
   - When I attempt to authenticate
   - Then a prominent, non-dismissible error explains the issue and instructs enabling storage/cookies

9. Cross-app session
   - Given I completed authentication in Shaliah Next
   - When I access other Shaliah apps in the ecosystem (and later the Ezer bot integration)
   - Then I remain authenticated without repeating login (within policy constraints)
   - And when I log out in one app, only that app logs out; other apps remain signed in (app-local logout)

10. Session expiry and idle timeout
   - Given I have an active session
   - When I remain idle for more than 7 days, or my session age exceeds 30 days
   - Then I am required to re-authenticate on next action

### Edge Cases
- Magic link used after 15 minutes → Link is rejected with an expired message and option to request a new link (subject to cooldown)
- Magic link used more than once → Only first valid use logs in; subsequent uses show that the link was already used/invalid
- Email address typed with case or whitespace variants → Treated case-insensitively after trimming
- Network loss right after link click → Show retriable error and do not mark link consumed until successfully exchanged
- User closes the email-confirmation UI and returns later → Cooldown state persists and is enforced


## Requirements *(mandatory)*

### Functional Requirements
- **FR-001 (Unified entry point)**: Provide a single authentication UI labeled "Continue with" options (Email, Google) instead of separate Sign in/Sign up.
- **FR-002 (Implicit account handling)**: Determine account existence by verified email identity; create a new account only when none exists; otherwise sign in the existing account.
- **FR-003 (Email magic link)**: Allow users to request a magic link for email authentication. The link must be valid for 15 minutes.
- **FR-004 (Magic link cooldown)**: Enforce a 60-second cooldown per email (global) after sending a magic link. Show a countdown until resend is available.
- **FR-004a (Magic link rate limit)**: Limit magic-link sends to 10 per email in a rolling 1-hour window with a clear error and retry-after indication when exceeded.
- **FR-005 (Post-request UI state)**: After requesting a link, show: a friendly confirmation message, the email in a disabled input, a visible cooldown timer, and a Back button to return to the provider selection.
- **FR-006 (Google auth and prefill)**: On Google auth, prefill profile fields (full_name, avatar_url) when available.
- **FR-007 (Account linking same email)**: If Google returns the same verified email as an existing account, link the identity to the same account (no duplicate creation).
- **FR-008 (Different email behavior)**: If Google returns a different verified email, create a separate account. [Note: future enhancement allows linking up to 3 verified emails per account.]
- **FR-009 (Language inference)**: Infer language automatically (e.g., browser or prior setting) and store on the profile without an explicit onboarding step.
- **FR-010 (Conditional onboarding)**: Only show onboarding if required profile data is missing. At minimum, require full_name if not already present. Skip onboarding otherwise and route to profile dashboard.
- **FR-010a (Avatar optional)**: Avatar editing is optional during onboarding; if no avatar is provided or available from Google, use a default placeholder image.
- **FR-011 (Profile dashboard placeholder)**: Provide a basic profile page showing user info and allowing language change. This replaces the prior "Connect to Ezer" onboarding step.
- **FR-012 (Cross-app authentication)**: Sessions should log the user into other Shaliah applications in the ecosystem, initially including the Ezer bot integration roadmap. [Scope note: exact mechanism is outside this spec’s HOW.]
   - Clarified: Logout is app-local; logging out in one app does not force logout across other apps.
- **FR-013 (Storage restrictions UX)**: If cookies/local storage are blocked and session cannot be saved, display a prominent, non-dismissible error explaining the issue and remediation.
- **FR-014 (Error/expired link UX)**: Expired or reused magic links must show clear errors and offer a flow to request a fresh link (respecting cooldown).
- **FR-015 (Security and audit)**: Log authentication attempts and critical events (link send, link consume, identity link) for security monitoring.
- **FR-016 (Naming)**: Use neutral, single-step language such as "Continue with" in UI copy instead of "Sign in/Sign up".

### Non-Functional and Policy Requirements
- **NFR-001 (Data retention)**: Account deletion follows Soft Delete with 30-day grace period before permanent removal.
- **NFR-002 (Accessibility)**: Authentication and onboarding screens meet baseline accessibility (keyboard, screen reader labels, sufficient contrast).
- **NFR-003 (Localization)**: All UI strings support English and Brazilian Portuguese at a minimum.
- **NFR-004 (Performance)**: Authentication UI loads within 2s on a 3G Fast network baseline.
- **NFR-005 (Session duration)**: Session absolute lifetime is 30 days with a 7-day idle timeout; after either threshold is reached, re-authentication is required.

### Key Entities *(include if feature involves data)*
- **UserProfile**: Public-facing profile linked 1:1 with auth user. Key attributes: id (FK to auth.users.id), full_name, avatar_url, language (default inferred, user-editable), telegram_user_id (optional, unique), active_space_id (optional), created_at, updated_at. Relationships: belongs to auth.users; can be member of many Spaces.

---

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

## Clarifications
### Session 2025-10-01
- Q: What behavior do you want for session sharing and logout across Shaliah apps (web now; Ezer later)? → A: B (Shared login across apps, but logout is app-local; other apps stay logged in)
- Q: What exact cooldown do you want before a user can request another magic link? → A: A (60 seconds per email, global)
- Q: How many magic-link send attempts should be allowed per email in a rolling 1-hour window? → A: B (10 per hour)
- Q: What session duration and idle timeout should apply before re-authentication is required? → A: B (30 days absolute, 7 days idle)
- Q: If Google doesn’t provide an avatar, should onboarding require or offer avatar editing? → A: A (Optional avatar edit; default placeholder)

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous  
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [ ] User description parsed
- [ ] Key concepts extracted
- [ ] Ambiguities marked
- [ ] User scenarios defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed

---
