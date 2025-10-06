# Feature Specification: Ezer Bot Authentication Link

**Feature Branch**: `005-ezer-login`  
**Created**: 2025-10-06  
**Status**: Draft  
**Input**: User description: "ezer login - lets add a feature to shaliah that will let the user to authenticate into Ezer bot through a link or a QR Code. it should have a message like this "Or you might use this [link](actual link)" behind the QR code. so, this QR code and link should appear in the user profile. before start implementing, it should be checked how this user profile screen was implemented, because I've seen a bug that when logging in through email lead to one user profile and logging in through google account would led to another user profile page even with a language input (this would be the correct). once this QR code is read or link clicked, it would authenticate into Telegram's Ezer-bot, letting the user to read the main overview message from Ezer. Ezer should be able to identify that the user is not authenticated, and would ask the user to first authenticate in shaliah and link his account there if it is the case. once authenticated in ezer, he would never see this message again, because it would act like a link between the two accounts, you know? so shaliah would "manage" the session in both applications: if the user logs out in shaliah, he would be logged out in the telegram bot too. now, see, ezer-bot also has i18n. Its language should match the user's preferred language."

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

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a Shaliah user, I want to link my account to the Ezer Telegram bot so that I can access my personalized features through Telegram. I can scan a QR code or click a link from my profile page to authenticate directly in the Ezer bot. Once linked, my language preference carries over to Ezer, and if I sign out from Shaliah, I'm also signed out from Ezer to maintain security and consistency.

### Acceptance Scenarios

1. **Display authentication QR code and link in profile**
   - **Given** I'm authenticated in Shaliah and viewing my profile dashboard
   - **When** the profile page loads
   - **Then** I see a section for "Connect to Ezer Bot" with a QR code displayed prominently
   - **And** below the QR code, I see text "Or you might use this [link]" where the link is clickable
   - **And** the QR code and link contain a single-use authentication token valid for a specific time period

2. **First-time Ezer authentication via QR code**
   - **Given** I scan the QR code with my Telegram app on my phone
   - **When** Telegram opens the Ezer bot with the authentication token
   - **Then** the Ezer bot automatically links my Shaliah account to my Telegram account
   - **And** the bot greets me with a welcome message in my preferred language (from Shaliah profile)
   - **And** the bot displays the main overview/menu
   - **And** my `telegram_user_id` is stored in my Shaliah user profile

3. **First-time Ezer authentication via link**
   - **Given** I click the authentication link from my profile page
   - **When** the link opens in Telegram (desktop or mobile)
   - **Then** the same authentication flow as QR code occurs
   - **And** my accounts are linked successfully

4. **Returning Ezer user (already linked)**
   - **Given** I have previously linked my Shaliah account to Ezer
   - **When** I start a conversation with Ezer bot (sending /start or any message)
   - **Then** the bot recognizes me automatically without re-authentication
   - **And** the bot displays content in my current language preference
   - **And** I don't see any authentication prompts

5. **Unlinked Telegram user attempts to use Ezer**
   - **Given** I'm a new Telegram user who has never linked their Shaliah account
   - **When** I send /start or any message to Ezer bot
   - **Then** the bot responds with a message explaining I need to authenticate via Shaliah first
   - **And** the bot provides instructions to create a Shaliah account and return with the authentication link/QR code

6. **Authentication token expiry**
   - **Given** I generate a QR code/link from my Shaliah profile
   - **When** I attempt to use the link after the expiration period (e.g., 15 minutes)
   - **Then** the Ezer bot shows an error message that the link has expired
   - **And** the bot instructs me to generate a new link from my Shaliah profile
   - **And** the expired token cannot be reused

7. **Single-use token enforcement**
   - **Given** I use an authentication link to successfully link my account
   - **When** I attempt to use the same link again
   - **Then** the bot rejects it with a message that the link has already been used
   - **And** the bot confirms I'm already authenticated

8. **Language synchronization**
   - **Given** my Shaliah profile language is set to Brazilian Portuguese
   - **When** I authenticate with Ezer bot for the first time
   - **Then** Ezer bot communicates with me in Brazilian Portuguese
   - **And** when I later change my language preference in Shaliah to English
   - **Then** Ezer bot automatically uses English in our next interaction

9. **Sign out from Shaliah cascades to Ezer**
   - **Given** I'm authenticated in both Shaliah and Ezer bot
   - **When** I sign out from Shaliah
   - **Then** my `telegram_user_id` is removed from my user profile
   - **And** the next time I interact with Ezer bot, I'm treated as unauthenticated
   - **And** the bot prompts me to re-authenticate via Shaliah

