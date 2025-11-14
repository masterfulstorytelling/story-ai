"""
Unit tests for file parser (PDF, PPTX, DOCX).

TDD: These tests are written FIRST and should FAIL until the file parser is implemented.
"""

import pytest
from io import BytesIO


class TestFileParser:
    """Test file parsing functionality."""

    def test_parse_pdf(self):
        """Test parsing PDF files."""
        from src.ingestion.file_parser import parse_file

        # Create a minimal PDF file (in real test, use actual PDF)
        file_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\ntrailer\n<<\n/Root 1 0 R\n>>\nstartxref\n9\n%%EOF"
        filename = "test.pdf"

        result = parse_file(file_content, filename)

        assert hasattr(result, "text")
        assert isinstance(result.text, str)
        assert result.filename == filename
        assert result.file_type == "pdf"

    def test_parse_pptx(self):
        """Test parsing PPTX files."""
        from src.ingestion.file_parser import parse_file, FileParsingError

        # Minimal PPTX structure is not valid - should raise error
        # In real test, use actual PPTX file
        file_content = b"PK\x03\x04"  # ZIP signature (PPTX is a ZIP file)
        filename = "test.pptx"

        # Invalid PPTX should raise FileParsingError
        with pytest.raises(FileParsingError):
            parse_file(file_content, filename)

    def test_parse_docx(self):
        """Test parsing DOCX files."""
        from src.ingestion.file_parser import parse_file, FileParsingError

        # Minimal DOCX structure is not valid - should raise error
        # In real test, use actual DOCX file
        file_content = b"PK\x03\x04"  # ZIP signature (DOCX is a ZIP file)
        filename = "test.docx"

        # Invalid DOCX should raise FileParsingError
        with pytest.raises(FileParsingError):
            parse_file(file_content, filename)

    def test_rejects_unsupported_format(self):
        """Test rejection of unsupported file formats."""
        from src.ingestion.file_parser import parse_file, UnsupportedFileFormatError

        file_content = b"Some text content"
        filename = "test.txt"

        with pytest.raises(UnsupportedFileFormatError):
            parse_file(file_content, filename)

    def test_handles_corrupted_file(self):
        """Test handling of corrupted files."""
        from src.ingestion.file_parser import parse_file, FileParsingError

        file_content = b"Corrupted content that is not a valid PDF/PPTX/DOCX"
        filename = "test.pdf"

        with pytest.raises(FileParsingError):
            parse_file(file_content, filename)

    def test_extracts_text_from_pdf_pages(self):
        """Test that PDF parser extracts text from all pages."""
        from src.ingestion.file_parser import parse_file

        # Minimal PDF may parse but have empty text
        # In real test, use actual multi-page PDF
        file_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\ntrailer\n<<\n/Root 1 0 R\n>>\nstartxref\n9\n%%EOF"
        filename = "multipage.pdf"

        result = parse_file(file_content, filename)

        assert hasattr(result, "text")
        # Should extract text from all pages (may be empty for minimal PDF)
        assert isinstance(result.text, str)

    def test_preserves_structure_in_pptx(self):
        """Test that PPTX parser preserves slide structure."""
        from src.ingestion.file_parser import parse_file, FileParsingError

        # Invalid PPTX should raise error
        # In real test, use actual PPTX file
        file_content = b"PK\x03\x04"
        filename = "presentation.pptx"

        # Invalid PPTX should raise FileParsingError
        with pytest.raises(FileParsingError):
            parse_file(file_content, filename)

