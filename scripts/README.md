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

---

## validate-quickstart.sh

**T105: Validates that all setup steps in quickstart.md work correctly**

This script verifies that the quickstart guide is accurate and all documented setup steps can be followed.

### Usage

```bash
./scripts/validate-quickstart.sh
```

### What it checks

1. **Prerequisites**: Node.js, Python, npm, pip are installed
2. **Project Structure**: All required directories exist
3. **Frontend Setup**: package.json, dependencies, key files
4. **Backend Setup**: package.json, dependencies, key files
5. **AI Processing Setup**: requirements.txt, virtual environment, key files
6. **Configuration Files**: .env.example files exist
7. **Documentation**: quickstart.md and spec.md exist
8. **Basic Commands**: Build/start scripts are defined

### Exit codes

- `0` - All checks passed (warnings are OK for optional items)
- `1` - Validation failed with errors

### Notes

- Warnings are non-critical (e.g., missing optional documentation)
- Errors indicate missing required files or dependencies
- Run this when updating quickstart.md to ensure it stays accurate

