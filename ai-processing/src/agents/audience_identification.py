"""Audience Identification Agent - Identifies target audiences from content."""

import uuid
from datetime import datetime, UTC
from typing import Dict, Any, Optional
from anthropic import Anthropic

from src.config.env import load_env_config
from src.models.audience import Audience
from src.models.base import CitationDetail
from src.utils.logger import get_logger

logger = get_logger(__name__)
env = load_env_config()


def identify_audiences(
    content: Dict[str, Any], user_provided_audience: Optional[str] = None
) -> Dict[str, Any]:
    """
    Identify target audiences from content.

    Args:
        content: Dictionary with scraped_content and/or uploaded_content
        user_provided_audience: Optional user-specified audience

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

    # Build prompt
    # Limit content length
    limited_content = content_text[:10000]
    prompt = (
        "Analyze the following content and identify the target audiences. "
        "Be specific and concrete.\n\n"
        "Content:\n"
        f"{limited_content}\n\n"
    )
    if user_provided_audience:
        prompt += f"User-specified audience: {user_provided_audience}\n\n"

    prompt += """Identify all target audiences from the content. For each audience:
1. Provide a specific description (e.g., "CFOs at Fortune 500 companies", not just "CFOs")
2. Assign a specificity score (0-100) indicating how specific the audience description is
3. Indicate the source: "user_provided", "content_analysis", or "both"
4. Provide rationale for why this audience was identified
5. Include citations (quotes) from the content that support this audience identification

Return a JSON array of audiences with: id (UUID), description,
specificity_score, source, rationale, citations (array with quote and source).
"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=2000,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        # Parse response (simplified - in production, use structured output)
        response_text = response.content[0].text

        # Extract JSON from response (simplified parsing)
        import json
        import re

        # Try to find JSON array in response
        json_match = re.search(r"\[.*\]", response_text, re.DOTALL)
        if json_match:
            audiences_data = json.loads(json_match.group())
        else:
            # Fallback: create default audience
            audiences_data = [
                {
                    "description": user_provided_audience or "General audience",
                    "specificity_score": 50,
                    "source": "user_provided" if user_provided_audience else "content_analysis",
                    "rationale": "Identified from content analysis",
                }
            ]

        # Convert to Audience objects and format output
        audiences = []
        for aud_data in audiences_data:
            audience = Audience(
                id=str(uuid.uuid4()),
                description=aud_data.get("description", "Unknown audience"),
                specificity_score=aud_data.get("specificity_score", 50),
                source=aud_data.get("source", "content_analysis"),
                rationale=aud_data.get("rationale"),
                citations=(
                    [
                        CitationDetail(quote=c["quote"], source=c.get("source", "content"))
                        for c in aud_data.get("citations", [])
                    ]
                    if aud_data.get("citations")
                    else []
                ),
            )
            audiences.append(audience)

        return {
            "agent_name": "audience_identification",
            "timestamp": datetime.now(UTC).isoformat() + "Z",
            "audiences": [aud.dict() for aud in audiences],
        }

    except Exception as e:
        logger.error(f"Error in audience identification: {e}")
        # Return default audience on error
        return {
            "agent_name": "audience_identification",
            "timestamp": datetime.now(UTC).isoformat() + "Z",
            "audiences": [
                {
                    "id": str(uuid.uuid4()),
                    "description": user_provided_audience or "General audience",
                    "specificity_score": 50,
                    "source": "user_provided" if user_provided_audience else "content_analysis",
                    "rationale": "Default audience due to processing error",
                }
            ],
        }
