#!/usr/bin/env bash

# Automated Implementation Validation Script for T047/T048
# Feature: 005-ezer-login
# Date: 2025-10-07

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Validating Ezer Bot Authentication Implementation"
echo "=================================================="
echo ""

# Change to repo root
cd "$(dirname "$0")/../../.."

# Track results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

check() {
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  if "$@"; then
    echo -e "${GREEN}✓${NC} $*"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    return 0
  else
    echo -e "${RED}✗${NC} $*"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    return 1
  fi
}

info() {
  echo -e "${YELLOW}ℹ${NC} $*"
}

# 1. Check Shaliah Next.js files exist
echo "1. Checking Shaliah Implementation..."
check test -f "apps/shaliah-next/src/modules/ezer-auth/ui/components/QRCodeDisplay.tsx" || echo "Missing QRCodeDisplay component"
check test -f "apps/shaliah-next/src/modules/ezer-auth/ui/components/EzerAuthSection.tsx" || echo "Missing EzerAuthSection component"
check test -f "apps/shaliah-next/src/modules/ezer-auth/ui/server/actions.ts" || echo "Missing server actions"
check test -f "apps/shaliah-next/src/app/api/ezer-auth/token/route.ts" || echo "Missing API route"
check test -f "apps/shaliah-next/src/db/schema/auth-tokens.ts" || echo "Missing auth_tokens schema"
echo ""

# 2. Check Ezer Bot files exist
echo "2. Checking Ezer Bot Implementation..."
check test -f "apps/ezer-bot/src/modules/auth-link.ts" || echo "Missing auth-link module"
check test -f "apps/ezer-bot/src/lib/supabase.ts" || echo "Missing Supabase client"
check test -f "apps/ezer-bot/src/locales/en.ftl" || echo "Missing English translations"
check test -f "apps/ezer-bot/src/locales/pt-BR.ftl" || echo "Missing Portuguese translations"
echo ""

# 3. Check dependencies installed
echo "3. Checking Dependencies..."
if [ -f "apps/shaliah-next/package.json" ]; then
  if grep -q "next-qrcode" "apps/shaliah-next/package.json"; then
    check echo "next-qrcode installed in shaliah-next"
  else
    check false || echo "next-qrcode NOT found in package.json"
  fi
fi

if [ -f "apps/ezer-bot/package.json" ]; then
  if grep -q "grammy" "apps/ezer-bot/package.json"; then
    check echo "grammy installed in ezer-bot"
  else
    check false || echo "grammy NOT found in package.json"
  fi
fi
echo ""

# 4. Check environment variable templates
echo "4. Checking Environment Configuration..."
if [ -f "apps/shaliah-next/.env.example" ] || [ -f "apps/shaliah-next/.env.local" ]; then
  info "Shaliah .env file exists"
else
  echo -e "${YELLOW}⚠${NC} No .env.example or .env.local in shaliah-next"
fi

if [ -f "apps/ezer-bot/.env.example" ] || [ -f "apps/ezer-bot/.env" ]; then
  info "Ezer Bot .env file exists"
else
  echo -e "${YELLOW}⚠${NC} No .env.example or .env in ezer-bot"
fi
echo ""

# 5. Check database schema files
echo "5. Checking Database Schema..."
check test -f "apps/shaliah-next/src/db/schema/auth-tokens.ts" || echo "Missing auth-tokens schema"
check test -f "apps/shaliah-next/src/db/schema/user-profiles.ts" || echo "Missing user-profiles schema"

# Check if migration was generated
if ls apps/shaliah-next/drizzle/*_add_ezer_auth.sql 1> /dev/null 2>&1; then
  check echo "Ezer auth migration exists"
else
  echo -e "${YELLOW}⚠${NC} No ezer_auth migration found (may need to run drizzle-kit generate)"
fi
echo ""

# 6. Check critical code patterns
echo "6. Checking Code Patterns..."

# Check QRCodeDisplay uses next-qrcode
if grep -q "useQRCode" "apps/shaliah-next/src/modules/ezer-auth/ui/components/QRCodeDisplay.tsx"; then
  check echo "QRCodeDisplay uses next-qrcode"
else
  check false || echo "QRCodeDisplay missing useQRCode hook"
fi

# Check EzerAuthSection is imported in ProfileDashboard
if grep -q "EzerAuthSection" "apps/shaliah-next/src/components/ProfileDashboard.tsx"; then
  check echo "EzerAuthSection imported in ProfileDashboard"
else
  check false || echo "EzerAuthSection NOT imported in ProfileDashboard"
fi

# Check auth-link handles /start command
if grep -q "command('start'" "apps/ezer-bot/src/modules/auth-link.ts"; then
  check echo "Bot handles /start command"
else
  check false || echo "Bot missing /start command handler"
fi

# Check token validation logic
if grep -q "fetchValidToken\|validateToken" "apps/ezer-bot/src/modules/auth-link.ts"; then
  check echo "Bot has token validation logic"
else
  check false || echo "Bot missing token validation"
fi

# Check language sync
if grep -q "mapShaliahToTelegramLocale\|language" "apps/ezer-bot/src/modules/auth-link.ts"; then
  check echo "Bot has language synchronization"
else
  check false || echo "Bot missing language sync"
fi
echo ""

# 7. Check i18n translations
echo "7. Checking Internationalization..."

# Check English translations exist
if [ -f "apps/ezer-bot/src/locales/en.ftl" ]; then
  if grep -q "auth-link-success\|welcome" "apps/ezer-bot/src/locales/en.ftl"; then
    check echo "English translations present"
  else
    info "English translation file exists but may be incomplete"
  fi
fi

# Check Portuguese translations exist
if [ -f "apps/ezer-bot/src/locales/pt-BR.ftl" ]; then
  if grep -q "auth-link-success\|welcome" "apps/ezer-bot/src/locales/pt-BR.ftl"; then
    check echo "Portuguese translations present"
  else
    info "Portuguese translation file exists but may be incomplete"
  fi
fi
echo ""

# 8. Check test files exist
echo "8. Checking Test Coverage..."
check test -f "apps/shaliah-next/__tests__/contract/ezer-auth.contract.test.ts" || echo "Missing Shaliah contract tests"
check test -f "apps/ezer-bot/__tests__/contract/auth-link.contract.test.ts" || echo "Missing Bot contract tests"
check test -f "apps/ezer-bot/__tests__/integration/auth-link-success.test.ts" || echo "Missing bot success integration test"
check test -f "apps/ezer-bot/__tests__/integration/auth-link-errors.test.ts" || echo "Missing bot error integration test"
echo ""

# Summary
echo "=================================================="
echo "Validation Complete!"
echo ""
echo -e "Total Checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
  echo -e "${GREEN}✓ Implementation validation PASSED${NC}"
  echo ""
  echo "Next Steps:"
  echo "1. Start applications (shaliah-next + ezer-bot)"
  echo "2. Run manual tests from TESTING_GUIDE.md"
  echo "3. Complete T047 and T048 checklists"
  exit 0
else
  echo -e "${RED}✗ Implementation validation FAILED${NC}"
  echo ""
  echo "Fix the failed checks above before proceeding with manual testing."
  exit 1
fi

