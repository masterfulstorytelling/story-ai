# Corporate Storytelling Evaluation Tool - Functional Specification

## System Overview

A multi-agent AI system that analyzes corporate communication materials (websites, decks, documents) to assess storytelling quality across multiple dimensions. The system produces detailed reports with specific citations and recommendations.

## User Journey

### 1. Content Submission
**User arrives at web form and provides:**
- Company website URL (required)
- Optional: Additional page URLs
- Optional: File uploads (PDF, PPTX, DOCX)
- Optional: Target audience description
- Email address (required for report delivery)

**User expectations:**
- Submission takes < 30 seconds
- Clear indication that analysis is in progress
- Estimated wait time provided (5-10 minutes)

### 2. Analysis Phase (User waits)
**System processes content through multi-agent pipeline:**
- Scrapes and parses content
- Identifies audiences
- Evaluates clarity, voice, and storytelling
- Validates all citations
- Synthesizes findings
- Generates report

**User experience:**
- Email confirmation: "We're analyzing your content..."
- Optional: Progress updates via email
- No user interaction required during analysis

### 3. Report Delivery
**User receives email with:**
- Link to download PDF report (or PDF attachment)
- Brief summary of key findings
- Call-to-action to schedule consultation

**Report contains:**
- Executive summary (brutal honesty about storytelling quality)
- Audience analysis
- Dimension-by-dimension assessment (clarity, voice, storytelling)
- Specific examples with exact quotes and citations
- Detailed recommendations
- Gentle CTA for Feedforward AI services

### 4. Follow-up
**System captures:**
- Email for CRM/outreach
- Report generated timestamp
- Which content was analyzed
- Opportunity to schedule sales call

