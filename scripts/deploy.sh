#!/bin/bash

# Deployment script for Story AI services to Cloud Run
# Usage: ./scripts/deploy.sh [service] [environment]
#   service: backend|frontend|ai-processing|all (default: all)
#   environment: staging|production (default: staging)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE="${1:-all}"
ENVIRONMENT="${2:-staging}"
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"

# Validate inputs
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: GCP_PROJECT_ID environment variable is not set${NC}"
    exit 1
fi

if [[ ! "$SERVICE" =~ ^(backend|frontend|ai-processing|all)$ ]]; then
    echo -e "${RED}Error: Invalid service. Must be: backend, frontend, ai-processing, or all${NC}"
    exit 1
fi

if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Must be: staging or production${NC}"
    exit 1
fi

# Set environment-specific values
if [ "$ENVIRONMENT" == "production" ]; then
    SERVICE_PREFIX="storyai"
    MIN_INSTANCES_BACKEND="1"
    MIN_INSTANCES_FRONTEND="1"
    MIN_INSTANCES_PROCESSING="0"
else
    SERVICE_PREFIX="storyai-staging"
    MIN_INSTANCES_BACKEND="0"
    MIN_INSTANCES_FRONTEND="0"
    MIN_INSTANCES_PROCESSING="0"
fi

echo -e "${GREEN}Deploying to ${ENVIRONMENT} environment${NC}"
echo -e "${GREEN}Project: ${PROJECT_ID}${NC}"
echo -e "${GREEN}Region: ${REGION}${NC}"
echo ""

# Function to deploy a service
deploy_service() {
    local service_name=$1
    local image_name=$2
    local config_file=$3
    local min_instances=$4
    local max_instances=$5
    local memory=$6
    local cpu=$7
    local timeout=$8
    local port=$9
    shift 9
    local additional_args="$@"

    echo -e "${YELLOW}Deploying ${service_name}...${NC}"

    # Build Docker image
    echo -e "${YELLOW}Building Docker image...${NC}"
    docker build -t "gcr.io/${PROJECT_ID}/${image_name}:latest" "./${service_name}" || {
        echo -e "${RED}Failed to build ${service_name}${NC}"
        exit 1
    }

    # Push to GCR
    echo -e "${YELLOW}Pushing image to GCR...${NC}"
    docker push "gcr.io/${PROJECT_ID}/${image_name}:latest" || {
        echo -e "${RED}Failed to push ${service_name}${NC}"
        exit 1
    }

    # Deploy to Cloud Run
    echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
    gcloud run deploy "${SERVICE_PREFIX}-${service_name}" \
        --image="gcr.io/${PROJECT_ID}/${image_name}:latest" \
        --region="${REGION}" \
        --platform=managed \
        --min-instances="${min_instances}" \
        --max-instances="${max_instances}" \
        --memory="${memory}" \
        --cpu="${cpu}" \
        --timeout="${timeout}" \
        --port="${port}" \
        ${additional_args} || {
        echo -e "${RED}Failed to deploy ${service_name}${NC}"
        exit 1
    }

    echo -e "${GREEN}✓ ${service_name} deployed successfully${NC}"
    echo ""
}

# Deploy Backend
if [ "$SERVICE" == "backend" ] || [ "$SERVICE" == "all" ]; then
    deploy_service \
        "backend" \
        "storyai-backend" \
        "deploy/cloudrun-backend.yaml" \
        "${MIN_INSTANCES_BACKEND}" \
        "20" \
        "512Mi" \
        "1" \
        "300" \
        "8080" \
        "--allow-unauthenticated \
        --service-account=storyai-backend@${PROJECT_ID}.iam.gserviceaccount.com \
        --set-env-vars=NODE_ENV=production,AI_PROCESSING_URL=https://${SERVICE_PREFIX}-processing-${PROJECT_ID}.run.app \
        --set-secrets=GCP_PROJECT_ID=gcp-project-id:latest,FIRESTORE_PROJECT_ID=firestore-project-id:latest,CLOUD_STORAGE_BUCKET=cloud-storage-bucket:latest,SENDGRID_API_KEY=sendgrid-api-key:latest,SENDGRID_FROM_EMAIL=sendgrid-from-email:latest,CLOUD_TASKS_QUEUE=cloud-tasks-queue:latest,CLOUD_TASKS_LOCATION=cloud-tasks-location:latest"
fi

# Deploy Frontend
if [ "$SERVICE" == "frontend" ] || [ "$SERVICE" == "all" ]; then
    deploy_service \
        "frontend" \
        "storyai-frontend" \
        "deploy/cloudrun-frontend.yaml" \
        "${MIN_INSTANCES_FRONTEND}" \
        "10" \
        "256Mi" \
        "1" \
        "60" \
        "8080" \
        "--allow-unauthenticated \
        --set-env-vars=VITE_API_URL=https://${SERVICE_PREFIX}-backend-${PROJECT_ID}.run.app"
fi

# Deploy AI Processing
if [ "$SERVICE" == "ai-processing" ] || [ "$SERVICE" == "all" ]; then
    deploy_service \
        "ai-processing" \
        "storyai-processing" \
        "deploy/cloudrun-ai-processing.yaml" \
        "${MIN_INSTANCES_PROCESSING}" \
        "10" \
        "2Gi" \
        "2" \
        "900" \
        "8000" \
        "--no-allow-unauthenticated \
        --service-account=storyai-processing@${PROJECT_ID}.iam.gserviceaccount.com \
        --set-env-vars=PYTHONUNBUFFERED=1,CORS_ALLOWED_ORIGINS=https://${SERVICE_PREFIX}-backend-${PROJECT_ID}.run.app \
        --set-secrets=GCP_PROJECT_ID=gcp-project-id:latest,FIRESTORE_PROJECT_ID=firestore-project-id:latest,CLOUD_STORAGE_BUCKET=cloud-storage-bucket:latest,ANTHROPIC_API_KEY=anthropic-api-key:latest,LANGSMITH_API_KEY=langsmith-api-key:latest,LANGSMITH_PROJECT=langsmith-project:latest"
fi

echo -e "${GREEN}✓ All deployments completed successfully!${NC}"
echo ""
echo -e "${GREEN}Service URLs:${NC}"
if [ "$SERVICE" == "backend" ] || [ "$SERVICE" == "all" ]; then
    echo -e "  Backend: https://${SERVICE_PREFIX}-backend-${PROJECT_ID}.run.app"
fi
if [ "$SERVICE" == "frontend" ] || [ "$SERVICE" == "all" ]; then
    echo -e "  Frontend: https://${SERVICE_PREFIX}-frontend-${PROJECT_ID}.run.app"
fi
if [ "$SERVICE" == "ai-processing" ] || [ "$SERVICE" == "all" ]; then
    echo -e "  AI Processing: https://${SERVICE_PREFIX}-processing-${PROJECT_ID}.run.app (internal)"
fi

