"""Audience model for identified target audiences."""

from typing import Optional, List
from pydantic import BaseModel, Field
from src.models.base import CitationDetail


class Audience(BaseModel):
    """Model for an identified target audience."""

    id: str = Field(..., description="Unique identifier for the audience")
    description: str = Field(..., description="Description of the audience")
    specificity_score: int = Field(..., ge=0, le=100, description="Specificity score (0-100)")
    source: str = Field(
        ...,
        description="Source of audience identification: user_provided, content_analysis, or both",
    )
    rationale: Optional[str] = Field(None, description="Rationale for audience identification")
    citations: Optional[List[CitationDetail]] = Field(
        None, description="Citations supporting audience identification"
    )
