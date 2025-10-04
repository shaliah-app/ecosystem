# `/refactor` Command Documentation

## Overview

The `/refactor` command enables systematic refactoring of **existing features** in your codebase. Unlike `/specify` which creates new features, `/refactor` improves the quality, architecture, performance, or constitution-compliance of features that have already been implemented.

## When to Use `/refactor`

Use `/refactor` when you need to:
- **Fix constitution violations** in existing code (CRITICAL priority)
- **Improve code quality**: reduce complexity, eliminate duplication, improve naming
- **Enhance performance**: optimize algorithms, reduce database queries, improve caching
- **Strengthen architecture**: decouple components, improve abstractions, apply design patterns
- **Increase test coverage**: add missing tests, fix flaky tests
- **Update to new standards**: modernize patterns, upgrade dependencies, align with conventions
- **Pay down technical debt**: address TODOs, resolve warnings, clean up hacks

Do NOT use `/refactor` for:
- Adding new features (use `/specify` → `/plan` → `/implement` instead)
- Changing functional requirements (update spec.md first, then refactor)
- Fixing bugs (fix bugs directly, then refactor if needed)

## Usage

### Basic Usage

```bash
/refactor Focus on constitution violations in the authentication feature
```

```bash
/refactor Improve performance of the photo gallery loading - it's too slow
```

```bash
/refactor The user-profile module has too much duplication and complex logic
```

### With Feature ID

```bash
/refactor 004-shaliah-onboarding-n - consolidate database queries and add proper error handling
```

### Focused Refactoring

```bash
/refactor Only address CRITICAL and HIGH priority issues in the API module
```

### Comprehensive Analysis

```bash
/refactor Perform full code quality audit across all features and create improvement roadmap
```

## Workflow

The `/refactor` command follows this systematic workflow:

### 1. Feature Identification
- If you provide a feature name/ID, it uses that directly
- Otherwise, lists available features for you to select
- Loads all existing specifications and implementation files

### 2. Analysis Phase
The agent analyzes your code across multiple dimensions:
- **Constitution Compliance** (violations are CRITICAL priority)
- **Code Quality** (complexity, duplication, naming)
- **Architecture** (coupling, abstractions, patterns)
- **Performance** (inefficiencies, bottlenecks)
- **Testing** (coverage, reliability)
- **Maintainability** (documentation, clarity)

### 3. Opportunity Identification
Creates a prioritized list of refactoring opportunities:
- **CRITICAL**: Constitution violations, security issues
- **HIGH**: Performance, reliability problems
- **MEDIUM**: Code quality, maintainability improvements
- **LOW**: Style, minor polish

### 4. Plan Generation
Creates `refactoring-plan.md` in your feature directory with:
- Current state analysis
- Prioritized opportunities
- Phased execution approach
- Task breakdown
- Validation strategy
- Rollback plan

### 5. User Confirmation
Reviews the plan with you and lets you:
- Approve the full plan
- Select specific phases (e.g., "Just Phase 1")
- Cherry-pick specific tasks
- Adjust priorities

### 6. Execution
Executes refactoring tasks in three modes:
- **Automated**: For low-risk changes with good test coverage
- **Guided**: For high-risk changes requiring user approval per step
- **Plan-only**: Just generates the plan for manual execution

### 7. Validation
After each change:
- Runs existing test suite
- Checks linting and type errors
- Verifies no regressions
- Creates checkpoint commits

### 8. Completion Report
Generates a summary showing:
- Changes made
- Metrics improved
- Constitution compliance
- Next steps

## Execution Phases

Most refactoring plans use a phased approach:

### Phase 1: Foundation (MANDATORY)
- Fix all constitution violations
- Resolve security issues
- Address data integrity problems
- **MUST complete before other phases**

### Phase 2: Architecture & Performance
- Design improvements
- Performance optimizations
- Interface refinements

### Phase 3: Code Quality & Testing
- Refactor for maintainability
- Improve test coverage
- Reduce complexity

### Phase 4: Polish & Documentation
- Update documentation
- Style consistency
- Minor improvements

## Safety Features

The `/refactor` command includes multiple safety mechanisms:

### Validation
- ✅ All existing tests must pass after each change
- ✅ No reduction in test coverage allowed
- ✅ Checkpoint commits after each major task
- ✅ Constitution compliance verification

