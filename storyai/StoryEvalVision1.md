# Corporate Storytelling Evaluation Tool - Vision Document

## The Problem

Most companies are terrible at communicating their story. They fail to clearly convey:
- What they do
- How they're different from competitors
- Who they serve and why those customers should care
- The personality and values of their organization
- Memorable, emotionally engaging narratives

When you visit their website or read their sales materials, you're left confused, bored, or unable to recall anything distinctive about them days later.

## The Solution

An AI-powered evaluation tool that assesses corporate storytelling across multiple dimensions using a multi-agent system. The tool analyzes websites, decks, and marketing materials to provide companies with a brutally honest assessment of their narrative quality—backed by specific examples and citations.

## Who This Serves

### Primary Audience (MVP)
**Prospects for Feedforward AI's consulting services**
- Companies that suspect their messaging isn't working
- Marketing/communications leaders seeking validation or diagnosis
- Business executives who want to understand why their story isn't resonating

### Secondary Audience (Future)
**Paid clients of Feedforward AI**
- Fortune 500 companies needing industrial-scale narrative assessment
- Enterprises evaluating multiple brands/products/divisions
- Organizations tracking storytelling improvements over time

## Why This Serves Them

### For Prospects (Lead Generation)
- Free or low-cost diagnostic that provides genuine value
- Demonstrates Feedforward AI's expertise and methodology
- Creates awareness of storytelling gaps they didn't know existed
- Intimidates them (in a good way) with the complexity of doing this well
- Natural pathway to scheduling a sales call

### For Paid Clients
- Scalable evaluation across multiple properties
- Consistent assessment methodology
- Baseline measurement for storytelling improvements
- Competitive intelligence on narrative effectiveness

## Success Criteria

### MVP Success (6 weeks)
1. **Functional pipeline**: URL/file input → multi-agent analysis → report generation
2. **Quality outputs**: Reports that Adam would stand behind as credible assessments
3. **Lead generation**: Prospects engage with the tool and request follow-up calls
4. **Technical foundation**: Architecture that scales to paid version

### Long-term Success
1. **Conversion rate**: X% of report recipients schedule sales calls
2. **Credibility**: Prospects say "this nailed our problem"
3. **Differentiation**: No competitor offers comparable automated storytelling assessment
4. **Scalability**: System handles paid client volumes with industrial reliability

## Key Principles

### 1. Bias Toward Simplicity
- Each agent does one thing extremely well
- Don't overload agents with multiple responsibilities
- Clear, focused outputs that feed downstream agents

### 2. Single-Purpose Agents
- One agent to identify audiences
- Separate agents to assess clarity for each audience
- Distinct agents for technical level, importance, vividness, etc.
- Agents shouldn't score AND write assessments AND provide examples—pick one

### 3. Audience-First Architecture
- Understanding who the content is for precedes all other evaluation
- Every assessment is contextualized by audience
- Multiple audiences require multiple parallel assessments

### 4. No Hallucination Tolerance
- Every quote must be validated against source material
- Citation tracking is non-negotiable
- Better to say "we found no examples" than to fabricate quotes

### 5. Strongly Opinionated Output
- Reports should be direct and unsparing
- "I don't know what your company does" is a valid assessment
- Recommendations should be thorough but intimidating (signals need for expert help)
- Back every criticism with specific quoted examples

### 6. Rapid Iteration on Agent Design
- Agent specifications will change constantly
- Build infrastructure to support fast experimentation
- Comprehensive evaluation/testing capability from day one
- A/B testing different agent configurations

## MVP Scope

### In Scope
- Web form for URL input + file upload
- Homepage + About page scraping
- Multi-agent analysis pipeline (clarity, voice, storytelling dimensions)
- Citation validation
- 2-5 page PDF report generation
- Email delivery
- Basic UI (functional, not polished)

### Out of Scope (Post-MVP)
- Conversational/VideoAsk-style intake
- Voice input
- Multi-language support
- Real-time analysis streaming
- Full-site scraping (beyond homepage + about)
- Custom branding per client
- API access for third parties
- Fine-tuned models for vividness assessment

## Future Vision

### Paid Client Version
- Industrial scale (analyze hundreds of properties)
- Custom evaluation dimensions per client
- Competitive benchmarking
- Longitudinal tracking (narrative improvement over time)
- Integration with client systems
- White-labeled reports
- Advanced analytics dashboard
- Fine-tuned models trained on Adam's assessments

### Additional Features
- Story generation (create example narratives showing what good looks like)
- Side-by-side competitor comparison
- Industry-specific evaluation frameworks
- Multi-language storytelling assessment
- Video/audio content analysis
- Real-time collaboration features

## Why Adam Davidson / Feedforward AI

This tool codifies tacit knowledge from:
- Co-founder of NPR's Planet Money
- Staff writer at The New Yorker and New York Times Magazine
- Author of "The Passion Economy"
- Decades of evaluating and crafting business narratives
- Deep understanding of what makes stories memorable vs forgettable

The tool isn't just running generic AI analysis—it's extracting and systematizing Adam's expert judgment at scale.

## Development Timeline

**Weeks 1-2**: Infrastructure + basic frontend + scraping
**Weeks 3-5**: Core agent pipeline + evaluation engine  
**Week 6**: Report generation + polish + testing

Post-MVP: Iterate on agent quality, then build paid version.