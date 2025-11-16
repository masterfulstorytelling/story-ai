#!/bin/bash

# Helper script to add API keys to Secret Manager
# Usage: ./scripts/add-secrets.sh

set -e

PROJECT_ID=$(gcloud config get-value project)

echo "Adding API keys to Secret Manager..."
echo ""

# SendGrid API Key
read -sp "Enter SendGrid API Key: " SENDGRID_KEY
echo ""
echo -n "${SENDGRID_KEY}" | gcloud secrets versions add storyai-secrets \
  --data-file=- \
  --secret-key="sendgrid-api-key"
echo "✅ SendGrid API Key added"

# SendGrid From Email
read -p "Enter SendGrid From Email (e.g., noreply@yourdomain.com): " SENDGRID_EMAIL
echo -n "${SENDGRID_EMAIL}" | gcloud secrets versions add storyai-secrets \
  --data-file=- \
  --secret-key="sendgrid-from-email"
echo "✅ SendGrid From Email added"

# Anthropic API Key
read -sp "Enter Anthropic API Key: " ANTHROPIC_KEY
echo ""
echo -n "${ANTHROPIC_KEY}" | gcloud secrets versions add storyai-secrets \
  --data-file=- \
  --secret-key="anthropic-api-key"
echo "✅ Anthropic API Key added"

# LangSmith API Key (optional)
read -p "Enter LangSmith API Key (optional, press Enter to skip): " LANGSMITH_KEY
if [ -n "${LANGSMITH_KEY}" ]; then
  echo -n "${LANGSMITH_KEY}" | gcloud secrets versions add storyai-secrets \
    --data-file=- \
    --secret-key="langsmith-api-key"
  echo "✅ LangSmith API Key added"
  
  read -p "Enter LangSmith Project Name (e.g., storyai-evaluations): " LANGSMITH_PROJECT
  echo -n "${LANGSMITH_PROJECT}" | gcloud secrets versions add storyai-secrets \
    --data-file=- \
    --secret-key="langsmith-project"
  echo "✅ LangSmith Project added"
else
  echo "⏭️  LangSmith skipped"
fi

echo ""
echo "✅ All secrets added successfully!"
echo ""
echo "Verify with: gcloud secrets versions list storyai-secrets"

