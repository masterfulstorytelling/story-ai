# Research: Corporate Storytelling Evaluation Tool MVP

**Date**: 2025-11-13  
**Feature**: Corporate Storytelling Evaluation Tool MVP  
**Phase**: 0 - Outline & Research

## Research Areas

### 1. LangGraph Agent Orchestration Patterns

**Research Question**: How to structure multi-agent pipeline with LangGraph for audience-first architecture?

**Findings**:
- LangGraph supports state machines with conditional edges
- Parallel agent execution via fan-out/fan-in patterns
- State management through shared state object
- Best practice: Use typed state classes for type safety

**Decision**: Use LangGraph StateGraph with:
- Sequential flow: Audience Identification → Parallel Clarity Agents → Parallel Technical/Importance → Voice/Vividness (parallel) → Citation Validation → Synthesis
- State object containing: content, audiences, agent outputs, validated citations
- Conditional edges based on audience count for parallel clarity agents

**Rationale**: LangGraph provides built-in support for parallel execution and state management, essential for audience-first architecture where multiple clarity agents run in parallel.

**Alternatives Considered**:
- Manual orchestration with asyncio: More control but more complexity
- LangChain SequentialChain: Doesn't support parallel execution well
- Custom workflow engine: Overkill for MVP

---

### 2. Citation Validation Strategy

**Research Question**: How to efficiently validate all quotes against source material to prevent hallucinations?

**Findings**:
- Exact string matching too strict (whitespace, punctuation variations)
- Fuzzy matching (Levenshtein distance) better for near-exact quotes
- Embedding-based similarity for semantic validation
- Best practice: Multi-stage validation (exact → fuzzy → semantic)

**Decision**: Three-stage validation:
1. Exact match search in source text
2. Fuzzy match (85%+ similarity) if exact fails
3. Semantic similarity check (embedding cosine similarity >0.9) as fallback
4. Flag and remove any quote that fails all three stages

**Rationale**: Multi-stage approach balances accuracy (prevent hallucinations) with flexibility (handle minor variations). Better to remove uncertain quotes than fabricate.

**Alternatives Considered**:
- Exact match only: Too strict, would reject valid paraphrases
- Semantic only: Risk of false positives (similar but not same quote)
- LLM-based validation: Too slow and expensive for MVP

---

### 3. Asynchronous Processing Architecture

**Research Question**: How to handle long-running evaluation pipeline (10 minutes) with user submission?

**Findings**:
- Cloud Run supports long-running requests (up to 60 minutes)
- Better pattern: Fire-and-forget with background job queue
- Firestore can trigger Cloud Functions for async processing
- Alternative: Cloud Tasks for job queuing

**Decision**: Use Cloud Tasks for job queuing:
- Backend API receives submission, creates Firestore document, enqueues Cloud Task
- Cloud Task triggers AI processing service
- Processing service updates Firestore with status
- Separate Cloud Function monitors completion and sends email

**Rationale**: Decouples user-facing API from long-running processing. Enables retry logic, status tracking, and better error handling.

**Alternatives Considered**:
- Synchronous processing: User waits 10 minutes (poor UX)
- Cloud Functions directly: Limited execution time (9 minutes max)
- Pub/Sub: More complex setup for MVP

---

### 4. PDF Report Generation

**Research Question**: How to generate professional PDF reports with citations and formatting?

**Findings**:
- ReportLab: Python library for PDF generation, good control
- WeasyPrint: HTML/CSS to PDF, easier styling
- pdfkit/wkhtmltopdf: HTML to PDF, good for templates
- Best practice: Template-based approach (HTML → PDF)

**Decision**: Use WeasyPrint with HTML templates:
- Generate report content as structured HTML
- Use CSS for styling and layout
- Convert HTML to PDF via WeasyPrint
- Embed citations as footnotes or inline references

**Rationale**: HTML/CSS approach allows for easier styling, template reuse, and future web-based report viewing. WeasyPrint handles complex layouts well.

**Alternatives Considered**:
- ReportLab: More programmatic control but harder to style
- LaTeX: Overkill for MVP, harder to iterate
- Markdown → PDF: Limited formatting control

