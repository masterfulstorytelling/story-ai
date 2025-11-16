# Pre-commit Hooks Rollout Plan

## Current Situation

**Problem:** Pre-commit hooks configuration is only in PR #14. Until this PR merges:
- Hooks aren't available in `main` branch
- Developers on other branches can't install hooks
- But we need hooks to prevent formatting issues

## Solution: Two-Phase Approach

### Phase 1: This PR (Before Merge)

**What works:**
- ✅ CI runs `black --check` directly (works always)
- ✅ CI runs `flake8` with E501 ignored (works always)
- ✅ Code on this PR is already formatted correctly

**What doesn't work yet:**
- ❌ Pre-commit hooks aren't installed (config doesn't exist in main)
- ❌ Developers can't auto-format before commits yet

**CI Behavior:**
- Runs Black check directly (always works)
- Checks for `.pre-commit-config.yaml` - if it exists, verifies hooks
- If config doesn't exist (current state), skips hook verification
- **This PR will pass CI** because Black check works directly

### Phase 2: After This PR Merges

**What will work:**
- ✅ `.pre-commit-config.yaml` exists in `main`
- ✅ All developers can run `pre-commit install`
- ✅ Hooks will auto-format before every commit
- ✅ CI will verify hooks are working

**Required Actions After Merge:**

1. **All developers must install hooks:**
   ```bash
   cd ai-processing
   pip install -r requirements-dev.txt
   pre-commit install
   ```

2. **Or use the setup script:**
   ```bash
   cd ai-processing
   ./setup-dev.sh
   ```

3. **Verify it works:**
   ```bash
   pre-commit run --all-files
   ```

## How It Works

### Before This PR Merges (Current State)
```
Developer commits → CI runs black --check → Pass/Fail
(No hooks installed locally)
```

### After This PR Merges (Future State)
```
Developer commits → Pre-commit hook runs → Black formats → Flake8 checks → Commit proceeds
(If formatting fails, commit is blocked)
```

## Files Added in This PR

1. **`.pre-commit-config.yaml`** - Hook configuration
2. **`ai-processing/SETUP.md`** - Installation instructions
3. **`ai-processing/setup-dev.sh`** - Automated setup script
4. **Updated `README.md`** - Includes hook installation
5. **Updated CI workflow** - Works before and after merge

## Verification

After this PR merges, verify hooks work:

```bash
# Test that hooks are installed
ls -la .git/hooks/pre-commit

# Test that hooks run
pre-commit run --all-files

# Make a test commit to verify auto-formatting
echo "# test" >> test.py
git add test.py
git commit -m "test"  # Should auto-format if needed
```

## Summary

- **This PR:** CI works, code is formatted, ready to merge
- **After merge:** Hooks become available for everyone
- **Future commits:** Will be auto-formatted by hooks
- **No more manual formatting needed!**

