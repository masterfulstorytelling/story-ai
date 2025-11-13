# Corporate Storytelling Evaluation Tool - Agent Specifications

## Agent Design Principles

1. **Single Purpose**: Each agent does ONE thing extremely well
2. **Clear Inputs/Outputs**: Structured data in, structured data out
3. **No Hallucination**: Citations must be validated against source
4. **Audience-Aware**: Most agents operate in context of specific audience(s)
5. **Composable**: Agents feed each other in clear dependency chain

## Agent Pipeline Overview
```
User Input + Scraped Content
         │
         ▼
    [1] Audience Identification Agent
         │
         ├──────┬──────┬──────┬──────┐
         ▼      ▼      ▼      ▼      ▼
    [2] Clarity Agent (per audience, parallel)
         │      │      │      │      │
         └──────┴──────┴──────┴──────┘
         │
         ├──────┬──────┬──────┐
         ▼      ▼      ▼      ▼
    [3] Technical  [4] Importance  [5] Voice  [6] Vividness
        Level Agent     Agent       Agent      Agent
         │      │      │      │
         └──────┴──────┴──────┘
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

---

## Agent 1: Audience Identification Agent

### Purpose
Identify all distinct audiences that the content is (or should be) addressing.

### Inputs
```json
{
  "scraped_content": {
    "homepage": {"text": "...", "url": "..."},
    "about_page": {"text": "...", "url": "..."}
  },
  "uploaded_files": [
    {"filename": "deck.pdf", "text": "..."}
  ],
  "user_provided_audience": "CISOs at Fortune 500 financial institutions" // optional
}
```

### Process
1. If user provided audience:
   - Evaluate specificity (is "people in finance" too vague?)
   - If too vague, note this and refine based on content
   - If specific enough, accept and use as primary audience
2. Analyze content to identify other audiences:
   - Look for explicit mentions ("for security teams at enterprises")
   - Infer from technical level and domain
   - Identify multiple audience types (technical buyers, budget approvers, end users, employees, investors, media)
3. Create structured audience list with specificity scores

### Outputs
```json
{
  "agent": "audience_identification",
  "audiences": [
    {
      "id": "aud_1",
      "description": "CISOs and VP Security at Fortune 500 financial institutions",
      "specificity_score": 9,
      "rationale": "User provided 'CISOs at Fortune 500 financial institutions' which is highly specific",
      "source": "user_provided"
    },
    {
      "id": "aud_2",
      "description": "IT compliance managers at mid-size banks (50-1000 employees)",
      "specificity_score": 8,
      "rationale": "Content mentions 'compliance teams' and 'mid-market financial services' multiple times",
      "source": "content_analysis",
      "citations": [
        {"quote": "Built for compliance teams at mid-market banks", "source": "homepage"}
      ]
    },
    {
      "id": "aud_3",
      "description": "CFOs and budget approvers at financial institutions",
      "specificity_score": 7,
      "rationale": "ROI calculator and pricing page suggest budget decision-makers as audience",
      "source": "content_analysis"
    }
  ],
  "user_input_evaluation": {
    "provided": true,
    "specific_enough": true,
    "refinement_needed": false,
    "notes": "User provided highly specific audience"
  }
}
```

### Prompt Guidelines
- Emphasize specificity: "cybersecurity experts at Fortune 100 banks" not "people in finance"
- Look for multiple audience types (technical, budget, end-user, employee, investor, media)
- Note when content seems to conflate distinct audiences
- Flag when user-provided audience is too vague

### Example Assessment Criteria
- **Highly specific (9-10)**: Role + seniority + industry + company size
- **Specific (7-8)**: Role + industry or company size
- **Somewhat specific (5-6)**: Role or industry
- **Too vague (1-4)**: "People in finance", "business users", "companies"

---

## Agent 2: Clarity Agent (Per Audience)

### Purpose
For a SPECIFIC audience, assess whether the content clearly communicates what the company does, how they're different, and who would use them.

**Note**: This agent runs in PARALLEL for each identified audience.

### Inputs
```json
{
  "audience": {
    "id": "aud_1",
    "description": "CISOs at Fortune 500 financial institutions"
  },
  "content": {
    "homepage": {"text": "..."},
    "about_page": {"text": "..."},
    "uploaded_files": [...]
  }
}
```

### Process
Evaluate three binary questions for this specific audience:

1. **What they do**: Does this audience understand what product/service is offered?
2. **How they're different**: Does this audience understand what makes this company distinct from competitors?
3. **Who uses them**: Does this audience understand who the target customer is (and if they fit)?

For each question:
- Answer: Clear (true) or Unclear (false)
- Provide brief explanation
- Include specific citations from content

### Outputs
```json
{
  "agent": "clarity_assessment",
  "audience_id": "aud_1",
  "audience_description": "CISOs at Fortune 500 financial institutions",
  "assessments": {
    "what_they_do": {
      "clear": true,
      "explanation": "Clearly states they provide automated cloud infrastructure compliance auditing",
      "citations": [
        {
          "quote": "Automated compliance auditing for AWS, Azure, and GCP environments",
          "source": "homepage",
          "section": "hero",
          "relevance": "Specific product description understandable to CISOs"
        }
      ]
    },
    "how_different": {
      "clear": false,
      "explanation": "No differentiation from competitors. Generic claims about 'innovative' and 'cutting-edge' without substance.",
      "citations": [
        {
          "quote": "Our innovative approach to cloud security compliance",
          "source": "homepage",
          "section": "about",
          "relevance": "Meaningless differentiator - any competitor could claim this"
        }
      ],
      "missing": "No mention of unique methodology, specific frameworks, speed advantage, accuracy metrics, or other distinguishing features"
    },
    "who_uses_them": {
      "clear": true,
      "explanation": "Explicitly mentions enterprise security teams at financial institutions",
      "citations": [
        {
          "quote": "Trusted by security teams at over 50 financial institutions",
          "source": "homepage",
          "section": "social-proof"
        }
      ]
    }
  },
  "overall_clarity_score": 2/3,
  "summary": "CISOs will understand what you do and who you serve, but won't know what makes you different from competitors."
}
```

### Prompt Guidelines
- Be binary: Clear = yes/no, not "somewhat clear"
- For this specific audience, would they understand?
- Look for jargon that this audience would/wouldn't know
- Note when specifics are missing (e.g., "we're faster" without metrics)
- Generic marketing speak ("innovative", "cutting-edge", "best-in-class") counts as UNCLEAR differentiation

### Example Strong Citations
✅ "Provides SOC 2 compliance reports in 24 hours vs industry standard 2 weeks" (specific, measurable)
✅ "Built specifically for multi-cloud environments spanning AWS, Azure, GCP" (clear scope)
✅ "Automated continuous monitoring, not point-in-time audits" (clear methodology difference)

### Example Weak/Generic Language
❌ "Innovative approach to security"
❌ "Best-in-class solutions"
❌ "Cutting-edge technology"
❌ "Digital marketing services" (what kind?)
❌ "We help businesses succeed" (how?)

---

## Agent 3: Technical Level Agent

### Purpose
Assess whether the content is written at an appropriate technical level for each identified audience.

### Inputs
```json
{
  "audiences": [...], // all identified audiences
  "content": {...}
}
```

### Process
1. Analyze technical sophistication of the content:
   - Jargon density
   - Domain-specific terminology
   - Assumed background knowledge
   - Complexity of concepts
2. For each audience, assess match:
   - Is content too technical for this audience?
   - Is content too vague/simplistic for this audience?
   - Is it appropriately matched?

### Outputs
```json
{
  "agent": "technical_level_assessment",
  "content_sophistication": {
    "overall_level": 8, // scale 1-10
    "jargon_density": "high",
    "assumed_knowledge": "deep cloud infrastructure expertise",
    "examples": [
      {
        "quote": "Leverages eBPF for kernel-level network observability",
        "technical_level": 9,
        "source": "homepage"
      }
    ]
  },
  "audience_appropriateness": [
    {
      "audience_id": "aud_1",
      "audience_description": "CISOs at Fortune 500 financial institutions",
      "match": "appropriate",
      "explanation": "CISOs will understand cloud security terminology and appreciate technical depth",
      "recommendation": "none"
    },
    {
      "audience_id": "aud_3",
      "audience_description": "CFOs and budget approvers",
      "match": "too_technical",
      "explanation": "CFOs won't understand 'eBPF' or 'kernel-level observability'. Business value is obscured by technical jargon.",
      "recommendation": "Add sections that translate technical capabilities into business outcomes (cost savings, risk reduction, time savings)",
      "problematic_examples": [
        {"quote": "eBPF-based monitoring", "source": "homepage"},
        {"quote": "Custom OPA policies for Kubernetes admission control", "source": "features"}
      ]
    }
  ]
}
```

### Prompt Guidelines
- Consider each audience's likely background knowledge
- Technical buyers can handle jargon; budget approvers often can't
- "Too vague" is also a problem (technical audiences want specifics)
- Highlight specific phrases that are too technical or too generic

---

## Agent 4: Importance Agent

### Purpose
Assess whether the content conveys WHY each audience should care—i.e., the importance or value of what's being offered.

### Inputs
```json
{
  "audiences": [...],
  "content": {...}
}
```

### Process
For each audience, evaluate:
1. Is there a clear problem articulated that this audience faces?
2. Is the value proposition stated in terms this audience cares about?
3. Is there urgency or significance conveyed?

### Outputs
```json
{
  "agent": "importance_assessment",
  "assessments": [
    {
      "audience_id": "aud_1",
      "audience_description": "CISOs at Fortune 500 financial institutions",
      "importance_conveyed": true,
      "explanation": "Clear articulation of compliance risk and audit burden faced by CISOs",
      "citations": [
        {
          "quote": "Manual compliance audits take 2-3 months and miss critical vulnerabilities",
          "source": "homepage",
          "relevance": "States problem CISOs face"
        },
        {
          "quote": "Reduce audit time by 90% while increasing accuracy",
          "source": "homepage",
          "relevance": "Quantified value proposition"
        }
      ]
    },
    {
      "audience_id": "aud_3",
      "audience_description": "CFOs and budget approvers",
      "importance_conveyed": false,
      "explanation": "No mention of cost implications, ROI, or financial risk. CFOs won't understand why this matters to the business.",
      "missing": "Business case, cost-benefit analysis, risk quantification, competitor costs"
    }
  ]
}
```

### Prompt Guidelines
- Look for problem statements (what pain does this solve?)
- Look for value articulation (why should I care?)
- Different audiences care about different things:
  - Technical: Better/faster/more reliable solutions
  - Budget: ROI, cost savings, risk mitigation
  - End users: Ease of use, time savings
- Generic claims ("helps your business succeed") don't count

---

## Agent 5: Voice & Personality Agent

### Purpose
Assess whether the content conveys a distinct voice, tone, and sense of who these people are.

### Inputs
```json
{
  "content": {...}
}
```

### Process
Evaluate:
1. **Voice consistency**: Is there a recognizable tone throughout?
2. **Personality indicators**: Can you sense what kind of people/company this is?
3. **Values/principles**: Are organizational values evident?
4. **Vibe**: Serious engineers? Laid-back creatives? Buttoned-up enterprise? Scrappy startup?

### Outputs
```json
{
  "agent": "voice_personality_assessment",
  "voice_present": true,
  "personality_type": "serious_technical_professionals",
  "confidence": 7,
  "assessment": {
    "consistency": true,
    "description": "Consistently formal, precise, technical tone throughout. Sounds like experienced security engineers who prioritize accuracy over personality.",
    "indicators": [
      {
        "trait": "precision",
        "evidence": "Uses specific metrics, technical terminology consistently",
        "citations": [
          {"quote": "99.97% uptime SLA", "source": "homepage"},
          {"quote": "Sub-millisecond latency for real-time detection", "source": "features"}
        ]
      },
      {
        "trait": "seriousness",
        "evidence": "No humor, minimal personality, focuses on technical credibility",
        "citations": []
      }
    ],
    "values_evident": ["accuracy", "expertise", "reliability"],
    "vibe": "This is a company of serious security experts who want you to trust their technical chops, not their ability to tell jokes. They're the people you want when there's a breach, not at a happy hour."
  },
  "strengths": "Voice is consistent and appropriate for security context",
  "weaknesses": "Could be more memorable—nothing distinctive about the personality itself"
}
```

### Prompt Guidelines
- Voice ≠ just formality level
- Look for consistency: does homepage match about page match deck?
- Identify if voice is DISTINCTIVE or generic
- Note when there's NO apparent voice (just corporate boilerplate)
- Consider if voice matches audience expectations

---

## Agent 6: Vividness & Storytelling Agent

### Purpose
Assess whether the language is vivid, memorable, and emotionally engaging—or generic and forgettable.

**Note**: This is the hardest dimension and will require iteration. MVP uses strong prompts; post-MVP may use fine-tuned model.

### Inputs
```json
{
  "content": {...}
}
```

### Process
Evaluate:
1. **Vividness**: Is the language specific and concrete vs vague and abstract?
2. **Memorability**: Would someone remember phrases a day/week/month later?
3. **Emotional engagement**: Does language create feeling, not just convey information?
4. **Storytelling**: Are there narratives (even brief ones) or just feature lists?

Compare generic corporate language against vivid alternatives.

### Outputs
```json
{
  "agent": "vividness_storytelling_assessment",
  "overall_assessment": "generic",
  "score": 3,
  "findings": {
    "vivid_language": {
      "present": false,
      "examples": []
    },
    "generic_language": {
      "present": true,
      "examples": [
        {
          "quote": "We leverage innovative solutions to help businesses succeed",
          "source": "homepage",
          "critique": "Meaningless business-speak. 'Leverage', 'innovative', 'solutions', 'help businesses succeed' are all empty phrases that could apply to any company."
        },
        {
          "quote": "Our cutting-edge platform provides best-in-class security",
          "source": "about",
          "critique": "'Cutting-edge', 'best-in-class'—generic marketing adjectives without substance."
        }
      ]
    },
    "storytelling": {
      "present": false,
      "assessment": "No narratives. Only feature lists and generic testimonials ('Great product! - John D.')."
    },
    "memorability": {
      "score": 2,
      "assessment": "Nothing distinctive would stick in memory. Language is interchangeable with any security vendor."
    }
  },
  "recommendations": [
    "Replace generic phrases like 'innovative solutions' with specific examples of what you do differently",
    "Use concrete metaphors or analogies to make technical concepts memorable",
    "Include brief customer stories with specific details (not just 'increased efficiency by 40%')",
    "Show, don't tell: Instead of 'fast', say 'results in 24 hours not 2 weeks'"
  ]
}
```

### Prompt Guidelines (MVP - will evolve)
- **Generic triggers**: "innovative", "cutting-edge", "best-in-class", "solutions", "help businesses succeed", "leverage", "game-changing", "revolutionary"
- **Vivid indicators**: Specific numbers, concrete comparisons, sensory language, metaphors, brief narratives
- **Examples to train agent**:
  - ❌ Generic: "We provide fast results"
  - ✅ Vivid: "Get your compliance report by Friday morning, not next quarter"
  - ❌ Generic: "Our platform is user-friendly"
  - ✅ Vivid: "Your team will be running audits in 15 minutes, not 15 days of training"

**Post-MVP**: Fine-tune model on Adam's assessments of vivid vs generic language from journalism/consulting work.

---

## Agent 7: Citation Validation Agent

### Purpose
Verify that every quote used by other agents actually exists in the source material. Prevent hallucination.

### Inputs
```json
{
  "all_agent_outputs": [...], // outputs from agents 1-6
  "source_content": {...}
}
```

### Process
1. Extract all quotes from all agent outputs
2. For each quote, search source material for exact or near-exact match
3. Verify source attribution is correct
4. Flag any quotes that cannot be validated
5. Return validated citation list

### Outputs
```json
{
  "agent": "citation_validation",
  "validation_results": [
    {
      "quote": "Automated compliance auditing for AWS, Azure, and GCP",
      "claimed_source": "homepage",
      "claimed_section": "hero",
      "validated": true,
      "exact_match": true,
      "actual_location": "homepage, hero section, line 12"
    },
    {
      "quote": "Our innovative approach to security",
      "claimed_source": "homepage",
      "claimed_section": "about",
      "validated": true,
      "exact_match": false,
      "actual_quote": "Our innovative approach to cloud security compliance",
      "note": "Slight paraphrase but meaning preserved"
    },
    {
      "quote": "Trusted by over 500 enterprises",
      "claimed_source": "homepage",
      "validated": false,
      "error": "Cannot find this claim anywhere in source material",
      "action": "Remove from report"
    }
  ],
  "validation_summary": {
    "total_quotes": 47,
    "validated": 45,
    "flagged": 2,
    "exact_matches": 38,
    "close_matches": 7
  }
}
```

### Prompt Guidelines
- Require exact or very close matches
- Flag paraphrases that change meaning
- When in doubt, remove the citation (better to have no example than false example)
- This agent has veto power: if citation can't be validated, it doesn't go in report

---

## Agent 8: Synthesis/Editor Agent

### Purpose
Take all agent outputs and synthesize them into a cohesive, strongly-worded narrative report.

### Inputs
```json
{
  "all_agent_outputs": {
    "audience_identification": {...},
    "clarity_assessments": [...],
    "technical_level": {...},
    "importance": {...},
    "voice_personality": {...},
    "vividness": {...},
    "validated_citations": {...}
  }
}
```

### Process
1. Read all agent assessments
2. Identify key themes and patterns
3. Create narrative that:
   - Leads with direct, honest overall assessment
   - Organizes findings logically
   - Uses specific examples (validated citations only)
   - Provides thorough, somewhat intimidating recommendations
   - Ends with gentle CTA

### Outputs
```json
{
  "agent": "synthesis_editor",
  "report_sections": {
    "executive_summary": "Your website does not clearly communicate what makes you different from competitors. While technical security professionals will understand your basic offering, business decision-makers will struggle to see why they should choose you. Your language is generic corporate-speak that won't be remembered an hour after someone reads it, let alone a day or week later.",
    
    "detailed_findings": {
      "audience_analysis": "...",
      "clarity": "...",
      "technical_appropriateness": "...",
      "importance_value": "...",
      "voice_personality": "...",
      "vividness_storytelling": "..."
    },
    
    "recommendations": [
      {
        "priority": "critical",
        "area": "differentiation",
        "recommendation": "Replace vague claims like 'innovative approach' with specific, measurable differences. For example: 'We generate compliance reports in 24 hours vs the industry standard of 2-3 months' or 'Our eBPF-based monitoring catches vulnerabilities that signature-based systems miss.' Without this, prospects cannot rationally choose you over alternatives.",
        "example_fix": "..."
      },
      // ... more recommendations
    ],
    
    "call_to_action": "Clarifying your narrative and making it memorable requires deep expertise in both storytelling and your technical domain. This is work we do every day with Fortune 500 companies. If you'd like to discuss how we can help sharpen your story, we'd welcome a conversation."
  }
}
```

### Prompt Guidelines
- **Be direct**: "I don't know what you do" is valid feedback
- **Be specific**: Always tie criticism to exact quotes
- **Be constructive**: Explain WHY something is a problem and WHAT to do instead
- **Be thorough**: Recommendations should be detailed enough to seem complex (gentle intimidation)
- **Don't be cruel**: Honest ≠ mean. Professional critical analysis, not insults.

### Tone Examples

**Good:**
> "Your homepage states you 'provide innovative cloud security solutions' (homepage, hero section). This phrase is meaningless—every cloud security vendor claims to be innovative. You've given readers no reason to remember you or choose you over competitors. Specificity is what creates differentiation: Are you faster? More thorough? Easier to use? Do you support unique environments? None of this is evident."

**Too soft:**
> "Your messaging could be more specific."

**Too harsh:**
> "This is the worst website I've ever seen. Whoever wrote this has no idea what they're doing."

---

## Agent Iteration Strategy

### MVP: Get It Working
- Use strong prompts with examples
- Accept that vividness assessment will be imperfect
- Focus on binary assessments (clear/unclear, present/absent)
- Manual review by Adam of sample outputs

### Post-MVP: Refinement
- Collect Adam's manual assessments of reports
- A/B test different agent prompts
- Identify patterns in what works/doesn't
- Consider fine-tuning for vividness agent

### Evaluation Approach
1. **Ground truth dataset**: Adam manually evaluates 20-30 company websites
2. **Agent evaluation**: Run same websites through agent system
3. **Comparison**: Where does agent match Adam's assessment? Where does it diverge?
4. **Iteration**: Refine prompts based on mismatches
5. **A/B testing**: Try different agent configurations (sequential vs parallel, different prompt styles, etc.)

---

## Dependencies Between Agents
```
Audience Identification
    ↓
    ├─→ Clarity Agents (requires audience list)
    ├─→ Technical Level (requires audience list)
    ├─→ Importance (requires audience list)
    │
    ↓
Voice/Personality (no dependencies)
Vividness/Storytelling (no dependencies)
    │
    ↓
Citation Validation (requires all outputs)
    ↓
Synthesis/Editor (requires all validated outputs)
```

**Key insight**: Audience identification MUST complete before most other agents can run. Clarity/Technical/Importance all need to know who they're evaluating for.

Voice and Vividness can run in parallel with others since they're audience-agnostic.

---

## Future Agent Enhancements

### Story Generation Agent (Post-MVP)
Create example narratives that show what vivid storytelling could look like for this company.

**Inputs**: 
- Company understanding (from clarity agents)
- Audience profiles
- Existing vividness assessment

**Outputs**:
- 2-3 example narratives showing vivid alternatives
- Side-by-side comparison with existing generic language

### Competitive Comparison Agent
Compare this company's storytelling against competitors.

### Industry Benchmark Agent
Evaluate storytelling against industry norms.

### Longitudinal Tracking Agent
For paid clients, track narrative improvement over time.