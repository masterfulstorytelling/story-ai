#!/bin/bash

# Monitoring script for Story AI evaluation system
# Usage:
#   ./scripts/monitor.sh                          # System overview
#   ./scripts/monitor.sh --evaluation-id {ID}     # Check specific evaluation
#   ./scripts/monitor.sh --watch                  # Watch logs in real-time
#   ./scripts/monitor.sh --langsmith              # Show LangSmith dashboard link

set -e

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
REGION="${GCP_REGION:-us-central1}"
BACKEND_URL="https://storyai-staging-backend-datmtomk6a-uc.a.run.app"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check evaluation status
check_evaluation() {
    local eval_id=$1
    print_header "Evaluation Status: $eval_id"
    
    response=$(curl -s "${BACKEND_URL}/v1/evaluations/${eval_id}" || echo "ERROR")
    
    if [ "$response" = "ERROR" ]; then
        print_error "Failed to fetch evaluation status"
        return 1
    fi
    
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
}

# System overview
system_overview() {
    print_header "System Overview"
    
    # Check Cloud Run services
    echo -e "\n${YELLOW}Cloud Run Services:${NC}"
    gcloud run services list --platform=managed --region=$REGION --project=$PROJECT_ID \
        --format="table(metadata.name,status.url,status.conditions[0].status)" 2>/dev/null || print_error "Failed to list services"
    
    # Check recent submissions
    echo -e "\n${YELLOW}Recent Submissions (last 5):${NC}"
    gcloud logging read \
        "resource.type=cloud_run_revision AND resource.labels.service_name=storyai-staging-backend AND jsonPayload.message=~\"Evaluation request stored\"" \
        --limit=5 \
        --format="table(timestamp,jsonPayload.id,jsonPayload.email)" \
        --project=$PROJECT_ID 2>/dev/null || print_info "No recent submissions found"
    
    # Check Cloud Tasks queue
    echo -e "\n${YELLOW}Cloud Tasks Queue:${NC}"
    QUEUE_NAME=$(gcloud secrets versions access latest --secret=cloud-tasks-queue --project=$PROJECT_ID 2>/dev/null || echo "evaluation-processing")
    gcloud tasks list --queue=$QUEUE_NAME --location=$REGION --project=$PROJECT_ID \
        --format="table(TASK_NAME,CREATE_TIME,SCHEDULE_TIME,LAST_ATTEMPT_STATUS)" 2>/dev/null || print_info "No tasks in queue"
    
    # Check recent errors
    echo -e "\n${YELLOW}Recent Errors (last 5):${NC}"
    gcloud logging read \
        "resource.type=cloud_run_revision AND severity>=ERROR" \
        --limit=5 \
        --format="table(timestamp,resource.labels.service_name,severity,jsonPayload.message,textPayload)" \
        --project=$PROJECT_ID 2>/dev/null || print_info "No recent errors"
}

