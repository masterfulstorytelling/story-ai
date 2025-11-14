"""Environment configuration validation for AI processing layer."""

import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator

# Load .env file from project root (ai-processing directory)
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class EnvConfig(BaseModel):
    """Validated environment configuration."""

    anthropic_api_key: str = Field(..., description="Anthropic API key for Claude")
    langsmith_api_key: Optional[str] = Field(
        None, description="LangSmith API key for observability"
    )
    langsmith_project: str = Field("story-eval-mvp", description="LangSmith project name")
    firestore_project_id: str = Field(..., description="GCP Firestore project ID")
    cloud_storage_bucket: str = Field(..., description="Cloud Storage bucket name")
    gcp_project_id: str = Field(..., description="GCP project ID")

    @field_validator("anthropic_api_key")
    @classmethod
    def validate_anthropic_key(cls, v: str) -> str:
        if not v or v == "your-anthropic-api-key":
            raise ValueError("ANTHROPIC_API_KEY must be set to a valid API key")
        return v

    @field_validator("firestore_project_id", "gcp_project_id")
    @classmethod
    def validate_project_id(cls, v: str) -> str:
        if not v or "your-" in v.lower():
            raise ValueError(f"Project ID must be set to a valid GCP project ID, got: {v}")
        return v


def load_env_config() -> EnvConfig:
    """Load and validate environment configuration."""
    return EnvConfig(
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", ""),
        langsmith_api_key=os.getenv("LANGSMITH_API_KEY"),
        langsmith_project=os.getenv("LANGSMITH_PROJECT", "story-eval-mvp"),
        firestore_project_id=os.getenv("FIRESTORE_PROJECT_ID", ""),
        cloud_storage_bucket=os.getenv("CLOUD_STORAGE_BUCKET", ""),
        gcp_project_id=os.getenv("GCP_PROJECT_ID", ""),
    )


# Global config instance
env = load_env_config()
