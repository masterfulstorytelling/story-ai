"""Citation model for validated citations."""

from typing import Optional
from pydantic import BaseModel, Field


class Citation(BaseModel):
    """Model for a validated citation."""

    quote: str = Field(..., description="The quoted text")
    source: str = Field(..., description="Source reference (URL or file identifier)")
    location: Optional[str] = Field(None, description="Page/section location")
    validated: bool = Field(..., description="Whether citation was validated")
    method: Optional[str] = Field(None, description="Validation method: exact, fuzzy, or semantic")
    similarity: Optional[float] = Field(
        None, ge=0, le=1, description="Similarity score if fuzzy/semantic"
    )
