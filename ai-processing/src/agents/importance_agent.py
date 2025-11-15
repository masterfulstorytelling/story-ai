"""Importance Agent - Evaluates why audience should care."""

from datetime import datetime, UTC
from typing import Dict, Any
from anthropic import Anthropic

from src.config.env import load_env_config
from src.utils.logger import get_logger

logger = get_logger(__name__)
env = load_env_config()


def evaluate_importance(audience: Dict[str, Any], content: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluate importance and relevance for audience."""
    client = Anthropic(api_key=env.anthropic_api_key)

    content_text = ""
    if "scraped_content" in content:
        scraped = content["scraped_content"]
        if "homepage" in scraped:
            content_text += scraped["homepage"].get("text", "")
    if "uploaded_content" in content:
        for file_content in content["uploaded_content"]:
            content_text += file_content.get("text", "")

    prompt = f"""Evaluate why this audience should care: {audience.get('description')}

Content: {content_text[:10000]}

Assess the importance and relevance. Provide score (0-100) and assessment.
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
            "agent_name": "importance_agent",
            "audience_id": audience.get("id"),
            "timestamp": datetime.now(UTC).isoformat(),
            "assessment": data.get("assessment", "Default"),
            "score": data.get("score", 50),
        }
    except Exception as e:
        logger.error(f"Error in importance evaluation: {e}")
        return {
            "agent_name": "importance_agent",
            "audience_id": audience.get("id"),
            "timestamp": datetime.now(UTC).isoformat(),
            "assessment": "Error in evaluation",
            "score": 0,
        }
