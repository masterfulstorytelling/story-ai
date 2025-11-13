# Corporate Storytelling Evaluation Tool - Implementation Specification

## Technology Stack

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Deployment**: Google Cloud Run

### Backend API Layer
- **Runtime**: Node.js 20.x
- **Framework**: Express.js
- **File Upload**: Multer
- **Validation**: Joi or Zod
- **Deployment**: Google Cloud Run

### AI Processing Layer
- **Language**: Python 3.11+
- **Framework**: FastAPI
- **Agent Framework**: LangGraph
- **LLM Integration**: LangChain
- **Models**: Claude (Anthropic), with flexibility for OpenAI, Gemini, open-source
- **Observability**: LangSmith (for tracing/evals)
- **Deployment**: Google Cloud Run

### Scraping & Parsing
- **Web Scraping**: Playwright (Python)
- **Document Parsing**: 
  - PDF: PyMuPDF or pdfplumber
  - PPTX: python-pptx
  - DOCX: python-docx

### Storage
- **File Storage**: Google Cloud Storage
- **Metadata/State**: Firestore (for MVP) or Cloud SQL (for scale)
- **Caching**: Redis (optional, post-MVP)

### Reporting
- **PDF Generation**: ReportLab or WeasyPrint
- **Markdown**: markdown-it (if using markdown-to-PDF pipeline)

### Email
- **Service**: SendGrid or Google Cloud SMTP

### Infrastructure
- **Cloud Platform**: Google Cloud Platform (GCP)
- **Compute**: Cloud Run (serverless containers)
- **Networking**: Cloud Load Balancing
- **CI/CD**: Cloud Build or GitHub Actions
- **Monitoring**: Cloud Logging, Cloud Monitoring
- **Secrets**: Secret Manager

---

## System Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                          │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Cloud Load Balancer (GCP)                   │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│   Vue Frontend   │            │   Node.js API    │
│   (Cloud Run)    │            │   (Cloud Run)    │
│                  │            │                  │
│  - Form UI       │            │  - Validation    │
│  - File upload   │            │  - File handling │
│  - Progress      │            │  - Job queue     │
└──────────────────┘            └────────┬─────────┘
                                         │
                                         │ HTTP/gRPC
                                         ▼
                                ┌──────────────────┐
                                │  Python/FastAPI  │
                                │  + LangGraph     │
                                │  (Cloud Run)     │
                                │                  │
                                │  - Content       │
                                │    ingestion     │
                                │  - Agent         │
                                │    pipeline      │
                                │  - Report        │
                                │    generation    │
                                └────────┬─────────┘
                                         │
               ┌─────────────────────────┼─────────────────────────┐
               │                         │                         │
               ▼                         ▼                         ▼
     ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
     │  Cloud Storage   │    │   Firestore      │    │   SendGrid       │
     │  (files, PDFs)   │    │   (metadata)     │    │   (email)        │
     └──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## Project Structure
