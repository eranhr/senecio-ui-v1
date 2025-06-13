#!/bin/bash

# Exit on error
set -e

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Install it: https://cli.github.com/"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo "⚠️ You need to authenticate GitHub CLI first."
    echo "Run: gh auth login"
    echo "Or set GH_TOKEN environment variable with your token."
    exit 1
fi

# Check for repo name argument
if [ -z "$1" ]; then
    echo "Usage: ./gitinit.sh <repo-name> [--private]"
    exit 1
fi

REPO_NAME=$1
PRIVACY="--public"

# Check for optional --private flag
if [ "$2" == "--private" ]; then
    PRIVACY="--private"
fi

# Create .gitignore with Node.js, Python, and Swift rules
echo "🛡️ Creating .gitignore..."
cat > .gitignore <<EOL
# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json

# Python
__pycache__/
*.py[cod]
*.egg
*.egg-info/
dist/
build/
.env
.venv/
env/
venv/
*.pyo
.Python

# Swift
.DS_Store
.build/
Packages/
xcuserdata/
*.xcuserstate
*.xcodeproj/*
*.swiftpm/
DerivedData/

# General
.idea/
.vscode/
*.log
EOL

# Initialize Git if needed
if [ ! -d ".git" ]; then
    echo "🔧 Initializing git..."
    git init
fi

# Add and commit
echo "📦 Adding files and committing..."
git add .
git commit -m "Initial commit"

# Create GitHub repo and push
echo "🌐 Creating GitHub repo: $REPO_NAME"
gh repo create "$REPO_NAME" $PRIVACY --source=. --remote=origin --push

echo "✅ Done! Repository '$REPO_NAME' is now live on GitHub."
