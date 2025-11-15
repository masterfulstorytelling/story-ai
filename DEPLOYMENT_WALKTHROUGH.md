# Production Deployment Walkthrough

This guide walks you through deploying the Corporate Storytelling Evaluation Tool MVP to production.

## Step 1: GCP Project Setup (15-30 minutes)

### 1.1 Create or Select GCP Project

```bash
# List existing projects
gcloud projects list

# Create new project (if needed)
gcloud projects create storyai-production --name="Story AI Production"

# Set as active project
gcloud config set project storyai-production
```

**Action Items:**
- [ ] Project created or selected
- [ ] Billing enabled
- [ ] Project ID noted (you'll need this)

### 1.2 Enable Required APIs

```bash
# Enable all required APIs at once
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudtasks.googleapis.com \
  firestore.googleapis.com \
  storage-component.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com
```

**Action Items:**
- [ ] All APIs enabled
- [ ] Verify with: `gcloud services list --enabled`

## Step 2: Service Accounts (10 minutes)

### 2.1 Create Service Accounts

```bash
PROJECT_ID=$(gcloud config get-value project)

# Backend service account
gcloud iam service-accounts create storyai-backend \
  --display-name="Story AI Backend Service Account"

# AI Processing service account
gcloud iam service-accounts create storyai-processing \
  --display-name="Story AI Processing Service Account"
```

### 2.2 Grant Permissions

```bash
PROJECT_ID=$(gcloud config get-value project)
BACKEND_SA="storyai-backend@${PROJECT_ID}.iam.gserviceaccount.com"
PROCESSING_SA="storyai-processing@${PROJECT_ID}.iam.gserviceaccount.com"

# Backend permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${BACKEND_SA}" \
  --role="roles/run.invoker"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${BACKEND_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${BACKEND_SA}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${BACKEND_SA}" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${BACKEND_SA}" \
  --role="roles/cloudtasks.enqueuer"

# Processing permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${PROCESSING_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${PROCESSING_SA}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${PROCESSING_SA}" \
  --role="roles/storage.objectAdmin"
```

**Action Items:**
- [ ] Service accounts created
- [ ] Permissions granted
- [ ] Verify with: `gcloud iam service-accounts list`

## Step 3: Secret Manager Setup (15 minutes)

### 3.1 Create Secret

```bash
PROJECT_ID=$(gcloud config get-value project)

# Create the secret (we'll add keys one by one)
gcloud secrets create storyai-secrets \
  --replication-policy="automatic"
```

### 3.2 Add Secret Values

You'll need to gather these values first:

```bash
PROJECT_ID=$(gcloud config get-value project)

# Set project ID
echo -n "${PROJECT_ID}" | gcloud secrets versions add storyai-secrets \
  --data-file=- \
  --secret-key="gcp-project-id"

# Set Firestore project ID (usually same as GCP project)
echo -n "${PROJECT_ID}" | gcloud secrets versions add storyai-secrets \
  --data-file=- \
  --secret-key="firestore-project-id"

# Set Cloud Storage bucket (create bucket first - see Step 4)
echo -n "storyai-uploads" | gcloud secrets versions add storyai-secrets \
  --data-file=- \
  --secret-key="cloud-storage-bucket"

# Set SendGrid API key (get from SendGrid dashboard)
echo -n "YOUR_SENDGRID_API_KEY" | gcloud secrets versions add storyai-secrets \
  --data-file=- \
  --secret-key="sendgrid-api-key"

# Set SendGrid from email
echo -n "noreply@yourdomain.com" | gcloud secrets versions add storyai-secrets \
  --data-file=- \
  --secret-key="sendgrid-from-email"

# Set Cloud Tasks queue name
echo -n "evaluation-processing" | gcloud secrets versions add storyai-secrets \
  --data-file=- \
  --secret-key="cloud-tasks-queue"

# Set Cloud Tasks location
echo -n "us-central1" | gcloud secrets versions add storyai-secrets \
  --data-file=- \
  --secret-key="cloud-tasks-location"

# Set Anthropic API key (get from Anthropic dashboard)
echo -n "YOUR_ANTHROPIC_API_KEY" | gcloud secrets versions add storyai-secrets \
  --data-file=- \
  --secret-key="anthropic-api-key"

# Set LangSmith API key (optional)
echo -n "YOUR_LANGSMITH_API_KEY" | gcloud secrets versions add storyai-secrets \
  --data-file=- \
  --secret-key="langsmith-api-key"

# Set LangSmith project (optional)
echo -n "storyai-evaluations" | gcloud secrets versions add storyai-secrets \
  --data-file=- \
  --secret-key="langsmith-project"
```

**Action Items:**
- [ ] Secret created
- [ ] All keys added
- [ ] Verify with: `gcloud secrets versions list storyai-secrets`

## Step 4: Cloud Storage Setup (5 minutes)

### 4.1 Create Bucket

```bash
PROJECT_ID=$(gcloud config get-value project)
BUCKET_NAME="storyai-uploads"

gsutil mb -p ${PROJECT_ID} -c STANDARD -l us-central1 gs://${BUCKET_NAME}

# Set lifecycle policy (optional - delete files after 90 days)
cat > lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 90}
      }
    ]
  }
}
EOF
gsutil lifecycle set lifecycle.json gs://${BUCKET_NAME}
```

**Action Items:**
- [ ] Bucket created
- [ ] Lifecycle policy set (if desired)

## Step 5: Firestore Setup (5 minutes)

### 5.1 Create Firestore Database

```bash
PROJECT_ID=$(gcloud config get-value project)

# Create Firestore database (Native mode)
gcloud firestore databases create \
  --location=us-central1 \
  --type=firestore-native
```

**Action Items:**
- [ ] Firestore database created
- [ ] Collections will be created automatically by the application

## Step 6: Cloud Tasks Setup (5 minutes)

### 6.1 Create Queue

```bash
PROJECT_ID=$(gcloud config get-value project)
QUEUE_NAME="evaluation-processing"
LOCATION="us-central1"

gcloud tasks queues create ${QUEUE_NAME} \
  --location=${LOCATION}
```

**Action Items:**
- [ ] Queue created
- [ ] Verify with: `gcloud tasks queues list --location=${LOCATION}`

## Step 7: Deploy to Staging (30-45 minutes)

### 7.1 Set Environment Variables

```bash
export GCP_PROJECT_ID=$(gcloud config get-value project)
export GCP_REGION=us-central1
```

### 7.2 Authenticate Docker

```bash
gcloud auth configure-docker
```

### 7.3 Deploy Services

```bash
# Deploy all services to staging
./scripts/deploy.sh all staging
```

This will:
1. Build Docker images for all three services
2. Push images to Container Registry
3. Deploy to Cloud Run with staging configuration

**Expected Output:**
- Backend URL: `https://storyai-staging-backend-${PROJECT_ID}.run.app`
- Frontend URL: `https://storyai-staging-frontend-${PROJECT_ID}.run.app`
- Processing URL: `https://storyai-staging-processing-${PROJECT_ID}.run.app` (internal)

**Action Items:**
- [ ] All services deployed
- [ ] URLs noted

## Step 8: Verify Staging Deployment (15 minutes)

### 8.1 Health Checks

```bash
PROJECT_ID=$(gcloud config get-value project)

# Backend health check
curl https://storyai-staging-backend-${PROJECT_ID}.run.app/v1/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 8.2 Test Submission Flow

1. Open frontend URL in browser
2. Submit a test evaluation (use a real company website)
3. Check email for confirmation
4. Wait for processing to complete
5. Check email for report

### 8.3 Check Logs

```bash
# Backend logs
gcloud run services logs read storyai-staging-backend \
  --region=us-central1 \
  --limit=50

# Processing logs
gcloud run services logs read storyai-staging-processing \
  --region=us-central1 \
  --limit=50
```

**Action Items:**
- [ ] Health checks pass
- [ ] Test submission successful
- [ ] Email delivery works
- [ ] Report generated correctly
- [ ] No errors in logs

## Step 9: Deploy to Production (30-45 minutes)

### 9.1 Update Secrets for Production

If you need different values for production, create a new secret:

```bash
gcloud secrets create storyai-secrets-prod \
  --replication-policy="automatic"
# Then add keys as in Step 3.2
```

Or use the same secret if staging/production share values.

### 9.2 Deploy Services

```bash
# Deploy all services to production
./scripts/deploy.sh all production
```

**Action Items:**
- [ ] All services deployed
- [ ] Production URLs noted

## Step 10: Post-Deployment Setup (30 minutes)

### 10.1 Set Up Monitoring

```bash
# View service metrics
gcloud monitoring dashboards list

# Create custom dashboard (via Console)
# Go to: https://console.cloud.google.com/monitoring/dashboards
```

### 10.2 Set Up Alerting

Create alerts for:
- High error rates (>5%)
- Service downtime
- Processing failures
- High latency (>10s)

### 10.3 Test Production

Repeat Step 8 verification for production environment.

**Action Items:**
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Production tested
- [ ] Documentation updated with production URLs

## Troubleshooting

### Issue: Service won't start

```bash
# Check logs
gcloud run services logs read SERVICE_NAME --region=us-central1

# Common issues:
# - Missing environment variables
# - Incorrect service account permissions
# - Secrets not accessible
```

### Issue: Secrets not accessible

```bash
# Verify secret exists
gcloud secrets list

# Check service account has access
gcloud secrets get-iam-policy storyai-secrets

# Grant access if needed
gcloud secrets add-iam-policy-binding storyai-secrets \
  --member="serviceAccount:storyai-backend@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Issue: Build failures

```bash
# Check Cloud Build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

## Next Steps

After successful deployment:

1. **Monitor Performance**
   - Set up dashboards
   - Review error rates
   - Track processing times

2. **Collect Feedback**
   - Test with real users
   - Gather report quality feedback
   - Monitor user engagement

3. **Iterate**
   - Improve agent prompts based on feedback
   - Optimize performance
   - Add features from post-MVP roadmap

## Support

If you encounter issues:
1. Check logs: `gcloud run services logs read SERVICE_NAME --region=us-central1`
2. Review [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
3. Check [Deployment Guide](deploy/README.md)