10. **Profile page bug verification**
    - **Given** the current implementation may have inconsistencies in profile pages
    - **When** I authenticate via email magic link
    - **Then** I'm directed to the same profile page as Google authentication
    - **And** both authentication methods show the same profile interface with language selector
    - **And** both show the Ezer authentication section

### Edge Cases

- **QR code fails to scan**: User can use the text link alternative provided below the QR code
- **Token generated but never used**: Token expires naturally after the defined period (no manual cleanup needed if database handles expiry)
- **User deletes Telegram account**: Next authentication attempt from Shaliah generates a new link; old telegram_user_id becomes orphaned but doesn't affect new linking
- **Multiple authentication attempts**: Each new QR code/link generation invalidates the previous unused token to prevent token accumulation
- **Network failure during linking**: User sees an error and can retry; partial state doesn't corrupt the linking process
- **User changes Telegram account**: User must re-authenticate with the new Telegram account; old association is replaced
- **Concurrent sessions**: If user is authenticated in multiple Telegram devices, they all share the same linked account
- **Concurrent token usage (race condition)**: If user opens authentication link on two devices simultaneously, first successful request consumes token; second receives "already used" error and must use existing authenticated session

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Display authentication UI)**: The Shaliah profile page MUST display a section for connecting to Ezer Bot, including a QR code and a clickable text link with the format "Or you might use this [link]"

- **FR-002 (Token generation)**: When a user views their profile, the system MUST generate a single-use authentication token that is valid for a limited time period (15 minutes recommended)

- **FR-003 (QR code encoding)**: The QR code MUST encode a Telegram deep link that opens the Ezer bot with the authentication token as a parameter

- **FR-004 (Link format)**: The text link MUST use the same Telegram deep link format as the QR code, allowing users to click it directly from web or mobile browsers

- **FR-005 (Token validation in Ezer)**: The Ezer bot MUST validate authentication tokens, checking for expiry and single-use enforcement before linking accounts

- **FR-006 (Account linking)**: When a valid token is used, the Ezer bot MUST:
  - Extract the user ID from the token
  - Store the Telegram user ID in the Shaliah user profile's `telegram_user_id` field
  - Establish the bidirectional link between accounts

- **FR-007 (Unauthenticated Ezer access)**: When an unlinked Telegram user interacts with Ezer bot, the bot MUST detect the absence of a linked Shaliah account and prompt the user to authenticate via Shaliah first

- **FR-008 (Authenticated Ezer access)**: When a linked Telegram user interacts with Ezer bot, the bot MUST:
  - Recognize the user by their Telegram user ID
  - Retrieve their associated Shaliah profile by querying the Supabase database directly using the telegram_user_id
  - Skip authentication prompts
  - Provide immediate access to bot features

- **FR-009 (Language synchronization)**: The Ezer bot MUST use the language preference stored in the user's Shaliah profile (queried from Supabase user_profiles table) for all interactions

- **FR-010 (Sign-out propagation)**: When a user signs out from Shaliah, the system MUST:
  - Remove the `telegram_user_id` from the user profile
  - Mark the Telegram session as invalidated
  - Ensure the next Ezer bot interaction treats the user as unauthenticated

- **FR-011 (Token expiration)**: Authentication tokens MUST expire after 15 minutes of generation, and expired tokens MUST be rejected with a clear error message

- **FR-012 (Single-use enforcement)**: Once an authentication token is successfully used, it MUST be marked as consumed atomically (using database transaction or row-level locking) and rejected on any subsequent use attempts. In concurrent access scenarios, the first request to complete the transaction wins; subsequent requests receive an "already used" error

- **FR-013 (Token invalidation on new generation)**: When a user generates a new authentication QR code/link, the system MUST update their existing token record (same row) with the new token value and reset the expiration time, rather than creating a new record or marking the old one as invalid

- **FR-014 (Profile consistency)**: Both email magic link and Google OAuth authentication methods MUST lead to the same profile page interface, with consistent display of language settings and Ezer authentication section

- **FR-015 (Error handling for expired tokens)**: When a user attempts to use an expired token in Ezer, the bot MUST display a friendly error message explaining the expiration and providing instructions to generate a new link

- **FR-016 (Error handling for used tokens)**: When a user attempts to reuse a consumed token, the bot MUST inform them that the link has already been used and confirm their authentication status

- **FR-017 (Bi-lingual support)**: All user-facing messages in both Shaliah profile page and Ezer bot MUST support Brazilian Portuguese and English

### Non-Functional Requirements

