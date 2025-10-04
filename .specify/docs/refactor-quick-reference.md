# `/refactor` Quick Reference

## Quick Start

```bash
/refactor [feature-id or description] [refactoring goal]
```

## Common Use Cases

### Fix Constitution Violations
```bash
/refactor 004-shaliah-onboarding-n - Constitution compliance audit
```

### Performance Optimization
```bash
/refactor Optimize slow database queries in user dashboard
```

### Code Quality
```bash
/refactor Reduce complexity in authentication module
```

### Test Coverage
```bash
/refactor Increase test coverage to 80% in API layer
```

### Technical Debt
```bash
/refactor Clean up TODOs and deprecation warnings
```

## Priority Levels

| Priority | Examples | Required? |
|----------|----------|-----------|
| **CRITICAL** | Constitution violations, security issues, data integrity | ✅ MUST fix |
| **HIGH** | Performance bottlenecks, reliability issues | ⚠️ Should fix |
| **MEDIUM** | Code quality, maintainability | 📋 Nice to fix |
| **LOW** | Style, minor polish | ✨ Optional |

## Execution Modes

| Mode | When to Use | Safety Level |
|------|-------------|--------------|
| **Automated** | Low-risk, well-tested changes | 🟢 High |
| **Guided** | High-risk or complex changes | 🟡 Medium |
| **Plan-only** | Just want to see opportunities | 🟢 Safest |

## Workflow

1. **Analyze** → Agent scans code for opportunities
2. **Plan** → Creates `refactoring-plan.md`
3. **Confirm** → You review and approve scope
4. **Execute** → Agent makes changes with validation
5. **Report** → Summary of improvements

## Safety Checklist

- ✅ All existing tests pass
- ✅ No test coverage reduction
- ✅ Checkpoint commits created
- ✅ Rollback plan documented
- ✅ Constitution compliance verified

## Phases

### Phase 1: Foundation 🚨 (MANDATORY)
Constitution violations, security fixes

### Phase 2: Architecture & Performance
Design improvements, optimizations

### Phase 3: Code Quality & Testing
Refactoring, test coverage

### Phase 4: Polish & Documentation
Style, docs, minor improvements

## Output Files

```
specs/[feature-id]/
  ├── refactoring-plan.md              ← The plan
  └── refactoring-completion-report.md ← Results
```

## Quick Commands

| Command | Purpose |
|---------|---------|
| `/refactor [feature] - Full audit` | Comprehensive analysis |
| `/refactor [feature] - Only CRITICAL` | Just fix violations |
| `/refactor [feature] - Plan only` | Don't execute, just plan |
| `/refactor [feature] - Phase 1 only` | Stop after critical fixes |

## When NOT to Use

❌ Adding new features → Use `/specify` instead
❌ Changing requirements → Update `spec.md` first
❌ Fixing bugs → Fix directly, then refactor if needed

## Related Commands

- `/constitution` - Define project principles
- `/specify` - Create new features
- `/implement` - Build new features
- `/analyze` - Check spec consistency

## Emergency Rollback

```bash
# Revert last commit
git revert HEAD

# Rollback to checkpoint
git checkout [checkpoint-commit]

# Abandon branch
git checkout main
git branch -D refactor/[branch-name]
```

## Tips

💡 **Be specific**: "Reduce complexity in payment module" > "Improve code"
💡 **Start small**: Incremental refactorings > big rewrites
💡 **Trust validation**: Don't skip tests
💡 **Use phases**: Ship after Phase 1 if needed
💡 **Constitution first**: Always fix principle violations

## Examples

```bash
# Quick constitution check
/refactor 001-auth - Constitution audit only

# Performance improvement
/refactor API is slow - optimize queries and add caching

# Code cleanup
/refactor Remove duplication in user service

# Test coverage
/refactor Add missing tests to payment module

# Full quality audit
/refactor Complete code quality review of all features
```

---

**Remember**: Refactoring preserves functionality while improving quality!
