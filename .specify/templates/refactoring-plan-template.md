# Refactoring Plan: [FEATURE_NAME]

**Created**: [YYYY-MM-DD]
**Target Feature**: [Feature ID and Name]
**Refactoring Scope**: [Brief description of what needs refactoring]
**Constitution Version**: [X.Y.Z from constitution.md]

## Executive Summary

- **Total opportunities identified**: [N]
- **Critical issues**: [N] (Constitution violations, security, data integrity)
- **High priority issues**: [N] (Performance, reliability, maintainability)
- **Medium priority issues**: [N] (Code quality, testing)
- **Low priority issues**: [N] (Style, minor improvements)
- **Estimated total effort**: [Hours range or S/M/L/XL]
- **Recommended execution order**: [Phased | Incremental | Big-bang]
- **Risk level**: [LOW | MEDIUM | HIGH]

## Current State Analysis

### Architecture Overview
<!-- Current architecture summary from plan.md -->
- **Tech Stack**: [List from plan.md]
- **Key Components**: [List main modules/services]
- **Integration Points**: [External dependencies, APIs]
- **Data Flow**: [Brief description]

### Implementation Health Metrics
<!-- Measurable current state -->
- **Test Coverage**: [X%]
- **Code Complexity**: [Average cyclomatic complexity or other metrics]
- **Dependencies**: [Number of external dependencies]
- **Technical Debt**: [Estimated hours or subjective assessment]
- **Performance Baseline**: [Key metrics if applicable]
- **Last Modified**: [Date of last significant change]

### Constitution Compliance Audit
<!-- Review each principle from constitution.md -->
| Principle | Status | Violations Found | Severity |
|-----------|--------|------------------|----------|
| [Principle 1] | ✅ PASS / ⚠️ PARTIAL / ❌ FAIL | [Description if not passing] | CRITICAL/HIGH/MEDIUM/LOW |
| [Principle 2] | [Status] | [Description] | [Severity] |
<!-- Add row for each principle in constitution -->

**Critical Constitution Violations** (MUST be resolved):
- [List any CRITICAL violations with details]

### Functional Requirements Review
<!-- Verify current implementation against spec.md -->
- **Requirements Met**: [N/M]
- **Missing Functionality**: [List if any]
- **Divergence from Spec**: [Areas where implementation differs from spec.md]

## Refactoring Opportunities

### Critical Priority (Constitution Violations & Security)
<!-- These are NON-NEGOTIABLE and must be addressed -->
| ID | Category | Issue Description | Files Affected | Effort | Risk | Principle Violated |
|----|----------|-------------------|----------------|--------|------|--------------------|
| R001 | [Constitution/Security/Data] | [Detailed description] | [file1.ts, file2.ts] | [S/M/L/XL] | [L/M/H] | [Principle name] |
<!-- Add all CRITICAL items -->

### High Priority (Performance & Reliability)
| ID | Category | Issue Description | Files Affected | Effort | Risk | Impact |
|----|----------|-------------------|----------------|--------|------|--------|
| R101 | [Performance/Reliability/Architecture] | [Detailed description] | [file1.ts, file2.ts] | [S/M/L/XL] | [L/M/H] | [Expected improvement] |
<!-- Add all HIGH items -->

### Medium Priority (Code Quality & Maintainability)
| ID | Category | Issue Description | Files Affected | Effort | Risk | Impact |
|----|----------|-------------------|----------------|--------|------|--------|
| R201 | [Code Quality/Testing/Design] | [Detailed description] | [file1.ts, file2.ts] | [S/M/L/XL] | [L/M/H] | [Expected improvement] |
<!-- Add all MEDIUM items -->

### Low Priority (Polish & Style)
| ID | Category | Issue Description | Files Affected | Effort | Risk | Impact |
|----|----------|-------------------|----------------|--------|------|--------|
| R301 | [Style/Documentation/Convention] | [Detailed description] | [file1.ts, file2.ts] | [S/M/L/XL] | [L/M/H] | [Expected improvement] |
<!-- Add all LOW items -->

## Recommended Approach

### Execution Strategy
**Chosen approach**: [Phased | Incremental | Big-bang]

**Rationale**: [Explain why this approach is recommended]

**Risk mitigation**:
- [Strategy 1]
- [Strategy 2]

### Phase 1: Foundation (Constitution & Critical) 🚨 MANDATORY
**Duration estimate**: [Hours/Days]
**Risk level**: [LOW/MEDIUM/HIGH]

**Prerequisites**:
- [List any setup needed]

**Tasks**:
1. **[R001]** - [Issue title] → [Expected outcome]
   - Files: [list]
   - Steps: [brief outline]
   - Tests to add/update: [list]
   - Validation: [how to verify success]

2. **[R00X]** - [Next critical task]
   [Same structure]

**Phase completion criteria**:
- [ ] All constitution violations resolved
- [ ] All critical security issues fixed
- [ ] All existing tests passing
- [ ] New tests added for critical areas
- [ ] Manual validation complete

**Gate check**: MUST complete Phase 1 before proceeding to Phase 2

