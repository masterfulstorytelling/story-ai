# Tasks: Corporate Storytelling Evaluation Tool MVP

**Input**: Design documents from `/specs/001-story-eval-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD is NON-NEGOTIABLE per constitution. All test tasks must be completed before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`, `ai-processing/src/`
- Paths follow three-tier architecture from plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project root directory structure (frontend/, backend/, ai-processing/)
- [X] T002 [P] Initialize frontend project with Vue 3, Vite, Tailwind CSS in frontend/
- [X] T003 [P] Initialize backend project with Node.js 20.x, Express.js in backend/
- [X] T004 [P] Initialize AI processing project with Python 3.11+, FastAPI in ai-processing/
- [X] T005 [P] Configure ESLint and Prettier for frontend in frontend/.eslintrc.js
- [X] T006 [P] Configure ESLint and Prettier for backend in backend/.eslintrc.js
- [X] T007 [P] Configure Black and flake8 for AI processing in ai-processing/pyproject.toml
- [X] T008 [P] Setup TypeScript configuration for frontend in frontend/tsconfig.json
- [X] T009 [P] Setup TypeScript configuration for backend in backend/tsconfig.json
- [X] T010 [P] Create .gitignore files for each project (frontend/.gitignore, backend/.gitignore, ai-processing/.gitignore)
- [X] T011 [P] Setup environment variable management (.env.example files for each project)
- [X] T012 [P] Configure package.json scripts for frontend in frontend/package.json
- [X] T013 [P] Configure package.json scripts for backend in backend/package.json
- [X] T014 [P] Create requirements.txt for AI processing in ai-processing/requirements.txt

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T015 Setup Firestore database connection in backend/src/services/firestoreService.ts
- [X] T016 [P] Setup Cloud Storage client in backend/src/services/storageService.ts
- [X] T017 [P] Setup SendGrid email client in backend/src/services/emailService.ts
- [X] T018 [P] Create base error handling middleware in backend/src/api/middleware/errorHandler.ts
- [X] T019 [P] Create base logging infrastructure in backend/src/utils/logger.ts
- [X] T020 [P] Create base logging infrastructure in ai-processing/src/utils/logger.py
- [X] T021 [P] Setup Firestore collections structure (evaluation_requests, scraped_content, parsed_content, audiences, evaluations, reports) - Collections defined in code, will be created automatically on first use
- [X] T022 [P] Create Cloud Storage buckets (storyai-uploads, storyai-reports, storyai-scraped) - Buckets created via gcloud
- [X] T023 [P] Setup environment configuration validation in backend/src/config/env.ts
- [X] T024 [P] Setup environment configuration validation in ai-processing/src/config/env.py
- [X] T025 [P] Create base API route structure in backend/src/api/routes/index.ts
- [X] T026 [P] Create base FastAPI app structure in ai-processing/src/main.py
- [X] T027 [P] Setup Cloud Tasks client for async job queuing in backend/src/services/taskService.ts
- [X] T028 [P] Create base Pydantic models for agent interfaces in ai-processing/src/models/base.py
- [X] T029 [P] Setup LangSmith for observability in ai-processing/src/config/langsmith.py

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Submit Content for Evaluation (Priority: P1) 🎯 MVP

**Goal**: Business executive submits website URL or files via web form, receives immediate confirmation and email notification. System validates inputs, enforces rate limits, stores submission, and queues processing.

**Independent Test**: Submit URL or file through web form, verify: (1) submission accepted, (2) validation errors shown for invalid inputs, (3) confirmation message displayed, (4) email confirmation received, (5) optional target audience captured. Can be tested end-to-end without User Story 2.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T030 [P] [US1] Contract test for POST /evaluations endpoint in backend/tests/contract/test_evaluation_api.test.ts
- [ ] T031 [P] [US1] Unit test for EvaluationRequest model validation in backend/tests/unit/models/evaluationRequest.test.ts
- [ ] T032 [P] [US1] Unit test for rate limiting service in backend/tests/unit/services/rateLimitService.test.ts
- [ ] T033 [P] [US1] Unit test for validation middleware in backend/tests/unit/middleware/validation.test.ts
- [ ] T034 [P] [US1] Integration test for submission flow in backend/tests/integration/test_submission_flow.test.ts
- [ ] T035 [P] [US1] Unit test for EvaluationForm component in frontend/tests/unit/components/EvaluationForm.test.ts
- [ ] T036 [P] [US1] E2E test for form submission in frontend/tests/e2e/submit_evaluation.spec.ts

