"""Logging infrastructure for AI processing layer."""

import json
import logging
import sys
from datetime import datetime
from typing import Any, Optional


class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "level": record.levelname.lower(),
            "message": record.getMessage(),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        # Add exception info if present
        if record.exc_info:
            log_entry["error"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": self.formatException(record.exc_info) if record.exc_info else None,
            }

        # Add extra fields
        if hasattr(record, "metadata") and record.metadata:
            log_entry["metadata"] = record.metadata

        return json.dumps(log_entry)


def setup_logger(name: str = "ai-processing", level: str = "INFO") -> logging.Logger:
    """Setup and configure logger."""
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers
    logger.handlers.clear()

    # Create console handler with JSON formatter
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)

    return logger


# Global logger instance
logger = setup_logger()
