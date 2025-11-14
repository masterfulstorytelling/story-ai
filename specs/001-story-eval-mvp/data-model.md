# Data Model: Corporate Storytelling Evaluation Tool MVP

**Date**: 2025-11-13  
**Feature**: Corporate Storytelling Evaluation Tool MVP  
**Phase**: 1 - Design & Contracts

## Entities

### EvaluationRequest

Represents a user's submission of content for evaluation.

**Fields**:
- `id` (string, required): Unique submission identifier (UUID)
- `email` (string, required): User's email address for report delivery
- `url` (string, optional): Website URL to evaluate
- `uploaded_files` (array of FileReference, optional): Uploaded files (PDF, PPTX, DOCX)
- `user_provided_audience` (string, optional): User-specified target audience (e.g., "CFOs at Fortune 500 companies")
- `status` (enum, required): `pending` | `processing` | `completed` | `failed`
- `submitted_at` (timestamp, required): Submission timestamp (ISO 8601)
- `processing_started_at` (timestamp, optional): When processing began
- `completed_at` (timestamp, optional): When processing completed
- `error_message` (string, optional): Error details if status is `failed`
- `report_id` (string, optional): Reference to generated EvaluationReport

**Validation Rules**:
- At least one of `url` or `uploaded_files` must be provided
- Email must be valid format
- URL must be valid HTTP/HTTPS URL if provided
- Status transitions: `pending` → `processing` → `completed` | `failed`

**State Transitions**:
```
pending → processing (when Cloud Task triggers processing)
processing → completed (when report generated successfully)
processing → failed (when error occurs)
```

---

### FileReference

Reference to an uploaded file stored in Cloud Storage.