### Rollback
- 🔄 Git branch for all refactoring work
- 🔄 Checkpoint commits for safe revert points
- 🔄 High-risk changes require explicit approval
- 🔄 Emergency rollback procedures documented

### Risk Assessment
Each opportunity is rated for:
- **Severity**: Impact of the issue
- **Effort**: Time to fix
- **Risk**: Chance of introducing problems

## Constitution Priority

**CRITICAL**: Any constitution violations are **non-negotiable** and must be fixed first. These represent:
- Project principles that cannot be compromised
- Security or compliance requirements
- Quality standards the team has committed to

The `/refactor` command will always prioritize constitution alignment in Phase 1.

## Examples

### Example 1: Quick Constitution Fix

```bash
/refactor 001-photo-albums - I noticed it's missing proper error logging per our constitution
```

**Result**: 
- Creates focused plan addressing logging principle
- Identifies all places missing error logs
- Adds comprehensive error logging
- Validates against constitution

### Example 2: Performance Improvement

```bash
/refactor The dashboard loads slowly - optimize database queries and add caching
```

**Result**:
- Analyzes current performance
- Identifies N+1 queries and missing indexes
- Creates multi-phase plan
- Implements optimizations
- Benchmarks improvements

### Example 3: Code Quality Overhaul

```bash
/refactor 003-user-auth - the code is hard to maintain and test
```

**Result**:
- Assesses code complexity and test coverage
- Identifies duplication and tight coupling
- Plans incremental refactoring
- Improves abstractions
- Adds missing tests

### Example 4: Comprehensive Audit

```bash
/refactor Audit all features for constitution compliance and create prioritized improvement plan
```

**Result**:
- Scans all features
- Creates master refactoring roadmap
- Prioritizes by severity
- Provides phased execution plan

## Tips for Effective Refactoring

### Be Specific
❌ "Refactor the code"
✅ "Reduce cyclomatic complexity in the payment processing module"

### Start Small
❌ "Rewrite the entire architecture"
✅ "Decouple the authentication logic from the API layer"

### Trust the Process
- Let the agent do the analysis first
- Review the plan before execution
- Don't skip validation steps
- Use phased approach for large refactorings

### Communicate Intent
```bash
/refactor Focus only on test coverage improvements - I want 80% coverage minimum
```

```bash
/refactor Performance is critical here - willing to trade some code elegance for speed
```

## Integration with Other Commands

The `/refactor` command works alongside other spec-kit commands:

```bash
# Constitution changed? Refactor to align
/constitution Update testing standards to require 90% coverage
/refactor Bring all features into compliance with new testing standard

# After feature implementation
/implement
/refactor Polish the code quality in the feature we just built

# Before major version release
/refactor Full quality audit before v2.0 release
```

## Output Files

After running `/refactor`, you'll find:

- `specs/[feature-id]/refactoring-plan.md` - The detailed refactoring plan
- `specs/[feature-id]/refactoring-completion-report.md` - Final results (after execution)
- Updated implementation files with improvements
- New or updated test files
- Updated documentation (if architecture changed)

## Best Practices

1. **Run regularly**: Don't let technical debt accumulate
2. **Constitution first**: Always address principle violations immediately
3. **Small increments**: Better to refactor frequently in small batches
4. **Validate thoroughly**: Never skip tests or validation steps
5. **Document decisions**: Use the plan's decision log
6. **Commit strategically**: Create checkpoint commits for safe rollback
7. **Review before merge**: Have another developer review significant refactorings

## Troubleshooting

### "No implementation found"
→ The feature hasn't been implemented yet. Run `/implement` first.

### "Too many opportunities identified"
→ Focus your scope: `/refactor Only CRITICAL issues` or `/refactor Just the API module`

### "Tests failing after refactoring"
→ The agent will auto-revert. Review the failure and adjust the plan.

### "Constitution unclear"
→ Update your constitution first: `/constitution` then retry `/refactor`

## Related Commands

- `/constitution` - Define project principles that guide refactoring priorities
- `/analyze` - Run consistency analysis on specs (before implementation)
- `/implement` - Implement new features (refactor existing ones)
- `/specify` - Create new feature specs (not for changing existing features)

---

**Remember**: Refactoring should **preserve functionality** while improving quality. If you need to change what the feature does, update the spec first!
