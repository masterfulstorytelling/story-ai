# Feature Specification: Corporate Storytelling Evaluation Tool MVP

**Feature Branch**: `001-story-eval-mvp`  
**Created**: 2025-11-13  
**Status**: Draft  
**Input**: User description: "Corporate Storytelling Evaluation Tool - An AI-powered multi-agent system that evaluates corporate storytelling across multiple dimensions. The tool analyzes websites, decks, and marketing materials to provide companies with a brutally honest assessment of their narrative quality—backed by specific examples and citations. MVP includes: web form for URL input + file upload, homepage + About page scraping, multi-agent analysis pipeline (clarity, voice, storytelling dimensions), citation validation, 2-5 page PDF report generation, email delivery, and basic UI."

## Clarifications

### Session 2025-11-13

- Q: How should the system handle edge cases and processing failures? → A: Fail fast with clear user notification - Reject invalid submissions immediately (invalid URL, unsupported file format, inaccessible URL) and email user with specific error and next steps
- Q: Should the system implement rate limiting or abuse prevention? → A: Combined limits - Both per-email (3 submissions per email address per 24 hours) and per-IP (5 submissions per IP address per hour) with stricter limits

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit Content for Evaluation (Priority: P1)

A business executive (CRO, CHRO, People Leader, or similar) in an acute business crisis visits the tool's website and submits their company's website URL or uploads marketing materials (decks, documents) to receive an evaluation of their corporate storytelling. They may optionally specify a target audience they're concerned about (e.g., "CFOs at Fortune 500 companies"). They provide their email address and receive immediate confirmation that their request has been received and processing has begun.

**Why this priority**: This is the entry point for all value delivery. Without the ability to submit content, no evaluations can be performed. This story establishes the user's first interaction with the tool and sets expectations. The optional audience field allows users to address specific pain points (e.g., "Can a CFO understand this?").

**Independent Test**: Can be fully tested by submitting a URL or file through the web form and verifying that: (1) the submission is accepted, (2) validation errors are shown for invalid inputs, (3) a confirmation message is displayed, (4) the user receives an email confirmation, and (5) optional target audience input is captured. This delivers value by providing immediate feedback and setting expectations for report delivery.

**Acceptance Scenarios**:

1. **Given** a CRO visits the evaluation tool website, **When** they enter a valid website URL, optionally specify "CFOs at Fortune 500 companies" as target audience, provide their email address and submit, **Then** they receive an on-screen confirmation message and an email confirming their request has been received
2. **Given** a CHRO visits the evaluation tool website, **When** they upload a PDF deck or document file, optionally specify "talented engineers considering job offers" as target audience, provide their email address and submit, **Then** they receive an on-screen confirmation message and an email confirming their request has been received
3. **Given** a user attempts to submit the form, **When** they provide an invalid URL format or no email address, **Then** they see clear validation error messages indicating what needs to be corrected
4. **Given** a user submits both a URL and file upload, **When** the form is submitted, **Then** the system accepts both inputs and processes them together
5. **Given** a user submits without specifying a target audience, **When** the form is submitted, **Then** the system identifies audiences from content analysis and evaluates for all identified audiences

---

### User Story 2 - Receive Evaluation Report (Priority: P1)

After submitting content for evaluation, a user receives a comprehensive PDF report via email that contains a brutally honest assessment of their corporate storytelling across multiple dimensions (clarity, voice, technical level, importance, vividness), with all claims backed by specific quoted examples and citations from their source material. The report addresses their specific business crisis (e.g., "Can a CFO understand this?" for a CRO losing deals at budget approval) and provides quantified evidence of the problem.

**Why this priority**: This story delivers the core value proposition. The evaluation report is what converts prospects into leads by demonstrating Feedforward AI's expertise and creating awareness of storytelling gaps. Without this, the tool provides no value. The report must name their specific crisis, show evidence, quantify the problem, prove complexity, and offer hope.

**Independent Test**: Can be fully tested by: (1) submitting content through the system, (2) waiting for processing to complete, (3) verifying receipt of email with PDF report attachment, (4) opening the PDF and verifying it contains assessments with citations, (5) verifying the report addresses audience-specific concerns (e.g., technical level mismatch between audiences). This delivers value by providing actionable insights that prospects can use and that demonstrate expertise.

