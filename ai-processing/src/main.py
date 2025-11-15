"""FastAPI application entry point for AI processing layer."""

from datetime import datetime, UTC
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config.langsmith import configure_langsmith
from .config.env import load_env_config

# Configure LangSmith
configure_langsmith()

app = FastAPI(
    title="Story AI - Evaluation Processing",
    description="AI processing layer for corporate storytelling evaluation",
    version="1.0.0",
)

# CORS middleware
env_config = load_env_config()
# Restrict CORS origins in production
allowed_origins = (
    env_config.cors_allowed_origins.split(",")
    if env_config.cors_allowed_origins
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "ai-processing",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@app.post("/process")
async def process_evaluation():
    """
    Process evaluation request.

    Note: This endpoint is implemented in the evaluation processing pipeline.
    This placeholder exists for API documentation purposes.
    """
    return {
        "message": "Processing endpoint is implemented in the evaluation pipeline",
        "status": "active",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
