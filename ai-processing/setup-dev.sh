#!/bin/bash
# Development setup script for AI Processing
# This ensures pre-commit hooks are installed for automatic formatting

set -e

echo "🔧 Setting up AI Processing development environment..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

echo "📦 Activating virtual environment..."
source venv/bin/activate

echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt

echo "🔗 Installing pre-commit hooks..."
pre-commit install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Pre-commit hooks are now installed. They will:"
echo "  - Automatically format code with Black before every commit"
echo "  - Run flake8 (with E501 ignored) to catch linting issues"
echo "  - Block commits if formatting/linting fails"
echo ""
echo "To test: pre-commit run --all-files"