**Acceptance Scenarios**:

1. **Given** a CRO has submitted content for evaluation with target audience "CFOs", **When** the system completes processing, **Then** the user receives a PDF report that explicitly tests "Can a CFO understand this?" and shows technical level mismatch between technical buyers and budget approvers
2. **Given** a user has submitted a website URL for evaluation, **When** the system completes processing (scraping, analysis, report generation), **Then** the user receives an email with a PDF report attached containing 2-5 pages of evaluation
3. **Given** a user has submitted files for evaluation, **When** the system completes processing (parsing, analysis, report generation), **Then** the user receives an email with a PDF report attached containing 2-5 pages of evaluation
4. **Given** a user receives an evaluation report, **When** they open the PDF, **Then** they see: (a) executive summary naming their specific business problem, (b) audience analysis showing who content is written for, (c) clarity assessment per audience, (d) technical appropriateness per audience, (e) importance/value assessment per audience, (f) voice and personality assessment, (g) vividness/storytelling assessment, (h) specific recommendations, all with quoted examples and citations
5. **Given** an evaluation report is generated, **When** the system validates citations, **Then** all quotes and examples in the report are verified against the source material with no fabricated content
6. **Given** an evaluation report is generated, **When** the system cannot find examples to support a claim, **Then** the report states "we found no examples" rather than fabricating quotes
7. **Given** a user receives an evaluation report, **When** they read the executive summary, **Then** they see quantified scores (e.g., "CFO clarity score: 30/100") that provide evidence of the problem

---

### Edge Cases