```
corporate-storytelling-eval/
│
├── frontend/                    # Vue.js application
│   ├── src/
│   │   ├── components/
│   │   │   ├── SubmissionForm.vue
│   │   │   ├── FileUpload.vue
│   │   │   └── ProgressIndicator.vue
│   │   ├── views/
│   │   │   ├── Home.vue
│   │   │   └── ThankYou.vue
│   │   ├── services/
│   │   │   └── api.js           # Axios API client
│   │   ├── App.vue
│   │   └── main.js
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── api/                         # Node.js Express API
│   ├── src/
│   │   ├── routes/
│   │   │   └── submission.js    # POST /submit endpoint
│   │   ├── middleware/
│   │   │   ├── validation.js
│   │   │   └── upload.js        # Multer config
│   │   ├── services/
│   │   │   ├── storage.js       # GCS integration
│   │   │   └── queue.js         # Job queue (if needed)
│   │   └── server.js
│   ├── package.json
│   └── Dockerfile
│
├── processor/                   # Python FastAPI + LangGraph
│   ├── src/
│   │   ├── main.py              # FastAPI app
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── audience.py      # Audience identification agent
│   │   │   ├── clarity.py       # Clarity assessment agents
│   │   │   ├── technical.py     # Technical level agent
│   │   │   ├── importance.py    # Importance agent
│   │   │   ├── voice.py         # Voice/personality agent
│   │   │   ├── vividness.py     # Vividness agent
│   │   │   ├── citation.py      # Citation validation agent
│   │   │   └── synthesis.py     # Synthesis/editor agent
│   │   ├── graph/
│   │   │   └── pipeline.py      # LangGraph workflow definition
│   │   ├── ingestion/
│   │   │   ├── scraper.py       # Playwright-based scraping
│   │   │   ├── parser.py        # PDF/PPTX/DOCX parsing
│   │   │   └── preprocessor.py  # Text cleaning/chunking
│   │   ├── reporting/
│   │   │   ├── generator.py     # Report generation logic
│   │   │   └── templates/       # Report templates
│   │   ├── services/
│   │   │   ├── llm.py           # LLM client (Claude, OpenAI, etc.)
│   │   │   ├── storage.py       # GCS integration
│   │   │   └── email.py         # SendGrid integration
│   │   └── models/
│   │       └── schemas.py       # Pydantic models
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/                        # Documentation
│   ├── VISION.md
│   ├── FUNCTIONAL_SPEC.md
│   ├── AGENT_SPEC.md
│   └── IMPLEMENTATION.md        # This file
│
├── infra/                       # Infrastructure as Code
│   ├── terraform/               # GCP resources
│   └── cloudbuild.yaml          # CI/CD config
│
└── README.md
```

---

## API Contracts

### POST /api/submit

**Request**:
```json
{
  "url": "https://example.com",
  "additional_urls": ["https://example.com/about"],  // optional
  "user_audience": "CISOs at Fortune 500 financial institutions",  // optional
  "email": "user@company.com"
}
```

**Files** (multipart/form-data):
- `files[]`: Array of uploaded files (PDF, PPTX, DOCX)

**Response** (202 Accepted):
```json
{
  "submission_id": "sub_abc123",
  "status": "processing",
  "estimated_time_minutes": 8,
  "message": "Your submission is being analyzed. You'll receive a report at user@company.com"
}
```

**Errors**:
- 400 Bad Request: Invalid URL or missing email
- 413 Payload Too Large: Files exceed size limit
- 500 Internal Server Error

---

### Internal API: Node → Python

**POST /process** (Python FastAPI endpoint)

**Request**:
```json
{
  "submission_id": "sub_abc123",
  "url": "https://example.com",
  "additional_urls": ["https://example.com/about"],
  "files": [
    {
      "filename": "deck.pdf",
      "gcs_path": "gs://bucket/submissions/sub_abc123/deck.pdf"
    }
  ],
  "user_audience": "CISOs at Fortune 500 financial institutions",
  "email": "user@company.com"
}
```

**Response** (200 OK, async processing):
```json
{
  "submission_id": "sub_abc123",
  "status": "processing",
  "started_at": "2024-01-15T10:30:00Z"
}
```

**Webhook/Callback** (when complete):
```json
{
  "submission_id": "sub_abc123",
  "status": "completed",
  "report_url": "https://storage.googleapis.com/bucket/reports/sub_abc123/report.pdf",
  "completed_at": "2024-01-15T10:38:00Z"
}
```

---

## LangGraph State Schema
```python
from typing import TypedDict, List, Dict, Optional
from pydantic import BaseModel

class Audience(BaseModel):
    id: str
    description: str
    specificity_score: int
    rationale: str
    source: str

class Citation(BaseModel):
    quote: str
    source: str
    section: Optional[str]
    relevance: Optional[str]

class ClarityAssessment(BaseModel):
    what_they_do: Dict[str, Any]
    how_different: Dict[str, Any]
    who_uses_them: Dict[str, Any]
    
class AgentState(TypedDict):
    # Input
    submission_id: str
    scraped_content: Dict[str, Any]
    uploaded_files: List[Dict[str, Any]]
    user_provided_audience: Optional[str]
    email: str
    
    # Agent outputs
    audiences: List[Audience]
    clarity_assessments: List[Dict[str, Any]]
    technical_level: Dict[str, Any]
    importance: Dict[str, Any]
    voice_personality: Dict[str, Any]
    vividness: Dict[str, Any]
    validated_citations: List[Citation]
    
    # Final output
    report_content: Dict[str, str]
    report_pdf_path: str
    
    # Metadata
    status: str
    errors: List[str]
```

