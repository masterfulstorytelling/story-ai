"""Technical Level Agent - Evaluates technical appropriateness for audience."""

from datetime import datetime, UTC
from typing import Dict, Any
from anthropic import Anthropic

from src.config.env import load_env_config
from src.utils.logger import get_logger

logger = get_logger(__name__)
env = load_env_config()


def evaluate_technical_level(audience: Dict[str, Any], content: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluate technical level appropriateness for audience."""
    client = Anthropic(api_key=env.anthropic_api_key)

    content_text = ""
    if "scraped_content" in content:
        scraped = content["scraped_content"]
        if "homepage" in scraped:
            content_text += scraped["homepage"].get("text", "")
    if "uploaded_content" in content:
        for file_content in content["uploaded_content"]:
            content_text += file_content.get("text", "")

    audience_desc = audience.get("description")
    prompt = f"""Evaluate if the technical level of content is appropriate for: {audience_desc}

Content: {content_text[:10000]}

Assess if content is: too technical, too vague, or appropriately matched for this audience.
Provide score (0-100), assessment text, and citations.
"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )

        import json
        import re

        response_text = response.content[0].text
        json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
        else:
            data = {"score": 50, "assessment": "Default assessment"}

        return {
            "agent_name": "technical_level_agent",
            "audience_id": audience.get("id"),
            "timestamp": datetime.now(UTC).isoformat(),
            "assessment": data.get("assessment", "Default"),
            "score": data.get("score", 50),
        }
    except Exception as e:
        logger.error(f"Error in technical level evaluation: {e}")
        return {
            "agent_name": "technical_level_agent",
            "audience_id": audience.get("id"),
            "timestamp": datetime.now(UTC).isoformat(),
            "assessment": "Error in evaluation",
            "score": 0,
        }