# Watch logs
watch_logs() {
    print_header "Watching Logs (Ctrl+C to stop)"
    print_info "Watching backend and AI processing services..."
    print_info "Note: This polls for new logs every 5 seconds"
    
    # Start by showing logs from the last minute, then track from there
    LAST_TIMESTAMP=$(date -u -d '1 minute ago' +%Y-%m-%dT%H:%M:%SZ)
    print_info "Showing logs from the last minute, then new logs as they arrive..."
    echo ""
    
    while true; do
        # Get logs since last check
        CURRENT_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
        
        # Query for logs since last timestamp
        LOGS=$(gcloud logging read \
            "resource.type=cloud_run_revision AND (resource.labels.service_name=storyai-staging-backend OR resource.labels.service_name=storyai-staging-ai-processing) AND timestamp>=\"${LAST_TIMESTAMP}\"" \
            --project=$PROJECT_ID \
            --format="table(timestamp,resource.labels.service_name,severity,jsonPayload.message,textPayload)" \
            --limit=50 2>/dev/null || echo "")
        
        # Only display if there are logs (avoid empty output)
        if [ -n "$LOGS" ] && [ "$LOGS" != "TIMESTAMP" ]; then
            echo "$LOGS"
            echo ""
            # Extract the last timestamp from the logs to use as the next LAST_TIMESTAMP
            # Get the last non-header line and extract its timestamp
            LAST_LOG_LINE=$(echo "$LOGS" | grep -v "^TIMESTAMP" | tail -1)
            if [ -n "$LAST_LOG_LINE" ]; then
                # Extract timestamp (first field, format: 2025-11-16T03:36:18.905955Z)
                LAST_LOG_TIMESTAMP=$(echo "$LAST_LOG_LINE" | awk '{print $1}')
                if [ -n "$LAST_LOG_TIMESTAMP" ]; then
                    LAST_TIMESTAMP="$LAST_LOG_TIMESTAMP"
                else
                    # Fallback: use current timestamp minus 1 second to ensure we don't miss logs
                    LAST_TIMESTAMP=$(date -u -d '1 second ago' +%Y-%m-%dT%H:%M:%SZ)
                fi
            else
                # No logs found, use current timestamp minus 1 second
                LAST_TIMESTAMP=$(date -u -d '1 second ago' +%Y-%m-%dT%H:%M:%SZ)
            fi
        else
            # No logs in this poll, update timestamp to current time minus 1 second
            # This ensures we don't miss logs that arrive between polls
            LAST_TIMESTAMP=$(date -u -d '1 second ago' +%Y-%m-%dT%H:%M:%SZ)
        fi
        
        sleep 5
    done
}

# Show LangSmith info
show_langsmith() {
    print_header "LangSmith Dashboard"
    
    PROJECT_NAME=$(gcloud secrets versions access latest --secret=langsmith-project --project=$PROJECT_ID 2>/dev/null || echo "story-eval-mvp")
    
    echo -e "${GREEN}LangSmith Dashboard:${NC} https://smith.langchain.com/"
    echo -e "${GREEN}Project:${NC} $PROJECT_NAME"
    echo ""
    echo "LangSmith shows:"
    echo "  • Every AI agent execution"
    echo "  • LLM calls with prompts and responses"
    echo "  • Token usage and costs"
    echo "  • Execution time for each step"
    echo "  • Error traces"
    echo ""
    echo "To access:"
    echo "  1. Go to https://smith.langchain.com/"
    echo "  2. Sign in with your LangSmith account"
    echo "  3. Select project: $PROJECT_NAME"
}

# Show quick links
show_links() {
    print_header "Quick Access Links"
    
    echo -e "${GREEN}LangSmith Dashboard:${NC}"
    echo "  https://smith.langchain.com/"
    echo ""
    echo -e "${GREEN}GCP Console:${NC}"
    echo "  Logs: https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
    echo "  Firestore: https://console.cloud.google.com/firestore/data/evaluation_requests?project=$PROJECT_ID"
    echo "  Cloud Tasks: https://console.cloud.google.com/cloudtasks?project=$PROJECT_ID"
    echo "  Cloud Run: https://console.cloud.google.com/run?project=$PROJECT_ID"
    echo ""
    echo -e "${GREEN}API:${NC}"
    echo "  Backend: $BACKEND_URL"
    echo "  Health: $BACKEND_URL/v1/health"
    echo "  Metrics: $BACKEND_URL/v1/metrics"
}

# Main
case "${1:-}" in
    --evaluation-id|--eval-id|-e)
        if [ -z "${2:-}" ]; then
            print_error "Evaluation ID required"
            echo "Usage: $0 --evaluation-id {ID}"
            exit 1
        fi
        check_evaluation "$2"
        ;;
    --watch|-w)
        watch_logs
        ;;
    --langsmith|-l)
        show_langsmith
        ;;
    --links)
        show_links
        ;;
    --help|-h)
        echo "Story AI Monitoring Script"
        echo ""
        echo "Usage:"
        echo "  $0                          # System overview"
        echo "  $0 --evaluation-id {ID}    # Check specific evaluation"
        echo "  $0 --watch                  # Watch logs in real-time"
        echo "  $0 --langsmith              # Show LangSmith dashboard info"
        echo "  $0 --links                  # Show quick access links"
        echo "  $0 --help                   # Show this help"
        ;;
    *)
        system_overview
        echo ""
        show_links
        ;;
esac

