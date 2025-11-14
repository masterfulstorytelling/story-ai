"""LangSmith configuration for observability."""
import os
from typing import Optional
from .env import env


def configure_langsmith() -> None:
    """Configure LangSmith for tracing and observability."""
    if env.langsmith_api_key:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"
        os.environ["LANGCHAIN_API_KEY"] = env.langsmith_api_key
        os.environ["LANGCHAIN_PROJECT"] = env.langsmith_project
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(
            "LangSmith configured",
            extra={"metadata": {"project": env.langsmith_project}},
        )
    else:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning("LangSmith API key not provided - tracing disabled")


# Auto-configure on import
configure_langsmith()

