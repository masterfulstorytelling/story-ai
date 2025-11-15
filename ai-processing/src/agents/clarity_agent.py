"""Clarity Agent - Evaluates clarity of messaging for a specific audience."""

from datetime import datetime, UTC
from typing import Dict, Any
from anthropic import Anthropic

from src.config.env import load_env_config
from src.utils.logger import get_logger

logger = get_logger(__name__)
env = load_env_config()


def evaluate_clarity(audience: Dict[str, Any], content: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluate clarity of messaging for a specific audience.

    Args:
        audience: Audience dictionary with id and description
        content: Content dictionary with scraped_content and/or uploaded_content

    Returns:
        Dictionary matching agent interface contract
    """
    client = Anthropic(api_key=env.anthropic_api_key)

    # Prepare content text
    content_text = ""
    if "scraped_content" in content:
        scraped = content["scraped_content"]
        if "homepage" in scraped:
            content_text += f"Homepage: {scraped['homepage'].get('text', '')}\n\n"
        if "about_page" in scraped:
            content_text += f"About Page: {scraped['about_page'].get('text', '')}\n\n"

    if "uploaded_content" in content:
        for file_content in content["uploaded_content"]:
            filename = file_content.get("filename", "unknown")
            file_text = file_content.get("text", "")
            content_text += f"File {filename}: {file_text}\n\n"

    audience_desc = audience.get("description", "Unknown")
    prompt = f"""Evaluate the clarity of messaging for this specific audience: {audience_desc}

Content:
{content_text[:10000]}

Assess clarity across three dimensions:
1. What they do - Is it clear what the company/product does?
2. How they're different - Is it clear how they differ from competitors?
3. Who uses them - Is it clear who the target users/customers are?

For each dimension, provide:
- A score (0-100)
- A textual assessment
- Citations (quotes) from the content that support your assessment

Return JSON with assessments object containing what_they_do,
how_theyre_different, and who_uses_them, each with score, assessment,
and citations array.
"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = response.content[0].text

        # Parse response (simplified)
        import json
        import re

        json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if json_match:
            parsed_data = json.loads(json_match.group())
            # Handle nested structure: if AI returns {"assessments": {...}}, extract it
            if "assessments" in parsed_data and isinstance(parsed_data["assessments"], dict):
                assessments_data = parsed_data["assessments"]
            else:
                assessments_data = parsed_data
        else:
            # Default assessments
            assessments_data = {
                "what_they_do": {"score": 50, "assessment": "Default assessment"},
                "how_theyre_different": {"score": 50, "assessment": "Default assessment"},
                "who_uses_them": {"score": 50, "assessment": "Default assessment"},
            }

        return {
            "agent_name": "clarity_agent",
            "audience_id": audience.get("id"),
            "audience_description": audience.get("description"),
            "timestamp": datetime.now(UTC).isoformat() + "Z",
            "assessments": assessments_data,
        }
    except Exception as e:
        logger.error(f"Error in clarity evaluation: {e}")
        return {
            "agent_name": "clarity_agent",
            "audience_id": audience.get("id"),
            "audience_description": audience.get("description"),
            "timestamp": datetime.now(UTC).isoformat() + "Z",
            "assessments": {
                "what_they_do": {"score": 0, "assessment": "Error in evaluation"},
                "how_theyre_different": {"score": 0, "assessment": "Error in evaluation"},
                "who_uses_them": {"score": 0, "assessment": "Error in evaluation"},
            },
        }