---

## LangGraph Workflow
```python
from langgraph.graph import StateGraph, END

def build_evaluation_graph():
    workflow = StateGraph(AgentState)
    
    # Add nodes (agents)
    workflow.add_node("ingestion", content_ingestion_node)
    workflow.add_node("audience_identification", audience_agent)
    workflow.add_node("clarity_assessment", clarity_agents_parallel)
    workflow.add_node("technical_level", technical_level_agent)
    workflow.add_node("importance", importance_agent)
    workflow.add_node("voice_personality", voice_agent)
    workflow.add_node("vividness", vividness_agent)
    workflow.add_node("citation_validation", citation_validation_agent)
    workflow.add_node("synthesis", synthesis_agent)
    workflow.add_node("report_generation", report_generator)
    
    # Define edges (flow)
    workflow.set_entry_point("ingestion")
    workflow.add_edge("ingestion", "audience_identification")
    
    # After audience identification, spawn parallel branches
    workflow.add_edge("audience_identification", "clarity_assessment")
    workflow.add_edge("audience_identification", "technical_level")
    workflow.add_edge("audience_identification", "importance")
    workflow.add_edge("audience_identification", "voice_personality")
    workflow.add_edge("audience_identification", "vividness")
    
    # All parallel agents converge to citation validation
    workflow.add_edge("clarity_assessment", "citation_validation")
    workflow.add_edge("technical_level", "citation_validation")
    workflow.add_edge("importance", "citation_validation")
    workflow.add_edge("voice_personality", "citation_validation")
    workflow.add_edge("vividness", "citation_validation")
    
    # Then synthesis
    workflow.add_edge("citation_validation", "synthesis")
    workflow.add_edge("synthesis", "report_generation")
    workflow.add_edge("report_generation", END)
    
    return workflow.compile()
```

---

## Model Configuration

### Primary Model: Claude (Anthropic)
```python
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(
    model="claude-sonnet-4-5-20250929",
    temperature=0.2,  # Low for consistency
    max_tokens=4096,
    api_key=os.getenv("ANTHROPIC_API_KEY")
)
```

### Model Flexibility
```python
# Support multiple models via config
def get_llm(model_name: str = "claude"):
    if model_name == "claude":
        return ChatAnthropic(...)
    elif model_name == "gpt4":
        return ChatOpenAI(model="gpt-4-turbo", ...)
    elif model_name == "gemini":
        return ChatVertexAI(...)
    else:
        raise ValueError(f"Unknown model: {model_name}")
```

---

## Deployment Architecture

### Cloud Run Services

**1. Frontend Service**
- Container: Vue app built with Vite, served via nginx
- Scaling: 0-10 instances
- Memory: 256 MB
- CPU: 1
- Public ingress

**2. API Service**
- Container: Node.js Express app
- Scaling: 0-20 instances
- Memory: 512 MB
- CPU: 1
- Authentication: API key (for internal) + public endpoint

**3. Processor Service**
- Container: Python FastAPI + LangGraph
- Scaling: 0-10 instances
- Memory: 2 GB (for LLM processing)
- CPU: 2
- Timeout: 15 minutes
- Internal only (called by API service)

### Networking
- Load Balancer routes to frontend and API services
- API service calls processor via internal VPC
- All services log to Cloud Logging