- **Invalid or inaccessible URL (404, timeout, requires authentication)**: System MUST reject submission immediately, display validation error message on form, and NOT create evaluation request. Error message MUST specify the issue (e.g., "URL not accessible - please check the URL and try again").
- **Unsupported file format**: System MUST reject submission immediately, display validation error message on form indicating supported formats (PDF, PPTX, DOCX), and NOT create evaluation request.
- **File upload exceeds maximum size limits (50MB)**: System MUST reject submission immediately, display validation error message on form indicating maximum file size, and NOT create evaluation request.
- **URL redirects to different domain**: System MUST follow redirect and scrape the final destination URL. If redirect chain exceeds 5 redirects or redirects to non-HTTP/HTTPS, reject submission with error message.
- **Website has no homepage or About page**: System MUST proceed with available content (homepage only if About page missing, or About page only if homepage missing). If both pages are missing or inaccessible, reject submission with error message indicating insufficient content for evaluation.
- **Scraped content is insufficient for meaningful evaluation**: If scraped content is less than 200 words total, System MUST reject submission and email user with error message: "Insufficient content found on website. Please ensure your homepage and About page contain substantial text content, or upload files instead."
- **Email delivery fails (bounce, invalid address, spam filter)**: System MUST log delivery failure, mark report email_delivery_status as "failed", and store error details. System MUST NOT retry email delivery automatically. Admin notification recommended for manual follow-up.
- **Processing takes longer than expected (exceeds 24 hours)**: System MUST email user with status update: "Your evaluation is still processing. We apologize for the delay and will send your report as soon as it's ready." System MUST continue processing and deliver report when complete.
- **User submits same URL/file multiple times**: System MUST accept duplicate submissions and process each independently. Each submission receives its own evaluation request ID and report. No deduplication required for MVP.
- **Website blocks scraping (robots.txt, rate limiting)**: System MUST respect robots.txt. If scraping is disallowed, reject submission with error message: "This website's robots.txt prevents automated access. Please upload files instead or contact us for assistance." If rate limited, retry up to 3 times with exponential backoff before rejecting.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a web form that accepts website URLs as input (required)
- **FR-002**: System MUST provide a web form that accepts file uploads (PDF, PPTX presentations, DOCX documents) (optional)
- **FR-003**: System MUST provide an optional field for users to specify target audience (e.g., "CFOs at Fortune 500 companies")
- **FR-004**: System MUST validate URL format and accessibility before accepting submission. If URL is invalid format, inaccessible (404, timeout, requires authentication), or redirects to invalid destination, System MUST reject submission immediately with specific error message displayed on form
- **FR-005**: System MUST validate file format and size before accepting upload. If file format is unsupported or exceeds 50MB limit, System MUST reject submission immediately with specific error message displayed on form indicating supported formats and size limit
- **FR-006**: System MUST require and validate email address format before accepting submission
- **FR-006a**: System MUST enforce rate limiting: maximum 3 submissions per email address per 24 hours, and maximum 5 submissions per IP address per hour. If limit exceeded, System MUST reject submission with error message: "Rate limit exceeded. Please try again later."
- **FR-007**: System MUST display clear validation error messages when input is invalid
- **FR-008**: System MUST display confirmation message immediately after successful submission
- **FR-009**: System MUST send email confirmation to user upon successful submission with estimated wait time (5-10 minutes)
- **FR-010**: System MUST scrape homepage and About page content from submitted URLs
- **FR-010a**: System MUST reject submission if scraped content is less than 200 words total. If insufficient content is detected, System MUST reject submission immediately and email user with error message: "Insufficient content found on website. Please ensure your homepage and About page contain substantial text content, or upload files instead."
- **FR-011**: System MUST parse and extract text content from uploaded files (PDF, PPTX, DOCX formats)
- **FR-012**: System MUST identify target audiences from scraped/parsed content, incorporating user-provided audience if specified
- **FR-013**: System MUST evaluate clarity of messaging for each identified audience, assessing: (a) what they do, (b) how they're different, (c) who uses them
- **FR-014**: System MUST evaluate technical level appropriateness of content for each identified audience (too technical, too vague, or appropriately matched)
- **FR-015**: System MUST evaluate importance and relevance of messaging for each identified audience (why should this audience care?)
- **FR-016**: System MUST evaluate voice and personality of the organization (distinct voice, personality indicators, values/principles evident, tone consistency)
- **FR-017**: System MUST evaluate vividness and memorability of narratives (vivid vs generic language, memorability, emotional engagement, storytelling presence)
- **FR-018**: System MUST validate all quotes and examples against source material before including in report
- **FR-019**: System MUST include citations with exact quotes and source references (URL or file identifier, page/section location) for all claims in the report
- **FR-020**: System MUST generate PDF reports that are 2-5 pages in length with the following sections in this order: (a) Executive Summary (brutally honest overall assessment), (b) Audience Analysis, (c) Clarity Assessment (per audience), (d) Technical Appropriateness (per audience), (e) Importance & Value (per audience), (f) Voice & Personality, (g) Storytelling & Memorability, (h) Recommendations (specific, actionable, thorough enough to signal complexity), (i) Next Steps (gentle CTA for Feedforward AI services). Section order MUST be maintained as specified.
- **FR-021**: System MUST include direct, unsparing assessments in reports (not vague or diplomatic) - "I don't know what your company does" is acceptable when supported by evidence
- **FR-022**: System MUST back every criticism with specific quoted examples from source material
- **FR-023**: System MUST state "we found no examples" when unable to find supporting evidence rather than fabricating quotes
- **FR-024**: System MUST provide quantified scores (e.g., "CFO clarity score: 30/100", "Technical level for CFOs: 8/100 - way too technical") that provide evidence of problems
- **FR-025**: System MUST identify specific problematic phrases or language that fails for each audience (e.g., "eBPF-based monitoring" loses CFOs)
- **FR-026**: System MUST deliver completed evaluation reports via email to the user's provided email address
- **FR-027**: System MUST attach PDF report to email delivery with brief summary of key findings and call-to-action to schedule consultation
- **FR-028**: System MUST handle processing failures gracefully and notify user of errors via email. For critical failures (inaccessible content, insufficient content, critical agent failures), System MUST fail fast, mark evaluation request status as "failed", and email user with specific error message and next steps. Critical agents are: Audience Identification Agent and Citation Validation Agent - failures in these agents MUST cause processing to fail. For non-critical agent failures (Clarity, Technical Level, Importance, Voice, Vividness, Synthesis), System MAY continue with partial results and note limitations in report
- **FR-029**: System MUST process evaluations asynchronously (user does not wait for completion during submission)
- **FR-030**: System MUST complete analysis and report generation within 10 minutes for typical website + deck submission

