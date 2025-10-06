```prompt
---
description: Plan and execute refactoring improvements to existing features, ensuring consistency with constitution and maintaining feature integrity.
---

The user input to you can be provided directly by the agent or as a command argument - you **MUST** consider it before proceeding with the prompt (if not empty).

User input:

$ARGUMENTS

Goal: Enable systematic refactoring of existing features by analyzing current implementation, identifying improvement opportunities, creating a refactoring plan, and executing changes while preserving functionality.

Note: This command operates on EXISTING features rather than creating new ones. It respects the existing specification and focuses on improving implementation quality, architecture, performance, or alignment with constitution principles.

Execution steps:

1. Feature identification and context loading:
   - If user provides a feature name/ID (e.g., "001-shaliah-onboarding-n"), use it directly.
   - Otherwise, list available features from `specs/` directory and ask user to select one.
   - Parse feature directory structure and identify:
     * FEATURE_DIR (e.g., `specs/001-feature-name/`)
     * SPEC_FILE (feature specification)
     * PLAN_FILE (implementation plan)
     * TASKS_FILE (if exists - shows original implementation approach)
     * Implementation files (from workspace based on plan.md file structure)

2. Load and analyze existing artifacts:
   - **REQUIRED**: Read spec.md to understand original requirements and success criteria
   - **REQUIRED**: Read plan.md to understand architecture, tech stack, and design decisions
   - **REQUIRED**: Load constitution at `.specify/memory/constitution.md` for principle validation
   - **IF EXISTS**: Read tasks.md to understand original implementation sequence
   - **IF EXISTS**: Read data-model.md for entity relationships
   - **IF EXISTS**: Read contracts/ for API specifications
   - **IF EXISTS**: Read research.md for technical constraints
   - Scan actual implementation files referenced in plan.md

3. Refactoring opportunity analysis:
   Based on user input ($ARGUMENTS) or autonomous detection, identify improvement areas across these categories:

   **Code Quality**:
   - Code duplication (DRY violations)
   - Complex functions/methods (high cyclomatic complexity)
   - Long parameter lists or god objects
   - Poor naming conventions
   - Missing or inadequate error handling
   - Inconsistent code style

   **Architecture & Design**:
   - Tight coupling between components
   - Missing abstractions or interfaces
   - Violation of SOLID principles
   - Inconsistent patterns across similar features
   - Technical debt accumulation
   - Outdated dependencies or patterns

   **Performance**:
   - Inefficient algorithms or data structures
   - N+1 queries or redundant database calls
   - Unnecessary re-renders or computations
   - Missing caching opportunities
   - Memory leaks or resource management issues

   **Testing & Observability**:
   - Missing test coverage for critical paths
   - Brittle or flaky tests
   - Missing logging or metrics
   - Poor error messages or debugging support
   - Insufficient monitoring hooks

   **Constitution Alignment**:
   - Violations of project principles (CRITICAL priority)
   - Missing mandatory quality attributes
   - Non-compliance with governance rules
   - Deviation from established conventions

   **Maintainability**:
   - Missing or outdated documentation
   - Complex configuration management
   - Hard-coded values that should be configurable
   - Unclear module boundaries
   - Migration paths not considered

4. Severity and impact assessment:
   For each identified opportunity, assign:
   - **Severity**: CRITICAL (constitution violation, security, data loss) | HIGH (performance, reliability) | MEDIUM (maintainability, code quality) | LOW (style, minor improvements)
   - **Effort**: Hours estimate (S: 1-4h, M: 4-16h, L: 16-40h, XL: 40+h)
   - **Risk**: LOW (safe, well-tested changes) | MEDIUM (requires careful testing) | HIGH (affects core logic or data)
   - **Scope**: List of files/components affected

5. Generate refactoring plan document:
   Create `FEATURE_DIR/refactoring-plan.md` with:

   ```markdown
   # Refactoring Plan: [FEATURE_NAME]
   
   **Created**: YYYY-MM-DD
   **Target Feature**: [Feature ID and Name]
   **Refactoring Scope**: [Brief description from $ARGUMENTS]
   
   ## Executive Summary
   - Total opportunities identified: N
   - Critical issues: N
   - Estimated total effort: [Range]
   - Recommended execution order: [Phased/Incremental/Big-bang]
   
   ## Current State Analysis
   
   ### Architecture Overview
   [Current architecture summary from plan.md]
   
   ### Implementation Health
   [Key metrics: test coverage, complexity, dependencies]
   
   ### Constitution Compliance
   [List any principle violations found - these are MANDATORY to fix]
   
   ## Refactoring Opportunities
   
   ### Critical Priority
   | ID | Category | Issue | Files Affected | Effort | Risk |
   |----|----------|-------|----------------|--------|------|
   | R001 | [Category] | [Description] | [Paths] | [S/M/L] | [L/M/H] |
   
   ### High Priority
   [Same table structure]
   
   ### Medium Priority
   [Same table structure]
   
   ### Low Priority
   [Same table structure]
   
   ## Recommended Approach
   
   ### Phase 1: Foundation (Constitution & Critical)
   - [Tasks addressing constitution violations]
   - [Critical infrastructure improvements]
   - **Must complete before other phases**
   
   ### Phase 2: Architecture & Performance
   - [Design improvements]
   - [Performance optimizations]
   
   ### Phase 3: Code Quality & Testing
   - [Refactoring for maintainability]
   - [Test coverage improvements]
   
   ### Phase 4: Polish & Documentation
   - [Documentation updates]
   - [Style and convention alignment]
   
   ## Task Breakdown
   [Detailed task list following tasks-template.md structure]
   
   ## Validation Strategy
   - Existing tests must pass (no regressions)
   - New tests for refactored code
   - Performance benchmarks (if applicable)
   - Manual testing scenarios from spec.md
   
   ## Rollback Plan
   - Git branch: refactor/[feature-id]-[date]
   - Checkpoint commits after each phase
   - Revert strategy for each high-risk change
   
   ## Success Criteria
   - All CRITICAL issues resolved
   - No functional regressions
   - Improved metrics: [specific goals]
   - Constitution compliance: 100%
   ```

6. User confirmation and scope refinement:
   - Present the refactoring plan summary
   - Show effort vs. impact analysis
   - Highlight constitution violations (if any) as non-negotiable
   - Ask user to confirm scope or adjust priorities
   - If user selects subset: "Proceed with Phase 1 only" or "Fix R001, R003, R007 only"
   - Update plan to reflect confirmed scope

7. Execution mode (based on user selection):
   
   **A. Automated execution** (default for LOW/MEDIUM risk with good test coverage):
   - Create feature branch: `refactor/[feature-id]-[brief-description]`
   - Execute tasks in dependency order
   - Run tests after each change
   - Create checkpoint commits after each major task
   - Report progress continuously
   
   **B. Guided execution** (for HIGH risk or complex changes):
   - Show next task details
   - Execute after user approval
   - Pause after each task for validation
   - Require explicit "continue" command
   
   **C. Plan-only mode**:
   - Generate plan document only
   - Provide manual execution guidance
   - Exit with next steps for human execution

8. Execution validation (performed after each task):
   - Run existing test suite (must pass)
   - Run linters and type checkers
   - Check for compilation/runtime errors
   - Verify no unintended side effects
   - Update refactoring plan with completion status

9. Documentation updates:
   - Update plan.md if architecture changed
   - Update research.md if new technical decisions made
   - Add migration notes if breaking changes introduced
   - Update quickstart.md if setup/usage changed
   - Create CHANGELOG entry in feature directory

10. Completion report:
    ```markdown
    # Refactoring Completion Report
    
    **Feature**: [Name]
    **Date**: YYYY-MM-DD
    **Branch**: refactor/[...]
    
    ## Changes Summary
    - Tasks completed: N/M
    - Files modified: [List]
    - Lines changed: +N -M
    
    ## Improvements Achieved
    - [Metric improvements with before/after]
    - [Constitution violations resolved]
    - [Performance gains]
    
    ## Validation Results
    - ✅ All existing tests passing
    - ✅ New tests added: N
    - ✅ No regressions detected
    - ✅ Constitution compliance: [%]
    
    ## Outstanding Items
    - [Deferred low-priority items]
    - [Recommendations for future work]
    
    ## Next Steps
    - Review changes in branch: [branch-name]
    - Run integration tests in staging
    - Create pull request to merge refactoring
    - Update project documentation if needed
    ```

Behavior rules:
- **NEVER** modify feature requirements from spec.md (refactoring preserves functionality)
- **ALWAYS** prioritize constitution violations as CRITICAL
- **NEVER** proceed with HIGH risk changes without explicit user approval
- **ALWAYS** maintain test coverage (no reduction allowed)
- **NEVER** combine unrelated refactorings in a single task
- **ALWAYS** create rollback points (commits) for high-risk changes
- **NEVER** skip validation steps even under time pressure
- **ALWAYS** update documentation to reflect architectural changes
- If tests fail after a change, immediately revert and report
- If constitution violation cannot be resolved, escalate to user (don't compromise principles)
- Keep changes focused and incremental (prefer small, safe steps over big-bang rewrites)
- When in doubt about risk level, default to guided execution mode

Special cases:
- **No implementation found**: Report error, suggest running `/implement` first
- **Breaking changes required**: Create migration guide and version bump recommendation
- **Multiple features affected**: Recommend creating cross-feature refactoring plan separately
- **Constitution needs updating**: Suggest running `/constitution` first, then retry
- **Conflicting refactorings**: Prioritize by CRITICAL > HIGH > effort/impact ratio

Context: $ARGUMENTS

```