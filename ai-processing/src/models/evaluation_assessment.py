"""EvaluationAssessment model for agent assessment outputs."""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from src.models.base import CitationDetail


class AssessmentDetail(BaseModel):
    """Detail for a specific assessment dimension."""

    score: int = Field(..., ge=0, le=100, description="Assessment score (0-100)")
    assessment: str = Field(..., description="Textual assessment")
    citations: Optional[List[CitationDetail]] = Field(None, description="Supporting citations")


class EvaluationAssessment(BaseModel):
    """Model for evaluation assessments from agents."""

    agent_name: str = Field(..., description="Name of the agent")
    audience_id: Optional[str] = Field(
        None, description="Audience ID (if assessment is per-audience)"
    )
    audience_description: Optional[str] = Field(None, description="Audience description")
    timestamp: str = Field(..., description="ISO timestamp of assessment")
    assessments: Optional[Dict[str, AssessmentDetail]] = Field(
        None, description="Assessment details"
    )
    score: Optional[int] = Field(None, ge=0, le=100, description="Overall score (0-100)")
    findings: Optional[Dict[str, Any]] = Field(None, description="Additional findings")
