# Corporate Storytelling Evaluation Tool

**AI-powered storytelling analysis for businesses** - Evaluate how effectively your company communicates its story to different audiences.

## 🎉 MVP Status: **COMPLETE** (v1.0.0-mvp)

All 107 tasks across 5 phases have been completed. The MVP is production-ready and includes:

- ✅ **Frontend**: Vue 3 SPA with form validation and error handling
- ✅ **Backend**: Express.js API with rate limiting, health checks, and GDPR compliance
- ✅ **AI Processing**: FastAPI service with multi-agent pipeline for content evaluation
- ✅ **Testing**: Comprehensive test suite (unit, integration, contract, e2e)
- ✅ **Deployment**: Dockerfiles, Cloud Run configs, and deployment scripts
- ✅ **Documentation**: API docs, quickstart guide, and deployment guide

## Quick Start

See the [Quickstart Guide](specs/001-story-eval-mvp/quickstart.md) for detailed setup instructions.

### Prerequisites

- Node.js 20.x
- Python 3.11+
- npm and pip
- Google Cloud Platform account (for deployment)

### Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev

# AI Processing
cd ai-processing
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload
```

### Validation

Run the quickstart validation script to verify your setup:

```bash
./scripts/validate-quickstart.sh
```

## Architecture

The system consists of three main services:

1. **Frontend** (Vue 3 + Vite): User interface for submitting content
2. **Backend** (Node.js + Express): API layer handling submissions, rate limiting, and orchestration
3. **AI Processing** (Python + FastAPI): Multi-agent pipeline for content evaluation

### System Flow

```
User Submission → Backend API → Cloud Tasks → AI Processing → Report Generation → Email Delivery
```

## Features

### User Story 1: Content Submission
- URL or file upload (PDF, PPTX, DOCX)
- Email confirmation with estimated completion time
- Rate limiting and validation
- GDPR-compliant data handling

### User Story 2: Evaluation & Reporting
- Multi-agent analysis pipeline:
  - Audience identification
  - Clarity assessment (per audience)
  - Technical level evaluation
  - Importance assessment
  - Voice & personality analysis
  - Vividness & storytelling evaluation
  - Citation validation
  - Synthesis & report generation
- 2-5 page PDF report with actionable recommendations
- Email delivery with PDF attachment

## Testing

### Run All Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# AI Processing
cd ai-processing && pytest
```

### Integration Tests

Comprehensive end-to-end tests verify the complete pipeline:

```bash
cd backend && npm test -- test_full_pipeline
```

## Deployment

### Prerequisites

1. Google Cloud SDK installed and configured
2. Docker installed and authenticated with GCR
3. GCP services enabled (Cloud Run, Cloud Build, Secret Manager, etc.)
4. Service accounts created
5. Secrets stored in Secret Manager

See [Deployment Guide](deploy/README.md) for detailed instructions.

### Quick Deploy

```bash
export GCP_PROJECT_ID=your-project-id
export GCP_REGION=us-central1
./scripts/deploy.sh all staging
```

### Cloud Build (CI/CD)

```bash
gcloud builds submit --config=deploy/cloudbuild.yaml .
```

## Documentation

- [Specification](specs/001-story-eval-mvp/spec.md) - Complete system specification
- [Quickstart Guide](specs/001-story-eval-mvp/quickstart.md) - Setup and development guide
- [Deployment Guide](deploy/README.md) - Production deployment instructions
- [Plain English Guide](README.plain.md) - System explanation for non-coders
- [Tasks](specs/001-story-eval-mvp/tasks.md) - Complete task list (all 107 tasks complete)

## Project Structure

```
story-ai/
├── frontend/          # Vue 3 frontend application
├── backend/           # Express.js API server
├── ai-processing/     # FastAPI AI processing service
├── deploy/            # Deployment configurations
├── scripts/           # Utility scripts
└── specs/             # Specifications and documentation
```

## Technology Stack

- **Frontend**: Vue 3, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js 20, Express.js, TypeScript
- **AI Processing**: Python 3.11, FastAPI, LangGraph, LangChain
- **Storage**: Google Cloud Storage, Firestore
- **Deployment**: Google Cloud Run, Docker
- **Email**: SendGrid
- **LLM**: Anthropic Claude (with flexibility for other models)

## Development Workflow

This project follows **Test-Driven Development (TDD)** - tests are written first and must pass before implementation.

See [CLAUDE.md](CLAUDE.md) for development guidelines and the [Constitution](.specify/memory/constitution.md) for core principles.

## Post-MVP Roadmap

### Phase 2: Quality Improvements
- Collect evaluation data from manual assessments
- A/B test different agent configurations
- Improve vividness agent (possibly fine-tune model)
- Refine prompts based on real-world feedback

### Phase 3: Paid Client Features
- Multi-property analysis at scale
- Custom evaluation dimensions per client
- Competitive benchmarking
- Longitudinal tracking
- White-labeled reports
- API access for third parties

### Phase 4: Advanced Features
- Story generation agent
- Video/audio content analysis
- Multi-language support
- Real-time collaboration features

## License

[Add your license here]

## Contributing

[Add contributing guidelines if applicable]