**Fields**:
- `filename` (string, required): Original filename
- `file_path` (string, required): Cloud Storage path (gs://bucket/path)
- `file_type` (enum, required): `pdf` | `pptx` | `docx`
- `file_size` (number, required): File size in bytes
- `uploaded_at` (timestamp, required): Upload timestamp

**Validation Rules**:
- File size must be ≤ 50MB
- File type must be one of: pdf, pptx, docx
- Filename must not contain path traversal characters

---

### ScrapedContent

Content extracted from a website.

**Fields**:
- `submission_id` (string, required): Reference to EvaluationRequest
- `url` (string, required): Source URL
- `page_type` (enum, required): `homepage` | `about`
- `raw_html` (string, required): Full HTML content
- `extracted_text` (string, required): Plain text extracted from page
- `structured_sections` (array of Section, optional): Parsed sections (hero, about, features, etc.)
- `scraped_at` (timestamp, required): Scraping timestamp
- `scraping_status` (enum, required): `success` | `failure` | `partial`
- `error_message` (string, optional): Error if scraping failed

**Validation Rules**:
- At least one of `extracted_text` or `structured_sections` must be present if status is `success`
- URL must match the EvaluationRequest URL

---

### Section

Structured section of scraped content.

**Fields**:
- `section_type` (enum, required): `hero` | `about` | `features` | `testimonials` | `other`
- `text` (string, required): Text content of section
- `html` (string, optional): HTML content of section
- `location` (string, optional): Page location identifier

---

### ParsedContent

Content extracted from uploaded files.

**Fields**:
- `submission_id` (string, required): Reference to EvaluationRequest
- `file_reference` (FileReference, required): Source file
- `extracted_text` (string, required): Plain text extracted from file
- `pages` (array of Page, optional): Page-by-page content for multi-page documents
- `metadata` (object, optional): File metadata (author, title, creation date, etc.)
- `parsed_at` (timestamp, required): Parsing timestamp
- `parsing_status` (enum, required): `success` | `failure` | `partial`
- `error_message` (string, optional): Error if parsing failed

**Validation Rules**:
- `extracted_text` must be present if status is `success`
- File type determines parsing method (PDF vs PPTX vs DOCX)

---

### Page

Single page from a parsed document.

**Fields**:
- `page_number` (number, required): Page number (1-indexed)
- `text` (string, required): Text content of page
- `metadata` (object, optional): Page-specific metadata

---

### Audience

Target audience identified from content analysis.

**Fields**:
- `id` (string, required): Unique audience identifier (UUID)
- `submission_id` (string, required): Reference to EvaluationRequest
- `description` (string, required): Audience description (e.g., "CISOs at Fortune 500 banks")
- `specificity_score` (number, required): 0-100 score for audience specificity
- `source` (enum, required): `user_provided` | `content_analysis` | `both`
- `confidence_level` (number, optional): 0-100 confidence in identification
- `source_evidence` (array of Citation, optional): Citations supporting audience identification
- `identified_at` (timestamp, required): When audience was identified

**Validation Rules**:
- Description must be specific (not generic like "people" or "companies")
- Specificity score: 9-10 = highly specific, 7-8 = specific, 5-6 = somewhat specific, 1-4 = too vague
- If source is `user_provided`, description should match user input closely

---

### EvaluationAssessment

Evaluation result for a specific dimension.

**Fields**:
- `id` (string, required): Unique assessment identifier (UUID)
- `submission_id` (string, required): Reference to EvaluationRequest
- `agent_name` (enum, required): `clarity` | `technical_level` | `importance` | `voice` | `vividness`
- `audience_id` (string, optional): Reference to Audience (required for clarity, technical_level, importance)
- `dimension_type` (string, required): Specific dimension (e.g., "what_they_do", "how_different" for clarity)
- `assessment_text` (string, required): Textual assessment
- `score` (number, optional): 0-100 score if applicable
- `supporting_citations` (array of Citation, required): Quotes and examples supporting assessment
- `confidence_level` (number, optional): 0-100 confidence in assessment
- `assessed_at` (timestamp, required): When assessment was made

**Validation Rules**:
- Citations must be present (empty array if no examples found, but must include note "we found no examples")
- Score must be 0-100 if provided
- Audience_id required for audience-specific dimensions

---

### Citation

Quote or example used to support an assessment.

**Fields**:
- `id` (string, required): Unique citation identifier (UUID)
- `quote` (string, required): Exact or near-exact quote from source
- `source_type` (enum, required): `homepage` | `about_page` | `uploaded_file`
- `source_reference` (string, required): URL or file identifier
- `location` (string, optional): Page/section location (e.g., "hero section", "page 3")
- `validation_status` (enum, required): `verified` | `unverified` | `rejected`
- `validation_method` (enum, optional): `exact_match` | `fuzzy_match` | `semantic_similarity`
- `validated_at` (timestamp, optional): When citation was validated
- `rejection_reason` (string, optional): Why citation was rejected if validation_status is `rejected`

**Validation Rules**:
- Quote must not be empty
- Validation_status must be `verified` before citation can be used in report
- If validation_status is `rejected`, rejection_reason must be provided

---

### EvaluationReport

Final PDF report delivered to user.

**Fields**:
- `id` (string, required): Unique report identifier (UUID)
- `submission_id` (string, required): Reference to EvaluationRequest
- `pdf_file_path` (string, required): Cloud Storage path to PDF file (gs://bucket/path)
- `report_sections` (object, required): Structured report content (executive_summary, audience_analysis, etc.)
- `generated_at` (timestamp, required): When report was generated
- `email_delivery_status` (enum, required): `pending` | `sent` | `failed` | `bounced`
- `email_delivered_at` (timestamp, optional): When email was successfully delivered
- `email_error_message` (string, optional): Error if email delivery failed

**Validation Rules**:
- PDF file must exist at pdf_file_path
- Report must be 2-5 pages in length
- All citations in report must have validation_status = `verified`

---

## Relationships

```
EvaluationRequest (1) ──→ (0..*) FileReference
EvaluationRequest (1) ──→ (0..1) ScrapedContent (per URL)
EvaluationRequest (1) ──→ (0..*) ParsedContent (per uploaded file)
EvaluationRequest (1) ──→ (1..*) Audience
EvaluationRequest (1) ──→ (0..1) EvaluationReport
Audience (1) ──→ (0..*) EvaluationAssessment
EvaluationAssessment (1) ──→ (0..*) Citation
ScrapedContent (1) ──→ (0..*) Citation (as source)
ParsedContent (1) ──→ (0..*) Citation (as source)
```

## Data Storage

### Firestore Collections

- `evaluation_requests`: EvaluationRequest documents
- `scraped_content`: ScrapedContent documents (subcollection under evaluation_requests)
- `parsed_content`: ParsedContent documents (subcollection under evaluation_requests)
- `audiences`: Audience documents (subcollection under evaluation_requests)
- `evaluations`: EvaluationAssessment documents (subcollection under evaluation_requests)
- `reports`: EvaluationReport documents (subcollection under evaluation_requests)

### Cloud Storage Buckets

- `storyai-uploads`: Uploaded files (organized by submission_id)
- `storyai-reports`: Generated PDF reports (organized by submission_id)
- `storyai-scraped`: Scraped HTML content (organized by submission_id, optional for debugging)

## Indexes

### Firestore Indexes Required

1. `evaluation_requests`: `status`, `submitted_at` (for status monitoring)
2. `evaluation_requests`: `email`, `submitted_at` (for user lookup)
3. `evaluations`: `submission_id`, `agent_name`, `audience_id` (for agent output retrieval)

## Data Retention

- Evaluation requests: Retain for 90 days (for CRM follow-up)
- Generated reports: Retain for 1 year (for user access)
- Uploaded files: Retain for 30 days (delete after parsing)
- Scraped content: Retain for 30 days (delete after evaluation)

## Privacy & Compliance

- All user data (email, content) must be GDPR-compliant
- Users can request data deletion
- No PII stored beyond email address
- Content is user-submitted (assumed permission to process)

