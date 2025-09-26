# Feature Specification: Shaliah Authentication

**Feature Branch**: `003-shaliah-authentication`  
**Created**: 2025-09-26  
**Status**: Draft  
**Input**: User description: "shaliah authentication

please check this attached markdown file that contains the journeys of the authentication that I want to implement in my Shaliah Nuxt application, so later I'll be able to use it to authenticate any user throughout my whole Yesod ecosystem, like it was pointed with the Telegram linking"

## Clarifications
### Session 2025-09-26
- **Q**: How does the system handle a user trying to sign up with a Google account that has a different email from their existing account? → **A**: It should create a new account. However, the system should support linking up to 3 verified emails to a single user account and allow users to delete their own accounts to resolve conflicts.
- **Q**: When a user requests a magic link to sign in, how long should the link remain valid before it expires? → **A**: 15 minutes
- **Q**: What should happen if a user's browser has cookies or local storage blocked, preventing the session from being saved? → **A**: Display a prominent, non-dismissible error message on the page explaining the issue and instructing the user to enable cookies/storage.
- **Q**: What is the absolute minimum set of actions a user must complete in this flow before they can access the main application dashboard? → **A**: Language selection and profile setup (entering `full_name`) are mandatory.
- **Q**: When a user deletes their account, what is the expected data retention policy? → **A**: Soft Delete with Grace Period: The account is marked as inactive, and data is permanently deleted after a 30-day grace period.
- **Q**: For linking the Shaliah account to the Ezer Telegram bot, a temporary token is generated. How long should this single-use token be valid before it expires? → **A**: 5 minutes

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a new user, I want to securely sign up and log in to Shaliah using my email or Google account, so that I can access the application and have my identity managed seamlessly across different login methods.

### Acceptance Scenarios
1. **Given** a user is on the Shaliah login page, **When** they enter their email and click "Sign in with Email", **Then** they receive a magic link valid for 15 minutes.
2. **Given** a new user clicks a valid magic link, **When** they are redirected to the app, **Then** a new user profile is created and they are logged in.
3. **Given** a user with an existing email-based account, **When** they sign in with Google using the same email address, **Then** the system links the Google identity to their existing account and logs them in.
4. **Given** a user has an account and wishes to resolve a conflict, **When** they navigate to account settings, **Then** they have an option to permanently delete their account.
5. **Given** a user wants to consolidate logins, **When** they are in their account settings, **Then** they can add a new email address, verify it via a magic link, and use it for future logins.

### Edge Cases
- **Invalid/Expired Link**: When a user clicks an expired or invalid magic link, the system MUST display a clear error message and prompt them to request a new one.
- **Blocked Storage**: If the browser has local storage or cookies disabled, the system MUST display a persistent error message explaining that the application cannot function and requires storage to be enabled.
- **Account Conflict (New Email)**: If a user tries to add an email to their profile that is already associated with another Shaliah account, the system MUST display an error and prevent the action.
- **Account Conflict (Google Sign-In)**: If a user signs in with a Google account whose email is different from their existing account, a new, separate Shaliah account MUST be created. The user can resolve this by deleting the unwanted account and linking the Google identity to the primary account.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST allow users to sign up or sign in using an email magic link.
- **FR-002**: System MUST allow users to sign up or sign in using their Google account.
- **FR-003**: System MUST create a new `UserProfile` for first-time users.
- **FR-004**: System MUST pre-populate `full_name` and `avatar_url` from the user's Google profile on first sign-up.
- **FR-005**: System MUST link a Google identity to an existing `UserProfile` if the email addresses match.
- **FR-006**: System MUST redirect new users to an initial onboarding flow where language selection and profile name entry are mandatory.
- **FR-007**: The authentication system MUST be extensible for future integrations (e.g., Ezer Telegram bot).
- **FR-008**: Users MUST be able to access the same `UserProfile` whether they log in with email or a linked Google account.
- **FR-009**: Magic links for email authentication MUST expire 15 minutes after being issued.
- **FR-010**: The system MUST support associating multiple email addresses (up to 3) with a single user account.
- **FR-011**: Users MUST be able to delete their own account. Deletion will be a soft delete, with permanent removal after a 30-day grace period.
- **FR-012**: The system MUST generate a single-use `AuthToken` for linking with the Ezer bot, which MUST expire 5 minutes after creation.
- **FR-013**: System MUST check for browser storage capabilities and show a blocking error if they are disabled.

### Key Entities *(include if feature involves data)*
- **UserProfile**: Represents a user's public-facing information and preferences.
  - **id**: UUID, Primary Key (Foreign Key to `auth.users.id`)
  - **full_name**: Text
  - **avatar_url**: Text (URL)
  - **language**: Text (e.g., 'pt-BR'), Not Null, Default 'pt-BR'
  - **active_space_id**: UUID (Foreign Key to `Spaces.id`)
  - **telegram_user_id**: BIGINT, Unique
  - **created_at**: Timestamp, Not Null
  - **updated_at**: Timestamp, Not Null
- **AuthToken**: A short-lived, single-use token for linking sessions (e.g., Ezer bot).
  - **token**: UUID, Primary Key
  - **user_id**: UUID (Foreign Key to `UserProfile.id`), Not Null
  - **expires_at**: Timestamp, Not Null

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

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

