"""Shared Tool Use schemas for Anthropic API to guarantee JSON output structure.

This module defines consistent JSON schemas for all agents using Anthropic's Tool Use API.
Tool Use guarantees valid JSON conforming to the schema, eliminating parsing errors.
"""

# Common reusable schema components
CITATION_SCHEMA = {
    "type": "object",
    "properties": {
        "quote": {"type": "string", "description": "Exact quote from the content"},
        "source": {
            "type": "string",
            "description": "Source of the quote (e.g., 'homepage', 'about page')",
        },
    },
    "required": ["quote", "source"],
}

EVIDENCE_SCHEMA = {
    "type": "object",
    "properties": {
        "quote": {"type": "string", "description": "Exact quote supporting the finding"},
        "source": {"type": "string", "description": "Source of the quote"},
    },
    "required": ["quote", "source"],
}

# Clarity Agent Tool
CLARITY_TOOL = {
    "name": "record_clarity_assessment",
    "description": "Record clarity evaluation for a specific audience across three dimensions",
    "input_schema": {
        "type": "object",
        "properties": {
            "overall_clarity_score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
                "description": "Overall clarity score (0-100)",
            },
            "overall_assessment": {
                "type": "string",
                "description": "Overall textual assessment of clarity",
            },
            "issues": {
                "type": "array",
                "description": "List of clarity issues identified",
                "items": {
                    "type": "object",
                    "properties": {
                        "category": {
                            "type": "string",
                            "description": (
                                "Category of clarity issue (e.g., 'what_they_do', "
                                "'how_theyre_different', 'who_uses_them')"
                            ),
                        },
                        "severity": {
                            "type": "string",
                            "enum": ["high", "medium", "low"],
                            "description": "Severity level of the issue",
                        },
                        "description": {
                            "type": "string",
                            "description": "Description of the clarity issue",
                        },
                        "evidence": {
                            "type": "array",
                            "description": "Supporting quotes from content",
                            "items": EVIDENCE_SCHEMA,
                        },
                    },
                    "required": ["category", "severity", "description"],
                },
            },
        },
        "required": ["overall_clarity_score", "overall_assessment"],
    },
}

# Technical Level Agent Tool
TECHNICAL_LEVEL_TOOL = {
    "name": "record_technical_level_assessment",
    "description": "Record technical level appropriateness for an audience",
    "input_schema": {
        "type": "object",
        "properties": {
            "technical_alignment_score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
                "description": "How well the technical level matches the audience (0-100)",
            },
            "audience_technical_level": {
                "type": "string",
                "description": (
                    "Expected technical level of the audience "
                    "(e.g., 'expert', 'intermediate', 'novice')"
                ),
            },
            "content_technical_level": {
                "type": "string",
                "description": "Actual technical level of the content",
            },
            "overall_assessment": {
                "type": "string",
                "description": "Overall assessment of technical level appropriateness",
            },
            "mismatches": {
                "type": "array",
                "description": "List of technical level mismatches",
                "items": {
                    "type": "object",
                    "properties": {
                        "mismatch_type": {
                            "type": "string",
                            "description": (
                                "Type of mismatch (e.g., 'too_technical', "
                                "'too_vague', 'jargon_heavy')"
                            ),
                        },
                        "severity": {"type": "string", "enum": ["high", "medium", "low"]},
                        "description": {
                            "type": "string",
                            "description": "Description of the mismatch",
                        },
                        "evidence": {"type": "array", "items": EVIDENCE_SCHEMA},
                    },
                    "required": ["mismatch_type", "severity", "description"],
                },
            },
        },
        "required": [
            "technical_alignment_score",
            "audience_technical_level",
            "content_technical_level",
            "overall_assessment",
        ],
    },
}

