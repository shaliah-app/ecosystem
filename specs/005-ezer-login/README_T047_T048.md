# T047-T048: Manual Testing Documentation

**Feature**: 005-ezer-login (Ezer Bot Authentication Link)  
**Status**: ✅ Implementation Complete - Ready for Manual Testing  
**Last Updated**: 2025-10-07

---

## 📋 Quick Start

```bash
# 1. Validate implementation (should pass 25/25 checks)
cd /home/patrickkmatias/repos/yesod-ecosystem
./specs/005-ezer-login/scripts/validate-implementation.sh

# 2. Start applications
# Terminal 1:
cd apps/shaliah-next && pnpm dev

# Terminal 2:
cd apps/ezer-bot && pnpm dev

# 3. Open testing guide
code specs/005-ezer-login/TESTING_GUIDE.md
```

---

## 📚 Documentation Index

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[TESTING_GUIDE.md](TESTING_GUIDE.md)** | Detailed test scenarios with checklists | During manual testing |
| **[EXECUTION_REPORT_T047_T048.md](EXECUTION_REPORT_T047_T048.md)** | What was done, results, next steps | Reference & status |
| **[T047-T048-SUMMARY.md](T047-T048-SUMMARY.md)** | Implementation overview | Quick reference |
| **[T047-T048-IMPLEMENTATION-COMPLETE.md](T047-T048-IMPLEMENTATION-COMPLETE.md)** | Completion checklist | Quick start |
| **[scripts/validate-implementation.sh](scripts/validate-implementation.sh)** | Automated validation | Before testing |

---

## ✅ What's Complete

### Implementation (100%)
- ✅ Shaliah web app (QR code, token generation, API)
- ✅ Ezer Telegram bot (token validation, account linking)
- ✅ Database schemas (auth_tokens, user_profiles)
- ✅ Internationalization (English + Portuguese)
- ✅ Rate limiting (5 tokens/minute)
- ✅ Language synchronization
- ✅ Sign-out propagation

### Testing Infrastructure (100%)
- ✅ Comprehensive testing guide (26 tests)
- ✅ Automated validation script (25 checks)
- ✅ Summary documentation
- ✅ Quick start guides
- ✅ Database query examples

### Validation Results
- ✅ All automated checks passed (25/25)
- ✅ All files present and correct
- ✅ All dependencies installed
- ✅ All translations complete
- ✅ Code patterns validated

---

## 🎯 What Needs to Be Done

### Manual Testing Required

**T047: End-to-End Testing** (~2-3 hours)
- 10 acceptance scenarios
- 5 edge cases
- 3 performance benchmarks
- 3 security validations

**T048: UI Validation** (~30-45 minutes)
- QR code display
- Link clickability
- Countdown timer
- Linked status indicator
- Performance measurement

**Total Time**: ~3-4 hours

---

## 📖 Test Scenarios Overview

### Acceptance Scenarios (10)
1. ✓ Display QR code in profile page
2. ✓ First-time authentication via QR scan
3. ✓ Authentication via link click
4. ✓ Returning user (already linked)
5. ✓ Unlinked user detection
6. ✓ Token expiration after 15 minutes
7. ✓ Single-use token enforcement
8. ✓ Language synchronization (pt-BR ↔ en-US)
9. ✓ Sign-out propagation to bot
10. ✓ Profile page consistency

### Edge Cases (5)
- Multiple token generation
- Telegram account collision
- Invalid token format
- Network failures
- Concurrent token usage

### Performance (3)
- Token generation < 2s
- Page load < 2s
- Bot validation < 500ms

### Security (3)
- Token entropy (no collisions)
- No PII in tokens
- HTTPS only

---

## 🚀 How to Execute

### Step 1: Pre-Test Validation

```bash
cd /home/patrickkmatias/repos/yesod-ecosystem
./specs/005-ezer-login/scripts/validate-implementation.sh
```

**Expected**: All 25 checks pass ✅

### Step 2: Start Applications

```bash
# Terminal 1: Shaliah Next.js
cd apps/shaliah-next
pnpm dev  # Runs on http://localhost:3000

# Terminal 2: Ezer Bot
cd apps/ezer-bot
pnpm dev  # Long polling mode
```

### Step 3: Execute Tests

Open `TESTING_GUIDE.md` and follow step-by-step:

```bash
# View in terminal
cat specs/005-ezer-login/TESTING_GUIDE.md

# OR open in editor
code specs/005-ezer-login/TESTING_GUIDE.md
```

**Mark checkboxes as you complete each test**

### Step 4: Validate Results

After all tests:
- [ ] All acceptance scenarios passed
- [ ] Edge cases validated
- [ ] Performance targets met
- [ ] Security checks passed
- [ ] UI validations complete

### Step 5: Mark Tasks Complete

In `tasks.md`, change:
```markdown
- [ ] **T047** Manual end-to-end testing...
- [ ] **T048** Use Chrome DevTools MCP...
```

To:
```markdown
- [x] **T047** Manual end-to-end testing...
- [x] **T048** Use Chrome DevTools MCP...
```

---