---

### Phase 2: Architecture & Performance
**Duration estimate**: [Hours/Days]
**Risk level**: [LOW/MEDIUM/HIGH]
**Can run in parallel**: [Yes/No - which tasks can be parallelized]

**Prerequisites**:
- Phase 1 complete
- [Other prerequisites]

**Tasks**:
1. **[R101]** - [Issue title] → [Expected outcome]
   [Same structure as Phase 1]

**Phase completion criteria**:
- [ ] Architecture improvements implemented
- [ ] Performance targets met: [specific metrics]
- [ ] Integration tests passing
- [ ] Documentation updated

---

### Phase 3: Code Quality & Testing
**Duration estimate**: [Hours/Days]
**Risk level**: [LOW/MEDIUM/HIGH]

**Prerequisites**:
- Phase 2 complete
- [Other prerequisites]

**Tasks**:
1. **[R201]** - [Issue title] → [Expected outcome]
   [Same structure]

**Phase completion criteria**:
- [ ] Code quality metrics improved: [specific targets]
- [ ] Test coverage increased to [X%]
- [ ] All linting issues resolved
- [ ] Code review checklist passed

---

### Phase 4: Polish & Documentation
**Duration estimate**: [Hours/Days]
**Risk level**: LOW

**Prerequisites**:
- Phase 3 complete
- [Other prerequisites]

**Tasks**:
1. **[R301]** - [Issue title] → [Expected outcome]
   [Same structure]

**Phase completion criteria**:
- [ ] All documentation updated
- [ ] Style consistency verified
- [ ] No outstanding TODO/FIXME comments
- [ ] README and quickstart guide current

## Detailed Task Breakdown

### Task Format
<!-- Follow tasks-template.md conventions -->

#### Setup Phase
- **ST001**: Create refactoring branch
  - Command: `git checkout -b refactor/[feature-id]-[description]`
  - Validation: Verify clean working directory

- **ST002**: Establish baseline metrics
  - Run tests: `[test command]`
  - Record coverage: [X%]
  - Record performance: [baseline metrics]
  - Validation: All tests passing before starting

#### Refactoring Tasks
<!-- Group by phase, maintain dependency order -->
- **RT001**: [First critical task from Phase 1]
  - **Prerequisites**: ST001, ST002
  - **Files**: [paths]
  - **Changes**: [detailed description]
  - **Tests**: [tests to add/update]
  - **Validation**: [acceptance criteria]
  - **Rollback**: [revert strategy if needed]

- **RT002**: [Next task]
  - **Prerequisites**: RT001
  - [Same structure]

<!-- Mark parallel tasks with [P] like in tasks-template.md -->
- **RT010** [P]: [Parallelizable task A]
- **RT011** [P]: [Parallelizable task B]
- **RT012** [P]: [Parallelizable task C]

#### Validation Phase
- **VT001**: Run full test suite
- **VT002**: Performance benchmarking
- **VT003**: Manual testing scenarios
- **VT004**: Constitution compliance verification

## Validation Strategy

### Continuous Validation (After Each Task)
- [ ] Existing tests passing
- [ ] New tests passing
- [ ] No type/compilation errors
- [ ] No linting violations
- [ ] Checkpoint commit created

### Phase Validation (After Each Phase)
- [ ] All phase tasks complete
- [ ] Phase completion criteria met
- [ ] Integration tests passing
- [ ] Performance benchmarks acceptable
- [ ] Manual testing scenarios passed

### Final Validation (Before Merge)
- [ ] All refactoring tasks complete
- [ ] Full test suite passing
- [ ] Code coverage maintained or improved: [before X% → after Y%]
- [ ] Performance metrics met or improved: [metrics]
- [ ] Constitution compliance: 100%
- [ ] No functional regressions detected
- [ ] Documentation complete and accurate
- [ ] Migration guide created (if needed)

### Test Coverage Requirements
- **Minimum coverage**: [X%] (must not decrease)
- **New code coverage**: [Y%] target
- **Critical path coverage**: 100%

### Performance Benchmarks
<!-- If applicable -->
| Metric | Baseline | Target | Acceptable Range |
|--------|----------|--------|------------------|
| [Metric 1] | [Value] | [Value] | [Min-Max] |
| [Metric 2] | [Value] | [Value] | [Min-Max] |

## Rollback Plan

### Branch Strategy
- **Refactoring branch**: `refactor/[feature-id]-[date]`
- **Base branch**: [main/master/develop]
- **Checkpoint strategy**: Commit after each completed task

### Rollback Points
| Checkpoint | Commit Message | Tasks Completed | Can Rollback To |
|------------|----------------|-----------------|-----------------|
| CP1 | "Phase 1 complete: Constitution violations resolved" | RT001-RT00X | Yes - stable |
| CP2 | "Phase 2 complete: Architecture improvements" | RT101-RT10X | Yes - stable |
| CP3 | "Phase 3 complete: Code quality refactoring" | RT201-RT20X | Yes - stable |

