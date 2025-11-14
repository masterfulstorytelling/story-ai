# Quickstart: Corporate Storytelling Evaluation Tool MVP

**Date**: 2025-11-13  
**Feature**: Corporate Storytelling Evaluation Tool MVP

## Overview

This guide provides a quick start for developers implementing the Corporate Storytelling Evaluation Tool MVP. It covers the essential setup, architecture overview, and key implementation patterns.

## Architecture Overview

The system consists of three main components:

1. **Frontend** (Vue 3): User submission form
2. **Backend API** (Node.js/Express): Request handling, file uploads, email delivery
3. **AI Processing** (Python/FastAPI): Multi-agent analysis pipeline

```
User → Frontend → Backend API → Cloud Tasks → AI Processing → Email Delivery
```

## Setup

### Prerequisites

- Node.js 20.x
- Python 3.11+
- Google Cloud Platform account
- SendGrid account
- Anthropic API key (Claude)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

**Key Dependencies**:
- Vue 3 (Composition API)
- Vite
- Tailwind CSS
- Axios

**Main Component**: `EvaluationForm.vue` - Handles URL/file input, validation, submission

### Backend API Setup

```bash
cd backend
npm install
npm run dev
```

**Key Dependencies**:
- Express.js
- Multer (file uploads)
- Joi/Zod (validation)
- @google-cloud/firestore
- @google-cloud/storage
- @google-cloud/tasks
- sendgrid

**Main Routes**: 
- `POST /v1/evaluations` - Submit evaluation request
- `GET /v1/evaluations/:id` - Get status

### AI Processing Setup

```bash
cd ai-processing
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

**Key Dependencies**:
- FastAPI
- LangGraph
- LangChain
- Anthropic SDK
- Playwright
- PyMuPDF/pdfplumber
- python-pptx
- python-docx
- WeasyPrint

**Main Entry Point**: `main.py` - FastAPI app with agent pipeline

## Development Workflow

### 1. Local Development

**Frontend**: Runs on `http://localhost:5173` (Vite default)
**Backend**: Runs on `http://localhost:3000`
**AI Processing**: Runs on `http://localhost:8000`

**Testing End-to-End**:
1. Submit form via frontend
2. Backend creates Firestore document and Cloud Task
3. For local dev, trigger AI processing manually or use Cloud Tasks emulator
4. Check Firestore for status updates
5. Verify email delivery (use SendGrid sandbox for testing)

### 2. Agent Development

Agents are in `ai-processing/src/agents/`. Each agent:
- Has a single, focused responsibility
- Accepts structured input (Pydantic models)
- Returns structured output (Pydantic models)
- Includes citations for all claims

**Example Agent Structure**:
```python
from pydantic import BaseModel
from langchain_core.messages import HumanMessage

class ClarityInput(BaseModel):
    audience: Audience
    content: Content

class ClarityOutput(BaseModel):
    agent_name: str = "clarity_assessment"
    audience_id: str
    assessments: ClarityAssessments
    citations: List[Citation]

def clarity_agent(input: ClarityInput) -> ClarityOutput:
    # Agent logic here
    pass
```

### 3. Testing

**Unit Tests**: Test individual agents, services, components
**Integration Tests**: Test API endpoints, agent pipeline
**Contract Tests**: Verify agent input/output schemas match contracts

**Run Tests**:
```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && npm test

# AI Processing
cd ai-processing && pytest
```

## Key Implementation Patterns

### 1. Asynchronous Processing

**Pattern**: Fire-and-forget with status tracking

```typescript
// Backend: Create evaluation request
const request = await createEvaluationRequest(data);
await enqueueProcessingTask(request.id);
return { id: request.id, status: 'pending' };

// AI Processing: Update status as work progresses
await updateStatus(requestId, 'processing');
// ... run agents ...
await updateStatus(requestId, 'completed', { reportId });
```

### 2. Citation Validation

