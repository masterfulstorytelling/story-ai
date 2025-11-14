# Implementation Plan: Corporate Storytelling Evaluation Tool MVP

**Branch**: `001-story-eval-mvp` | **Date**: 2025-11-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-story-eval-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an AI-powered multi-agent system that evaluates corporate storytelling across multiple dimensions (clarity, voice, technical level, importance, vividness). The system accepts website URLs and file uploads, scrapes/parses content, runs a multi-agent analysis pipeline with citation validation, and generates brutally honest PDF reports delivered via email. The MVP serves as a lead generation tool for Feedforward AI's consulting services by demonstrating expertise through credible, evidence-based assessments.

**Technical Approach**: Three-tier architecture with Vue 3 frontend, Node.js/Express API gateway, and Python/FastAPI AI processing layer using LangGraph for agent orchestration. Content ingestion via Playwright scraping and file parsing. Asynchronous processing pipeline with Firestore state management and Cloud Storage for files. Report generation and email delivery via SendGrid. Fail-fast error handling with clear user notifications. Combined rate limiting (per-email and per-IP) to prevent abuse.

## Technical Context

**Language/Version**: 
- Frontend: JavaScript/TypeScript (Vue 3 Composition API)
- Backend API: Node.js 20.x
- AI Processing: Python 3.11+

**Primary Dependencies**: 
- Frontend: Vue 3, Vite, Tailwind CSS, Axios
- Backend: Express.js, Multer, Joi/Zod
- AI Layer: FastAPI, LangGraph, LangChain, Claude (Anthropic API), LangSmith
- Scraping/Parsing: Playwright, PyMuPDF/pdfplumber, python-pptx, python-docx
- Infrastructure: Google Cloud Platform (Cloud Run, Firestore, Cloud Storage), SendGrid

**Storage**: 
- Firestore: Evaluation requests, agent outputs, metadata, state management
- Cloud Storage: Uploaded files, scraped content, generated PDF reports
- In-memory: Agent pipeline state during processing

**Testing**: 
- Frontend: Vitest, Vue Test Utils
- Backend: Jest, Supertest
- AI Layer: pytest, contract tests for agent interfaces
- Integration: End-to-end tests for full pipeline

**Target Platform**: 
- Web application (browser-based frontend)
- Serverless containers (Cloud Run) for backend and AI processing
- Cross-platform (Linux containers)

**Project Type**: Web application (frontend + backend + AI processing layer)

**Performance Goals**: 
- Submission confirmation: < 30 seconds
- Analysis completion: < 10 minutes for typical website + deck
- Report generation: < 30 seconds
- Concurrent analyses: 10+ simultaneous
- Email delivery: < 5 minutes after report generation