---

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://api.storytelling-eval.com
```

### API (.env)
```
PORT=8080
GCS_BUCKET_NAME=storytelling-eval-submissions
PROCESSOR_URL=https://processor-service-url
SENDGRID_API_KEY=xxx
```

### Processor (.env)
```
PORT=8000
ANTHROPIC_API_KEY=xxx
OPENAI_API_KEY=xxx  # optional
LANGSMITH_API_KEY=xxx
GCS_BUCKET_NAME=storytelling-eval-submissions
SENDGRID_API_KEY=xxx
```

---

## Development Workflow

### Local Development

**1. Frontend**
```bash
cd frontend
npm install
npm run dev  # Runs on localhost:5173
```

**2. API**
```bash
cd api
npm install
npm run dev  # Runs on localhost:8080
```

**3. Processor**
```bash
cd processor
pip install -r requirements.txt
uvicorn src.main:app --reload  # Runs on localhost:8000
```

**4. Connect services locally**
Update frontend .env to point to localhost:8080
Update API to call localhost:8000

### Testing

**Frontend**
```bash
npm run test
npm run test:e2e
```

**API**
```bash
npm run test
```

**Processor**
```bash
pytest
pytest --cov=src  # With coverage
```

**Agent Evaluation**
- Use LangSmith for tracing
- A/B test different prompts
- Manual review by Adam of sample outputs

---

## CI/CD Pipeline (Cloud Build)
```yaml
# cloudbuild.yaml
steps:
  # Build frontend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/frontend:$SHORT_SHA', './frontend']
  
  # Build API
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/api:$SHORT_SHA', './api']
  
  # Build processor
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/processor:$SHORT_SHA', './processor']
  
  # Push images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/frontend:$SHORT_SHA']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/api:$SHORT_SHA']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/processor:$SHORT_SHA']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'frontend'
      - '--image=gcr.io/$PROJECT_ID/frontend:$SHORT_SHA'
      - '--region=us-central1'
  
  # Similar for API and processor...