### Implementation for User Story 1

- [ ] T037 [P] [US1] Create EvaluationRequest model in backend/src/models/EvaluationRequest.ts
- [ ] T038 [P] [US1] Create FileReference model in backend/src/models/FileReference.ts
- [ ] T039 [P] [US1] Implement rate limiting service in backend/src/services/rateLimitService.ts (3 per email/24h, 5 per IP/hour)
- [ ] T040 [P] [US1] Implement validation middleware in backend/src/api/middleware/validation.ts (URL, email, file format/size)
- [ ] T041 [P] [US1] Implement rate limiter middleware in backend/src/api/middleware/rateLimiter.ts
- [ ] T042 [US1] Implement submission service in backend/src/services/submissionService.ts (depends on T037, T038, T039)
- [ ] T043 [US1] Implement file upload handler in backend/src/api/middleware/fileUpload.ts (Multer, 50MB limit)
- [ ] T044 [US1] Implement POST /evaluations endpoint in backend/src/api/routes/evaluationRoutes.ts (depends on T042, T043, T040, T041)
- [ ] T045 [US1] Implement email confirmation service in backend/src/services/emailService.ts (SendGrid, estimated wait time)
- [ ] T046 [US1] Create EvaluationForm component in frontend/src/components/EvaluationForm.vue
- [ ] T047 [US1] Create ConfirmationMessage component in frontend/src/components/ConfirmationMessage.vue
- [ ] T048 [US1] Create ErrorDisplay component in frontend/src/components/ErrorDisplay.vue
- [ ] T049 [US1] Implement API client service in frontend/src/services/api.ts
- [ ] T050 [US1] Create SubmitEvaluation page in frontend/src/pages/SubmitEvaluation.vue (depends on T046, T047, T048, T049)
- [ ] T051 [US1] Setup Vue router and main app entry in frontend/src/main.ts (depends on T050)
- [ ] T052 [US1] Add form validation logic in frontend/src/components/EvaluationForm.vue (client-side validation)
- [ ] T053 [US1] Integrate Cloud Tasks for async processing queue in backend/src/services/taskService.ts (depends on T044)
- [ ] T108 [US1] Verify all User Story 1 tests pass before proceeding to User Story 2 (TDD checkpoint: run all tests T030-T036, ensure 100% pass rate)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can submit content and receive confirmation.

---

## Phase 4: User Story 2 - Receive Evaluation Report (Priority: P1)

**Goal**: System processes submitted content through multi-agent pipeline, generates PDF report with brutally honest assessment, validates all citations, and delivers report via email. Report addresses user's business crisis with quantified evidence.

**Independent Test**: Submit content, wait for processing, verify: (1) email with PDF received, (2) PDF contains assessments with citations, (3) report addresses audience-specific concerns, (4) all citations validated, (5) report is 2-5 pages. Can be tested independently once User Story 1 is complete.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T054 [P] [US2] Contract test for agent interfaces in ai-processing/tests/contract/test_agent_interfaces.py
- [ ] T055 [P] [US2] Unit test for scraper in ai-processing/tests/unit/ingestion/test_scraper.py
- [ ] T056 [P] [US2] Unit test for file parser in ai-processing/tests/unit/ingestion/test_file_parser.py
- [ ] T057 [P] [US2] Unit test for citation validation in ai-processing/tests/unit/agents/test_citation_validation.py
- [ ] T058 [P] [US2] Unit test for report generator in ai-processing/tests/unit/report/test_generator.py
- [ ] T059 [P] [US2] Integration test for agent pipeline in ai-processing/tests/integration/test_pipeline.py
- [ ] T060 [P] [US2] Integration test for full processing flow in backend/tests/integration/test_processing_flow.test.ts

### Implementation for User Story 2

#### Content Ingestion

