# AI Processing Setup Guide

## Initial Setup

### 1. Create Virtual Environment

```bash
cd ai-processing
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 3. **CRITICAL: Install Pre-commit Hooks**

```bash
pre-commit install
```

This installs git hooks that will:
- **Automatically format code with Black** before every commit
- **Run flake8** (with E501 ignored) to catch other linting issues
- **Block commits** if formatting/linting fails

**You MUST run this command** or commits will fail CI checks.

### 4. Verify Installation

```bash
pre-commit run --all-files
```

This should format all files and show any linting issues.

## How It Works

### Automatic Formatting

When you commit Python code:
1. Pre-commit hook runs Black automatically
2. Black formats your code to match style guidelines
3. Formatted code is staged automatically
4. Commit proceeds with properly formatted code

### Linting

After Black formats:
1. Flake8 runs to check for other issues
2. E501 (line too long) is **ignored** because Black handles it
3. Other linting errors will block the commit

## Troubleshooting

### "pre-commit: command not found"

Install pre-commit:
```bash
pip install pre-commit
pre-commit install
```

### "Black would reformat files"

This means your code isn't formatted. The hook will format it automatically.
If you see this error, the hook isn't installed. Run `pre-commit install`.

### "E501 line too long" errors

This shouldn't happen if hooks are installed. If it does:
1. Check that `.pre-commit-config.yaml` has `--extend-ignore=E501`
2. Reinstall hooks: `pre-commit install --overwrite`

## Manual Formatting

If you want to format without committing:

```bash
black src/
flake8 src/ --max-line-length=100 --extend-ignore=E203,E501,W503
```

But with hooks installed, this happens automatically on commit.

