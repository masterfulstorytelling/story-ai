"""Citation Validation Agent - Validates all citations against source material."""

from datetime import datetime, UTC
from typing import Dict, Any, List
from difflib import SequenceMatcher

from src.utils.logger import get_logger

logger = get_logger(__name__)


def similarity(a: str, b: str) -> float:
    """Calculate similarity ratio between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def validate_citation(quote: str, source_text: str) -> Dict[str, Any]:
    """
    Validate a single citation using multi-stage validation.

    Args:
        quote: The quote to validate
        source_text: Source text to search in

    Returns:
        Dictionary with validation results
    """
    quote_clean = quote.strip()
    source_lower = source_text.lower()

    # Stage 1: Exact match
    if quote_clean.lower() in source_lower:
        return {
            "quote": quote,
            "validated": True,
            "method": "exact",
            "location": source_text.lower().find(quote_clean.lower()),
        }

    # Stage 2: Fuzzy match (85%+ similarity)
    best_similarity = 0.0

    # Try sliding window approach
    for i in range(len(source_text) - len(quote_clean)):
        window = source_text[i : i + len(quote_clean) + 100]
        sim = similarity(quote_clean, window)
        if sim > best_similarity:
            best_similarity = sim

    if best_similarity >= 0.85:
        return {
            "quote": quote,
            "validated": True,
            "method": "fuzzy",
            "similarity": best_similarity,
        }

    # Stage 3: Semantic validation would go here (using embeddings)
    # For now, reject if exact and fuzzy both fail
    return {
        "quote": quote,
        "validated": False,
        "error": "Quote not found in source material",
    }


def validate_citations(
    all_agent_outputs: Dict[str, Any], source_content: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Validate all citations in agent outputs against source content.

    Args:
        all_agent_outputs: Dictionary of all agent outputs
        source_content: Source content dictionary

    Returns:
        Dictionary with validated citations
    """
    # Extract all source text
    source_text = ""
    if "scraped_content" in source_content:
        scraped = source_content["scraped_content"]
        if "homepage" in scraped:
            source_text += scraped["homepage"].get("text", "")
        if "about_page" in scraped:
            source_text += scraped["about_page"].get("text", "")

    if "uploaded_content" in source_content:
        for file_content in source_content["uploaded_content"]:
            source_text += file_content.get("text", "")

    validated_citations = []

    # Extract citations from all agent outputs
    def extract_citations(obj: Any, path: str = "") -> List[Dict[str, Any]]:
        """Recursively extract citations from nested structure."""
        citations = []
        if isinstance(obj, dict):
            if "quote" in obj and "source" in obj:
                citations.append({**obj, "path": path})
            for key, value in obj.items():
                citations.extend(extract_citations(value, f"{path}.{key}" if path else key))
        elif isinstance(obj, list):
            for item in obj:
                citations.extend(extract_citations(item, path))
        return citations

    all_citations = extract_citations(all_agent_outputs)

    # Validate each citation
    for citation in all_citations:
        quote = citation.get("quote", "")
        if quote:
            validation_result = validate_citation(quote, source_text)
            validated_citations.append(
                {
                    **citation,
                    **validation_result,
                }
            )

    return {
        "agent_name": "citation_validation_agent",
        "timestamp": datetime.now(UTC).isoformat(),
        "validated_citations": validated_citations,
    }
