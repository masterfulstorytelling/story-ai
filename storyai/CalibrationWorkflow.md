# Corporate Storytelling Evaluation Tool - Calibration Workflow

## Purpose

This document specifies how Adam will evaluate a reference set of companies to:
1. Calibrate the scoring system (teach agents what scores mean)
2. Build competitive benchmarks (industry comparisons)
3. Validate agent performance (do agents match Adam's assessments?)
4. Create training examples (improve agent prompts over time)

---

## Evaluation Interface Design

### Web-Based Evaluation Tool

**Overview:**
Simple, fast interface for Adam to evaluate companies without leaving the browser.

**Core Requirements:**
- Single-page application
- Keyboard shortcuts for speed
- Auto-save (no "submit" button needed)
- Shows content side-by-side with evaluation form
- Progress tracking (X of Y companies evaluated)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Company Evaluation Tool                     [15 of 50]     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  COMPANY: Rackspace                                          │
│  INDUSTRY: Cloud Infrastructure                              │
│  URL: https://rackspace.com                                  │
│                                                               │
├────────────────┬────────────────────────────────────────────┤
│                │                                             │
│  CONTENT       │  EVALUATION                                 │
│  (scrollable)  │  (fixed)                                    │
│                │                                             │
│  [Homepage]    │  AUDIENCES IDENTIFIED:                      │
│  [About]       │  ┌─────────────────────────────────────┐   │
│  [Other]       │  │ 1. ________________________         │   │
│                │  │ 2. ________________________         │   │
│  ───────────   │  │ 3. ________________________         │   │
│                │  └─────────────────────────────────────┘   │
│  Homepage      │                                             │
│  content       │  CLARITY (per audience):                    │
│  here...       │                                             │
│                │  Audience 1: Cloud Engineers                │
│  [Show full]   │  What they do:    [____] (0-100)           │
│                │  How different:   [____] (0-100)           │
│  About page    │  Who uses:        [____] (0-100)           │
│  content       │                                             │
│  here...       │  Audience 2: CFOs                           │
│                │  What they do:    [____] (0-100)           │
│                │  How different:   [____] (0-100)           │
│                │  Who uses:        [____] (0-100)           │
│                │                                             │
│                │  TECHNICAL LEVEL:                           │
│                │  Content level:   [____] (0-100)           │
│                │                                             │
│                │  JARGON DENSITY:  [____] (0-100)           │
│                │  VAGUENESS:       [____] (0-100)           │
│                │  MEMORABILITY:    [____] (0-100)           │
│                │                                             │
│                │  NOTES:                                     │
│                │  ┌─────────────────────────────────────┐   │
│                │  │                                      │   │
│                │  │                                      │   │
│                │  └─────────────────────────────────────┘   │
│                │                                             │
│                │  [Previous]  [Skip]  [Next] ──────────►    │
│                │                                             │
└────────────────┴────────────────────────────────────────────┘
```

---

## Evaluation Workflow

### Phase 1: Initial Setup (1 hour)

**Select Test Industries:**
Choose 2-3 industries for initial calibration:
- **Primary:** B2B SaaS / Cloud Infrastructure (15-20 companies)
- **Secondary:** Fintech (10-15 companies)
- **Tertiary:** Healthcare Tech (10-15 companies)

**Target:** 35-50 companies total for initial calibration

**Company Selection Criteria:**
- Mix of well-known and obscure companies
- Mix of good and bad storytelling
- Companies at different scales (startups to enterprises)
- Include known best-in-class (e.g., Stripe, Cloudflare)
- Include known poor messaging

**How to Select Companies:**
1. Adam lists competitors in each industry
2. We scrape their homepages
3. Adam picks 10-20 per industry based on:
   - Mix of good/bad
   - Competitive relevance
   - Variety of approaches

---

### Phase 2: Evaluation Sessions (3-5 hours)

**Session Structure:**
- **Duration:** 30-60 minutes per session
- **Companies per session:** 8-12 companies
- **Frequency:** As many sessions as needed over 1-2 weeks
- **Time per company:** 3-5 minutes average

**Evaluation Process (per company):**

**Step 1: Identify Audiences (30 seconds)**
- Who is this content written for?
- List 1-3 distinct audiences
- Can be quick notes: "cloud engineers", "CFOs", "employees"

**Step 2: Score Clarity (60-90 seconds)**
For each audience:
- What they do: 0-100
- How they're different: 0-100
- Who uses them: 0-100

Quick mental rubric:
- 90+: Exceptional, very clear
- 70-89: Good, clear enough
- 50-69: Okay but needs work
- 30-49: Poor, unclear
- 0-29: Very poor, no idea

**Step 3: Score Other Dimensions (60-90 seconds)**
- Content technical level: 0-100
- Jargon density: 0-100
- Vagueness: 0-100
- Memorability: 0-100

**Step 4: Quick Notes (30 seconds)**
- Any standout examples (good or bad)
- Why this company is notable
- Pattern observations

**Step 5: Move to Next** (auto-save, no submit needed)

---

### Phase 3: Pattern Analysis (1 hour)

After completing 30-50 companies, analyze patterns:

**Questions to Answer:**
1. What score ranges actually occur?
   - Do we see full 0-100 range or just 20-80?
   - Are there natural clusters? (excellent, good, poor, terrible)

2. What distinguishes score levels?
   - What makes an 85 different from a 65?
   - Can we articulate rubrics for each dimension?

3. Industry differences?
   - Is fintech generally clearer than cloud infrastructure?
   - Different jargon patterns by industry?

4. Best-in-class examples?
   - Which companies score 80+ consistently?
   - What do they do that others don't?

**Output: Scoring Rubrics**
Convert Adam's implicit knowledge into explicit rubrics for agents.

---

## Evaluation Interface - Technical Spec

### Data Model

```typescript
interface CompanyEvaluation {
  id: string;
  company_name: string;
  url: string;
  industry: string;
  evaluated_at: timestamp;
  evaluated_by: string; // "adam"
  
  // Scraped content
  content: {
    homepage: {
      text: string;
      html: string;
    };
    about_page?: {
      text: string;
      html: string;
    };
  };
  
  // Adam's evaluation
  audiences: Array<{
    id: string;
    description: string;
    notes?: string;
  }>;
  
  clarity_scores: Array<{
    audience_id: string;
    what_they_do: number; // 0-100
    how_different: number;
    who_uses: number;
    notes?: string;
  }>;
  
  technical_level: number; // 0-100
  jargon_density: number;
  vagueness: number;
  memorability: number;
  
  // Optional
  voice_personality: number;
  importance_scores?: Array<{
    audience_id: string;
    score: number;
  }>;
  
  notes: string; // Free-form notes
  
  // Flags
  best_in_class: boolean;
  use_as_example: boolean;
  skip_reason?: string;
}
```

### API Endpoints

```
GET /api/calibration/companies?industry=cloud&status=pending
GET /api/calibration/companies/:id
POST /api/calibration/companies/:id/evaluate
GET /api/calibration/progress
GET /api/calibration/export (CSV or JSON)
```

### Keyboard Shortcuts

**Navigation:**
- `n` or `→` - Next company
- `p` or `←` - Previous company
- `s` - Skip this company
- `Cmd+S` - Force save (auto-saves anyway)

**Quick Scoring:**
- Tab through score fields
- Type number + Enter to move to next field
- `Cmd+0` through `Cmd+9` - Quick preset scores (0, 10, 20... 90)

**Marking:**
- `b` - Toggle "best in class" flag
- `e` - Toggle "use as example" flag

---

## Pre-Population & Assistance

### What We Pre-Fill

To speed up Adam's work, we can pre-populate some fields:

**1. Audience Suggestions (from AI)**
- Run audience identification agent
- Show suggestions: "We identified: CFOs, Cloud Engineers, Employees"
- Adam can accept, modify, or override

**2. Content Highlighting**
- Highlight potential jargon automatically
- Highlight generic phrases ("innovative", "best-in-class")
- Highlight specific/measurable claims

**3. Quick Comparisons**
- Show side-by-side with similar companies already evaluated
- "This is similar to Company X which you scored..."

### What We Don't Pre-Fill

- **Scores:** These must be Adam's judgment
- **Notes:** These capture Adam's expertise

---

## Industry Selection Strategy

### Phase 1 Industries (MVP Calibration)

**1. B2B SaaS / Cloud Infrastructure (Priority 1)**
Companies to evaluate:
- [ ] Rackspace (known example)
- [ ] Cloudflare (likely good storytelling)
- [ ] AWS (baseline)
- [ ] Azure (baseline)
- [ ] GCP (baseline)
- [ ] Datadog
- [ ] New Relic
- [ ] PagerDuty
- [ ] HashiCorp
- [ ] Terraform
- [ ] MongoDB
- [ ] Snowflake
- [ ] Confluent
- [ ] Elastic
- [ ] GitLab
- [ ] CircleCI
- [ ] Sumo Logic
- [ ] Splunk
- [ ] 2-3 lesser-known competitors

**Why this industry:**
- You have domain expertise
- Clear B2B buying patterns (technical champion + CFO)
- Known problems (champion enablement)
- Easy to identify audiences

**2. Fintech (Priority 2)**
Companies to evaluate:
- [ ] Stripe (likely best-in-class)
- [ ] Square
- [ ] Plaid
- [ ] Brex
- [ ] Ramp
- [ ] Bill.com
- [ ] Expensify
- [ ] Gusto
- [ ] Rippling
- [ ] Carta
- [ ] 5-8 more fintech companies

**Why this industry:**
- High-stakes storytelling (money, trust)
- Multiple audiences (businesses, individuals, compliance)
- Good vs bad storytelling examples
- Growing industry with demand

**3. Healthcare Tech (Priority 3)**
Companies to evaluate:
- [ ] Epic Systems
- [ ] Cerner
- [ ] Athenahealth
- [ ] Teladoc
- [ ] Zocdoc
- [ ] Oscar Health
- [ ] 8-10 more healthcare tech companies

**Why this industry:**
- Importance/meaning often unclear
- Regulatory complexity
- Multiple stakeholders (patients, providers, payers)
- Different from cloud/fintech

---

## Using Evaluation Data

### 1. Agent Calibration

**Process:**
1. Run agents on same 50 companies Adam evaluated
2. Compare agent scores to Adam's scores
3. Measure agreement:
   - Perfect match: within 5 points
   - Close: within 10 points
   - Divergent: >10 points apart

**Refinement Loop:**
```
For each dimension where agents diverge:
  1. Look at specific examples where agent was wrong
  2. Identify pattern (agent too harsh? too lenient?)
  3. Adjust agent prompt or scoring rubric
  4. Re-run on subset
  5. Measure improvement
  6. Repeat until 80%+ agreement
```

### 2. Benchmark Creation

**By Industry:**
```
Cloud Infrastructure Benchmark:
- Average clarity (CFO): 52/100
- Average jargon: 67/100
- Average memorability: 31/100
- Best-in-class: Cloudflare (clarity: 84, memorability: 73)
- Worst: Company X (clarity: 23, jargon: 91)
```

**Overall Benchmark:**
```
All B2B Companies (n=50):
- Average clarity: 58/100
- Average jargon: 54/100
- Top 25%: clarity >75
- Bottom 25%: clarity <35
```

### 3. Example Library

**For Each Dimension, Collect:**

**Best Examples:**
- Company name
- Specific quote
- Why it's good
- Score it received

**Worst Examples:**
- Company name  
- Specific quote
- Why it's bad
- Score it received

**Use in Agent Prompts:**
Show agents examples of 90+ and <20 to calibrate their assessments.

---

## Quality Assurance

### Consistency Checks

**During Evaluation:**
- Flag if Adam scores technical level 90 but jargon 20 (likely inconsistent)
- Flag if clarity scores vary wildly between similar audiences
- Flag if company scores 90 on everything (probably too generous)

**After Evaluation:**
- Check for scoring drift (Are later evaluations more harsh/lenient?)
- Look for outliers (Scores that are very different from similar companies)
- Validate patterns (Do best-in-class companies cluster together?)

### Re-Evaluation

**When to Re-Evaluate:**
- If Adam's scores seem inconsistent
- If a company seems mis-scored in hindsight
- If we add new dimensions to evaluate

**Process:**
- Show original evaluation
- Ask Adam to re-score
- Compare original vs new
- Use for calibration improvement

---

## Scoring Speed Optimizations

### Techniques to Make This Fast

**1. Comparative Scoring**
Instead of absolute 0-100:
"Is this company clearer than Cloudflare? [Much worse | Worse | Same | Better | Much better]"
Then convert to scores based on reference point.

**2. Preset Profiles**
- Save common audience combinations
- "B2B SaaS typical: cloud engineers + CFOs + employees"
- One-click to populate audiences

**3. Smart Defaults**
- If previous company was cloud infrastructure with 3 audiences
- Default next cloud company to same 3 audiences
- Adam can modify if needed

**4. Batch Operations**
- "Score next 5 companies all at once"
- Show all 5 side-by-side
- Fill scores across all 5
- Good for similar companies

---

## Timeline & Milestones

### Week 1: Infrastructure Setup
- [ ] Build evaluation interface
- [ ] Select 50 target companies
- [ ] Scrape content
- [ ] Test interface with Adam (3-5 companies)
- [ ] Refine based on feedback

### Week 2-3: Evaluation Sessions
- [ ] Session 1: 12 companies (cloud)
- [ ] Session 2: 12 companies (cloud)  
- [ ] Session 3: 10 companies (fintech)
- [ ] Session 4: 10 companies (fintech)
- [ ] Session 5: 10 companies (healthcare)

### Week 3: Analysis & Agent Calibration
- [ ] Analyze patterns in scores
- [ ] Create explicit rubrics
- [ ] Run agents on same 50 companies
- [ ] Measure agent vs Adam agreement
- [ ] Refine agent prompts
- [ ] Iterate until 80%+ agreement

---

## Agent Validation Methodology

### Success Metrics

**Overall Agreement:**
- Target: 80%+ of agent scores within 10 points of Adam's
- Stretch: 90%+ within 10 points

**Per-Dimension Agreement:**
- Clarity: 85%+ within 10 points
- Jargon: 80%+ within 10 points
- Memorability: 75%+ within 10 points (hardest)
- Technical level: 85%+ within 10 points

### What to Do When Agents Diverge

**Scenario 1: Agent Too Harsh**
- Pattern: Agent consistently scores 20-30 points lower than Adam
- Fix: Adjust prompt to be less critical, show more generous examples
- Example: Memorability agent thinks nothing is memorable

**Scenario 2: Agent Too Lenient**
- Pattern: Agent consistently scores 20-30 points higher than Adam
- Fix: Adjust prompt to be more critical, show harsh examples
- Example: Clarity agent thinks vague language is clear enough

**Scenario 3: Agent Misses Patterns**
- Pattern: Agent scores randomly relative to Adam (no consistent bias)
- Fix: Agent doesn't understand the dimension - rewrite prompt entirely
- Example: Agent doesn't understand what makes differentiation clear

**Scenario 4: Agent Correct But Adam Inconsistent**
- Pattern: Agent is self-consistent but disagrees with Adam
- Fix: Have Adam re-evaluate those companies
- Example: Adam was tired and scored inconsistently

---

## Data Export & Usage

### Export Formats

**CSV for Analysis:**
```csv
company,industry,clarity_cfo,jargon,memorability,notes
Rackspace,Cloud,30,89,18,"Champion problem example"
Cloudflare,Cloud,84,34,73,"Best-in-class example"
...
```

**JSON for Agent Training:**
```json
{
  "company": "Rackspace",
  "industry": "cloud_infrastructure",
  "scores": {
    "clarity": {
      "cloud_engineers": 82,
      "cfos": 30
    },
    "jargon": 89,
    "memorability": 18
  },
  "examples": {
    "jargon": [
      {
        "quote": "eBPF-based kernel monitoring",
        "source": "homepage",
        "why_problematic": "CFOs don't know what eBPF or kernel means"
      }
    ]
  }
}
```

### Using Data in Production

**When User Submits:**
1. Run agents on their content
2. Compare to reference companies in same industry
3. Show: "Your jargon: 87. Industry average: 54. Best-in-class: 28."

**Continuous Improvement:**
- Every month, Adam evaluates 5-10 new companies
- Adds to benchmark database
- Refines agent prompts based on new examples

---

## Future Enhancements

### Post-MVP Calibration Features

**1. Multi-Evaluator Calibration**
- Train other team members to evaluate
- Measure inter-rater reliability
- Use consensus scores for training

**2. Active Learning**
- System identifies companies where it's most uncertain
- Prioritizes those for Adam's evaluation
- Focuses human effort where most valuable

**3. Partial Evaluation**
- Adam doesn't need to score everything
- Can just validate agent's assessment
- "Do you agree with this 85/100 for clarity? [Yes/No/Different score]"

**4. A/B Testing Framework**
- Test different agent prompts
- Measure which version agrees better with Adam
- Automated prompt optimization

---

## Success Criteria

### MVP Calibration Success
- [ ] 50 companies evaluated by Adam
- [ ] 2-3 industries covered
- [ ] Agent agreement 80%+ with Adam's scores
- [ ] Benchmark data available for reports
- [ ] Best-in-class examples identified
- [ ] Worst examples identified for training

### Production Readiness
- [ ] Agent scores correlate with Adam's scores (r > 0.8)
- [ ] Agents identify same business problems Adam would identify
- [ ] Reports feel credible to users
- [ ] Adam approves 80%+ of generated reports

---

## Notes & Considerations

### What Makes This Hard

**Subjective Judgment:**
- Storytelling quality is somewhat subjective
- Adam's scores might vary day-to-day
- No "ground truth" to compare against

**Domain Expertise Required:**
- Some scores require deep understanding of industry
- Technical level assessment requires knowing audience expertise
- This is why we need Adam, not random evaluators

**Time Investment:**
- 50 companies × 4 minutes = 3+ hours of Adam's time
- Is this the best use of his time?
- Could we use his time more efficiently?

### What Makes This Easier

**Adam's Expertise:**
- Years of evaluating business narratives
- Quick pattern recognition
- Consistent internal rubric

**Clear Outcomes:**
- We're not trying to be academically rigorous
- Just need "good enough" calibration
- 80% agreement is success

**Iterative Improvement:**
- Start with rough calibration
- Improve over time
- Always use Adam's judgment as final arbiter

---

## Open Questions

1. **How much variation is acceptable?**
   - If Adam scores 70 and agent scores 80, is that okay?
   - What if it's 70 vs 60?

2. **Should we weight dimensions differently?**
   - Is clarity more important than memorability for scoring?
   - Should some scores be "critical failures" that override others?

3. **How do we handle industry differences?**
   - Is a 70 in fintech the same as a 70 in healthcare?
   - Should we use industry-relative scores?

4. **What if agents can't match Adam's performance?**
   - Is 70% agreement good enough for MVP?
   - Do we need to fine-tune models instead of just prompts?

5. **How do we validate the system is working?**
   - User satisfaction surveys?
   - Conversion rates to sales calls?
   - Manual review of generated reports?