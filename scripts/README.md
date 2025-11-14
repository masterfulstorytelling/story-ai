# Validation Scripts

## validate-all.sh

**CRITICAL: Run this before every push to GitHub**

This script validates all three tiers (backend, frontend, ai-processing) to ensure:
- ✅ Linting passes
- ✅ Type checking passes  
- ✅ Tests pass

### Usage

```bash
./scripts/validate-all.sh
```

### What it checks

**Backend:**
- ESLint linting
- TypeScript type checking
- Jest tests

**Frontend:**
- ESLint linting
- TypeScript type checking
- Vitest tests (warns if no tests found, which is expected for now)

**AI Processing:**
- Black code formatting
- Flake8 linting
- Pytest tests with coverage

### Exit codes

- `0` - All validation passed, safe to push
- `1` - Validation failed, do not push

### Note

**Always run this script before pushing to GitHub.** This prevents the frustrating cycle of:
1. Push to GitHub
2. Find errors in CI
3. Bring errors back locally
4. Fix and repeat

Run it locally first, fix any issues, then push.

