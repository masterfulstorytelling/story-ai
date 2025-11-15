# Production Deployment Checklist

Use this checklist to prepare for production deployment of the Corporate Storytelling Evaluation Tool MVP.

## Pre-Deployment Setup

### 1. Google Cloud Platform Setup

- [ ] Create GCP project (or use existing)
- [ ] Enable billing
- [ ] Enable required APIs:
  - [ ] Cloud Run API
  - [ ] Cloud Build API
  - [ ] Container Registry API
  - [ ] Secret Manager API
  - [ ] Cloud Tasks API
  - [ ] Firestore API
  - [ ] Cloud Storage API
  - [ ] Cloud Logging API
  - [ ] Cloud Monitoring API

### 2. Service Accounts

- [ ] Create `storyai-backend@PROJECT_ID.iam.gserviceaccount.com`
  - [ ] Grant roles: Cloud Run Invoker, Secret Manager Secret Accessor, Firestore User, Storage Object Admin, Cloud Tasks Enqueuer
- [ ] Create `storyai-processing@PROJECT_ID.iam.gserviceaccount.com`
  - [ ] Grant roles: Secret Manager Secret Accessor, Firestore User, Storage Object Admin

### 3. Secret Manager Setup

Create secret `storyai-secrets` with the following keys:

- [ ] `gcp-project-id` - Your GCP project ID
- [ ] `firestore-project-id` - Firestore project ID (usually same as GCP project)
- [ ] `cloud-storage-bucket` - Cloud Storage bucket name (e.g., `storyai-uploads`)
- [ ] `sendgrid-api-key` - SendGrid API key for email delivery
- [ ] `sendgrid-from-email` - Email address for sending reports
- [ ] `cloud-tasks-queue` - Cloud Tasks queue name (e.g., `evaluation-processing`)
- [ ] `cloud-tasks-location` - Cloud Tasks location (e.g., `us-central1`)
- [ ] `anthropic-api-key` - Anthropic API key for Claude
- [ ] `langsmith-api-key` - LangSmith API key (optional, for observability)
- [ ] `langsmith-project` - LangSmith project name (optional)

### 4. Cloud Storage

- [ ] Create bucket for file uploads (e.g., `storyai-uploads`)
- [ ] Set up lifecycle policies if needed
- [ ] Configure CORS if needed

### 5. Firestore

- [ ] Create Firestore database (Native mode recommended)
- [ ] Set up security rules (if needed)
- [ ] Verify collections will be created automatically

### 6. Cloud Tasks

- [ ] Create Cloud Tasks queue (e.g., `evaluation-processing`)
- [ ] Configure queue settings (rate limits, retry policy)

## Deployment Steps

### 1. Authenticate with GCP

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud auth configure-docker
```

### 2. Set Environment Variables

```bash
export GCP_PROJECT_ID=your-project-id
export GCP_REGION=us-central1
```

### 3. Deploy to Staging

```bash
./scripts/deploy.sh all staging
```

### 4. Verify Staging Deployment

- [ ] Frontend is accessible
- [ ] Backend health check passes: `curl https://storyai-staging-backend-PROJECT_ID.run.app/v1/health`
- [ ] AI processing health check passes (internal): `curl https://storyai-staging-processing-PROJECT_ID.run.app/health`
- [ ] Test submission flow end-to-end
- [ ] Verify email delivery works
- [ ] Check Cloud Logging for errors

### 5. Deploy to Production

```bash
./scripts/deploy.sh all production
```

### 6. Verify Production Deployment

- [ ] All services are running
- [ ] Health checks pass
- [ ] Test submission with real data
- [ ] Monitor error rates
- [ ] Verify email delivery
- [ ] Check performance metrics

## Post-Deployment

### 1. Monitoring Setup

- [ ] Set up Cloud Monitoring dashboards
- [ ] Configure alerting for:
  - [ ] High error rates
  - [ ] Service downtime
  - [ ] Processing failures
  - [ ] High latency
- [ ] Set up log-based metrics

### 2. Testing

- [ ] Run integration tests against production
- [ ] Test with real company websites
- [ ] Validate report quality
- [ ] Test error scenarios
- [ ] Verify rate limiting works

### 3. Documentation

- [ ] Update production URLs in documentation
- [ ] Document any environment-specific configurations
- [ ] Create runbook for common issues

### 4. Security Review

- [ ] Verify secrets are not exposed
- [ ] Check service account permissions (principle of least privilege)
- [ ] Review CORS settings
- [ ] Verify rate limiting is working
- [ ] Check GDPR compliance (data deletion endpoint)

## Rollback Plan

If issues occur:

1. **Identify the problematic service**
   ```bash
   gcloud run services list --region=us-central1
   ```

2. **List revisions**
   ```bash
   gcloud run revisions list --service=SERVICE_NAME --region=us-central1
   ```

3. **Rollback to previous revision**
   ```bash
   gcloud run services update-traffic SERVICE_NAME \
     --to-revisions=PREVIOUS_REVISION=100 \
     --region=us-central1
   ```

## Troubleshooting

### Common Issues

1. **Service won't start**
   - Check Cloud Run logs: `gcloud run services logs read SERVICE_NAME --region=us-central1`
   - Verify environment variables are set correctly
   - Check service account permissions

2. **Secrets not accessible**
   - Verify secret exists: `gcloud secrets list`
   - Check service account has Secret Manager Secret Accessor role
   - Verify secret key names match exactly

3. **Build failures**
   - Check Cloud Build logs
   - Verify Dockerfiles are correct
   - Check for dependency issues

4. **Email delivery fails**
   - Verify SendGrid API key is correct
   - Check SendGrid account status
   - Review email service logs

## Support Contacts

- **GCP Support**: [Add support contact]
- **SendGrid Support**: [Add support contact]
- **Development Team**: [Add contact]

## Notes

- Staging and production use different service prefixes (`storyai-staging-*` vs `storyai-*`)
- Production has minimum instances set to 1 for better availability
- AI processing service is internal-only (no public access)
- All secrets should be rotated regularly

