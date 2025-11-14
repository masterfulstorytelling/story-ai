"""Tests for logging infrastructure."""
import json
import logging
import sys
from io import StringIO

from src.utils.logger import JSONFormatter, setup_logger


class TestJSONFormatter:
    """Test JSON formatter for structured logging."""

    def test_format_basic_log(self):
        """Test formatting a basic log entry."""
        formatter = JSONFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="Test message",
            args=(),
            exc_info=None,
        )

        result = formatter.format(record)
        data = json.loads(result)

        assert data["level"] == "info"
        assert data["message"] == "Test message"
        assert "timestamp" in data

    def test_format_log_with_exception(self):
        """Test formatting a log entry with exception info."""
        formatter = JSONFormatter()
        try:
            raise ValueError("Test error")
        except ValueError:
            record = logging.LogRecord(
                name="test",
                level=logging.ERROR,
                pathname="test.py",
                lineno=1,
                msg="Error occurred",
                args=(),
                exc_info=sys.exc_info(),
            )

            result = formatter.format(record)
            data = json.loads(result)

            assert data["level"] == "error"
            assert "error" in data
            assert data["error"]["type"] == "ValueError"
            assert data["error"]["message"] == "Test error"
            assert "traceback" in data["error"]

    def test_format_log_with_metadata(self):
        """Test formatting a log entry with metadata."""
        formatter = JSONFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="Test message",
            args=(),
            exc_info=None,
        )
        record.metadata = {"key": "value"}

        result = formatter.format(record)
        data = json.loads(result)

        assert data["metadata"] == {"key": "value"}


class TestSetupLogger:
    """Test logger setup and configuration."""

    def test_setup_logger_creates_logger(self):
        """Test that setup_logger creates a logger instance."""
        logger = setup_logger("test-logger", "INFO")

        assert isinstance(logger, logging.Logger)
        assert logger.name == "test-logger"
        assert logger.level == logging.INFO

    def test_setup_logger_has_json_formatter(self):
        """Test that setup_logger uses JSONFormatter."""
        logger = setup_logger("test-logger", "INFO")

        assert len(logger.handlers) > 0
        handler = logger.handlers[0]
        assert isinstance(handler.formatter, JSONFormatter)

    def test_logger_outputs_json(self):
        """Test that logger outputs JSON formatted logs."""
        logger = setup_logger("test-logger", "INFO")
        stream = StringIO()
        handler = logging.StreamHandler(stream)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.removeHandler(logger.handlers[0])  # Remove default handler

        logger.info("Test message")

        output = stream.getvalue()
        data = json.loads(output)

        assert data["level"] == "info"
        assert data["message"] == "Test message"

