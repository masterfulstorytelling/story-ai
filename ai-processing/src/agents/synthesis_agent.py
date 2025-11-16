"""Synthesis/Editor Agent - Generates brutally honest report with validated citations using Tool Use."""

from datetime import datetime, UTC
from typing import Dict, Any, Optional
from anthropic import Anthropic

from src.config.env import load_env_config
from src.utils.logger import get_logger
from src.utils.tool_schemas import SYNTHESIS_TOOL

logger = get_logger(__name__)
env = load_env_config()


def generate_report(
    all_agent_outputs: Dict[str, Any], failed_agents: Optional[list[str]] = None
) -> Dict[str, Any]:
    """
    Generate final evaluation report from all agent outputs.

    Args:
        all_agent_outputs: Dictionary of all agent outputs
        failed_agents: Optional list of agent names that failed (for noting limitations)

    Returns:
        Dictionary with report content
    """
    client = Anthropic(api_key=env.anthropic_api_key)

    # Prepare agent outputs summary
    validated_citations = str(
        all_agent_outputs.get("citation_validation_agent", {}).get("validated_citations", [])
    )
    outputs_summary = f"""
Audience Identification: {all_agent_outputs.get('audience_identification', {})}
Clarity Assessments: {all_agent_outputs.get('clarity_agent', {})}
Technical Level: {all_agent_outputs.get('technical_level_agent', {})}
Importance: {all_agent_outputs.get('importance_agent', {})}
Voice: {all_agent_outputs.get('voice_agent', {})}
Vividness: {all_agent_outputs.get('vividness_agent', {})}
Validated Citations: {validated_citations}
"""

    # Build limitations note if any agents failed
    limitations_note = ""
    if failed_agents:
        limitations_note = (
            f"\n\nIMPORTANT: Some assessments are incomplete due to processing errors. "
            f"Failed agents: {', '.join(failed_agents)}. "
            f"Please note these limitations in the report and indicate which sections "
            f"may be incomplete or missing."
        )

    prompt = f"""Generate a brutally honest evaluation report based on these agent assessments.

Agent Outputs:
{outputs_summary[:15000]}{limitations_note}

CRITICAL INSTRUCTIONS FOR AUDIENCE EVALUATION:

1. First, identify the IMPLIED audience from the content analysis:
   - Analyze the technical level, terminology, and knowledge required
   - Identify what profession, educational level, or knowledge level would easily understand this material
   - If the content is highly technical, the implied audience is a technical/professional audience, NOT "general audience"
   - If no clear implied audience can be identified, explicitly state: "Unable to identify clear implied audience from content"

2. Then, evaluate effectiveness for THREE STANDARD TIERS (always evaluate these, regardless of identified audiences):
   - **Technical Audience**: People who understand the material and have domain expertise
   - **Budget Approver**: Decision-makers (CFOs, CTOs, executives) who likely don't fully understand the technical material but need to approve budgets
   - **General Audience**: People with no specialized knowledge of the domain

3. ALSO evaluate for any ADDITIONAL AUDIENCES identified from content analysis or user-provided audiences (beyond the three standard tiers)

4. For EACH tier and additional audience, evaluate:
   - Clarity (what they do, how they're different, who uses them)
   - Technical Appropriateness (is the content at the right level?)
   - Importance & Value (why should they care?)

5. The report must show scores and assessments for ALL THREE STANDARD TIERS plus any additional identified audiences.

Create a comprehensive report with:
1. Executive Summary - Brutally honest overall assessment, name the specific business problem. Include scores for all three standard tiers (and any additional identified audiences).
2. Audience Analysis - Who the content is IMPLIED to be written for (from content analysis), then list all audiences being evaluated (three standard tiers + any additional identified audiences)
3. Clarity Assessment - For EACH audience (all three standard tiers + any additional identified audiences), evaluate what/why/who clarity with scores
4. Technical Appropriateness - For EACH audience (all three standard tiers + any additional identified audiences), assess if content level matches audience level with scores
5. Importance & Value - For EACH audience (all three standard tiers + any additional identified audiences), evaluate why they should care with scores
6. Voice & Personality - Distinct voice assessment (applies to all audiences)
7. Storytelling & Memorability - Vividness assessment (applies to all audiences)
8. Recommendations - Specific, actionable recommendations addressing gaps across all evaluated audiences
9. Next Steps - Gentle CTA for Feedforward AI services

Be direct and unsparing. Include quantified scores for all three standard tiers AND any additional identified audiences. Use only validated citations.
Return the report content as a structured text.
"""
    if failed_agents:
        prompt += (
            f"\nNote: Some assessments may be incomplete due to processing errors "
            f"in: {', '.join(failed_agents)}. Please indicate limitations where applicable."
        )

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=4000,
            tools=[SYNTHESIS_TOOL],
            tool_choice={"type": "tool", "name": "record_synthesis_report"},
            messages=[{"role": "user", "content": prompt}],
        )

        # Extract tool use response
        tool_use_block = None
        for block in response.content:
            if block.type == "tool_use" and block.name == "record_synthesis_report":
                tool_use_block = block
                break

        if not tool_use_block:
            logger.warning(
                "No tool_use block found in synthesis response, using default",
                extra={
                    "response_content_types": [block.type for block in response.content],
                },
            )
            report_data = {
                "executive_summary": "Default summary due to missing tool use block",
                "audience_analysis": {
                    "implied_audience": "Unknown",
                    "evaluated_audiences": []
                },
                "clarity_assessment": "No assessment available",
                "technical_appropriateness": "No assessment available",
                "importance_value": "No assessment available",
                "voice_personality": "No assessment available",
                "storytelling_memorability": "No assessment available",
                "recommendations": [],
                "next_steps": "Please contact Feedforward AI for a comprehensive assessment."
            }
        else:
            report_data = tool_use_block.input

        result = {
            "agent_name": "synthesis_agent",
            "timestamp": datetime.now(UTC).isoformat(),
            "report_content": report_data,  # Now this is structured JSON, not plain text
        }

        # Add limitations metadata if any agents failed
        if failed_agents:
            note = (
                f"Some assessments may be incomplete due to processing errors in: "
                f"{', '.join(failed_agents)}"
            )
            result["limitations"] = {
                "failed_agents": failed_agents,
                "note": note,
            }

        return result
    except Exception as e:
        logger.error(
            f"Error generating report: {e}",
            exc_info=True,
            extra={"failed_agents": failed_agents} if failed_agents else {},
        )
        return {
            "agent_name": "synthesis_agent",
            "timestamp": datetime.now(UTC).isoformat(),
            "report_content": {
                "executive_summary": "Error generating report. Please try again.",
                "audience_analysis": {
                    "implied_audience": "Error",
                    "evaluated_audiences": []
                },
                "clarity_assessment": "Error in evaluation",
                "technical_appropriateness": "Error in evaluation",
                "importance_value": "Error in evaluation",
                "voice_personality": "Error in evaluation",
                "storytelling_memorability": "Error in evaluation",
                "recommendations": [],
                "next_steps": "Please try again or contact support."
            },
        }
