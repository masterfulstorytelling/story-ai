# Deployment Guide

This directory contains deployment configurations and scripts for deploying the Story AI application to Google Cloud Run.

## Prerequisites

1. **Google Cloud SDK** installed and configured
   ```bash
   gcloud --version
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Docker** installed and authenticated with GCR
   ```bash
   gcloud auth configure-docker
   ```

3. **Required GCP Services Enabled**:
   - Cloud Run API
   - Cloud Build API
   - Container Registry API
   - Secret Manager API
   - Cloud Tasks API
   - Firestore API
   - Cloud Storage API

4. **Service Accounts Created**:
   - `storyai-backend@PROJECT_ID.iam.gserviceaccount.com`
   - `storyai-processing@PROJECT_ID.iam.gserviceaccount.com`

5. **Secrets in Secret Manager**:
   Create a secret named `storyai-secrets` with the following keys:
   - `gcp-project-id`
   - `firestore-project-id`
   - `cloud-storage-bucket`
   - `sendgrid-api-key`
   - `sendgrid-from-email`
   - `cloud-tasks-queue`
   - `cloud-tasks-location`
   - `anthropic-api-key`
   - `langsmith-api-key`
   - `langsmith-project`

## Files

- `cloudrun-backend.yaml` - Cloud Run service configuration for backend
- `cloudrun-frontend.yaml` - Cloud Run service configuration for frontend
- `cloudrun-ai-processing.yaml` - Cloud Run service configuration for AI processing
- `cloudbuild.yaml` - Cloud Build CI/CD configuration

## Deployment Methods

### Method 1: Using Deployment Script (Recommended)

```bash
# Deploy all services to staging
export GCP_PROJECT_ID=your-project-id
export GCP_REGION=us-central1
./scripts/deploy.sh all staging

# Deploy all services to production
./scripts/deploy.sh all production

# Deploy a specific service
./scripts/deploy.sh backend staging
./scripts/deploy.sh frontend production
./scripts/deploy.sh ai-processing staging
```

### Method 2: Using Cloud Build (CI/CD)

```bash
# Submit build to Cloud Build
gcloud builds submit --config=deploy/cloudbuild.yaml .
```

This will:
1. Build all three Docker images
2. Push them to Container Registry
3. Deploy to Cloud Run

### Method 3: Manual Deployment

#### Build and Push Images

```bash
# Backend
docker build -t gcr.io/PROJECT_ID/storyai-backend:latest ./backend
docker push gcr.io/PROJECT_ID/storyai-backend:latest

# Frontend
docker build -t gcr.io/PROJECT_ID/storyai-frontend:latest ./frontend
docker push gcr.io/PROJECT_ID/storyai-frontend:latest

# AI Processing
docker build -t gcr.io/PROJECT_ID/storyai-processing:latest ./ai-processing
docker push gcr.io/PROJECT_ID/storyai-processing:latest
```

#### Deploy to Cloud Run

```bash
# Backend
gcloud run deploy storyai-backend \
  --image gcr.io/PROJECT_ID/storyai-backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated

# Frontend
gcloud run deploy storyai-frontend \
  --image gcr.io/PROJECT_ID/storyai-frontend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated

# AI Processing
gcloud run deploy storyai-processing \
  --image gcr.io/PROJECT_ID/storyai-processing:latest \
  --region us-central1 \
  --platform managed \
  --no-allow-unauthenticated
```

### Method 4: Using YAML Configuration Files

```bash
# Replace PROJECT_ID in YAML files first
sed -i 's/PROJECT_ID/your-project-id/g' deploy/cloudrun-*.yaml

# Deploy using YAML
gcloud run services replace deploy/cloudrun-backend.yaml --region=us-central1
gcloud run services replace deploy/cloudrun-frontend.yaml --region=us-central1
gcloud run services replace deploy/cloudrun-ai-processing.yaml --region=us-central1
```

## Service Configuration

### Backend Service
- **Memory**: 512 MiB
- **CPU**: 1
- **Min Instances**: 0 (staging), 1 (production)
- **Max Instances**: 20
- **Timeout**: 300 seconds
- **Port**: 8080
- **Public Access**: Yes

### Frontend Service
- **Memory**: 256 MiB
- **CPU**: 1
- **Min Instances**: 0 (staging), 1 (production)
- **Max Instances**: 10
- **Timeout**: 60 seconds
- **Port**: 8080
- **Public Access**: Yes

### AI Processing Service
- **Memory**: 2 GiB
- **CPU**: 2
- **Min Instances**: 0
- **Max Instances**: 10
- **Timeout**: 900 seconds (15 minutes)
- **Port**: 8000
- **Public Access**: No (internal only)

## Environment Variables

### Backend
- `PORT`: 8080
- `NODE_ENV`: production
- `GCP_PROJECT_ID`: From secret
- `FIRESTORE_PROJECT_ID`: From secret
- `CLOUD_STORAGE_BUCKET`: From secret
- `SENDGRID_API_KEY`: From secret
- `SENDGRID_FROM_EMAIL`: From secret
- `CLOUD_TASKS_QUEUE`: From secret
- `CLOUD_TASKS_LOCATION`: From secret
- `AI_PROCESSING_URL`: Set automatically

### Frontend
- `PORT`: 8080
- `VITE_API_URL`: Backend service URL

### AI Processing
- `PORT`: 8000
- `PYTHONUNBUFFERED`: 1
- `GCP_PROJECT_ID`: From secret
- `ANTHROPIC_API_KEY`: From secret
- `LANGSMITH_API_KEY`: From secret
- `LANGSMITH_PROJECT`: From secret
- `CORS_ALLOWED_ORIGINS`: Backend service URL

## Health Checks

All services include health check endpoints:
- Backend: `GET /v1/health`
- Frontend: `GET /`
- AI Processing: `GET /health`

## Monitoring

After deployment, monitor services using:
- Cloud Run console: https://console.cloud.google.com/run
- Cloud Logging: https://console.cloud.google.com/logs
- Cloud Monitoring: https://console.cloud.google.com/monitoring

## Troubleshooting

### Build Failures
- Check Dockerfile syntax
- Verify all dependencies are listed
- Check build logs: `gcloud builds log BUILD_ID`

### Deployment Failures
- Verify service accounts exist and have correct permissions
- Check secrets exist in Secret Manager
- Verify all environment variables are set correctly
- Check Cloud Run logs: `gcloud run services logs read SERVICE_NAME`

### Runtime Issues
- Check service logs: `gcloud run services logs read SERVICE_NAME`
- Verify health check endpoints are responding
- Check service account permissions
- Verify secrets are accessible

## Updating Services

To update a service:

```bash
# Rebuild and redeploy
./scripts/deploy.sh SERVICE_NAME ENVIRONMENT

# Or update image tag only
gcloud run services update SERVICE_NAME \
  --image gcr.io/PROJECT_ID/SERVICE_NAME:NEW_TAG \
  --region us-central1
```

## Rollback

To rollback to a previous version:

```bash
# List revisions
gcloud run revisions list --service=SERVICE_NAME --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic SERVICE_NAME \
  --to-revisions=REVISION_NAME=100 \
  --region=us-central1
```

