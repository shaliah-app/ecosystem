# Refactoring Plan: Test Structure Reorganization

**Created**: 2024-12-19
**Target Feature**: shaliah-next test structure
**Refactoring Scope**: Move module-related tests from `__tests__/` to module-specific `tests/` folders

## Executive Summary
- Total opportunities identified: 1
- Critical issues: 0
- Estimated total effort: 2-4 hours
- Recommended execution order: Incremental

## Current State Analysis

### Architecture Overview
The shaliah-next application follows a modular architecture with feature-based modules under `src/modules/`. Currently, all tests are centralized in `__tests__/` directory, which doesn't align with the modular structure.

### Implementation Health
- **Test Coverage**: Good coverage across components, integration, and contract tests
- **Test Organization**: Currently centralized in `__tests__/` directory
- **Module Structure**: Well-defined modules with clear boundaries

### Constitution Compliance
- **Modularity**: Tests should be colocated with their respective modules
- **Maintainability**: Module-specific tests improve maintainability and discoverability

## Refactoring Opportunities

### High Priority
| ID | Category | Issue | Files Affected | Effort | Risk |
|----|----------|-------|----------------|--------|------|
| R001 | Test Organization | Module-related tests should be colocated with modules | 8 test files | S | L |

## Recommended Approach

### Phase 1: Create Module Test Directories
- Create `tests/` directories in each module
- Move module-specific tests to their respective modules
- Update import paths

### Phase 2: Update Test Configuration
- Ensure Jest configuration supports the new structure
- Update any test scripts if needed

### Phase 3: Documentation Update
- Update architecture documentation to reflect new test structure

## Task Breakdown

### Task 1: Create ezer-auth module tests directory
- Create `src/modules/ezer-auth/tests/` directory
- Move `__tests__/components/EzerAuthSection.test.tsx` to `src/modules/ezer-auth/tests/`
- Move `__tests__/components/QRCodeDisplay.test.tsx` to `src/modules/ezer-auth/tests/`
- Move ezer-auth related integration tests

### Task 2: Create user module tests directory
- Create `src/modules/user/tests/` directory
- Move user profile related tests to `src/modules/user/tests/`

### Task 3: Update import paths
- Update all import statements in moved test files
- Ensure relative paths are correct

### Task 4: Verify test execution
- Run test suite to ensure all tests still pass
- Verify Jest can find and execute tests in new locations

## Validation Strategy
- All existing tests must pass (no regressions)
- Jest configuration should support the new structure
- Import paths should be correct

## Rollback Plan
- Git branch: `refactor/test-structure-reorganization`
- Checkpoint commits after each task
- Easy revert if any issues arise

## Success Criteria
- Module-specific tests are colocated with their modules
- All tests continue to pass
- Improved test organization and discoverability
- Documentation updated to reflect new structure

## Files to Move

### ezer-auth module tests:
- `__tests__/components/EzerAuthSection.test.tsx` → `src/modules/ezer-auth/tests/EzerAuthSection.test.tsx`
- `__tests__/components/QRCodeDisplay.test.tsx` → `src/modules/ezer-auth/tests/QRCodeDisplay.test.tsx`
- `__tests__/integration/ezer-auth-signout.test.ts` → `src/modules/ezer-auth/tests/ezer-auth-signout.test.ts`
- `__tests__/integration/ezer-auth-token-generation.test.ts` → `src/modules/ezer-auth/tests/ezer-auth-token-generation.test.ts`
- `__tests__/integration/generate-token-usecase.test.ts` → `src/modules/ezer-auth/tests/generate-token-usecase.test.ts`

### user module tests:
- `__tests__/integration/profile-language-change.test.tsx` → `src/modules/user/tests/profile-language-change.test.tsx`
- `__tests__/integration/ProfileLanguageChangeTest.tsx` → `src/modules/user/tests/ProfileLanguageChangeTest.tsx`

### Tests to remain in __tests__/:
- General component tests (AuthForm, CooldownTimer, OnboardingForm, ProfileDashboard, StorageBlockedError)
- Cross-module integration tests
- Contract tests
- Database connectivity tests
- Test helpers and setup files