## System Architecture (Conceptual)
```
┌─────────────────────────────────────────────────────────┐
│                      Web Interface                       │
│              (Content submission form)                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     API Gateway                          │
│         (Receives submission, triggers pipeline)         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Content Ingestion                       │
│         - Scrape URLs (Playwright)                       │
│         - Parse uploaded files                           │
│         - Extract text, structure, metadata              │
│         - Store raw content                              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Multi-Agent Analysis Pipeline               │
│                    (LangGraph)                           │
│                                                           │
│  1. Audience Identification Agent                        │
│     ├─ Reads user-provided audience (if any)            │
│     ├─ Analyzes content to identify audiences           │
│     └─ Outputs: Structured list of audiences            │
│                                                           │
│  2. Clarity Agents (Parallel, one per audience)         │
│     ├─ Evaluates: "Do I understand what they do?"       │
│     ├─ Evaluates: "Do I know how they're different?"    │
│     ├─ Evaluates: "Do I know who would use them?"       │
│     └─ Outputs: Binary + explanation per audience       │
│                                                           │
│  3. Technical Level Agent                                │
│     ├─ Assesses sophistication of content               │
│     ├─ Maps content level to audiences                  │
│     └─ Outputs: Appropriateness per audience            │
│                                                           │
│  4. Importance Agent                                     │
│     ├─ Evaluates: "Why should audience care?"           │
│     ├─ Assesses per audience                            │
│     └─ Outputs: Whether importance is conveyed          │
│                                                           │
│  5. Voice/Personality Agent                              │
│     ├─ Evaluates: Distinct voice present?               │
│     ├─ Evaluates: Personality/values evident?           │
│     ├─ Evaluates: Tone/vibe clear?                      │
│     └─ Outputs: Assessment + examples                   │
│                                                           │
│  6. Vividness/Storytelling Agent                         │
│     ├─ Evaluates: Memorable language present?           │
│     ├─ Evaluates: Emotional engagement?                 │
│     ├─ Identifies: Generic vs vivid passages            │
│     └─ Outputs: Assessment + specific examples          │
│                                                           │
│  7. Citation Validation Agent                            │
│     ├─ Verifies all quotes exist in source              │
│     ├─ Flags any potential hallucinations               │
│     └─ Outputs: Validated quotes with sources           │
│                                                           │
│  8. Synthesis/Editor Agent                               │
│     ├─ Receives all agent outputs                       │
│     ├─ Creates cohesive narrative assessment            │
│     ├─ Generates specific recommendations               │
│     └─ Outputs: Complete report content                 │
│                                                           │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Report Generation                       │
│         - Format content as PDF or Markdown              │
│         - Apply styling/branding                         │
│         - Include all citations                          │
│         - Add CTA and contact info                       │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Email Delivery                        │
│         - Send report to user's email                    │
│         - Store email for follow-up                      │
│         - Track delivery status                          │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Input Data Structure
```
{
  "submission_id": "unique_id",
  "timestamp": "ISO_8601",
  "url": "https://example.com",
  "additional_urls": ["https://example.com/about"],
  "uploaded_files": [
    {
      "filename": "deck.pdf",
      "file_path": "gs://bucket/submissions/unique_id/deck.pdf",
      "file_type": "pdf"
    }
  ],
  "user_provided_audience": "CISOs at Fortune 500 financial institutions",
  "email": "user@company.com"
}
```

### Content Storage Structure
```
{
  "submission_id": "unique_id",
  "scraped_content": {
    "homepage": {
      "url": "https://example.com",
      "title": "...",
      "text": "...",
      "structured_sections": [...]
    },
    "about_page": { ... }
  },
  "uploaded_content": {
    "deck.pdf": {
      "text": "...",
      "pages": [...],
      "metadata": {...}
    }
  }
}
```

### Agent Output Structure
Each agent outputs structured data that feeds downstream agents:
```
{
  "agent_name": "audience_identification",
  "timestamp": "ISO_8601",
  "audiences": [
    {
      "audience_id": "aud_1",
      "description": "CISOs and security directors at Fortune 500 financial institutions",
      "specificity_score": 9,
      "source": "user_provided + content_analysis"
    },
    {
      "audience_id": "aud_2",
      "description": "IT procurement managers at mid-size banks",
      "specificity_score": 8,
      "source": "content_analysis"
    }
  ]
}
```
```
{
  "agent_name": "clarity_agent",
  "audience_id": "aud_1",
  "timestamp": "ISO_8601",
  "assessment": {
    "what_they_do": {
      "clear": true,
      "explanation": "States they provide cloud security audit tools",
      "citations": [
        {
          "quote": "We provide automated compliance auditing for cloud infrastructure",
          "source": "homepage",
          "section": "hero"
        }
      ]
    },
    "how_different": {
      "clear": false,
      "explanation": "No differentiation from competitors mentioned",
      "citations": []
    },
    "who_uses": {
      "clear": true,
      "explanation": "Explicitly mentions enterprise security teams",
      "citations": [...]
    }
  }
}
```

### Final Report Structure

**Section 1: Executive Summary**
- Overall assessment (1-2 paragraphs, brutally honest)
- Key strengths (if any)
- Critical gaps

**Section 2: Audience Analysis**
- Who is this content written for?
- How specific/clear are the target audiences?
- Are multiple audiences addressed appropriately?

**Section 3: Clarity Assessment**
- Do we know what you do? (per audience)
- Do we know how you're different? (per audience)
- Do we know who would use you? (per audience)
- Specific examples with citations

**Section 4: Technical Appropriateness**
- Is the content at the right level for each audience?
- Where is it too technical or too vague?
- Examples

**Section 5: Importance & Value**
- Is it clear why audiences should care?
- Is value articulated?
- Examples

**Section 6: Voice & Personality**
- Is there a distinct voice?
- Can we sense who these people are?
- Examples of voice done well or poorly

**Section 7: Storytelling & Memorability**
- Is the language vivid and memorable?
- Are there compelling narratives?
- Examples of generic vs vivid language

**Section 8: Recommendations**
- Specific, actionable recommendations
- Thorough enough to signal complexity
- Organized by priority

**Section 9: Next Steps**
- Gentle CTA to schedule consultation
- Contact information

## Report Tone & Style

### Voice Characteristics
- **Direct**: "I don't know what your company does" is acceptable
- **Evidence-based**: Every claim backed by specific quotes
- **Unsparing but not cruel**: Honest assessment, constructive intent
- **Professional**: Sophisticated analysis, not flippant
- **Authoritative**: Based on decades of expertise

### Example Report Language

**Strong:**
> "Your homepage fails to communicate what distinguishes you from competitors. You state that you 'provide innovative cloud solutions' (homepage, hero section), but this phrase is meaningless—every competitor could claim the same. There's no indication of your specific approach, methodology, or unique value proposition."

**Weak:**
> "Your messaging could be clearer and more differentiated."

## Evaluation Dimensions

### 1. Clarity
**Definition**: Can a reader quickly understand what the company does, how they do it differently, and who would use them?

**Sub-dimensions**:
- What they do (product/service clarity)
- How they're different (differentiation)
- Who uses them (audience fit)
- What makes them unique (positioning)

### 2. Audience Appropriateness
**Definition**: Is the content written at the right technical level for the intended audiences?

**Considerations**:
- Multiple audiences require different approaches
- Technical buyers need different language than budget approvers
- Internal employees vs external stakeholders

### 3. Importance/Value
**Definition**: Does the content convey why audiences should care?

**Considerations**:
- Problem articulation
- Value proposition clarity
- Urgency or significance

### 4. Voice & Personality
**Definition**: Is there a distinct voice that conveys who these people are?

**Considerations**:
- Tone consistency
- Personality indicators (serious engineers vs laid-back creatives)
- Values and principles evident

### 5. Vividness & Storytelling
**Definition**: Is the language memorable and emotionally engaging?

**Considerations**:
- Vivid vs generic language
- Specific vs vague descriptions
- Memorable phrases that stick
- Emotional engagement

## Technical Requirements

### Performance
- Analysis completes in < 10 minutes for typical website + deck
- System handles at least 10 concurrent analyses
- Report generation < 30 seconds

### Reliability
- No hallucinated quotes (citation validation required)
- Graceful handling of scraping failures
- Clear error messages to users

### Scalability
- Architecture supports paid client version
- Agent configurations easily swappable
- Evaluation/testing infrastructure built-in

### Data Storage
- Submissions stored for analysis/improvement
- User emails captured for CRM
- Generated reports archived
- All data handling GDPR-compliant

## Out of Scope (MVP)

### Features
- Real-time progress streaming to user
- Interactive report (drill-down, filtering)
- Comparison with competitor sites
- Industry benchmarking
- Multi-language support
- Video/audio content analysis
- Full-site scraping (beyond homepage + about)
- Custom evaluation dimensions per user

### User Management
- User accounts/login
- Dashboard to view past reports
- Report sharing/collaboration
- Payment processing (MVP is free/low-cost)

### Advanced AI
- Fine-tuned models (use strong prompts for MVP)
- Custom models per client
- Story generation (create example narratives)

## Success Metrics

### MVP Success
1. **Technical**: Pipeline completes successfully 95%+ of submissions
2. **Quality**: Adam approves 80%+ of generated reports as credible
3. **Engagement**: 20%+ of recipients schedule follow-up calls
4. **Speed**: Analysis + report generation < 10 minutes

### Evaluation Approach
- A/B testing different agent configurations
- Manual review by Adam of sample reports
- Comparison against Adam's own assessments
- User feedback on report quality/usefulness

## Future Enhancements (Post-MVP)

### Paid Client Features
- Custom evaluation dimensions
- Competitive analysis
- Longitudinal tracking
- Multi-property analysis at scale
- White-labeled reports
- API access

### Advanced Capabilities
- Fine-tuned vividness model trained on Adam's examples
- Story generation (show what good looks like)
- Real-time collaborative analysis
- Integration with client CMS/marketing tools