# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Corporate Storytelling Evaluation Tool** - An AI-powered multi-agent system that evaluates corporate storytelling across multiple dimensions (clarity, voice, technical level, importance, vividness). The tool analyzes websites, decks, and marketing materials to provide companies with detailed assessments of their narrative quality.

**Current Status**: Early-stage product design (Phase 6.5: Design MVP). No implementation yet - all work so far is specification and planning documents in `/storyai/` directory.

**Business Context**: Lead generation tool for Feedforward AI ($6m+/year consulting business). Free/low-cost diagnostic demonstrates expertise and creates pathway to $100K+ consulting engagements.

## Development Methodology

This project follows the **Specify framework** (integrated Design Thinking + Jobs-to-be-Done + Lean Startup methodology):

### Specify Slash Commands

**Critical**: This project uses structured slash commands managed by Speckit. Available commands:

- `/speckit.specify` - Create or update feature specification from natural language
- `/speckit.plan` - Execute implementation planning workflow
- `/speckit.tasks` - Generate actionable, dependency-ordered tasks
- `/speckit.implement` - Execute the implementation plan
- `/speckit.clarify` - Identify underspecified areas and ask targeted questions
- `/speckit.analyze` - Cross-artifact consistency and quality analysis
- `/speckit.checklist` - Generate custom checklist for current feature
- `/speckit.constitution` - Create/update project constitution

### Active Plan Protocol

**⚠️ CRITICAL**: This project has an active plan at `/home/adamd/.claude/context/always/active-plan.md`

**Required workflow**:
1. Read active-plan.md BEFORE making changes
2. Complete sub-steps IN ORDER, one at a time
3. After completing each sub-step, ASK: "Sub-step [X] complete. Ready to proceed to sub-step [Y]?"
4. WAIT for explicit user confirmation
5. Update active-plan.md to mark current complete, next as current
6. Then proceed

**Do NOT**:
- Skip ahead without approval
- Combine multiple sub-steps
- Proceed without explicit "yes"

### Project Documents Structure

All specifications live in `/storyai/` directory:

- `StoryEvalVision1.md` - Vision document and problem definition
- `UserPersonas.md` - Detailed user personas and pain points
- `CorpEvalAgentSpec.md` - Multi-agent system specifications
- `CorpEvalFucntional.md` - Functional requirements
- `CorpEvalImplementationSpecification.md` - Tech stack and architecture
- `ReportSpecification.md` - Report generation requirements
- `CalibrationWorkflow.md` - Agent calibration process

**Always reference these documents** when making implementation decisions to ensure alignment with design intent.

## Planned Architecture

### Technology Stack

**Frontend**:
- Vue 3 (Composition API) + Vite
- Tailwind CSS
- Axios for HTTP client

**Backend API**:
- Node.js 20.x + Express.js
- Multer for file uploads
- Joi/Zod for validation

**AI Processing Layer**:
- Python 3.11+ + FastAPI
- LangGraph for agent orchestration
- LangChain for LLM integration
- Claude (Anthropic) as primary model
- LangSmith for observability/tracing

**Scraping & Parsing**:
- Playwright (Python) for web scraping
- PyMuPDF/pdfplumber for PDFs
- python-pptx for presentations
- python-docx for documents

**Infrastructure**:
- Google Cloud Platform (GCP)
- Cloud Run for serverless containers
- Firestore for metadata/state
- Cloud Storage for files/PDFs
- SendGrid for email delivery

### System Architecture Principles

**From specification documents**:

1. **Single-Purpose Agents**: Each agent does ONE thing extremely well (no overloading)
2. **No Hallucination Tolerance**: Every quote must be validated against source material
3. **Audience-First Architecture**: All evaluation is contextualized by specific audience
4. **Strongly Opinionated Output**: Direct, unsparing assessments backed by specific examples
5. **Citation Validation**: Non-negotiable citation tracking for all claims

### Agent Pipeline