## 🔧 Environment Setup

### Required Environment Variables

**Shaliah** (`apps/shaliah-next/.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TELEGRAM_BOT_USERNAME=ezer_dev_bot
```

**Ezer Bot** (`apps/ezer-bot/.env`):
```bash
BOT_TOKEN=your-telegram-bot-token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SHALIAH_BASE_URL=http://localhost:3000
```

---

## 🐛 Troubleshooting

### Apps Won't Start

```bash
# Check environment
cat apps/shaliah-next/.env.local
cat apps/ezer-bot/.env

# Reinstall dependencies
cd apps/shaliah-next && pnpm install
cd apps/ezer-bot && pnpm install
```

### Tests Fail

1. Check application logs (terminal output)
2. Check browser console (DevTools → Console)
3. Verify database state (see TESTING_GUIDE.md for queries)
4. Re-run validation script

### Bot Not Responding

- Verify `BOT_TOKEN` is correct
- Check bot is running (terminal shows "Bot started")
- Test Supabase connection
- Check database tables exist

---

## 📊 Validation Results

**Automated Validation** (ran 2025-10-07):

```
Total Checks: 25
Passed: 25 ✅
Failed: 0

✓ Shaliah Implementation (5/5)
✓ Ezer Bot Implementation (4/4)
✓ Dependencies (2/2)
✓ Database Schema (3/3)
✓ Code Patterns (5/5)
✓ Internationalization (2/2)
✓ Test Coverage (4/4)
```

**Key Findings**:
- All implementation files present
- All dependencies installed correctly
- Database migrations ready
- Portuguese translations added
- Code patterns validated

---

## 📁 Files Created

| File | Size | Purpose |
|------|------|---------|
| TESTING_GUIDE.md | 13 KB | Main testing instructions |
| EXECUTION_REPORT_T047_T048.md | 9.7 KB | Execution summary |
| T047-T048-SUMMARY.md | 8.2 KB | Implementation overview |
| T047-T048-IMPLEMENTATION-COMPLETE.md | 7.1 KB | Completion report |
| scripts/validate-implementation.sh | 6.6 KB | Automated validation |
| README_T047_T048.md | This file | Documentation index |

**Total Documentation**: ~50 KB of testing resources

---

## 🎓 Key URLs

- **Shaliah**: http://localhost:3000
- **Profile Page**: http://localhost:3000/profile
- **API Endpoint**: http://localhost:3000/api/ezer-auth/token
- **Telegram Bot**: @ezer_dev_bot (or your configured username)

---

## 💡 Tips

### For Faster Testing

1. **Database shortcuts** - Use SQL queries in TESTING_GUIDE.md to:
   - Unlink accounts quickly
   - Expire tokens instantly
   - Check token status

2. **Browser shortcuts** - Keep DevTools open:
   - Network tab: Monitor API calls
   - Console: Check for errors
   - Performance: Validate load times

3. **Test data** - Create dedicated test user:
   - Separate from production
   - Easy to reset
   - Known credentials

### Common Patterns

**Generate token**:
1. Navigate to profile
2. See QR code automatically (or click generate)
3. Token expires in 15 minutes

**Link account**:
1. Scan QR or click link
2. Opens Telegram
3. Bot validates and links
4. Success message in your language

**Check status**:
```sql
SELECT telegram_user_id FROM user_profiles WHERE user_id = '<your-id>';
```

---

## ✨ Success Criteria

### T047 Complete When:
- ✅ All 10 acceptance scenarios pass
- ✅ At least 4/5 edge cases pass
- ✅ All 3 performance targets met
- ✅ All 3 security checks pass

### T048 Complete When:
- ✅ QR code renders correctly (SVG)
- ✅ Link is clickable and formatted
- ✅ Countdown updates every second
- ✅ Linked status displays clearly
- ✅ Performance < 2s (Lighthouse > 90)

---

## 🎯 Next Steps

### After Manual Testing

1. **If all pass** ✅
   - Mark T047 and T048 as complete in tasks.md
   - Proceed to Phase 5: Code Quality (T049-T052)

2. **If any fail** ❌
   - Document failures in GitHub issues
   - Fix implementation
   - Re-run validation script
   - Re-test failed scenarios

---

## 📞 Support

**Documentation**:
- Main guide: `TESTING_GUIDE.md`
- Contracts: `contracts/*.md`
- Quickstart: `quickstart.md`
- Data model: `data-model.md`

**Scripts**:
- Validation: `scripts/validate-implementation.sh`

**Queries**: See TESTING_GUIDE.md for database queries

---

## 📈 Progress Tracking

- [x] Implementation complete
- [x] Automated validation passed
- [x] Testing documentation created
- [x] Portuguese translations added
- [ ] Manual tests executed (T047)
- [ ] UI validation executed (T048)
- [ ] Tasks marked complete in tasks.md
- [ ] Ready for Phase 5

---

**Status**: ✅ READY FOR MANUAL TESTING  
**Quality**: High (all automated checks passed)  
**Next Action**: Execute tests in TESTING_GUIDE.md

**Good luck! 🎯**