**Constraints**: 
- 10-minute processing time limit per evaluation
- 50MB maximum file upload size
- Asynchronous processing (user doesn't wait)
- Zero hallucinated quotes (100% citation validation)
- GDPR-compliant data handling
- Rate limiting: 3 submissions per email per 24 hours, 5 submissions per IP per hour
- Fail-fast error handling for invalid submissions

**Scale/Scope**: 
- MVP: Free/low-cost diagnostic tool for lead generation
- Target: 100-500 evaluations per month initially
- Architecture must scale to paid client version (hundreds of properties)
- Single-tenant MVP, multi-tenant ready

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Single-Purpose Agents ✅
- **Requirement**: Each agent does ONE thing extremely well
- **Compliance**: Architecture uses 8 distinct agents (Audience Identification, Clarity per audience, Technical Level, Importance, Voice, Vividness, Citation Validation, Synthesis/Editor)
- **Validation**: Agent specifications clearly define single responsibilities

### Principle II: No Hallucination Tolerance ✅
- **Requirement**: Every quote validated against source material
- **Compliance**: Citation Validation Agent verifies all quotes before report generation
- **Validation**: FR-018, FR-019, FR-023 require citation validation

### Principle III: Audience-First Architecture ✅
- **Requirement**: All evaluation contextualized by specific audience
- **Compliance**: Audience Identification Agent runs first; Clarity, Technical, Importance agents run per audience
- **Validation**: FR-012, FR-013, FR-014, FR-015 require audience-specific evaluation

### Principle IV: Strongly Opinionated Output ✅
- **Requirement**: Direct, unsparing assessments backed by examples
- **Compliance**: Synthesis/Editor Agent generates brutally honest reports with citations
- **Validation**: FR-020, FR-021 require direct assessments with quoted examples

### Principle V: Rapid Iteration on Agent Design ✅
- **Requirement**: Infrastructure supports fast experimentation
- **Compliance**: Modular agent architecture, LangGraph enables agent swapping, evaluation/testing infrastructure
- **Validation**: Architecture designed for A/B testing agent configurations

### Principle VI: Modular Development and Architecture ✅
- **Requirement**: Features easily separable with clear boundaries
- **Compliance**: Three-tier architecture (frontend, API, AI layer) with well-defined interfaces
- **Validation**: Each layer can be developed, tested, and deployed independently

### Principle VII: Test-Driven Development ✅
- **Requirement**: Comprehensive test suite at checkpoints, tests before implementation
- **Compliance**: Test strategy includes unit, integration, and contract tests for agents
- **Validation**: TDD workflow enforced in development process

**Gate Status**: ✅ PASS - All principles satisfied by architecture design

### Post-Design Constitution Check (After Phase 1)

**Re-evaluation after data model and contracts design**:

- **Principle I (Single-Purpose Agents)**: ✅ Confirmed - Agent interfaces define single responsibilities
- **Principle II (No Hallucination Tolerance)**: ✅ Confirmed - Citation validation agent contract enforces validation
- **Principle III (Audience-First Architecture)**: ✅ Confirmed - Data model includes Audience entity, agent contracts require audience context
- **Principle IV (Strongly Opinionated Output)**: ✅ Confirmed - Synthesis agent contract includes direct assessment requirements
- **Principle V (Rapid Iteration)**: ✅ Confirmed - Modular agent architecture with clear interfaces enables swapping
- **Principle VI (Modular Architecture)**: ✅ Confirmed - Three-tier structure with well-defined API contracts
- **Principle VII (TDD)**: ✅ Confirmed - Contract tests defined for all agent interfaces

**Post-Design Gate Status**: ✅ PASS - Design maintains compliance with all principles

## Project Structure

### Documentation (this feature)

```text
specs/001-story-eval-mvp/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api.yaml         # REST API contract
│   └── agent-interfaces.yaml  # Agent input/output contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── EvaluationForm.vue
│   │   ├── ConfirmationMessage.vue
│   │   └── ErrorDisplay.vue
│   ├── pages/
│   │   └── SubmitEvaluation.vue
│   ├── services/
│   │   └── api.ts
│   └── main.ts
├── tests/
│   ├── unit/
│   └── integration/
└── package.json

backend/
├── src/
│   ├── models/
│   │   └── EvaluationRequest.ts
│   ├── services/
│   │   ├── submissionService.ts
│   │   ├── emailService.ts
│   │   ├── storageService.ts
│   │   └── rateLimitService.ts
│   └── api/
│       ├── routes/
│       │   └── evaluationRoutes.ts
│       └── middleware/
│           ├── validation.ts
│           └── rateLimiter.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── contract/
└── package.json

ai-processing/
├── src/
│   ├── agents/
│   │   ├── audience_identification.py
│   │   ├── clarity_agent.py
│   │   ├── technical_level_agent.py
│   │   ├── importance_agent.py
│   │   ├── voice_agent.py
│   │   ├── vividness_agent.py
│   │   ├── citation_validation_agent.py
│   │   └── synthesis_agent.py
│   ├── ingestion/
│   │   ├── scraper.py
│   │   └── file_parser.py
│   ├── orchestration/
│   │   └── pipeline.py
│   ├── report/
│   │   └── generator.py
│   └── main.py
├── tests/
│   ├── unit/
│   ├── integration/
│   └── contract/
└── requirements.txt
```

**Structure Decision**: Three-tier web application architecture chosen to support:
1. **Frontend**: Vue 3 SPA for user submission form
2. **Backend API**: Node.js/Express for request handling, file uploads, email delivery, rate limiting
3. **AI Processing**: Python/FastAPI for multi-agent pipeline (best ecosystem for LangGraph/LangChain)

This structure enables:
- Independent development and deployment of each layer
- Clear separation of concerns (UI, API, AI processing)
- Modular agent architecture within AI layer
- Scalability (each layer can scale independently on Cloud Run)
- Rate limiting enforcement at API layer
- Fail-fast validation at API layer before processing

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - architecture aligns with all constitution principles.