# Importance Agent Tool
IMPORTANCE_TOOL = {
    "name": "record_importance_assessment",
    "description": "Record importance/stakes assessment for an audience",
    "input_schema": {
        "type": "object",
        "properties": {
            "stakes_clarity_score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
                "description": "How clearly the stakes/importance are communicated (0-100)",
            },
            "overall_assessment": {
                "type": "string",
                "description": "Overall assessment of stakes clarity",
            },
            "stakes_identified": {
                "type": "array",
                "description": "List of stakes identified in the content",
                "items": {
                    "type": "object",
                    "properties": {
                        "stake_type": {
                            "type": "string",
                            "description": (
                                "Type of stake (e.g., 'financial', 'operational', "
                                "'reputational', 'compliance')"
                            ),
                        },
                        "description": {
                            "type": "string",
                            "description": "Description of the stake",
                        },
                        "clarity_level": {
                            "type": "string",
                            "enum": ["clear", "implied", "unclear"],
                            "description": "How clearly this stake is communicated",
                        },
                        "evidence": {"type": "array", "items": EVIDENCE_SCHEMA},
                    },
                    "required": ["stake_type", "description", "clarity_level"],
                },
            },
            "weaknesses": {
                "type": "array",
                "description": "Weaknesses in stakes communication",
                "items": {
                    "type": "object",
                    "properties": {
                        "weakness_type": {"type": "string", "description": "Type of weakness"},
                        "description": {
                            "type": "string",
                            "description": "Description of the weakness",
                        },
                    },
                    "required": ["weakness_type", "description"],
                },
            },
        },
        "required": ["stakes_clarity_score", "overall_assessment"],
    },
}

# Voice Agent Tool
VOICE_TOOL = {
    "name": "record_voice_assessment",
    "description": "Record voice consistency and characteristics assessment",
    "input_schema": {
        "type": "object",
        "properties": {
            "voice_consistency_score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
                "description": "How consistent the voice is across content (0-100)",
            },
            "dominant_voice_characteristics": {
                "type": "string",
                "description": "Description of the dominant voice characteristics",
            },
            "overall_assessment": {"type": "string", "description": "Overall voice assessment"},
            "voice_patterns": {
                "type": "array",
                "description": "Voice patterns detected in content",
                "items": {
                    "type": "object",
                    "properties": {
                        "pattern_type": {
                            "type": "string",
                            "description": (
                                "Type of voice pattern (e.g., 'authoritative', "
                                "'conversational', 'technical', 'sales-oriented')"
                            ),
                        },
                        "consistency_level": {
                            "type": "string",
                            "enum": ["consistent", "inconsistent", "mixed"],
                            "description": "How consistently this pattern appears",
                        },
                        "description": {
                            "type": "string",
                            "description": "Description of the pattern",
                        },
                        "evidence": {"type": "array", "items": EVIDENCE_SCHEMA},
                    },
                    "required": ["pattern_type", "consistency_level", "description"],
                },
            },
        },
        "required": [
            "voice_consistency_score",
            "dominant_voice_characteristics",
            "overall_assessment",
        ],
    },
}

# Vividness Agent Tool
VIVIDNESS_TOOL = {
    "name": "record_vividness_assessment",
    "description": "Record vividness and concreteness assessment",
    "input_schema": {
        "type": "object",
        "properties": {
            "vividness_score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
                "description": "Overall vividness/concreteness score (0-100)",
            },
            "overall_assessment": {"type": "string", "description": "Overall vividness assessment"},
            "vivid_elements": {
                "type": "array",
                "description": "Vivid elements identified in content",
                "items": {
                    "type": "object",
                    "properties": {
                        "element_type": {
                            "type": "string",
                            "description": (
                                "Type of vivid element (e.g., 'concrete_example', "
                                "'specific_metric', 'case_study', 'visual_language')"
                            ),
                        },
                        "effectiveness_rating": {
                            "type": "string",
                            "enum": ["high", "medium", "low"],
                            "description": "How effective this element is",
                        },
                        "description": {
                            "type": "string",
                            "description": "Description of the element",
                        },
                        "examples": {
                            "type": "array",
                            "description": "Examples from content",
                            "items": EVIDENCE_SCHEMA,
                        },
                    },
                    "required": ["element_type", "effectiveness_rating", "description"],
                },
            },
            "missed_opportunities": {
                "type": "array",
                "description": "Opportunities for more vivid/concrete content",
                "items": {
                    "type": "object",
                    "properties": {
                        "opportunity_type": {
                            "type": "string",
                            "description": "Type of missed opportunity",
                        },
                        "description": {
                            "type": "string",
                            "description": "Description of the opportunity",
                        },
                    },
                    "required": ["opportunity_type", "description"],
                },
            },
        },
        "required": ["vividness_score", "overall_assessment"],
    },
}