- [ ] T061 [P] [US2] Create ScrapedContent model in ai-processing/src/models/scraped_content.py
- [ ] T062 [P] [US2] Create ParsedContent model in ai-processing/src/models/parsed_content.py
- [ ] T063 [P] [US2] Create Section model in ai-processing/src/models/section.py
- [ ] T064 [P] [US2] Create Page model in ai-processing/src/models/page.py
- [ ] T065 [US2] Implement web scraper in ai-processing/src/ingestion/scraper.py (Playwright, homepage + About page, robots.txt respect)
- [ ] T066 [US2] Implement file parser for PDF in ai-processing/src/ingestion/file_parser.py (PyMuPDF/pdfplumber)
- [ ] T067 [US2] Implement file parser for PPTX in ai-processing/src/ingestion/file_parser.py (python-pptx)
- [ ] T068 [US2] Implement file parser for DOCX in ai-processing/src/ingestion/file_parser.py (python-docx)
- [ ] T069 [US2] Create content ingestion service in ai-processing/src/ingestion/ingestion_service.py (depends on T065, T066, T067, T068)

#### Agent Models

- [ ] T070 [P] [US2] Create Audience model in ai-processing/src/models/audience.py
- [ ] T071 [P] [US2] Create EvaluationAssessment model in ai-processing/src/models/evaluation_assessment.py
- [ ] T072 [P] [US2] Create Citation model in ai-processing/src/models/citation.py
- [ ] T073 [P] [US2] Create EvaluationReport model in ai-processing/src/models/evaluation_report.py

#### AI Agents

- [ ] T074 [US2] Implement Audience Identification Agent in ai-processing/src/agents/audience_identification.py (Claude, incorporates user-provided audience)
- [ ] T075 [US2] Implement Clarity Agent in ai-processing/src/agents/clarity_agent.py (per audience, assesses what/why/who)
- [ ] T076 [US2] Implement Technical Level Agent in ai-processing/src/agents/technical_level_agent.py (per audience, too technical/vague/appropriate)
- [ ] T077 [US2] Implement Importance Agent in ai-processing/src/agents/importance_agent.py (per audience, why should they care)
- [ ] T078 [US2] Implement Voice Agent in ai-processing/src/agents/voice_agent.py (distinct voice, personality, values, consistency)
- [ ] T079 [US2] Implement Vividness Agent in ai-processing/src/agents/vividness_agent.py (vivid vs generic, memorability, storytelling)
- [ ] T080 [US2] Implement Citation Validation Agent in ai-processing/src/agents/citation_validation_agent.py (exact → fuzzy → semantic validation)
- [ ] T081 [US2] Implement Synthesis/Editor Agent in ai-processing/src/agents/synthesis_agent.py (generates brutally honest report with validated citations)

#### Orchestration

- [ ] T082 [US2] Create LangGraph state model in ai-processing/src/orchestration/state.py (content, audiences, agent outputs, citations)
- [ ] T083 [US2] Implement agent pipeline orchestration in ai-processing/src/orchestration/pipeline.py (LangGraph StateGraph, parallel execution)
- [ ] T084 [US2] Create processing service in ai-processing/src/services/processing_service.py (orchestrates ingestion → agents → report)

#### Report Generation

- [ ] T085 [US2] Implement PDF report generator in ai-processing/src/report/generator.py (WeasyPrint, 2-5 pages, all sections)
- [ ] T086 [US2] Create report template in ai-processing/src/report/templates/report_template.html (executive summary, audience analysis, assessments, recommendations)

#### Backend Integration

- [ ] T087 [US2] Create Cloud Tasks handler for processing in backend/src/api/handlers/processEvaluation.ts
- [ ] T088 [US2] Implement AI processing API client in backend/src/services/aiProcessingService.ts (calls FastAPI service)
- [ ] T089 [US2] Implement report delivery service in backend/src/services/reportDeliveryService.ts (email with PDF attachment)
- [ ] T090 [US2] Create GET /evaluations/:id endpoint in backend/src/api/routes/evaluationRoutes.ts (status check)
- [ ] T091 [US2] Integrate processing pipeline in backend/src/services/submissionService.ts (queue Cloud Task after submission)

#### Error Handling

