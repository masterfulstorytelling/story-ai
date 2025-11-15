#!/bin/bash

# Setup all secrets for Story AI deployment
# This creates individual secrets in Secret Manager (standard GCP approach)

set -e

PROJECT_ID=$(gcloud config get-value project)

echo "Setting up secrets in Secret Manager..."
echo ""

# Function to create or update a secret
create_secret() {
    local secret_name=$1
    local value=$2
    local description=$3
    
    echo "Creating secret: ${secret_name}..."
    echo -n "${value}" | gcloud secrets create "${secret_name}" \
        --replication-policy="automatic" \
        --data-file=- 2>&1 | grep -v "already exists" || true
    
    # If secret exists, add new version
    if gcloud secrets describe "${secret_name}" &>/dev/null; then
        echo -n "${value}" | gcloud secrets versions add "${secret_name}" \
            --data-file=- 2>&1 | grep -v "already exists" || true
    fi
    echo "✅ ${secret_name}"
}

# Basic configuration
create_secret "gcp-project-id" "${PROJECT_ID}" "GCP Project ID"
create_secret "firestore-project-id" "${PROJECT_ID}" "Firestore Project ID"
create_secret "cloud-storage-bucket" "storyai-uploads" "Cloud Storage Bucket Name"
create_secret "cloud-tasks-queue" "evaluation-processing" "Cloud Tasks Queue Name"
create_secret "cloud-tasks-location" "us-central1" "Cloud Tasks Location"

# API Keys (will prompt for these)
echo ""
echo "Now enter your API keys:"
echo ""

read -sp "SendGrid API Key: " SENDGRID_KEY
echo ""
create_secret "sendgrid-api-key" "${SENDGRID_KEY}" "SendGrid API Key"

read -p "SendGrid From Email (e.g., noreply@yourdomain.com): " SENDGRID_EMAIL
create_secret "sendgrid-from-email" "${SENDGRID_EMAIL}" "SendGrid From Email"

read -sp "Anthropic API Key: " ANTHROPIC_KEY
echo ""
create_secret "anthropic-api-key" "${ANTHROPIC_KEY}" "Anthropic API Key"

read -p "LangSmith API Key (optional, press Enter to skip): " LANGSMITH_KEY
if [ -n "${LANGSMITH_KEY}" ]; then
    create_secret "langsmith-api-key" "${LANGSMITH_KEY}" "LangSmith API Key"
    
    read -p "LangSmith Project Name (e.g., storyai-evaluations): " LANGSMITH_PROJECT
    create_secret "langsmith-project" "${LANGSMITH_PROJECT}" "LangSmith Project Name"
else
    echo "⏭️  LangSmith skipped"
fi

echo ""
echo "✅ All secrets created!"
echo ""
echo "List secrets: gcloud secrets list"
echo "View a secret: gcloud secrets versions access latest --secret=SECRET_NAME"

