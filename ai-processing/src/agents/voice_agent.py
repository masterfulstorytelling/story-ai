"""Voice Agent - Evaluates voice, personality, and consistency."""

from datetime import datetime, UTC
from typing import Dict, Any
from anthropic import Anthropic

from src.config.env import load_env_config
from src.utils.logger import get_logger

logger = get_logger(__name__)
env = load_env_config()


def evaluate_voice(content: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluate voice and personality."""
    client = Anthropic(api_key=env.anthropic_api_key)

    content_text = ""
    if "scraped_content" in content:
        scraped = content["scraped_content"]
        if "homepage" in scraped:
            content_text += scraped["homepage"].get("text", "")
        if "about_page" in scraped:
            content_text += scraped["about_page"].get("text", "")
    if "uploaded_content" in content:
        for file_content in content["uploaded_content"]:
            content_text += file_content.get("text", "")

    prompt = f"""Evaluate the voice and personality of this content.

Content: {content_text[:10000]}

Assess: distinct voice, personality indicators, values/principles, tone consistency.
Return: overall_assessment (distinct/generic/mixed), score (0-100), and findings.
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
            data = {
                "overall_assessment": "mixed",
                "score": 50,
                "findings": {},
            }

        return {
            "agent_name": "voice_agent",
            "timestamp": datetime.now(UTC).isoformat(),
            "overall_assessment": data.get("overall_assessment", "mixed"),
            "score": data.get("score", 50),
            "findings": data.get("findings", {}),
        }
    except Exception as e:
        logger.error(f"Error in voice evaluation: {e}")
        return {
            "agent_name": "voice_agent",
            "timestamp": datetime.now(UTC).isoformat(),
            "overall_assessment": "generic",
            "score": 0,
            "findings": {},
        }