**Pattern**: Multi-stage validation before including in report

```python
def validate_citation(quote: str, source_content: str) -> ValidationResult:
    # Stage 1: Exact match
    if quote in source_content:
        return ValidationResult(verified=True, method='exact_match')
    
    # Stage 2: Fuzzy match
    similarity = fuzzy_ratio(quote, source_content)
    if similarity >= 85:
        return ValidationResult(verified=True, method='fuzzy_match')
    
    # Stage 3: Semantic similarity
    embedding_sim = cosine_similarity(quote_embedding, source_embedding)
    if embedding_sim >= 0.9:
        return ValidationResult(verified=True, method='semantic_similarity')
    
    return ValidationResult(verified=False, reason='No match found')
```

### 3. Parallel Agent Execution

**Pattern**: Run clarity agents in parallel for each audience

```python
from langgraph.graph import StateGraph

# Define parallel clarity agents
clarity_agents = {
    f"clarity_{audience.id}": clarity_agent
    for audience in audiences
}

# Add parallel edges
graph.add_conditional_edges(
    "audience_identification",
    lambda state: list(clarity_agents.keys()),
    clarity_agents
)
```

### 4. Error Handling

**Pattern**: Graceful degradation with user notification

```python
try:
    result = agent.run(input)
except CriticalAgentError:
    # Critical agents (Audience, Citation Validation) must succeed
    await notify_user_error(request_id, "Critical processing error")
    raise
except NonCriticalAgentError:
    # Non-critical agents can fail, continue with partial results
    logger.warning(f"Agent {agent_name} failed, continuing")
    result = None
```

## Configuration

### Environment Variables

**Backend**:
```
PORT=3000
FIRESTORE_PROJECT_ID=your-project-id
CLOUD_STORAGE_BUCKET=storyai-uploads
SENDGRID_API_KEY=your-api-key
CLOUD_TASKS_QUEUE=storyai-processing
```

**AI Processing**:
```
ANTHROPIC_API_KEY=your-api-key
LANGSMITH_API_KEY=your-api-key (optional)
FIRESTORE_PROJECT_ID=your-project-id
CLOUD_STORAGE_BUCKET=storyai-uploads
```

## Deployment

### Cloud Run Deployment

**Backend**:
```bash
gcloud run deploy storyai-api \
  --source backend \
  --platform managed \
  --region us-central1
```

**AI Processing**:
```bash
gcloud run deploy storyai-processing \
  --source ai-processing \
  --platform managed \
  --region us-central1 \
  --timeout 600
```

### Firestore Setup

Create collections:
- `evaluation_requests`
- Create indexes as specified in data-model.md

### Cloud Storage Setup

Create buckets:
- `storyai-uploads` (for file uploads)
- `storyai-reports` (for generated PDFs)

## Next Steps

1. **Implement Frontend Form**: Create `EvaluationForm.vue` with validation
2. **Implement Backend API**: Create submission endpoint with file upload
3. **Implement Content Ingestion**: Scraper and file parser
4. **Implement Agents**: Start with Audience Identification, then Clarity
5. **Implement Citation Validation**: Critical for preventing hallucinations
6. **Implement Report Generation**: PDF generation with citations
7. **Implement Email Delivery**: SendGrid integration

## Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Firestore Documentation](https://cloud.google.com/firestore/docs)
- Agent specifications: `storyai/CorpEvalAgentSpec.md`
- Functional requirements: `storyai/CorpEvalFucntional.md`

## Troubleshooting

**Common Issues**:

1. **File upload fails**: Check file size (max 50MB) and type (PDF, PPTX, DOCX only)
2. **Scraping fails**: Check URL accessibility, handle JavaScript-rendered content
3. **Agent timeout**: Increase Cloud Run timeout, optimize agent prompts
4. **Citation validation too strict**: Adjust fuzzy match threshold
5. **Email not delivered**: Check SendGrid API key, verify email address format