### High-Risk Change Reversals
<!-- For each HIGH risk task, document specific rollback -->
- **RT001**: [If this fails, revert by...]
- **RT010**: [If this fails, revert by...]

### Emergency Rollback
If critical issues discovered post-merge:
1. Revert merge commit: `git revert [commit-hash]`
2. Notify team: [communication plan]
3. Root cause analysis: [process]
4. Fix forward plan: [approach]

## Impact Analysis

### Benefits (Expected Outcomes)
**Constitution Compliance**:
- Before: [X violations]
- After: [0 violations] ← MANDATORY

**Code Quality**:
- Complexity reduction: [metric change]
- Duplication eliminated: [X instances removed]
- Technical debt reduction: [estimated hours]

**Performance**:
- [Metric 1]: [Before → After]
- [Metric 2]: [Before → After]

**Maintainability**:
- Code clarity: [subjective or measured improvement]
- Documentation: [updated/new docs]
- Future extension ease: [description]

### Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| Functional regression | [L/M/H] | [L/M/H] | Comprehensive test suite, manual validation |
| Performance degradation | [L/M/H] | [L/M/H] | Benchmarking, profiling |
| Breaking changes | [L/M/H] | [L/M/H] | Version bumping, migration guide |
| Extended timeline | [L/M/H] | [L/M/H] | Phased approach, can ship after Phase 1/2 |

### Dependencies & Coordination
- **Blocked by**: [Other work that must complete first]
- **Blocks**: [Other work waiting on this refactoring]
- **Coordinated with**: [Other teams/features affected]
- **Communication needed**: [Who needs to be informed]

## Success Criteria

### Mandatory (Must Achieve)
- [ ] All CRITICAL priority items resolved (constitution violations)
- [ ] No functional regressions
- [ ] All tests passing
- [ ] Test coverage maintained: [X%] minimum
- [ ] Constitution compliance: 100%

### Primary Goals (Should Achieve)
- [ ] All HIGH priority items resolved
- [ ] Performance targets met: [specific metrics]
- [ ] Code quality improved: [specific metrics]
- [ ] Documentation complete

### Stretch Goals (Nice to Have)
- [ ] All MEDIUM priority items resolved
- [ ] Some LOW priority items completed
- [ ] Additional test coverage: [X% → Y%]
- [ ] Performance exceeds targets

## Outstanding Items & Future Work

### Deferred for This Iteration
<!-- Items consciously postponed -->
- **[R3XX]**: [Description] - Reason: [Why deferred]

### Recommendations for Future Refactoring
<!-- Opportunities identified but out of scope -->
- [Suggestion 1]
- [Suggestion 2]

### Technical Debt Remaining
<!-- Honest assessment of what's still not ideal -->
- [Known issue 1]
- [Known issue 2]

## Timeline & Milestones

| Milestone | Target Date | Dependencies | Status |
|-----------|-------------|--------------|--------|
| Phase 1 Complete | [YYYY-MM-DD] | - | Not Started |
| Phase 2 Complete | [YYYY-MM-DD] | Phase 1 | Not Started |
| Phase 3 Complete | [YYYY-MM-DD] | Phase 2 | Not Started |
| Phase 4 Complete | [YYYY-MM-DD] | Phase 3 | Not Started |
| Final Review | [YYYY-MM-DD] | All phases | Not Started |
| Merge to [branch] | [YYYY-MM-DD] | Final review | Not Started |

## Progress Tracking

<!-- Update as work progresses -->

**Last Updated**: [YYYY-MM-DD HH:MM]

**Current Phase**: [Phase number and name]

**Overall Progress**: [X/Y tasks complete] ([Z%])

### Phase Status
- **Phase 1**: ⏳ Not Started | 🔄 In Progress | ✅ Complete
- **Phase 2**: ⏳ Not Started | 🔄 In Progress | ✅ Complete
- **Phase 3**: ⏳ Not Started | 🔄 In Progress | ✅ Complete
- **Phase 4**: ⏳ Not Started | 🔄 In Progress | ✅ Complete

### Task Completion
<!-- Mark as work progresses -->
- [x] RT001 - [Task name]
- [ ] RT002 - [Task name]
- [ ] RT003 - [Task name]

## Notes & Learnings

### Decision Log
<!-- Document key decisions made during refactoring -->
- **[YYYY-MM-DD]**: [Decision] - Rationale: [Why]

### Challenges Encountered
<!-- Problems discovered and how they were solved -->
- **[YYYY-MM-DD]**: [Challenge] - Solution: [How resolved]

### Learnings for Future Refactorings
<!-- Capture insights for next time -->
- [Learning 1]
- [Learning 2]

---

## Review & Approval

**Author**: [Name]
**Reviewers**: [Names]
**Approved By**: [Name]
**Approval Date**: [YYYY-MM-DD]

**Review Checklist**:
- [ ] Plan aligns with constitution
- [ ] All critical issues identified
- [ ] Risk assessment reasonable
- [ ] Validation strategy comprehensive
- [ ] Rollback plan adequate
- [ ] Timeline realistic
