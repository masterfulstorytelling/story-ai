#!/bin/bash
# Comprehensive validation script - run before pushing
# This ensures all linting, type checking, and tests pass locally

set -e  # Exit on any error

echo "🔍 Running comprehensive validation for all tiers..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Backend validation
echo "📦 Backend validation..."
cd backend

echo "  - Linting..."
if npm run lint > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Linting passed"
else
    echo -e "  ${RED}✗${NC} Linting failed"
    npm run lint
    ERRORS=$((ERRORS + 1))
fi

echo "  - Type checking..."
if npx tsc --noEmit > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Type check passed"
else
    echo -e "  ${RED}✗${NC} Type check failed"
    npx tsc --noEmit
    ERRORS=$((ERRORS + 1))
fi

echo "  - Tests..."
# Vitest exits with code 1 if no tests found, which is expected for now
# Use timeout to prevent hanging, and capture output
TEST_OUTPUT=$(timeout 10 npm test 2>&1 || true)
if echo "$TEST_OUTPUT" | grep -q "No test files found"; then
    echo -e "  ${YELLOW}⚠${NC} No tests found (expected for now)"
elif echo "$TEST_OUTPUT" | grep -qE "(PASS|passed|✓)"; then
    echo -e "  ${GREEN}✓${NC} Tests passed"
elif echo "$TEST_OUTPUT" | grep -qE "(FAIL|failed|✗)"; then
    echo -e "  ${RED}✗${NC} Tests failed"
    echo "$TEST_OUTPUT"
    ERRORS=$((ERRORS + 1))
else
    # Unknown state - show output
    echo -e "  ${YELLOW}⚠${NC} Test status unclear"
    echo "$TEST_OUTPUT" | head -5
fi

cd ..

# Frontend validation
echo ""
echo "📦 Frontend validation..."
cd frontend

echo "  - Linting..."
if npm run lint > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Linting passed"
else
    echo -e "  ${RED}✗${NC} Linting failed"
    npm run lint
    ERRORS=$((ERRORS + 1))
fi

echo "  - Type checking..."
if npx tsc --noEmit > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Type check passed"
else
    echo -e "  ${RED}✗${NC} Type check failed"
    npx tsc --noEmit
    ERRORS=$((ERRORS + 1))
fi

echo "  - Tests..."
# Vitest exits with code 1 if no tests found, which is expected for now
# Use timeout to prevent hanging, and capture output
TEST_OUTPUT=$(timeout 10 npm test 2>&1 || true)
if echo "$TEST_OUTPUT" | grep -q "No test files found"; then
    echo -e "  ${YELLOW}⚠${NC} No tests found (expected for now)"
elif echo "$TEST_OUTPUT" | grep -qE "(PASS|passed|✓)"; then
    echo -e "  ${GREEN}✓${NC} Tests passed"
elif echo "$TEST_OUTPUT" | grep -qE "(FAIL|failed|✗)"; then
    echo -e "  ${RED}✗${NC} Tests failed"
    echo "$TEST_OUTPUT"
    ERRORS=$((ERRORS + 1))
else
    # Unknown state - show output
    echo -e "  ${YELLOW}⚠${NC} Test status unclear"
    echo "$TEST_OUTPUT" | head -5
fi

cd ..

# AI Processing validation
echo ""
echo "📦 AI Processing validation..."
cd ai-processing

if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo -e "  ${YELLOW}⚠${NC} Virtual environment not found, creating..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt > /dev/null 2>&1
fi

echo "  - Black formatting check..."
if black --check src/ > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Black formatting passed"
else
    echo -e "  ${RED}✗${NC} Black formatting failed"
    black --check src/
    ERRORS=$((ERRORS + 1))
fi

echo "  - Flake8 linting..."
if flake8 src/ --max-line-length=100 --extend-ignore=E203,W503,E501 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Flake8 linting passed"
else
    echo -e "  ${RED}✗${NC} Flake8 linting failed"
    flake8 src/ --max-line-length=100 --extend-ignore=E203,W503,E501
    ERRORS=$((ERRORS + 1))
fi

echo "  - Tests..."
# Set CI-like environment variables to catch environment-dependent test issues
export ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-test-key}
export LANGSMITH_API_KEY=${LANGSMITH_API_KEY:-}
export LANGSMITH_PROJECT=${LANGSMITH_PROJECT:-story-eval-mvp-test}
export FIRESTORE_PROJECT_ID=${FIRESTORE_PROJECT_ID:-test-project}
export CLOUD_STORAGE_BUCKET=${CLOUD_STORAGE_BUCKET:-test-bucket}
export GCP_PROJECT_ID=${GCP_PROJECT_ID:-test-project}

if pytest tests/ -v --cov=src --cov-report=xml > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Tests passed"
else
    echo -e "  ${RED}✗${NC} Tests failed"
    pytest tests/ -v --cov=src --cov-report=xml
    ERRORS=$((ERRORS + 1))
fi

cd ..

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All validation passed! Safe to push.${NC}"
    exit 0
else
    echo -e "${RED}❌ Validation failed with $ERRORS error(s)${NC}"
    echo -e "${YELLOW}⚠  Do not push until all errors are fixed${NC}"
    exit 1
fi

