#!/bin/bash

# Trace full execution flow for a specific submission
# Usage: ./scripts/trace_submission.sh [submission_id] [hours_ago]
#   submission_id: Required submission ID
#   hours_ago: How many hours back to look (default: 2)

set -e

SUBMISSION_ID="${1}"
HOURS_AGO="${2:-2}"
PROJECT_ID="${GCP_PROJECT_ID:-storyai-mvp}"

if [ -z "$SUBMISSION_ID" ]; then
    echo "Usage: ./scripts/trace_submission.sh <submission_id> [hours_ago]"
    echo ""
    echo "Example: ./scripts/trace_submission.sh e149ca1d-880d-446d-bd19-b11d514026a2"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Execution Trace for Submission: $SUBMISSION_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TIMESTAMP=$(date -u -d "${HOURS_AGO} hours ago" +%Y-%m-%dT%H:%M:%SZ)
FILTER="resource.type=cloud_run_revision AND resource.labels.service_name=storyai-staging-ai-processing AND jsonPayload.metadata.submission_id=\"${SUBMISSION_ID}\" AND timestamp>=\"${TIMESTAMP}\""

# Get all logs in chronological order
echo "📋 FULL EXECUTION TIMELINE (chronological order)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
gcloud logging read "${FILTER}" \
    --project="${PROJECT_ID}" \
    --format="table(timestamp,jsonPayload.message,jsonPayload.metadata.elapsed_seconds,jsonPayload.metadata.node)" \
    --limit=100 \
    --order=asc

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Count agent executions
echo "Agent Executions:"
for agent in "audience_identification" "clarity" "technical_level" "importance" "voice" "vividness" "citation_validation" "synthesis"; do
    COUNT=$(gcloud logging read "${FILTER} AND jsonPayload.message=~\"${agent}\"" \
        --project="${PROJECT_ID}" \
        --format="value(timestamp)" \
        --limit=100 2>/dev/null | wc -l)
    if [ "$COUNT" -gt 0 ]; then
        echo "  ✓ $agent: $COUNT log entry/entries"
    fi
done

# Check completion
COMPLETED=$(gcloud logging read "${FILTER} AND jsonPayload.message=~\"Pipeline execution completed\"" \
    --project="${PROJECT_ID}" \
    --format="value(timestamp)" \
    --limit=1 2>/dev/null | wc -l)

if [ "$COMPLETED" -gt 0 ]; then
    echo ""
    echo "Pipeline Status: ✓ COMPLETED"
    gcloud logging read "${FILTER} AND jsonPayload.message=~\"Pipeline execution completed\"" \
        --project="${PROJECT_ID}" \
        --format="json" \
        --limit=1 | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data:
    meta = data[0].get('jsonPayload', {}).get('metadata', {})
    print(f\"  Audiences: {meta.get('audience_count', 'N/A')}\")
    print(f\"  Agent Outputs: {meta.get('agent_output_count', 'N/A')}\")
    print(f\"  Has Report: {meta.get('has_report', 'N/A')}\")
    print(f\"  Elapsed: {meta.get('elapsed_seconds', 'N/A')} seconds\")
"
else
    echo ""
    echo "Pipeline Status: ⏳ IN PROGRESS or NOT FOUND"
fi

# Check errors
ERROR_COUNT=$(gcloud logging read "${FILTER} AND (jsonPayload.message=~\"Could not parse JSON\" OR jsonPayload.message=~\"Error\" OR severity>=ERROR)" \
    --project="${PROJECT_ID}" \
    --format="value(timestamp)" \
    --limit=100 2>/dev/null | wc -l)

if [ "$ERROR_COUNT" -gt 0 ]; then
    echo ""
    echo "Errors: ⚠ $ERROR_COUNT error(s) found"
else
    echo ""
    echo "Errors: ✓ None"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

