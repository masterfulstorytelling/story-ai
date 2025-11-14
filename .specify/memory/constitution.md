<!--
Sync Impact Report:
Version: 1.1.0 (added modular architecture and TDD principles)
Ratification Date: 2025-11-13
Last Amended: 2025-11-13

Principles Added (v1.0.0):
- I. Single-Purpose Agents
- II. No Hallucination Tolerance
- III. Audience-First Architecture
- IV. Strongly Opinionated Output
- V. Rapid Iteration on Agent Design

Principles Added (v1.1.0):
- VI. Modular Development and Architecture
- VII. Test-Driven Development

Sections Added:
- Development Workflow (Specify framework, Active Plan Protocol)
- Quality Standards (Executive quality bar)

Templates Status:
✅ plan-template.md - Constitution Check section already references constitution
✅ spec-template.md - No changes needed (generic template)
✅ tasks-template.md - Already includes test tasks and TDD workflow (aligned)
✅ checklist-template.md - No changes needed (generic template)
✅ Command files - Already reference constitution appropriately

Follow-up TODOs: None
-->

# Story AI Constitution

## Core Principles

### I. Single-Purpose Agents

Each agent MUST do ONE thing extremely well with no overloading of responsibilities. Agents MUST NOT score AND write assessments AND provide examples—each agent picks a single, focused responsibility. Clear, focused outputs that feed downstream agents are required. This principle ensures maintainability, testability, and clear data flow through the multi-agent pipeline.

**Rationale**: Overloaded agents create ambiguity, reduce testability, and make rapid iteration difficult. Single-purpose agents enable parallel development, independent testing, and clear debugging boundaries.

### II. No Hallucination Tolerance

Every quote, claim, or example MUST be validated against source material. Citation tracking is non-negotiable for all agent outputs. Better to report "we found no examples" than to fabricate quotes or claims. All assessments MUST include citations with exact quotes and sources.

**Rationale**: Credibility for executive audiences requires absolute accuracy. Fabricated content destroys trust and undermines the tool's value proposition as a lead generation vehicle for Feedforward AI's consulting services.

### III. Audience-First Architecture

Understanding who the content is for MUST precede all other evaluation. Every assessment MUST be contextualized by specific audience. Multiple audiences require multiple parallel assessments (e.g., one Clarity Agent per audience). Agent prompts MUST emphasize specificity over vagueness (e.g., "CISOs at Fortune 500 banks" not "people in finance").

**Rationale**: Storytelling quality is meaningless without audience context. The same content can be excellent for one audience and terrible for another. Parallel assessment per audience enables accurate, actionable evaluations.

### IV. Strongly Opinionated Output

Reports MUST be direct and unsparing in their assessments. "I don't know what your company does" is a valid assessment when supported by evidence. Recommendations MUST be thorough but intimidating (signals need for expert help). Every criticism MUST be backed by specific quoted examples from source material.

**Rationale**: Vague, diplomatic assessments provide no value. The tool must demonstrate Feedforward AI's expertise through bold, evidence-based evaluations that create awareness of complexity and signal the need for expert consulting help.

### V. Rapid Iteration on Agent Design

Agent specifications will change constantly—infrastructure MUST support fast experimentation. Comprehensive evaluation and testing capability MUST exist from day one. A/B testing different agent configurations MUST be supported. Build infrastructure to enable rapid iteration without breaking existing functionality.

**Rationale**: This is a new product category with no established best practices. Agent design will evolve based on real-world feedback. The system must support experimentation without requiring complete rewrites.

### VI. Modular Development and Architecture

Each new feature specification tool MUST be easily separable from others. Features MUST be designed with clear boundaries, minimal coupling, and well-defined interfaces. Architecture MUST support independent development, testing, and deployment of features. Dependencies between features MUST be explicit and documented.

**Rationale**: Modular architecture enables parallel development, reduces risk of breaking changes, simplifies testing, and allows features to evolve independently. This is critical for a multi-agent system where different evaluation dimensions may be added or modified over time.

### VII. Test-Driven Development (NON-NEGOTIABLE)

A comprehensive test suite MUST be called upon at natural checkpoints and between phases. Tests MUST be written before implementation (red-green-refactor cycle). Test coverage MUST include unit tests, integration tests, and contract tests for agent interfaces. All tests MUST pass before proceeding to the next phase or checkpoint.

**Rationale**: TDD ensures code quality, prevents regressions, documents expected behavior, and provides confidence for rapid iteration. For a system requiring executive-level credibility, comprehensive testing is non-negotiable. Natural checkpoints (between phases, before deployments, after major changes) ensure continuous validation.

## Development Workflow

### Specify Framework

This project follows the Specify framework (integrated Design Thinking + Jobs-to-be-Done + Lean Startup methodology). All feature development MUST use structured slash commands:

- `/speckit.specify` - Create or update feature specification
- `/speckit.plan` - Execute implementation planning workflow
- `/speckit.tasks` - Generate actionable, dependency-ordered tasks
- `/speckit.implement` - Execute the implementation plan
- `/speckit.clarify` - Identify underspecified areas
- `/speckit.analyze` - Cross-artifact consistency analysis
- `/speckit.checklist` - Generate custom checklist
- `/speckit.constitution` - Create/update project constitution

### Active Plan Protocol

**CRITICAL**: This project maintains an active plan at `/home/adamd/.claude/context/always/active-plan.md`. Before making changes:

1. Read active-plan.md BEFORE making changes
2. Complete sub-steps IN ORDER, one at a time
3. After completing each sub-step, ASK: "Sub-step [X] complete. Ready to proceed to sub-step [Y]?"
4. WAIT for explicit user confirmation
5. Update active-plan.md to mark current complete, next as current
6. Then proceed

**Do NOT**: Skip ahead without approval, combine multiple sub-steps, or proceed without explicit confirmation.

### Content Generation Protocol

1. Show sample content in chat and create `*.tmp` files for review
2. Get feedback
3. Refine based on feedback
4. Ask: "Should I write this to [filename]?"
5. Wait for YES
6. Then write file
7. Ask: "Is [task] complete?" before marking done

**Never write files without approval.**

## Quality Standards

### Executive Quality Bar

Reports MUST be credible for executive audiences. Assessment quality MUST be something Adam Davidson would stand behind. Output quality MUST demonstrate Feedforward AI expertise. The tool MUST create awareness of complexity (signals need for expert help).

### Technical Quality Requirements

- Agents MUST output structured JSON with specific schemas
- Every assessment MUST include citations with exact quotes and sources
- Agents MUST run in parallel where possible (e.g., one Clarity Agent per audience)
- No subjective scoring without objective evidence from content
- All specifications in `/storyai/` directory MUST be referenced when making implementation decisions

## Governance

This constitution supersedes all other development practices and guidelines. Amendments require:

1. Documentation of the change rationale
2. Version increment according to semantic versioning:
   - **MAJOR**: Backward incompatible governance/principle removals or redefinitions
   - **MINOR**: New principle/section added or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements
3. Update of dependent templates and command files
4. Sync Impact Report documenting all changes

All PRs, reviews, and implementation work MUST verify compliance with constitution principles. Complexity must be justified against these principles. Use `CLAUDE.md` for runtime development guidance and project-specific context.

**Version**: 1.1.0 | **Ratified**: 2025-11-13 | **Last Amended**: 2025-11-13
