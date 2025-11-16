# Linting Configuration - Permanent Fix for Black/flake8 Conflicts

## Problem
Previously, there was a conflict between Black formatter and flake8 E501 (line too long) errors:
- Black would format code, sometimes creating lines slightly over 100 characters
- flake8 would then report E501 violations
- After fixing E501 violations manually, Black would reformat differently
- This created a cycle of formatting conflicts

## Root Cause
Configuration inconsistency:
- `pyproject.toml` configured flake8 to ignore E501 (since Black handles line length)
- CI workflows and pre-commit hooks used explicit flags that didn't include E501
- This created a mismatch where different tools had different configurations

## Permanent Solution
E501 is now consistently ignored everywhere:

1. **`setup.cfg`** - flake8 automatically reads this file
   - Contains: `ignore = E203,E501,W503`
   - Ensures any `flake8` command (without flags) ignores E501

2. **CI Workflows** - Explicit flags updated to include E501
   - `.github/workflows/ai-processing-ci.yml`: `--extend-ignore=E203,W503,E501`
   - `.github/workflows/ci.yml`: `--extend-ignore=E203,W503,E501`

3. **Pre-commit hooks** - Updated to include E501
   - `.pre-commit-config.yaml`: `--extend-ignore=E203,E501`

4. **Validation scripts** - Updated to include E501
   - `scripts/validate-all.sh`: `--extend-ignore=E203,W503,E501`

5. **Makefile** - Uses setup.cfg automatically
   - `make lint` runs `flake8 src/ tests/` which reads `setup.cfg`

## Why This Works
- **Black handles line length**: Black is opinionated about line length and formatting
- **flake8 defers to Black**: E501 is ignored because Black is the source of truth for formatting
- **Consistent everywhere**: All tools (CI, pre-commit, local) now use the same configuration
- **Automatic**: `setup.cfg` ensures flake8 always ignores E501, even without explicit flags

## Usage
- Run `make lint` - Uses setup.cfg automatically
- Run `flake8 src/` - Uses setup.cfg automatically  
- Run `black src/` - Formats code (Black is source of truth)
- CI/pre-commit - Automatically use correct configuration

## Notes
- E203 and W503 are also ignored because they conflict with Black's formatting style
- Black's line-length is set to 100 in `pyproject.toml` and pre-commit config
- flake8's max-line-length is set to 100 but E501 is ignored (Black handles it)

