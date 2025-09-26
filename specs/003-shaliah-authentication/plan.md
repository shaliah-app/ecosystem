
# Implementation Plan: Shaliah Authentication

**Branch**: `003-shaliah-authentication` | **Date**: 2025-09-26 | **Spec**: [./spec.md](./spec.md)
**Input**: Feature specification from `/home/patrickkmatias/repos/yesod-ecosystem/specs/003-shaliah-authentication/spec.md`

## Summary
This plan outlines the implementation of a comprehensive authentication system for the Shaliah Nuxt application. The system will support user sign-up and sign-in via both email-based magic links and Google OAuth, leveraging Supabase Auth as the backend. The technical approach involves integrating a pre-built `shadcn-vue` component for the login UI, creating new API endpoints in the Yesod API for profile management, and establishing a clear, secure data model that extends Supabase's native `auth.users` table.

## Technical Context
**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Nuxt.js (Vue), Hono (Node.js), Drizzle ORM, Supabase
**Storage**: Supabase (PostgreSQL)
**Testing**: Vitest, Playwright (for E2E)
**Target Platform**: Web (Desktop & Mobile)
**Project Type**: Web Application (Frontend + Backend)
**Performance Goals**: p99 latency for auth endpoints < 200ms
**Constraints**: Must align with the Yesod Ecosystem Constitution; UI must be responsive.
**Scale/Scope**: Initial launch for Shaliah, designed for future use across the Yesod ecosystem.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Modular Monorepo**: PASS. The work is correctly distributed between `apps/shaliah` (frontend) and `apps/yesod-api` (backend).
- **API-First Design**: PASS. All business logic (profile updates, account deletion) is handled by the Yesod API.
- **Asynchronous Processing**: N/A. This feature does not involve long-running tasks.
- **Pragmatic MVP-First**: PASS. The plan focuses on core authentication flows, deferring more complex account management features.
- **User-Centric**: PASS. The design is based directly on the specified user journeys.
- **TDD**: PASS. The plan includes tasks for writing tests before implementation.
- **TypeScript-First**: PASS. All new code will be in TypeScript.
- **Technology Stack**: PASS. The plan utilizes the prescribed stack (Nuxt, Hono, Drizzle, Supabase).

## Project Structure

### Documentation (this feature)
```
specs/003-shaliah-authentication/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── account.ts
│   └── onboarding.ts
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)
```
apps/
├── shaliah/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── login.vue
│   │   │   └── onboarding/
│   │   │       ├── language.vue
│   │   │       └── profile.vue
│   │   └── middleware/
│   │       └── auth.global.ts
│   └── components/
│       └── ui/
│           └── ... (shadcn components)
└── yesod-api/
    ├── src/
    │   ├── db/
    │   │   └── schema.ts
    │   ├── routes/
    │   │   └── auth/
    │   │       ├── onboarding.ts
    │   │       └── account.ts
    │   └── middleware/
    │       └── auth.ts
    └── drizzle/
        └── ... (migration files)
```

**Structure Decision**: The feature will be implemented across the `shaliah` (frontend) and `yesod-api` (backend) applications, following the established monorepo structure.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context**: All key technologies are defined by the constitution.
2. **Generate and dispatch research agents**: Research focused on the `shadcn-vue/Login05` block.
3. **Consolidate findings**: The `research.md` document confirms the suitability of the chosen UI component.

**Output**: `research.md` with all NEEDS CLARIFICATION resolved.

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`: The data model has been defined, detailing the `UserProfile` and `AuthToken` tables and their relationship to `auth.users`.
2. **Generate API contracts** from functional requirements: Hono-based route definitions for `POST /onboarding` and `DELETE /account` have been created in the `contracts/` directory.
3. **Generate contract tests**: (Deferred to task generation).
4. **Extract test scenarios** from user stories: A `quickstart.md` guide has been created, which serves as a manual E2E test script.
5. **Update agent file incrementally**: Not applicable for this workflow.

**Output**: `data-model.md`, `contracts/`, `quickstart.md`.

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base.
- Generate tasks from the design artifacts (`data-model.md`, `contracts/`, `quickstart.md`).
- **Backend**: Create tasks for schema updates, migration generation, and implementing the API endpoints.
- **Frontend**: Create tasks for installing the UI component, building the login and onboarding pages, and wiring them to the Supabase client and backend API.
- **Integration**: Create tasks for implementing auth middleware in both the frontend and backend.

**Ordering Strategy**:
1.  Backend schema and API implementation.
2.  Frontend UI and page creation.
3.  Integration and middleware.

**Estimated Output**: Approximately 15-20 ordered tasks in `tasks.md`.

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (`/tasks` command creates `tasks.md`)
**Phase 4**: Implementation (execute `tasks.md`)
**Phase 5**: Validation (run tests, execute `quickstart.md`)

## Complexity Tracking
*No constitutional violations detected.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                 |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v1.2.0 - See `.specify/memory/constitution.md`*
