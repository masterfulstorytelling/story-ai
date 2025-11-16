"""
Contract tests for agent interfaces.

These tests verify that agent implementations conform to the defined
interface contracts in contracts/agent-interfaces.yaml.

TDD: These tests are written FIRST and should FAIL until agents are implemented.
"""

import pytest
from datetime import datetime
from typing import Any, Dict
import uuid


class TestAgentInterfaceContracts:
    """Test that agent interfaces match contract specifications."""

    def test_audience_identification_agent_interface(self):
        """
        Test Audience Identification Agent interface contract.

        Contract requirements:
        - Input: content (scraped_content, uploaded_content), optional user_provided_audience
        - Output: agent_name, timestamp, audiences array with id, description, specificity_score, source
        """
        # This test will fail until the agent is implemented
        from src.agents.audience_identification import identify_audiences

        content = {
            "scraped_content": {
                "homepage": {"text": "Test homepage content", "url": "https://example.com"},
                "about_page": {"text": "Test about page content", "url": "https://example.com/about"},
            },
            "uploaded_content": [],
        }

        result = identify_audiences(content, user_provided_audience="CFOs at Fortune 500 companies")

        # Verify output structure matches contract
        assert "agent_name" in result
        assert result["agent_name"] == "audience_identification"
        assert "timestamp" in result
        assert isinstance(result["timestamp"], str)
        # Verify timestamp is valid ISO format
        datetime.fromisoformat(result["timestamp"].replace("Z", "+00:00"))

        assert "audiences" in result
        assert isinstance(result["audiences"], list)
        assert len(result["audiences"]) > 0

        # Verify each audience matches contract
        for audience in result["audiences"]:
            assert "id" in audience
            assert isinstance(audience["id"], str)
            # Verify UUID format
            uuid.UUID(audience["id"])

            assert "description" in audience
            assert isinstance(audience["description"], str)
            assert len(audience["description"]) > 0

            assert "specificity_score" in audience
            assert isinstance(audience["specificity_score"], int)
            assert 0 <= audience["specificity_score"] <= 100

            assert "source" in audience
            assert audience["source"] in ["user_provided", "content_analysis", "both"]

            if "rationale" in audience:
                assert isinstance(audience["rationale"], str)

            if "citations" in audience:
                assert isinstance(audience["citations"], list)
                for citation in audience["citations"]:
                    assert "quote" in citation
                    assert "source" in citation

    def test_clarity_agent_interface(self):
        """
        Test Clarity Agent interface contract.

        Contract requirements:
        - Input: audience, content
        - Output: agent_name, audience_id, audience_description, timestamp, assessments
        """
        from src.agents.clarity_agent import evaluate_clarity

        audience = {
            "id": str(uuid.uuid4()),
            "description": "CFOs at Fortune 500 companies",
        }

        content = {
            "scraped_content": {
                "homepage": {"text": "Test content", "url": "https://example.com"},
            },
            "uploaded_content": [],
        }

        result = evaluate_clarity(audience, content)

        # Verify output structure matches contract
        assert "agent_name" in result
        assert result["agent_name"] == "clarity_agent"
        assert "audience_id" in result
        assert result["audience_id"] == audience["id"]
        assert "audience_description" in result
        assert "timestamp" in result
        datetime.fromisoformat(result["timestamp"].replace("Z", "+00:00"))

        assert "assessments" in result
        assert isinstance(result["assessments"], dict)

        # Verify assessments structure
        assessments = result["assessments"]
        assert "what_they_do" in assessments
        assert "how_theyre_different" in assessments
        assert "who_uses_them" in assessments

        # Each assessment should have score, assessment, and citations
        for key in ["what_they_do", "how_theyre_different", "who_uses_them"]:
            assert "score" in assessments[key]
            assert isinstance(assessments[key]["score"], int)
            assert 0 <= assessments[key]["score"] <= 100
            assert "assessment" in assessments[key]
            if "citations" in assessments[key]:
                assert isinstance(assessments[key]["citations"], list)

    def test_technical_level_agent_interface(self):
        """Test Technical Level Agent interface contract."""
        from src.agents.technical_level_agent import evaluate_technical_level

        audience = {"id": str(uuid.uuid4()), "description": "CFOs"}

        content = {"scraped_content": {}, "uploaded_content": []}

        result = evaluate_technical_level(audience, content)

        assert "agent_name" in result
        assert result["agent_name"] == "technical_level_agent"
        assert "audience_id" in result
        assert "timestamp" in result
        assert "assessment" in result
        assert "score" in result
        assert 0 <= result["score"] <= 100

    def test_importance_agent_interface(self):
        """Test Importance Agent interface contract."""
        from src.agents.importance_agent import evaluate_importance

        audience = {"id": str(uuid.uuid4()), "description": "CFOs"}

        content = {"scraped_content": {}, "uploaded_content": []}

        result = evaluate_importance(audience, content)

        assert "agent_name" in result
        assert result["agent_name"] == "importance_agent"
        assert "audience_id" in result
        assert "timestamp" in result
        assert "assessment" in result
        assert "score" in result
        assert 0 <= result["score"] <= 100

    def test_voice_agent_interface(self):
        """Test Voice Agent interface contract."""
        from src.agents.voice_agent import evaluate_voice

        content = {"scraped_content": {}, "uploaded_content": []}

        result = evaluate_voice(content)

        assert "agent_name" in result
        assert result["agent_name"] == "voice_agent"
        assert "timestamp" in result
        assert "overall_assessment" in result
        assert result["overall_assessment"] in ["distinct", "generic", "mixed"]
        assert "score" in result
        assert 0 <= result["score"] <= 100

    def test_vividness_agent_interface(self):
        """Test Vividness Agent interface contract."""
        from src.agents.vividness_agent import evaluate_vividness

        content = {"scraped_content": {}, "uploaded_content": []}

        result = evaluate_vividness(content)

        assert "agent_name" in result
        assert result["agent_name"] == "vividness_storytelling_assessment"
        assert "timestamp" in result
        assert "overall_assessment" in result
        assert result["overall_assessment"] in ["vivid", "generic", "mixed"]
        assert "score" in result
        assert 0 <= result["score"] <= 100

    def test_citation_validation_agent_interface(self):
        """Test Citation Validation Agent interface contract."""
        from src.agents.citation_validation_agent import validate_citations

        all_agent_outputs = {
            "audience_identification": {"audiences": []},
            "clarity_agent": {"assessments": {}},
        }

        source_content = {"scraped_content": {}, "uploaded_content": []}

        result = validate_citations(all_agent_outputs, source_content)

        assert "agent_name" in result
        assert result["agent_name"] == "citation_validation_agent"
        assert "timestamp" in result
        assert "validated_citations" in result
        assert isinstance(result["validated_citations"], list)

    def test_synthesis_agent_interface(self):
        """Test Synthesis/Editor Agent interface contract."""
        from src.agents.synthesis_agent import generate_report

        all_agent_outputs = {
            "audience_identification": {"audiences": []},
            "clarity_agent": {},
            "technical_level_agent": {},
            "importance_agent": {},
            "voice_agent": {},
            "vividness_agent": {},
            "citation_validation_agent": {"validated_citations": []},
        }

        result = generate_report(all_agent_outputs)

        assert "agent_name" in result
        assert result["agent_name"] == "synthesis_agent"
        assert "timestamp" in result
        assert "report_content" in result
        # After Tool Use API migration, report_content is a dict (structured JSON)
        assert isinstance(result["report_content"], dict)
        assert "executive_summary" in result["report_content"]
        assert "audience_analysis" in result["report_content"]

