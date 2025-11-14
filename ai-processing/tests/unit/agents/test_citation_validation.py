"""
Unit tests for citation validation agent.

TDD: These tests are written FIRST and should FAIL until citation validation is implemented.
"""

import pytest


class TestCitationValidation:
    """Test citation validation functionality."""

    def test_exact_match_validation(self):
        """Test exact string matching for citations."""
        from src.agents.citation_validation_agent import validate_citation

        source_text = "This is the exact quote we want to validate."
        quote = "This is the exact quote we want to validate."

        result = validate_citation(quote, source_text)

        assert result["validated"] is True
        assert result["method"] == "exact"
        assert "location" in result

    def test_fuzzy_match_validation(self):
        """Test fuzzy matching for near-exact quotes."""
        from src.agents.citation_validation_agent import validate_citation

        source_text = "This is the exact quote we want to validate."
        quote = "This is the exact quote we want to validate"  # Missing period

        result = validate_citation(quote, source_text)

        assert result["validated"] is True
        assert result["method"] in ["exact", "fuzzy"]
        if result["method"] == "fuzzy":
            assert result["similarity"] >= 0.85

    def test_semantic_validation(self):
        """Test semantic similarity validation."""
        from src.agents.citation_validation_agent import validate_citation

        source_text = "Our company provides innovative solutions for enterprise clients."
        quote = "We offer cutting-edge solutions for large businesses."  # Semantically similar

        result = validate_citation(quote, source_text)

        # May validate via semantic similarity
        assert "validated" in result
        if result["validated"]:
            assert result["method"] in ["exact", "fuzzy", "semantic"]

    def test_rejects_fabricated_quotes(self):
        """Test that fabricated quotes are rejected."""
        from src.agents.citation_validation_agent import validate_citation

        source_text = "Our company provides innovative solutions."
        quote = "This quote does not exist in the source text at all."

        result = validate_citation(quote, source_text)

        assert result["validated"] is False
        assert "error" in result or "reason" in result

    def test_validates_all_citations_in_output(self):
        """Test validation of all citations in agent output."""
        from src.agents.citation_validation_agent import validate_citations

        all_agent_outputs = {
            "clarity_agent": {
                "assessments": {
                    "what_they_do": {
                        "citations": [
                            {"quote": "We build software", "source": "homepage"},
                        ]
                    }
                }
            }
        }

        source_content = {
            "scraped_content": {
                "homepage": {"text": "We build software for enterprises."}
            },
            "uploaded_content": [],
        }

        result = validate_citations(all_agent_outputs, source_content)

        assert "validated_citations" in result
        assert isinstance(result["validated_citations"], list)
        assert len(result["validated_citations"]) > 0

        for citation in result["validated_citations"]:
            assert "quote" in citation
            assert "validated" in citation
            assert "method" in citation or citation["validated"] is False

    def test_handles_missing_source(self):
        """Test handling of citations with missing source material."""
        from src.agents.citation_validation_agent import validate_citation

        source_text = "Limited source text."
        quote = "This quote is not in the source."

        result = validate_citation(quote, source_text)

        assert result["validated"] is False

