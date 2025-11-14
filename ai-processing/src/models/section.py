"""Section model for document sections."""

from typing import Optional
from pydantic import BaseModel, Field


class Section(BaseModel):
    """Model for a document section."""

    title: Optional[str] = Field(None, description="Section title or heading")
    text: str = Field(..., description="Text content of the section")
    page_number: Optional[int] = Field(None, description="Page number where section appears")
    order: int = Field(..., description="Order of section in document")