```
User Input + Scraped Content
         │
         ▼
    [1] Audience Identification Agent
         │
         ├─────┬─────┬─────┬─────┐
         ▼     ▼     ▼     ▼     ▼
    [2] Clarity Agent (per audience, parallel)
         │
         ├─────┬─────┬─────┐
         ▼     ▼     ▼     ▼
    [3-6] Technical/Importance/Voice/Vividness Agents
         │
         ▼
    [7] Citation Validation Agent
         │
         ▼
    [8] Synthesis/Editor Agent
         │
         ▼
    Report Generation
```

## Working with This Codebase

### Before Starting Implementation

1. **Read the active plan**: Check `/home/adamd/.claude/context/always/active-plan.md`
2. **Understand current phase**: Verify which sub-step you're on
3. **Review specifications**: Read relevant spec documents in `/storyai/`
4. **Follow the plan**: Complete current sub-step fully before moving forward

### When Adding Features

1. Use `/speckit.specify` to create/update specifications
2. Use `/speckit.plan` to generate implementation plan
3. Use `/speckit.tasks` to create actionable task list
4. Use `/speckit.implement` to execute systematically

### Agent Development Guidelines

**Critical design constraints from specifications**:

- Agents must output **structured JSON** with specific schemas
- Every assessment must include **citations** with exact quotes and sources
- Agents run **in parallel where possible** (e.g., one Clarity Agent per audience)
- Agent prompts emphasize **specificity** over vagueness (e.g., "CISOs at Fortune 500 banks" not "people in finance")
- No subjective scoring without objective evidence from content

### Quality Standards

**Minimum quality bar for market** (from active plan Phase 6.5):
- Reports must be credible for **executive audiences**
- Assessment must be something Adam Davidson would stand behind
- Output quality demonstrates **Feedforward AI expertise**
- Tool creates awareness of complexity (signals need for expert help)

### Content Generation Protocol

**⚠️ From PAI system instructions**:

1. Show sample content in chat and create `*.tmp` files for review
2. Get Adam's feedback
3. Refine based on feedback
4. Ask: "Should I write this to [filename]?"
5. Wait for YES
6. Then write file
7. Ask: "Is [task] complete?" before marking done

**Never write files without approval.**

## Personal Context

**Adam Davidson's Role**: Co-founder of NPR's Planet Money, staff writer at The New Yorker/NYT Magazine, author of "The Passion Economy". This tool codifies his 35+ years of storytelling expertise.

**Working Style**:
- Thought partner approach - ASK questions, don't assume
- Extract Adam's knowledge, don't replace it with generic AI
- Adam is the expert on storytelling; Claude structures and organizes

**Key Challenge**: Adam has ADHD and gets distracted - PAI system provides structure + accountability to prevent drift

## Development Status

**Not yet implemented**:
- No frontend code exists
- No backend API exists
- No AI processing layer exists
- No infrastructure deployed

**What exists**:
- Comprehensive specification documents
- Agent architecture design
- Technical implementation plan
- User personas and requirements

**Next steps**: Complete Phase 6.5 (ensure MVP meets quality bar), then move to Phase 7 (prepare for Saturday developer meeting to define implementation priorities).

## Key Files to Reference

When implementing, always consult:

1. **Active Plan**: `/home/adamd/.claude/context/always/active-plan.md` - Current phase and sub-steps
2. **Vision**: `/storyai/StoryEvalVision1.md` - Core problem and solution
3. **Agent Specs**: `/storyai/CorpEvalAgentSpec.md` - Agent design and data schemas
4. **Implementation Spec**: `/storyai/CorpEvalImplementationSpecification.md` - Tech stack and architecture
5. **User Personas**: `/storyai/UserPersonas.md` - Who we're building for and why

## Specify Templates

Templates available in `.specify/templates/`:
- `spec-template.md` - Feature specification structure
- `plan-template.md` - Implementation plan structure
- `tasks-template.md` - Task breakdown structure
- `checklist-template.md` - Quality checklist structure
- `agent-file-template.md` - Agent file structure

Constitution template in `.specify/memory/constitution.md` (currently just template, not populated).
