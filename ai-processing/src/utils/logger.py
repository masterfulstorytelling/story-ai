"""Logging infrastructure for AI processing layer."""

import json
import logging
import sys
from datetime import datetime, UTC


class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "level": record.levelname.lower(),
            "message": record.getMessage(),
            "timestamp": datetime.now(UTC).isoformat(),
        }

        # Add exception info if present
        if record.exc_info:
            log_entry["error"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": self.formatException(record.exc_info) if record.exc_info else None,
            }

        # Add extra fields (from extra parameter in logger calls)
        # Standard LogRecord attributes to exclude
        standard_attrs = {
            "name",
            "msg",
            "args",
            "created",
            "filename",
            "funcName",
            "getMessage",
            "levelname",
            "levelno",
            "lineno",
            "module",
            "msecs",
            "message",
            "pathname",
            "process",
            "processName",
            "relativeCreated",
            "taskName",
            "thread",
            "threadName",
            "exc_info",
            "exc_text",
            "stack_info",
            "metadata",  # Special handling below
        }

        # Collect all extra fields
        extra_fields = {}
        for key, value in record.__dict__.items():
            if key not in standard_attrs and not key.startswith("_"):
                extra_fields[key] = value

        # Also handle metadata if present (for backward compatibility)
        if hasattr(record, "metadata") and record.metadata:
            if isinstance(record.metadata, dict):
                extra_fields.update(record.metadata)
            else:
                extra_fields["metadata"] = record.metadata

        if extra_fields:
            log_entry["metadata"] = extra_fields

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


def get_logger(name: str = "ai-processing") -> logging.Logger:
    """Get or create a logger instance (alias for setup_logger)."""
    return setup_logger(name)
