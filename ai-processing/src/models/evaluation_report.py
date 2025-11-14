"""EvaluationReport model for final report content."""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class EvaluationReport(BaseModel):
    """Model for the final evaluation report."""

    executive_summary: str = Field(
        ..., description="Executive summary with brutally honest assessment"
    )
    audience_analysis: str = Field(..., description="Analysis of identified audiences")
    clarity_assessment: Optional[Dict[str, str]] = Field(
        None, description="Clarity assessment per audience"
    )
    technical_appropriateness: Optional[Dict[str, str]] = Field(
        None, description="Technical appropriateness per audience"
    )
    importance_value: Optional[Dict[str, str]] = Field(
        None, description="Importance & value assessment per audience"
    )
    voice_personality: Optional[str] = Field(None, description="Voice and personality assessment")
    storytelling_memorability: Optional[str] = Field(
        None, description="Storytelling and memorability assessment"
    )
    recommendations: str = Field(..., description="Specific, actionable recommendations")
    next_steps: Optional[str] = Field(None, description="Next steps with CTA for Feedforward AI")
    citations: List[Dict[str, Any]] = Field(
        default_factory=list, description="All validated citations"
    )
    scores: Optional[Dict[str, int]] = Field(
        None, description="Quantified scores per audience/dimension"
    )
