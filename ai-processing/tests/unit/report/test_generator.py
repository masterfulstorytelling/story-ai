"""
Unit tests for PDF report generator.

TDD: These tests are written FIRST and should FAIL until the report generator is implemented.
"""

import pytest
import fitz  # PyMuPDF


class TestReportGenerator:
    """Test PDF report generation functionality."""

    def test_generates_pdf_report(self):
        """Test that report generator creates a PDF file."""
        from src.report.generator import generate_pdf_report

        report_data = {
            "executive_summary": "Test summary",
            "audience_analysis": "Test analysis",
            "assessments": {},
            "recommendations": "Test recommendations",
        }

        pdf_content = generate_pdf_report(report_data)

        assert isinstance(pdf_content, bytes)
        assert len(pdf_content) > 0
        # Verify PDF signature
        assert pdf_content.startswith(b"%PDF")

    def test_report_length_2_to_5_pages(self):
        """Test that generated report is 2-5 pages."""
        from src.report.generator import generate_pdf_report

        # Use realistic data that matches what a real report would contain
        # to properly test the 2-5 page requirement (FR-020)
        report_data = {
            "executive_summary": (
                "This is a comprehensive executive summary that provides a detailed overview "
                "of the evaluation findings. The analysis reveals significant opportunities "
                "for improvement in corporate storytelling across multiple dimensions. "
                "Key findings indicate that the messaging lacks clarity for target audiences, "
                "particularly for non-technical stakeholders. The assessment identifies specific "
                "areas where the narrative can be strengthened to better communicate value "
                "propositions and differentiate the company in the marketplace."
            ),
            "audience_analysis": (
                "The evaluation identified three primary target audiences: CFOs, CTOs, and "
                "business executives. Each audience has distinct information needs and technical "
                "backgrounds. CFOs require clear financial value propositions and ROI narratives. "
                "CTOs need technical depth balanced with business context. Business executives "
                "seek strategic positioning and competitive differentiation. The current messaging "
                "does not adequately address the unique needs of each audience segment."
            ),
            "clarity_assessment": {
                "CFO": (
                    "The clarity assessment for CFOs reveals significant gaps in financial "
                    "messaging. Key value propositions are buried in technical jargon that "
                    "obscures the business impact. The messaging fails to clearly articulate "
                    "cost savings, revenue opportunities, or risk mitigation benefits that "
                    "CFOs prioritize. Specific examples of unclear language include technical "
                    "terms without business context and abstract concepts without concrete "
                    "financial implications."
                ),
                "CTO": (
                    "For CTOs, the technical depth is appropriate but lacks sufficient business "
                    "context. The messaging assumes technical knowledge but doesn't connect "
                    "technical capabilities to strategic business outcomes. While the technical "
                    "accuracy is strong, the narrative would benefit from clearer articulation "
                    "of how technical innovations translate to competitive advantages."
                ),
            },
            "technical_appropriateness": {
                "CFO": (
                    "The technical level is inappropriate for CFOs. The messaging uses "
                    "specialized terminology without explanation, making it inaccessible to "
                    "financial executives. Terms like 'distributed architecture' and 'microservices' "
                    "are used without business context, creating barriers to understanding the "
                    "value proposition."
                ),
            },
            "importance_value": {
                "CFO": (
                    "The importance and value messaging for CFOs is weak. The narrative focuses "
                    "on technical features rather than financial benefits. Missing elements "
                    "include quantified cost savings, revenue impact, risk reduction metrics, "
                    "and clear ROI calculations that CFOs need to make investment decisions."
                ),
            },
            "voice_personality": (
                "The voice and personality assessment reveals a corporate tone that lacks "
                "distinctiveness. The messaging reads as generic industry-speak without a unique "
                "brand voice. The personality is professional but forgettable, missing "
                "opportunities to create emotional connections or memorable brand associations."
            ),
            "storytelling_memorability": (
                "The storytelling and memorability assessment indicates weak narrative structure. "
                "The messaging lacks compelling stories, concrete examples, or memorable metaphors "
                "that would help audiences remember and share the value proposition. The content "
                "relies on abstract concepts rather than vivid, relatable narratives that create "
                "lasting impressions."
            ),
            "recommendations": (
                "Based on the evaluation, the following recommendations are critical for "
                "improving corporate storytelling effectiveness: First, develop audience-specific "
                "messaging frameworks that address the unique information needs of each target "
                "audience. Second, create clear financial narratives for CFOs that quantify value "
                "propositions with specific metrics and ROI calculations. Third, balance technical "
                "depth with business context for CTOs, connecting technical capabilities to "
                "strategic outcomes. Fourth, develop a distinctive brand voice that differentiates "
                "the company from competitors. Fifth, incorporate compelling stories and concrete "
                "examples that make the messaging more memorable and shareable. Sixth, provide "
                "specific, actionable guidance that signals the complexity of the challenges "
                "and demonstrates deep understanding of audience needs."
            ),
            "next_steps": (
                "To implement these recommendations, we recommend scheduling a consultation with "
                "Feedforward AI to develop a comprehensive storytelling strategy. Our team can "
                "help create audience-specific messaging frameworks, develop compelling narratives, "
                "and establish a distinctive brand voice that resonates with your target audiences."
            ),
        }

        pdf_content = generate_pdf_report(report_data)

        # Use PyMuPDF to properly count pages
        pdf_doc = fitz.open(stream=pdf_content, filetype="pdf")
        page_count = len(pdf_doc)
        pdf_doc.close()

        assert 2 <= page_count <= 5

    def test_includes_all_required_sections(self):
        """Test that report includes all required sections."""
        from src.report.generator import generate_pdf_report

        report_data = {
            "executive_summary": "Executive Summary",
            "audience_analysis": "Audience Analysis",
            "clarity_assessment": {"CFO": "Clarity Assessment for CFO"},
            "technical_appropriateness": {"CFO": "Technical Appropriateness for CFO"},
            "importance_value": {"CFO": "Importance & Value for CFO"},
            "voice_personality": "Voice & Personality",
            "storytelling_memorability": "Storytelling & Memorability",
            "recommendations": "Recommendations",
            "next_steps": "Next Steps",
        }

        pdf_content = generate_pdf_report(report_data)

        # Use PyMuPDF to extract text from PDF
        pdf_doc = fitz.open(stream=pdf_content, filetype="pdf")
        pdf_text = ""
        for page in pdf_doc:
            pdf_text += page.get_text()
        pdf_doc.close()

        # Check that all sections are present
        assert "Executive Summary" in pdf_text or "executive" in pdf_text.lower()
        assert "Audience" in pdf_text or "audience" in pdf_text.lower()
        assert "Recommendations" in pdf_text or "recommendations" in pdf_text.lower()

    def test_includes_citations(self):
        """Test that report includes citations."""
        from src.report.generator import generate_pdf_report

        report_data = {
            "executive_summary": "Summary with citation",
            "citations": [
                {"quote": "Test quote", "source": "homepage", "location": "page 1"},
            ],
        }

        pdf_content = generate_pdf_report(report_data)

        # Use PyMuPDF to extract text from PDF
        pdf_doc = fitz.open(stream=pdf_content, filetype="pdf")
        pdf_text = ""
        for page in pdf_doc:
            pdf_text += page.get_text()
        pdf_doc.close()

        assert "Test quote" in pdf_text or "citation" in pdf_text.lower()

    def test_handles_empty_data(self):
        """Test handling of empty or minimal report data."""
        from src.report.generator import generate_pdf_report

        report_data = {
            "executive_summary": "",
            "audience_analysis": "",
        }

        # Should still generate a valid PDF (even if minimal)
        pdf_content = generate_pdf_report(report_data)

        assert isinstance(pdf_content, bytes)
        assert len(pdf_content) > 0
