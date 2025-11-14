"""FastAPI application entry point for AI processing layer."""

from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config.env import env
from .config.langsmith import configure_langsmith
from .utils.logger import logger

# Configure LangSmith
configure_langsmith()

app = FastAPI(
    title="Story AI - Evaluation Processing",
    description="AI processing layer for corporate storytelling evaluation",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
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
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@app.post("/process")
async def process_evaluation():
    """Process evaluation request (placeholder)."""
    # TODO: Implement in Phase 4
    return {"message": "Processing endpoint - to be implemented"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
