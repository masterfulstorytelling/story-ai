"""Page model for document pages."""

from pydantic import BaseModel, Field


class Page(BaseModel):
    """Model for a document page."""

    page_number: int = Field(..., description="Page number (1-indexed)")
    text: str = Field(..., description="Text content of the page")
    word_count: int = Field(..., description="Number of words on the page")
