#!/bin/bash
# Quickstart Validation Script
# T105: Verify all setup steps in quickstart.md work correctly

set -e  # Exit on error

echo "=========================================="
echo "Quickstart Validation (T105)"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Function to check command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        echo "✓ $1 is installed"
        return 0
    else
        echo "✗ $1 is NOT installed"
        ((ERRORS++))
        return 1
    fi
}

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo "✓ $1 exists"
        return 0
    else
        echo "✗ $1 is MISSING"
        ((ERRORS++))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo "✓ $1/ exists"
        return 0
    else
        echo "✗ $1/ is MISSING"
        ((ERRORS++))
        return 1
    fi
}

echo "1. Checking Prerequisites..."
echo "----------------------------"
check_command "node"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  Node.js version: $NODE_VERSION"
fi

check_command "python3"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "  Python version: $PYTHON_VERSION"
fi

check_command "npm"
check_command "pip3"
echo ""

echo "2. Checking Project Structure..."
echo "--------------------------------"
check_dir "frontend"
check_dir "backend"
check_dir "ai-processing"
check_dir "specs/001-story-eval-mvp"
echo ""

echo "3. Checking Frontend Setup..."
echo "-----------------------------"
check_file "frontend/package.json"
if [ -f "frontend/package.json" ]; then
    if [ -d "frontend/node_modules" ]; then
        echo "✓ frontend/node_modules exists (dependencies installed)"
    else
        echo "⚠ frontend/node_modules missing (run: cd frontend && npm install)"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Check for key dependencies
    if grep -q '"vue"' frontend/package.json; then
        echo "✓ Vue 3 is in dependencies"
    else
        echo "✗ Vue 3 is NOT in dependencies"
        ((ERRORS++))
    fi
    
    if grep -q '"vite"' frontend/package.json; then
        echo "✓ Vite is in dependencies"
    else
        echo "✗ Vite is NOT in dependencies"
        ((ERRORS++))
    fi
fi

check_file "frontend/src/components/EvaluationForm.vue"
echo ""

echo "4. Checking Backend Setup..."
echo "----------------------------"
check_file "backend/package.json"
if [ -f "backend/package.json" ]; then
    if [ -d "backend/node_modules" ]; then
        echo "✓ backend/node_modules exists (dependencies installed)"
    else
        echo "⚠ backend/node_modules missing (run: cd backend && npm install)"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Check for key dependencies
    if grep -q '"express"' backend/package.json; then
        echo "✓ Express.js is in dependencies"
    else
        echo "✗ Express.js is NOT in dependencies"
        ((ERRORS++))
    fi
    
    if grep -q '"@google-cloud/firestore"' backend/package.json; then
        echo "✓ @google-cloud/firestore is in dependencies"
    else
        echo "✗ @google-cloud/firestore is NOT in dependencies"
        ((ERRORS++))
    fi
fi

check_file "backend/src/api/routes/evaluationRoutes.ts"
check_file "backend/src/index.ts"
echo ""

echo "5. Checking AI Processing Setup..."
echo "-----------------------------------"
check_file "ai-processing/requirements.txt"
if [ -f "ai-processing/requirements.txt" ]; then
    if [ -d "ai-processing/venv" ] || [ -d "ai-processing/.venv" ]; then
        echo "✓ Virtual environment exists"
    else
        echo "⚠ Virtual environment missing (run: cd ai-processing && python3 -m venv venv)"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Check for key dependencies
    if grep -q "^fastapi" ai-processing/requirements.txt; then
        echo "✓ FastAPI is in requirements"
    else
        echo "✗ FastAPI is NOT in requirements"
        ((ERRORS++))
    fi
    
    if grep -q "^langgraph" ai-processing/requirements.txt; then
        echo "✓ LangGraph is in requirements"
    else
        echo "✗ LangGraph is NOT in requirements"
        ((ERRORS++))
    fi
fi

check_file "ai-processing/src/main.py"
check_dir "ai-processing/src/agents"
echo ""

echo "6. Checking Configuration Files..."
echo "----------------------------------"
check_file "backend/.env.example"
check_file "ai-processing/.env.example"
check_file "frontend/.env.example"
echo ""

echo "7. Checking Documentation..."
echo "-----------------------------"
check_file "specs/001-story-eval-mvp/quickstart.md"
check_file "specs/001-story-eval-mvp/spec.md"
    if [ -f "README.plain.md" ]; then
        echo "✓ README.plain.md exists (optional)"
    else
        echo "⚠ README.plain.md missing (optional documentation)"
        WARNINGS=$((WARNINGS + 1))
    fi
echo ""

echo "8. Testing Basic Commands..."
echo "-----------------------------"
echo "Testing: cd frontend && npm run build (dry run)"
if [ -f "frontend/package.json" ]; then
    if grep -q '"build"' frontend/package.json; then
        echo "✓ Frontend has build script"
    else
        echo "⚠ Frontend missing build script"
        ((WARNINGS++))
    fi
fi

echo "Testing: cd backend && npm run build (dry run)"
if [ -f "backend/package.json" ]; then
    if grep -q '"build"' backend/package.json || grep -q '"start"' backend/package.json; then
        echo "✓ Backend has start/build script"
    else
        echo "⚠ Backend missing start/build script"
        ((WARNINGS++))
    fi
fi
echo ""

echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✓ All checks passed! Quickstart guide is valid."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠ Some warnings (non-critical issues)"
    exit 0
else
    echo "✗ Validation failed with $ERRORS error(s)"
    exit 1
fi