### Key Entities *(include if feature involves data)*

- **Evaluation Request**: Represents a user's submission of content for evaluation. Contains: submission ID, user email, submitted URL (optional), uploaded files (optional), submission timestamp, status (pending/processing/completed/failed), processing start time, completion time.

- **Scraped Content**: Represents content extracted from a website. Contains: source URL, page type (homepage/about), raw HTML, extracted text, scraping timestamp, scraping status (success/failure/partial).

- **Parsed Content**: Represents content extracted from uploaded files. Contains: source file identifier, file type, extracted text, parsing timestamp, parsing status (success/failure/partial).

- **Audience**: Represents a target audience identified from content. Contains: audience identifier, audience description (e.g., "CISOs at Fortune 500 banks"), confidence level, source evidence.

- **Evaluation Assessment**: Represents an evaluation result for a specific dimension. Contains: dimension type (clarity/voice/technical/importance/vividness), audience context (if applicable), assessment text, score or rating (if applicable), supporting quotes with citations, confidence level.

- **Citation**: Represents a quote or example used to support an assessment. Contains: quote text, source reference (URL or file identifier), page/section location, validation status (verified/unverified), validation timestamp.

- **Evaluation Report**: Represents the final PDF report delivered to user. Contains: report identifier, evaluation request reference, generated PDF file, generation timestamp, email delivery status, email delivery timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can submit an evaluation request (URL or file) and receive confirmation in under 30 seconds
- **SC-002**: 95% of successfully submitted evaluation requests result in a completed PDF report delivered via email
- **SC-003**: Evaluation reports are delivered to users' email addresses within 24 hours of submission
- **SC-004**: 100% of quotes and examples in evaluation reports are validated against source material (zero fabricated content)
- **SC-005**: Evaluation reports contain assessments across at least 4 dimensions (clarity, voice, technical level, importance, vividness)
- **SC-006**: Evaluation reports are between 2-5 pages in length
- **SC-007**: At least 80% of report recipients find the assessment credible enough to consider it valuable feedback
- **SC-008**: System successfully scrapes homepage and About page content for at least 90% of valid website URLs submitted
- **SC-009**: System successfully parses and extracts text from at least 95% of supported file formats submitted
- **SC-010**: At least 5% of report recipients engage further by requesting follow-up calls or additional information (lead generation metric)
- **SC-011**: At least 20% of CRO persona report recipients schedule follow-up sales calls
- **SC-012**: At least 25% of CHRO persona report recipients schedule follow-up sales calls
- **SC-013**: At least 20% of People Leader persona report recipients schedule follow-up sales calls
- **SC-014**: At least 60% of report recipients forward the report to colleagues or leadership (sharing/validation metric)
- **SC-015**: Reports explicitly test audience-specific concerns (e.g., "Can a CFO understand this?") when user provides target audience
- **SC-016**: Reports show technical level mismatch between audiences (e.g., "Technical audience: 85/100, CFO audience: 8/100") when multiple audiences are identified

## Assumptions

- Users have access to email and can receive PDF attachments
- Users are submitting content they own or have permission to evaluate
- Website URLs submitted are publicly accessible (no authentication required)
- Websites have standard homepage and About page structures
- File uploads are in supported formats (PDF, presentations, documents) and under reasonable size limits (assumed 50MB maximum)
- Email delivery infrastructure is reliable (SendGrid or equivalent)
- Processing time for evaluations may vary based on content volume and complexity, but typical submission completes within 10 minutes
- Users understand this is a diagnostic tool for lead generation purposes
- Reports will be direct and potentially critical, which is intentional to demonstrate expertise
- Users are in acute business crises (lost deals, lost candidates, engagement drops) and seeking validation or evidence of messaging problems
- Users want specific, actionable assessments backed by evidence, not generic best practices
- Users are willing to pay for expertise (not DIY-ers looking for free education)
