# Monitoring & Observability Guide

This guide explains how to monitor your Story AI evaluation system and track the progression of evaluations through the pipeline.

## 🎯 Quick Access Links

### LangSmith (AI Agent Tracing)
- **Dashboard**: https://smith.langchain.com/
- **Project**: `story-eval-mvp` (default)
- **What it shows**: 
  - Every agent execution (audience identification, clarity, voice, etc.)
  - LLM calls, tokens used, latency
  - Agent inputs/outputs
  - Error traces
  - Cost tracking

### Google Cloud Console
- **Logs Explorer**: https://console.cloud.google.com/logs/query?project=storyai-mvp
- **Firestore**: https://console.cloud.google.com/firestore/data/evaluation_requests?project=storyai-mvp
- **Cloud Tasks**: https://console.cloud.google.com/cloudtasks?project=storyai-mvp
- **Cloud Run Services**: https://console.cloud.google.com/run?project=storyai-mvp

---

## 📊 Monitoring Options

### 1. LangSmith Dashboard (Best for AI Agent Monitoring)

LangSmith provides a visual interface to see exactly what each AI agent is doing.

#### Access LangSmith:
1. Go to https://smith.langchain.com/
2. Sign in with your LangSmith account
3. Select project: **`story-eval-mvp`**

#### What You'll See:
- **Traces**: Each evaluation request creates a trace showing all agent executions
- **Agent Details**: Click any trace to see:
  - Which agents ran (audience identification, clarity, voice, vividness, etc.)
  - Inputs and outputs for each agent
  - LLM calls with prompts and responses
  - Token usage and costs
  - Execution time for each step
  - Any errors or failures

#### Filtering:
- Filter by time range
- Search by evaluation ID (if included in metadata)
- Filter by agent type
- Filter by errors

#### Key Metrics:
- **Latency**: How long each agent takes
- **Token Usage**: Track LLM costs
- **Success Rate**: Which agents succeed/fail
- **Cost**: Total cost per evaluation

---

### 2. Google Cloud Logging (Best for System-Wide Monitoring)

#### View Recent Activity:
```bash
# Backend logs (submissions, task creation, email sending)
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=storyai-staging-backend" \
  --limit=50 \
  --project=storyai-mvp

# AI Processing logs (agent execution, LLM calls)
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=storyai-staging-processing" \
  --limit=50 \
  --project=storyai-mvp

# Errors only
gcloud logging read \
  "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=20 \
  --project=storyai-mvp
```

#### In GCP Console:
1. Go to: https://console.cloud.google.com/logs/query?project=storyai-mvp
2. Use query builder or enter:
   ```
   resource.type="cloud_run_revision"
   resource.labels.service_name="storyai-staging-backend"
   ```
3. Filter by severity, time range, or search terms

---

### 3. Firestore (Database State)

#### View Evaluation Requests:
1. Go to: https://console.cloud.google.com/firestore/data/evaluation_requests?project=storyai-mvp
2. See all submissions with:
   - Status (pending, processing, completed, failed)
   - Submission time
   - Email address
   - URL/files submitted
   - Error messages (if failed)

#### View Processing Results:
1. Go to: https://console.cloud.google.com/firestore/data/evaluations?project=storyai-mvp
2. See completed evaluations with:
   - Agent outputs
   - Assessments
   - Generated reports
   - Validated citations

---

### 4. Cloud Tasks Queue (Task Status)

#### Check Queue Status:
```bash
gcloud tasks list \
  --queue=evaluation-processing \
  --location=us-central1 \
  --project=storyai-mvp
```

#### In GCP Console:
1. Go to: https://console.cloud.google.com/cloudtasks?project=storyai-mvp
2. Select queue: `evaluation-processing`
3. See:
   - Pending tasks
   - Task creation time
   - Retry attempts
   - Last error (if any)

---

### 5. API Status Endpoint (Programmatic Check)

#### Check Evaluation Status:
```bash
# Replace {EVALUATION_ID} with actual ID from submission response
curl https://storyai-staging-backend-datmtomk6a-uc.a.run.app/v1/evaluations/{EVALUATION_ID}
```

Response includes:
- `status`: pending, processing, completed, failed
- `submitted_at`: When it was submitted
- `processing_started_at`: When processing began
- `completed_at`: When it finished
- `error_message`: If failed
- `result`: Full evaluation results (when completed)

---

## 🔍 Monitoring Script

Use the provided monitoring script for quick status checks:

```bash
# Check system health
./scripts/monitor.sh

# Check specific evaluation
./scripts/monitor.sh --evaluation-id {ID}

# Watch logs in real-time
./scripts/monitor.sh --watch
```

---

## 📈 Key Metrics to Watch

### Success Metrics:
- **Submission Success Rate**: % of submissions that complete successfully
- **Average Processing Time**: How long evaluations take
- **Agent Success Rate**: Which agents succeed/fail most often

### Error Metrics:
- **Task Failures**: Tasks that fail to process
- **Agent Errors**: Which agents fail and why
- **LLM Errors**: API errors from Anthropic

### Cost Metrics:
- **Token Usage**: Tracked in LangSmith
- **LLM Costs**: Estimated cost per evaluation
- **Infrastructure Costs**: Cloud Run, Firestore, Storage

---

## 🚨 Alerting (Future Enhancement)

Consider setting up alerts for:
- High error rate (>10% failures)
- Long processing times (>15 minutes)
- Service downtime
- High LLM costs

---

## 🔄 Typical Evaluation Flow

1. **Submission** → Backend receives request
   - Check: Backend logs, Firestore `evaluation_requests` collection

2. **Task Creation** → Cloud Task created
   - Check: Cloud Tasks queue, Backend logs

3. **Processing Starts** → Backend processes task
   - Check: Backend logs ("Processing evaluation request")

4. **AI Processing** → Agents execute
   - Check: **LangSmith dashboard** (best view here!)
   - Check: AI processing service logs

5. **Report Generation** → Report created
   - Check: LangSmith (synthesis agent), AI processing logs

6. **Email Delivery** → Report sent
   - Check: Backend logs ("Email sent successfully")

7. **Completion** → Status updated to "completed"
   - Check: Firestore `evaluations` collection, API status endpoint

---

## 💡 Pro Tips

1. **Use LangSmith for AI debugging**: It's the best tool to see what agents are doing
2. **Check Firestore for state**: See the current status of all evaluations
3. **Watch Cloud Tasks**: If tasks are stuck, check the queue
4. **Monitor logs during testing**: Use `--watch` mode to see real-time activity
5. **Set up bookmarks**: Save common queries in GCP Logs Explorer

---

## 🛠️ Troubleshooting

### "Evaluation stuck in pending"
- Check Cloud Tasks queue for failed tasks
- Check backend logs for errors
- Verify Cloud Tasks has permission to invoke backend

### "No traces in LangSmith"
- Verify `LANGSMITH_API_KEY` is set in AI processing service
- Check AI processing service logs for LangSmith initialization
- Ensure LangSmith project name matches

### "Processing takes too long"
- Check LangSmith to see which agent is slow
- Check token usage (large inputs = slower)
- Review Cloud Run service logs for timeouts

---

## 📚 Additional Resources

- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [Google Cloud Logging](https://cloud.google.com/logging/docs)
- [Cloud Tasks Monitoring](https://cloud.google.com/tasks/docs/monitoring)

