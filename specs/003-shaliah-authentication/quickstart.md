# Quickstart: Shaliah Authentication

**Date**: 2025-09-26  
**Status**: Completed

This guide provides the steps to set up the development environment and run the new authentication feature.

## 1. Prerequisites
- You have `pnpm` installed globally.
- You have Docker installed and running.
- You have cloned the `yesod-ecosystem` repository and are on the `003-shaliah-authentication` branch.

## 2. Environment Setup

### Step 2.1: Install Dependencies
Install all monorepo dependencies from the root of the project.
```bash
pnpm install
```

### Step 2.2: Configure Environment Variables
The Yesod API and Shaliah app require environment variables to connect to Supabase.

1. **Create `.env` file for Yesod API**:
   - Navigate to `apps/yesod-api`.
   - Copy the example file: `cp .env.example .env`.
   - Populate `.env` with your Supabase project URL and keys:
     ```env
     SUPABASE_URL=your-supabase-url
     SUPABASE_ANON_KEY=your-supabase-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
     ```

2. **Create `.env` file for Shaliah**:
   - Navigate to `apps/shaliah`.
   - Create a new `.env` file.
   - Add your public Supabase credentials. These will be exposed to the client.
     ```env
     NUXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NUXT_PUBLIC_SUPABASE_KEY=your-supabase-anon-key
     ```

### Step 2.3: Set up Supabase
1. **Start Supabase services**:
   From the repository root, run:
   ```bash
   pnpm supabase start
   ```
2. **Apply Database Migrations**:
   Run the Drizzle migrations to apply the new `UserProfile` and `AuthToken` tables.
   ```bash
   pnpm --filter yesod-api db:push
   ```

## 3. Running the Application

### Step 3.1: Run the Development Servers
From the repository root, start all applications in development mode using Turborepo.
```bash
pnpm dev
```
This will concurrently start:
- The **Yesod API** at `http://localhost:3000`
- The **Shaliah** Nuxt app at `http://localhost:3001`

### Step 3.2: Test the Authentication Flow
1. **Access Shaliah**: Open your browser and navigate to `http://localhost:3001`. You should be redirected to the new login page.
2. **Sign up with Email**:
   - Enter your email address and click "Login".
   - Check the Supabase local email catcher at `http://localhost:54324/monitor`.
   - Click the magic link in the email to be redirected back to Shaliah, now logged in.
3. **Complete Onboarding**: You will be guided through the mandatory language and profile setup.
4. **Sign up with Google**:
   - *Note*: Google OAuth requires additional setup in your Supabase project settings and may not be fully functional in a local environment without tunneling or further configuration. The primary flow to test locally is email authentication.

## 4. Adding the Login Component
To add the pre-built login UI to the Shaliah app, run this command from the `apps/shaliah` directory:
```bash
npx shadcn-vue@latest add Login05
```
Then, integrate the newly added component into the `pages/login.vue` file.
