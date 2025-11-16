#!/bin/bash

# Check full pipeline execution for a submission
# Usage: ./scripts/check_pipeline.sh [submission_id] [hours_ago]
#   submission_id: Optional submission ID to filter by
#   hours_ago: How many hours back to look (default: 1)

set -e

SUBMISSION_ID="${1:-}"
HOURS_AGO="${2:-1}"
PROJECT_ID="${GCP_PROJECT_ID:-storyai-mvp}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Pipeline Execution Monitor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build filter - evaluate date command first
TIMESTAMP=$(date -u -d "${HOURS_AGO} hours ago" +%Y-%m-%dT%H:%M:%SZ)
FILTER="resource.type=cloud_run_revision AND resource.labels.service_name=storyai-staging-ai-processing AND timestamp>=\"${TIMESTAMP}\""

if [ -n "$SUBMISSION_ID" ]; then
    FILTER="${FILTER} AND jsonPayload.metadata.submission_id=\"${SUBMISSION_ID}\""
    echo "Filtering for submission: $SUBMISSION_ID"
else
    echo "Showing all evaluations from last ${HOURS_AGO} hour(s)"
fi
echo ""

# Get pipeline start
echo "📊 PIPELINE EXECUTION FLOW"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
gcloud logging read "${FILTER} AND jsonPayload.message=~\"Starting pipeline\"" \
    --project="${PROJECT_ID}" \
    --format="table(timestamp,jsonPayload.metadata.submission_id)" \
    --limit=10 \
    --order=desc | head -15

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 AGENT EXECUTION STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check each agent
AGENTS=(
    "audience_identification:Starting audience identification"
    "clarity:Starting clarity evaluation"
    "technical_level:Starting technical level evaluation"
    "importance:Starting importance evaluation"
    "voice:Starting voice evaluation"
    "vividness:Starting vividness evaluation"
    "citation_validation:Starting citation validation"
    "synthesis:Report generation completed"
)

for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name agent_pattern <<< "$agent_info"
    COUNT=$(gcloud logging read "${FILTER} AND jsonPayload.message=~\"${agent_pattern}\"" \
        --project="${PROJECT_ID}" \
        --format="value(timestamp)" \
        --limit=100 2>/dev/null | wc -l)
    
    if [ "$COUNT" -gt 0 ]; then
        echo "  ✓ $agent_name: $COUNT execution(s)"
    else
        echo "  ✗ $agent_name: No executions found"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ COMPLETION STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
gcloud logging read "${FILTER} AND jsonPayload.message=~\"Pipeline execution completed\"" \
    --project="${PROJECT_ID}" \
    --format="table(timestamp,jsonPayload.metadata.submission_id,jsonPayload.metadata.status,jsonPayload.metadata.audience_count,jsonPayload.metadata.agent_output_count,jsonPayload.metadata.has_report,jsonPayload.metadata.elapsed_seconds)" \
    --limit=10 \
    --order=desc | head -15

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "❌ ERRORS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ERROR_COUNT=$(gcloud logging read "${FILTER} AND (jsonPayload.message=~\"Could not parse JSON\" OR jsonPayload.message=~\"Error.*evaluation\" OR severity>=ERROR)" \
    --project="${PROJECT_ID}" \
    --format="value(timestamp)" \
    --limit=100 2>/dev/null | wc -l)

if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "  Found $ERROR_COUNT error(s):"
    gcloud logging read "${FILTER} AND (jsonPayload.message=~\"Could not parse JSON\" OR jsonPayload.message=~\"Error.*evaluation\" OR severity>=ERROR)" \
        --project="${PROJECT_ID}" \
        --format="table(timestamp,jsonPayload.message)" \
        --limit=10 \
        --order=desc | head -12
else
    echo "  ✓ No errors found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 REPORT GENERATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
REPORT_COUNT=$(gcloud logging read "${FILTER} AND jsonPayload.message=~\"Report generation completed\"" \
    --project="${PROJECT_ID}" \
    --format="value(timestamp)" \
    --limit=100 2>/dev/null | wc -l)

if [ "$REPORT_COUNT" -gt 0 ]; then
    echo "  ✓ Reports generated: $REPORT_COUNT"
    gcloud logging read "${FILTER} AND jsonPayload.message=~\"Report generation completed\"" \
        --project="${PROJECT_ID}" \
        --format="table(timestamp,jsonPayload.metadata.submission_id)" \
        --limit=5 \
        --order=desc | head -8
else
    echo "  ✗ No reports generated"
fi

PDF_COUNT=$(gcloud logging read "${FILTER} AND jsonPayload.message=~\"PDF report generated\"" \
    --project="${PROJECT_ID}" \
    --format="value(timestamp)" \
    --limit=100 2>/dev/null | wc -l)

if [ "$PDF_COUNT" -gt 0 ]; then
    echo "  ✓ PDFs generated: $PDF_COUNT"
else
    echo "  ✗ No PDFs generated"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

