"""
Unit tests for PDF report generator.

TDD: These tests are written FIRST and should FAIL until the report generator is implemented.
"""

import pytest


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

        report_data = {
            "executive_summary": "Test summary",
            "audience_analysis": "Test analysis",
            "assessments": {},
            "recommendations": "Test recommendations",
        }

        pdf_content = generate_pdf_report(report_data)

        # Count pages in PDF (simplified check)
        page_count = pdf_content.count(b"/Type /Page")
        assert 2 <= page_count <= 5

    def test_includes_all_required_sections(self):
        """Test that report includes all required sections."""
        from src.report.generator import generate_pdf_report

        report_data = {
            "executive_summary": "Executive Summary",
            "audience_analysis": "Audience Analysis",
            "clarity_assessment": "Clarity Assessment",
            "technical_appropriateness": "Technical Appropriateness",
            "importance_value": "Importance & Value",
            "voice_personality": "Voice & Personality",
            "storytelling_memorability": "Storytelling & Memorability",
            "recommendations": "Recommendations",
            "next_steps": "Next Steps",
        }

        pdf_content = generate_pdf_report(report_data)

        # Convert to text for checking (simplified)
        pdf_text = pdf_content.decode("utf-8", errors="ignore")

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

        pdf_text = pdf_content.decode("utf-8", errors="ignore")
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