# Synthesis Agent Tool
SYNTHESIS_TOOL = {
    "name": "record_synthesis_report",
    "description": "Generate comprehensive evaluation report with all sections",
    "input_schema": {
        "type": "object",
        "properties": {
            "executive_summary": {
                "type": "string",
                "description": (
                    "Brutally honest executive summary identifying the core problem "
                    "and business impact. Include overall scores table for all three "
                    "standard tiers."
                ),
            },
            "audience_analysis": {
                "type": "object",
                "description": "Analysis of implied audience and all evaluated audiences",
                "properties": {
                    "implied_audience": {
                        "type": "string",
                        "description": (
                            "Who the content is IMPLIED to be written for based on "
                            "content analysis"
                        ),
                    },
                    "implied_audience_evidence": {
                        "type": "array",
                        "description": ("Evidence supporting the implied audience identification"),
                        "items": {"type": "string"},
                    },
                    "evaluated_audiences": {
                        "type": "array",
                        "description": (
                            "List of all audiences being evaluated "
                            "(3 standard tiers + additional identified)"
                        ),
                        "items": {
                            "type": "object",
                            "properties": {
                                "tier": {
                                    "type": "string",
                                    "description": (
                                        "Audience tier (e.g., 'Technical Audience', "
                                        "'Budget Approver', 'General Audience')"
                                    ),
                                },
                                "description": {
                                    "type": "string",
                                    "description": "Description of the audience",
                                },
                            },
                            "required": ["tier", "description"],
                        },
                    },
                },
                "required": ["implied_audience", "evaluated_audiences"],
            },
            "clarity_assessment": {
                "type": "string",
                "description": (
                    "Detailed clarity assessment FOR EACH AUDIENCE "
                    "(all three standard tiers + additional). "
                    "Evaluate what/why/who clarity with scores."
                ),
            },
            "technical_appropriateness": {
                "type": "string",
                "description": (
                    "Technical level appropriateness FOR EACH AUDIENCE "
                    "(all three standard tiers + additional). "
                    "Assess if content level matches audience level with scores."
                ),
            },
            "importance_value": {
                "type": "string",
                "description": (
                    "Importance and value assessment FOR EACH AUDIENCE "
                    "(all three standard tiers + additional). "
                    "Evaluate why they should care with scores."
                ),
            },
            "voice_personality": {
                "type": "string",
                "description": (
                    "Voice and personality assessment (applies to all audiences). "
                    "Distinct voice characteristics and consistency."
                ),
            },
            "storytelling_memorability": {
                "type": "string",
                "description": (
                    "Storytelling and vividness assessment (applies to all audiences). "
                    "Concrete examples, specificity, memorability."
                ),
            },
            "recommendations": {
                "type": "array",
                "description": (
                    "Specific, actionable recommendations addressing gaps across "
                    "all evaluated audiences"
                ),
                "items": {
                    "type": "object",
                    "properties": {
                        "priority": {
                            "type": "string",
                            "enum": ["high", "medium", "low"],
                            "description": "Priority level for this recommendation",
                        },
                        "audience": {
                            "type": "string",
                            "description": "Which audience(s) this recommendation addresses",
                        },
                        "recommendation": {
                            "type": "string",
                            "description": "The specific recommendation",
                        },
                        "rationale": {
                            "type": "string",
                            "description": "Why this recommendation matters",
                        },
                    },
                    "required": ["priority", "audience", "recommendation", "rationale"],
                },
            },
            "next_steps": {
                "type": "string",
                "description": (
                    "Gentle call-to-action for Feedforward AI services "
                    "(not pushy, consultative tone)"
                ),
            },
        },
        "required": [
            "executive_summary",
            "audience_analysis",
            "clarity_assessment",
            "technical_appropriateness",
            "importance_value",
            "voice_personality",
            "storytelling_memorability",
            "recommendations",
            "next_steps",
        ],
    },
}
