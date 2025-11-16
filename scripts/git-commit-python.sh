#!/bin/bash
# Git commit wrapper that automatically formats Python files with Black
# Usage: ./scripts/git-commit-python.sh "commit message"
# This ensures Python files are ALWAYS formatted before commit

set -e

COMMIT_MSG="$1"

if [ -z "$COMMIT_MSG" ]; then
    echo "Error: Commit message required"
    echo "Usage: ./scripts/git-commit-python.sh 'your commit message'"
    exit 1
fi

# Find all staged Python files
STAGED_PYTHON_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.py$' || true)

if [ -z "$STAGED_PYTHON_FILES" ]; then
    # No Python files staged, proceed with normal commit
    git commit -m "$COMMIT_MSG"
    exit 0
fi

echo "🔍 Found staged Python files. Formatting with Black..."

# Activate venv if it exists
if [ -d "ai-processing/venv" ]; then
    source ai-processing/venv/bin/activate
fi

# Format each staged Python file
FORMATTED_FILES=()
for file in $STAGED_PYTHON_FILES; do
    if [ -f "$file" ]; then
        echo "  Formatting: $file"
        black "$file" || {
            echo "Error: Black failed on $file"
            exit 1
        }
        # Re-stage the formatted file
        git add "$file"
        FORMATTED_FILES+=("$file")
    fi
done

if [ ${#FORMATTED_FILES[@]} -gt 0 ]; then
    echo "✅ Formatted ${#FORMATTED_FILES[@]} Python file(s) with Black"
fi

# Verify formatting
echo "🔍 Verifying formatting..."
black --check ${FORMATTED_FILES[@]} || {
    echo "Error: Black check failed after formatting"
    exit 1
}

# Now commit
echo "📝 Committing..."
git commit -m "$COMMIT_MSG"

echo "✅ Commit successful!"

