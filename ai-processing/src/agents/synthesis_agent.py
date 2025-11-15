"""Synthesis/Editor Agent - Generates brutally honest report with validated citations."""

from datetime import datetime, UTC
from typing import Dict, Any, Optional
from anthropic import Anthropic

from src.config.env import load_env_config
from src.utils.logger import get_logger

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

Create a comprehensive report with:
1. Executive Summary - Brutally honest overall assessment, name the specific business problem
2. Audience Analysis - Who the content is written for
3. Clarity Assessment - Per audience, what/why/who clarity
4. Technical Appropriateness - Per audience, technical level match
5. Importance & Value - Per audience, why should they care
6. Voice & Personality - Distinct voice assessment
7. Storytelling & Memorability - Vividness assessment
8. Recommendations - Specific, actionable recommendations
9. Next Steps - Gentle CTA for Feedforward AI services

Be direct and unsparing. Include quantified scores. Use only validated citations.
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
            messages=[{"role": "user", "content": prompt}],
        )

        report_content = response.content[0].text

        result = {
            "agent_name": "synthesis_agent",
            "timestamp": datetime.now(UTC).isoformat(),
            "report_content": report_content,
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
        logger.error(f"Error generating report: {e}")
        return {
            "agent_name": "synthesis_agent",
            "timestamp": datetime.now(UTC).isoformat(),
            "report_content": "Error generating report. Please try again.",
        }