- [ ] T092 [US2] Implement error handling for critical failures in ai-processing/src/orchestration/pipeline.py (fail fast, email user)
- [ ] T093 [US2] Implement error handling for non-critical agent failures in ai-processing/src/orchestration/pipeline.py (continue with partial results)
- [ ] T094 [US2] Implement processing timeout handling in ai-processing/src/services/processing_service.py (10-minute limit)
- [ ] T109 [US2] Verify all User Story 2 tests pass before proceeding to Polish phase (TDD checkpoint: run all tests T054-T060, ensure 100% pass rate)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Full end-to-end flow: submit → process → receive report.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T095 [P] Add comprehensive error logging across all services
- [ ] T096 [P] Implement monitoring and alerting (Cloud Logging, error tracking)
- [ ] T097 [P] Add performance metrics collection (processing time, success rates)
- [ ] T098 [P] Create API documentation (OpenAPI spec updates, README)
- [ ] T099 [P] Add data retention job (delete old files per data-model.md retention policy)
- [ ] T100 [P] Implement GDPR data deletion endpoint in backend/src/api/routes/dataDeletion.ts
- [ ] T101 [P] Add health check endpoints for all services
- [ ] T102 [P] Code cleanup and refactoring (remove TODOs, improve error messages)
- [ ] T103 [P] Performance optimization (caching, parallel processing improvements)
- [ ] T104 [P] Security hardening (input sanitization, rate limit tuning)
- [ ] T105 [P] Run quickstart.md validation (verify all setup steps work)
- [ ] T106 [P] Add comprehensive integration tests for full pipeline
- [ ] T107 [P] Create deployment scripts and Cloud Run configurations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (Phase 3): Can start after Foundational
  - User Story 2 (Phase 4): Depends on User Story 1 completion (needs submission endpoint)
- **Polish (Phase 5)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on User Story 1 completion - Needs submission endpoint and data models from US1

### Within Each User Story

- Tests (TDD) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints/agents
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, User Story 1 can start
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Agent implementations marked [P] can run in parallel (different agents, different files)
- Content ingestion tasks (scraper, parsers) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Contract test for POST /evaluations endpoint in backend/tests/contract/test_evaluation_api.test.ts"
Task: "Unit test for EvaluationRequest model validation in backend/tests/unit/models/evaluationRequest.test.ts"
Task: "Unit test for rate limiting service in backend/tests/unit/services/rateLimitService.test.ts"
Task: "Unit test for validation middleware in backend/tests/unit/middleware/validation.test.ts"
Task: "Unit test for EvaluationForm component in frontend/tests/unit/components/EvaluationForm.test.ts"

# Launch all models for User Story 1 together:
Task: "Create EvaluationRequest model in backend/src/models/EvaluationRequest.ts"
Task: "Create FileReference model in backend/src/models/FileReference.ts"

# Launch middleware implementations together:
Task: "Implement validation middleware in backend/src/api/middleware/validation.ts"
Task: "Implement rate limiter middleware in backend/src/api/middleware/rateLimiter.ts"
Task: "Implement file upload handler in backend/src/api/middleware/fileUpload.ts"
```

---

## Parallel Example: User Story 2

```bash
# Launch all agent implementations together (different files, no dependencies):
Task: "Implement Audience Identification Agent in ai-processing/src/agents/audience_identification.py"
Task: "Implement Clarity Agent in ai-processing/src/agents/clarity_agent.py"
Task: "Implement Technical Level Agent in ai-processing/src/agents/technical_level_agent.py"
Task: "Implement Importance Agent in ai-processing/src/agents/importance_agent.py"
Task: "Implement Voice Agent in ai-processing/src/agents/voice_agent.py"
Task: "Implement Vividness Agent in ai-processing/src/agents/vividness_agent.py"
Task: "Implement Citation Validation Agent in ai-processing/src/agents/citation_validation_agent.py"
Task: "Implement Synthesis/Editor Agent in ai-processing/src/agents/synthesis_agent.py"

# Launch content ingestion implementations together:
Task: "Implement file parser for PDF in ai-processing/src/ingestion/file_parser.py"
Task: "Implement file parser for PPTX in ai-processing/src/ingestion/file_parser.py"
Task: "Implement file parser for DOCX in ai-processing/src/ingestion/file_parser.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready (users can submit, receive confirmation)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - submission works!)
3. Add User Story 2 → Test independently → Deploy/Demo (Full MVP - reports delivered!)
4. Add Polish phase → Deploy/Demo (Production-ready)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (frontend + backend submission)
   - Developer B: User Story 2 preparation (agent research, test setup)
3. Once User Story 1 is complete:
   - Developer A: User Story 2 (orchestration, report generation)
   - Developer B: User Story 2 (agents implementation - can work in parallel)
   - Developer C: User Story 2 (content ingestion - can work in parallel)
4. Stories complete and integrate

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- TDD workflow: Write tests first, ensure they FAIL, then implement
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All agent implementations can be developed in parallel (different files)
- Citation validation is critical - must pass before report generation
- Rate limiting must be enforced at API layer before processing