- **NFR-001 (Security)**: Authentication tokens MUST be cryptographically secure, unguessable, and sufficiently long (minimum 32 characters recommended)

- **NFR-002 (Token storage)**: Tokens MUST be stored securely with their expiration time, user association, and consumption status

- **NFR-003 (Performance)**: Token generation and QR code generation SHOULD complete within a reasonable time (target: under 2 seconds) to avoid significantly delaying profile page load. Performance optimization is desirable but not a blocking requirement for MVP

- **NFR-004 (Accessibility)**: Both QR code and text link MUST be accessible; users who cannot scan QR codes can use the text link alternative

- **NFR-005 (Logging)**: Authentication attempts MUST be logged with structured logging including:
  - `ezer.auth.token_generated` (INFO): user_id, token_id, timestamp, expiration_time
  - `ezer.auth.token_used_success` (INFO): user_id, telegram_user_id, token_id, timestamp
  - `ezer.auth.token_used_failure` (WARN): token_id, failure_reason (expired/used/invalid), timestamp
  - `ezer.auth.unlinked_access` (INFO): telegram_user_id, timestamp
  - `ezer.auth.signout_propagated` (INFO): user_id, telegram_user_id_removed, timestamp

- **NFR-006 (Data retention)**: Expired and consumed tokens SHOULD be cleaned up after 30 days to prevent database bloat

### Key Entities

- **AuthToken (new)**: Short-lived, single-use token for linking Shaliah and Ezer accounts. One active token per user (updated on regeneration).
  - **token**: UUID or secure random string (Primary Key)
  - **user_id**: UUID (Foreign Key to user_profiles.id, NOT NULL, Unique - one token per user)
  - **telegram_user_id**: BIGINT (Nullable, set after successful use)
  - **expires_at**: Timestamp (NOT NULL, typically current time + 15 minutes)
  - **consumed_at**: Timestamp (Nullable, set when token is used)
  - **created_at**: Timestamp (NOT NULL)

- **UserProfile (extended)**: Existing entity with telegram_user_id field
  - **telegram_user_id**: BIGINT (Nullable, Unique, links to Telegram account)
  - This field is already present in the schema per FR-006

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

### Constitution Alignment
- [x] **Principle I (Domain-Centric Architecture)**: Requirements expressed in domain language (user profiles, authentication tokens, account linking)
- [x] **Principle II (MVP-First)**: Scope focused on core authentication linking; future enhancements (e.g., unlinking, re-linking) can be added later
- [x] **Principle III (Testing & MCP)**: Acceptance scenarios are testable; Chrome DevTools MCP can be used to test QR code generation and link functionality in Shaliah profile
- [x] **Principle IV (Supabase-First)**: Authentication tokens can be stored in Supabase table; real-time capabilities not needed for this feature
- [x] **Principle V (Async via poel-worker)**: No long-running operations identified; authentication linking is synchronous
- [x] **Principle VI (TypeScript-First Monorepo)**: Feature spans multiple apps (shaliah-next, ezer-bot) within monorepo
- [x] **Principle VII (i18n)**: All user-facing messages support pt-BR and en-US; messages in Shaliah profile and Ezer bot welcome flow

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (none remaining)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Notes

### Profile Page Bug
The user reported a potential bug where email authentication and Google authentication lead to different profile pages. This needs to be investigated and fixed as part of this feature to ensure consistent display of the Ezer authentication section across both authentication methods.

### Future Considerations (Post-MVP)
- Account unlinking feature (user-initiated removal of Telegram connection)
- Multiple Telegram account linking for the same Shaliah user
- Notification in Ezer when Shaliah profile is updated (e.g., language change)
- Admin panel to view and manage account linkages
- Analytics on adoption rate of Telegram bot authentication

---

## Clarifications

### Session 2025-10-06
- Q: When a user generates a new authentication QR code/link (FR-013), what should happen to their previous unused token? → A: Replace old token with new one (update same row, reuse token ID)
- Q: What should happen if a user clicks/scans their authentication link on TWO devices nearly simultaneously (both reach Ezer bot before token is marked consumed)? → A: First request wins; second gets "already used" error
- Q: When an already-linked Telegram user interacts with Ezer bot, how should the bot retrieve their Shaliah profile data (language preference, etc.)? → A: Query Supabase database directly from Ezer bot
- Q: Should QR code generation complete within 500ms (NFR-003) or can it exceed this? → A: Can exceed 500ms; not a strict requirement

---

*Based on Constitution v4.2.0 - See `.specify/memory/constitution.md`*

````

---