---

### 5. File Upload and Storage Strategy

**Research Question**: How to handle file uploads (PDF, PPTX, DOCX) with size limits and parsing?

**Findings**:
- Multer for Express.js handles multipart/form-data
- Cloud Storage for persistent file storage
- File parsing libraries: PyMuPDF (PDF), python-pptx (PPTX), python-docx (DOCX)
- Best practice: Validate file type and size before upload

**Decision**: 
- Frontend: Validate file type and size (50MB max) before upload
- Backend: Re-validate, store in Cloud Storage with unique path
- AI Processing: Download from Cloud Storage, parse, extract text
- Store parsed text in Firestore for agent access

**Rationale**: Separation of concerns - API handles upload/storage, AI layer handles parsing. Cloud Storage provides durable storage and easy access from Cloud Run.

**Alternatives Considered**:
- Store files in Firestore: Size limits too restrictive
- Parse in backend: Better to keep parsing in AI layer where parsing libraries are
- Direct upload to Cloud Storage from frontend: Requires signed URLs, more complex

---

### 6. Web Scraping Best Practices

**Research Question**: How to reliably scrape homepage and About page content?

**Findings**:
- Playwright handles JavaScript-rendered content better than requests/BeautifulSoup
- Best practice: Wait for content to load, extract main text content
- Handle robots.txt and rate limiting
- Extract structured sections (hero, about, features)

**Decision**: Use Playwright with:
- Wait for page load and main content
- Extract text from semantic HTML (main, article, section tags)
- Fallback to body text if structure unclear
- Store both HTML and extracted text
- Handle errors gracefully (404, timeout, authentication required)

**Rationale**: Playwright ensures we capture JavaScript-rendered content. Structured extraction helps agents understand content organization.

**Alternatives Considered**:
- requests + BeautifulSoup: Faster but misses JavaScript content
- Selenium: More heavyweight than Playwright
- Pre-rendering service: Additional cost and complexity

---

### 7. Agent Output Schema Design

**Research Question**: How to structure agent outputs for downstream consumption?

**Findings**:
- JSON Schema for validation
- Pydantic models for Python type safety
- Consistent structure across all agents
- Include metadata (timestamp, agent version, confidence)

**Decision**: Use Pydantic models with JSON Schema:
- Base AgentOutput class with common fields
- Specific output classes per agent (ClarityOutput, TechnicalLevelOutput, etc.)
- All outputs include: agent_name, timestamp, audience_id (if applicable), assessment, citations
- Citations always include: quote, source, location, validation_status

**Rationale**: Type-safe models prevent errors, enable validation, and make agent outputs predictable. JSON Schema allows validation at API boundaries.

**Alternatives Considered**:
- Plain dictionaries: No type safety, harder to validate
- Protobuf: Overkill for MVP, adds serialization complexity
- Custom classes: Pydantic provides validation and serialization

---

### 8. Error Handling and User Notification

**Research Question**: How to handle processing failures and notify users?

**Findings**:
- Graceful degradation: Partial results if some agents fail
- User-friendly error messages via email
- Retry logic for transient failures
- Logging and monitoring for debugging

**Decision**: 
- Try-catch around each agent execution
- If critical agent fails (Audience Identification, Citation Validation), fail entire evaluation
- If non-critical agent fails, continue with partial results, note in report
- Email user with error details and next steps
- Log all errors to Cloud Logging for monitoring

**Rationale**: Balance between robustness (partial results better than nothing) and quality (critical failures must stop processing).

**Alternatives Considered**:
- Fail fast on any error: Too strict, poor user experience
- Always continue: Risk of low-quality reports
- Silent failures: Users don't know what went wrong

---

## Summary

All technical decisions resolved. No NEEDS CLARIFICATION items remain. Architecture supports:
- Multi-agent orchestration with parallel execution
- Citation validation to prevent hallucinations
- Asynchronous processing with job queuing
- Professional PDF report generation
- File upload and parsing
- Web scraping with JavaScript support
- Type-safe agent outputs
- Robust error handling

Ready to proceed to Phase 1: Design & Contracts.

