# Research: Shaliah Authentication UI

**Date**: 2025-09-26  
**Status**: Completed

## Objective
Investigate the feasibility and implementation steps for using the `shadcn-vue` `Login05` block as the foundation for the Shaliah application's authentication screen.

## Key Findings

### 1. Component Source & Installation
- **Component Library**: `shadcn-vue`
- **Block**: `Login05`
- **Installation Command**: `npx shadcn-vue@latest add Login05`
- **Reference URL**: [https://www.shadcn-vue.com/blocks/login#Login05](https://www.shadcn-vue.com/blocks/login#Login05)

### 2. Suitability for Shaliah
The `Login05` block is an excellent fit for the Shaliah authentication feature for the following reasons:
- **Design Alignment**: The clean, modern, dark-mode aesthetic matches the desired look and feel for Shaliah.
- **Functionality**: It provides the exact UI elements required by the feature specification:
    - Email input field
    - "Login" button (for magic link flow)
    - "Or" separator
    - "Continue with Google" button
- **Responsiveness**: The block is pre-built to be responsive across desktop, tablet, and mobile views, which significantly reduces front-end development effort.
- **Extensibility**: As a `shadcn-vue` component, it is composed of standard, unstyled Radix Vue primitives, making it easy to customize and extend if needed.

### 3. Implementation Strategy
1. **Install the Block**: Run the `npx shadcn-vue@latest add Login05` command within the `apps/shaliah` directory. This will add the necessary Vue component file(s) to the project.
2. **Create Login Page**: Create a new Nuxt page at `apps/shaliah/pages/login.vue`.
3. **Integrate Component**: Import and render the `Login05` component within `login.vue`.
4. **Wire Up Logic**:
    - **Email Input**: Bind the email input field to a local state variable.
    - **Login Button**: Attach a click handler that triggers the Supabase magic link authentication flow using the entered email.
    - **Continue with Google Button**: Attach a click handler that triggers the Supabase Google OAuth flow.
5. **State Management**: Handle loading, success, and error states. For example, disable the buttons and show a spinner while an authentication request is in progress. Display error messages returned from the API (e.g., "Invalid email").
6. **Routing**:
    - The login page should be the default route for unauthenticated users.
    - Upon successful authentication, the user should be redirected to the onboarding flow (`/onboarding`) or the main dashboard (`/`) as per the feature specification.

## Conclusion
The `shadcn-vue` `Login05` block is the recommended starting point for the authentication UI. It accelerates development by providing a well-designed, responsive, and functional base that directly maps to the feature requirements. The primary effort will be in wiring up the UI to the Supabase authentication logic within the Nuxt application.
