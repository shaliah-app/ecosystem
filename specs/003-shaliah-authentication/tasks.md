# Task Breakdown: Shaliah Authentication

**Date**: 2025-09-26  
**Status**: Completed

This document breaks down the implementation of the Shaliah Authentication feature into actionable tasks, organized by application.

---

### Phase 1: Backend (Yesod API)

**Epic: Core Authentication and Profile Management**

- **Task 1.1: Update Database Schema**
  - **Description**: Add the `UserProfile` and `AuthToken` tables to the Drizzle schema located in `apps/yesod-api/src/db/schema.ts`.
  - **Files**: `apps/yesod-api/src/db/schema.ts`
  - **Verification**: Schema matches the `data-model.md` specification.

- **Task 1.2: Create Database Migration**
  - **Description**: Generate a new SQL migration file using Drizzle Kit based on the schema changes.
  - **Command**: `pnpm --filter yesod-api db:generate`
  - **Verification**: A new migration file is created in `apps/yesod-api/drizzle`.

- **Task 1.3: Implement User Profile Creation**
  - **Description**: Create a Supabase database function (or trigger) that automatically creates a new `UserProfile` record whenever a new user signs up in `auth.users`. This is more reliable than handling it in the client.
  - **Files**: New SQL migration file.
  - **Verification**: A new user signing up results in a corresponding row in the `UserProfile` table.

- **Task 1.4: Implement Onboarding API Endpoint**
  - **Description**: Create the `POST /onboarding` endpoint in the Hono router to handle the submission of the user's `fullName` and `language`.
  - **Files**: `apps/yesod-api/src/server.ts`, new file `apps/yesod-api/src/routes/auth/onboarding.ts`
  - **Verification**: Endpoint successfully updates the `UserProfile` table.

- **Task 1.5: Implement Account Deletion API Endpoint**
  - **Description**: Create the `DELETE /account` endpoint that uses the Supabase Admin SDK to delete a user from `auth.users`.
  - **Files**: `apps/yesod-api/src/server.ts`, new file `apps/yesod-api/src/routes/auth/account.ts`
  - **Verification**: Calling this endpoint removes the user from `auth.users` and the `UserProfile` table (via cascade).

---

### Phase 2: Frontend (Shaliah)

**Epic: Authentication and Onboarding UI**

- **Task 2.1: Install Login Component**
  - **Description**: Use the `shadcn-vue` CLI to add the `Login05` block to the Shaliah project.
  - **Command**: `pnpm --filter shaliah exec npx shadcn-vue@latest add Login05`
  - **Verification**: New component files are present in `apps/shaliah/src/components/ui/`.

- **Task 2.2: Create Login Page**
  - **Description**: Create the `login.vue` page and integrate the `Login05` component. Implement the client-side logic to call Supabase Auth methods.
  - **Files**: `apps/shaliah/app/pages/login.vue`
  - **Verification**: The login page is displayed correctly for unauthenticated users.

- **Task 2.3: Implement Magic Link and Google OAuth Logic**
  - **Description**: Wire the UI buttons to the corresponding Supabase client methods (`signInWithOtp` for magic link, `signInWithOAuth` for Google). Handle loading states and display errors returned from Supabase.
  - **Files**: `apps/shaliah/app/pages/login.vue`
  - **Verification**: Users can successfully log in using both methods.

- **Task 2.4: Create Onboarding Flow Pages**
  - **Description**: Create the necessary pages for the mandatory onboarding flow (Language Selection, Profile Setup).
  - **Files**: `apps/shaliah/app/pages/onboarding/language.vue`, `apps/shaliah/app/pages/onboarding/profile.vue`
  - **Verification**: New users are correctly redirected to this flow after their first login.

- **Task 2.5: Implement Onboarding Form Submission**
  - **Description**: Create the logic to submit the onboarding form data to the `POST /onboarding` endpoint on the Yesod API.
  - **Files**: `apps/shaliah/app/pages/onboarding/profile.vue`
  - **Verification**: User profile is updated with the provided name and language.

- **Task 2.6: Implement Account Deletion UI**
  - **Description**: Add a "Delete Account" button in the user settings page that calls the `DELETE /account` endpoint. This should be protected by a confirmation dialog.
  - **Files**: `apps/shaliah/app/pages/settings/account.vue` (or similar)
  - **Verification**: A user can successfully delete their own account.

---

### Phase 3: Integration & Middleware

**Epic: Routing and Session Management**

- **Task 3.1: Create Nuxt Auth Middleware**
  - **Description**: Implement global Nuxt middleware to manage routing. It should redirect unauthenticated users to `/login` and redirect authenticated users who haven't completed onboarding to the appropriate onboarding step.
  - **Files**: `apps/shaliah/middleware/auth.global.ts`
  - **Verification**: Routing rules are correctly enforced across the application.

- **Task 3.2: Create Hono Auth Middleware**
  - **Description**: Implement Hono middleware for the Yesod API to protect endpoints. It should verify the Supabase JWT from the `Authorization` header and attach the `userId` to the context for downstream handlers.
  - **Files**: `apps/yesod-api/src/middleware/auth.ts`
  - **Verification**: Protected API endpoints return a 401 error for unauthenticated requests.