```

---

## Security Considerations

### Input Validation
- Validate URLs (prevent SSRF)
- Sanitize file uploads (scan for malware)
- Rate limiting on submission endpoint
- CAPTCHA for public form (optional)

### Secrets Management
- All API keys in Secret Manager
- No secrets in code or containers
- Rotate keys regularly

### Data Privacy
- User emails stored securely
- Submissions deleted after X days (configurable)
- GDPR compliance: allow data deletion requests
- No PII in logs

---

## Monitoring & Observability

### Metrics (Cloud Monitoring)
- Submission success rate
- Average processing time
- Agent execution times
- Error rates per service
- LLM token usage

### Logging (Cloud Logging)
- All agent outputs logged (for debugging)
- Structured logs (JSON)
- Correlation IDs across services

### Tracing (LangSmith)
- Every agent execution traced
- Compare different agent configurations
- Identify bottlenecks

### Alerts
- High error rate
- Long processing times (> 15 min)
- Service down
- High costs (LLM token usage)

---

## Cost Estimation (MVP)

### Infrastructure (GCP)
- Cloud Run: ~$50/month (assuming low traffic)
- Cloud Storage: ~$10/month
- Firestore: ~$5/month
- Load Balancer: ~$20/month
**Subtotal**: ~$85/month

### LLM Usage (Anthropic Claude)
- Assume 100 submissions/month
- Average 50k tokens per analysis (input + output)
- Claude Sonnet pricing: ~$15 per 1M tokens (combined)
- Cost: 100 * 50k * $15 / 1M = **$75/month**

### Email (SendGrid)
- Free tier: 100 emails/day
- **$0/month** for MVP

### Total MVP Cost: ~$160/month

---

## Scaling Considerations (Post-MVP)

### For Paid Client Version

**1. Database**: Migrate from Firestore to Cloud SQL (PostgreSQL)
- Better for complex queries
- Relational data model

**2. Caching**: Add Redis for frequently accessed data
- Reduce redundant LLM calls
- Cache scraped content

**3. Job Queue**: Use Cloud Tasks or Pub/Sub
- Decouple submission from processing
- Better handling of high volume

**4. Model Fine-tuning**: Fine-tune for vividness assessment
- Collect training data from Adam's assessments
- Improve accuracy on specialized task

**5. Multi-region Deployment**: Deploy to multiple regions
- Reduce latency for global clients
- High availability

---

## Development Timeline (6 weeks)

### Week 1: Infrastructure Setup
- **Days 1-2**: Set up GCP project, Cloud Run services
- **Days 3-4**: Build basic Vue form + Node API skeleton
- **Days 5-7**: Python/FastAPI skeleton + Playwright scraping working

**Deliverable**: Can submit URL → scrape homepage → return text

### Week 2: Agent Framework
- **Days 8-10**: LangGraph pipeline structure
- **Days 11-12**: Audience identification agent working
- **Days 13-14**: First clarity agent working

**Deliverable**: Can identify audiences and assess clarity (basic)

### Week 3: Core Agents
- **Days 15-16**: Complete all clarity agents (parallel)
- **Days 17-18**: Technical level agent
- **Days 19-21**: Importance + voice agents

**Deliverable**: All evaluation agents working

### Week 4: Storytelling & Validation
- **Days 22-24**: Vividness/storytelling agent (hardest one)
- **Days 25-26**: Citation validation agent
- **Day 27-28**: Synthesis/editor agent

**Deliverable**: Complete agent pipeline produces draft report

### Week 5: Report Generation & Polish
- **Days 29-31**: PDF report generation
- **Days 32-33**: Email integration
- **Days 34-35**: Frontend polish (basic UI improvements)

**Deliverable**: End-to-end flow works (URL → report → email)

### Week 6: Testing & Refinement
- **Days 36-37**: Adam tests with real companies
- **Days 38-39**: Fix bugs, refine prompts based on feedback
- **Days 40-42**: Final polish, deploy to production

**Deliverable**: Production-ready MVP

---

## Post-MVP Roadmap

### Phase 2: Quality Improvements (Weeks 7-12)
- Collect evaluation data (Adam's manual assessments)
- A/B test different agent configurations
- Improve vividness agent (possibly fine-tune)
- Add more sophisticated report formatting

### Phase 3: Paid Client Features (Months 4-6)
- Multi-property analysis at scale
- Custom evaluation dimensions
- Competitive benchmarking
- Longitudinal tracking
- White-labeled reports
- API access

### Phase 4: Advanced Features (6+ months)
- Story generation agent
- Video/audio content analysis
- Multi-language support
- Real-time collaboration features

---

## Key Success Factors

### Technical
1. **Agent quality**: Agents must produce credible assessments
2. **No hallucination**: Citation validation is critical
3. **Performance**: < 10 min processing time
4. **Reliability**: 95%+ success rate

### Business
1. **Lead quality**: Reports drive sales calls
2. **Conversion rate**: X% of recipients engage
3. **Differentiation**: No competitor offers comparable tool
4. **Scalability**: Architecture supports paid version

### Development
1. **Iteration speed**: Fast experimentation on agents
2. **Observability**: LangSmith for debugging/improvement
3. **Evaluation**: A/B testing infrastructure from day one
4. **Code quality**: Clean, maintainable codebase for team

---

## Questions for Ongoing Refinement

1. **Agent prompts**: How do we continuously improve agent quality?
2. **Report format**: What's the ideal length/structure?
3. **Pricing model**: Free tier vs paid tier structure
4. **Conversion optimization**: What drives prospects to book calls?
5. **Scaling strategy**: When/how to build paid version?

---

## Getting Started

### Prerequisites
- Node.js 20.x
- Python 3.11+
- Docker
- GCP account with billing enabled
- Anthropic API key

### Initial Setup
```bash
# Clone repo (will be created)
git clone https://github.com/feedforward-ai/storytelling-eval.git
cd storytelling-eval

# Install dependencies
cd frontend && npm install
cd ../api && npm install
cd ../processor && pip install -r requirements.txt

# Set up GCP
gcloud init
gcloud config set project YOUR_PROJECT_ID

# Create GCS bucket
gsutil mb gs://storytelling-eval-submissions

# Set environment variables
# (copy .env.example to .env in each directory and fill in values)

# Run locally
# Terminal 1: cd frontend && npm run dev
# Terminal 2: cd api && npm run dev
# Terminal 3: cd processor && uvicorn src.main:app --reload

# Deploy to GCP
./scripts/deploy.sh  # (will be created)
```

---

## Contact & Support

- **Project Lead**: Adam Davidson (adam@feedforward-ai.com)
- **Technical Partner**: Ethan Mollick
- **Repository**: (TBD)
- **Documentation**: /docs folder

---

**Last Updated**: 2024-01-15
**Version**: 1.0 (MVP Specification)