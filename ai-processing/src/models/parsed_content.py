"""ParsedContent model for file parsing results."""

from typing import Optional
from pydantic import BaseModel, Field


class ParsedContent(BaseModel):
    """Model for parsed file content."""

    filename: str = Field(..., description="Name of the file")
    file_type: str = Field(..., description="File type: pdf, pptx, or docx")
    text: str = Field(..., description="Extracted text content")
    word_count: int = Field(..., description="Number of words in the text")
    sections: Optional[list] = Field(
        None, description="Document sections (for structured documents)"
    )
    pages: Optional[list] = Field(None, description="Page information (for multi-page documents)")

    def to_dict(self) -> dict:
        """Convert to dictionary format for agent inputs."""
        return {
            "filename": self.filename,
            "text": self.text,
        }
