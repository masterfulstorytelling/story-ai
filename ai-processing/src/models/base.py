"""Base Pydantic models for agent interfaces."""

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class BaseAgentOutput(BaseModel):
    """Base class for all agent outputs."""

    agent: str = Field(..., description="Name of the agent")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="When the output was generated"
    )
    confidence_level: Optional[float] = Field(
        None, ge=0, le=100, description="Confidence level (0-100)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "agent": "example_agent",
                "timestamp": "2025-11-13T12:00:00Z",
                "confidence_level": 85.5,
            }
        }


class CitationDetail(BaseModel):
    """Citation detail for quotes and examples."""

    quote: str = Field(..., description="Exact or near-exact quote from source")
    source: str = Field(..., description="Source reference (URL or file identifier)")
    section: Optional[str] = Field(None, description="Page/section location")
    relevance: Optional[str] = Field(None, description="Relevance explanation")


class BaseAgentInput(BaseModel):
    """Base class for all agent inputs."""

    pass
