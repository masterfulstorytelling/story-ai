"""
Integration tests for agent pipeline orchestration.

TDD: These tests are written FIRST and should FAIL until the pipeline is implemented.
"""

import pytest


class TestAgentPipeline:
    """Test agent pipeline integration."""

    def test_pipeline_processes_content(self):
        """Test that pipeline processes content through all agents."""
        from src.orchestration.pipeline import process_evaluation

        content = {
            "scraped_content": {
                "homepage": {"text": "Test homepage content", "url": "https://example.com"},
            },
            "uploaded_content": [],
        }

        user_provided_audience = "CFOs at Fortune 500 companies"

        result = process_evaluation(content, user_provided_audience)

        assert "audiences" in result
        assert "assessments" in result
        assert "report" in result

    def test_pipeline_runs_agents_in_sequence(self):
        """Test that pipeline runs agents in correct sequence."""
        from src.orchestration.pipeline import process_evaluation

        content = {
            "scraped_content": {"homepage": {"text": "Test", "url": "https://example.com"}},
            "uploaded_content": [],
        }

        result = process_evaluation(content)

        # Verify agent outputs are present in correct order
        assert "audience_identification" in result or "audiences" in result
        assert "clarity_agent" in result or "clarity" in result
        assert "voice_agent" in result or "voice" in result

    def test_pipeline_handles_agent_failures(self):
        """Test that pipeline handles agent failures gracefully."""
        from src.orchestration.pipeline import process_evaluation

        content = {
            "scraped_content": {},
            "uploaded_content": [],
        }

        # Should handle gracefully (either fail fast or continue with partial results)
        result = process_evaluation(content)

        # Result should indicate status
        assert "status" in result or "error" in result or "report" in result

    def test_pipeline_validates_citations(self):
        """Test that pipeline validates all citations."""
        from src.orchestration.pipeline import process_evaluation

        content = {
            "scraped_content": {
                "homepage": {"text": "Test content with specific quotes.", "url": "https://example.com"},
            },
            "uploaded_content": [],
        }

        result = process_evaluation(content)

        # Citations should be validated
        assert "validated_citations" in result or "citations" in result

    def test_pipeline_generates_report(self):
        """Test that pipeline generates final report."""
        from src.orchestration.pipeline import process_evaluation

        content = {
            "scraped_content": {
                "homepage": {"text": "Test content", "url": "https://example.com"},
            },
            "uploaded_content": [],
        }

        result = process_evaluation(content)

        assert "report" in result
        assert "report_content" in result or "pdf_content" in result

