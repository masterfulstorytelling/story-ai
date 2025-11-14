"""Tests for environment configuration."""
import os
import pytest
from unittest.mock import patch

from src.config.env import EnvConfig, load_env_config


class TestEnvConfig:
    """Test environment configuration validation."""

    def test_load_valid_config(self):
        """Test loading valid environment configuration."""
        with patch.dict(
            os.environ,
            {
                "ANTHROPIC_API_KEY": "test-key-123",
                "FIRESTORE_PROJECT_ID": "test-project",
                "CLOUD_STORAGE_BUCKET": "test-bucket",
                "GCP_PROJECT_ID": "test-project",
            },
            clear=False,
        ):
            config = load_env_config()

            assert config.anthropic_api_key == "test-key-123"
            assert config.firestore_project_id == "test-project"
            assert config.cloud_storage_bucket == "test-bucket"
            assert config.gcp_project_id == "test-project"

    def test_default_langsmith_project(self):
        """Test default LangSmith project name."""
        with patch.dict(
            os.environ,
            {
                "ANTHROPIC_API_KEY": "test-key-123",
                "FIRESTORE_PROJECT_ID": "test-project",
                "CLOUD_STORAGE_BUCKET": "test-bucket",
                "GCP_PROJECT_ID": "test-project",
            },
            clear=False,
        ):
            config = load_env_config()
            assert config.langsmith_project == "story-eval-mvp"

    def test_optional_langsmith_api_key(self):
        """Test that LangSmith API key is optional."""
        with patch.dict(
            os.environ,
            {
                "ANTHROPIC_API_KEY": "test-key-123",
                "FIRESTORE_PROJECT_ID": "test-project",
                "CLOUD_STORAGE_BUCKET": "test-bucket",
                "GCP_PROJECT_ID": "test-project",
            },
            clear=False,
        ):
            if "LANGSMITH_API_KEY" in os.environ:
                del os.environ["LANGSMITH_API_KEY"]
            config = load_env_config()
            assert config.langsmith_api_key is None

    def test_validate_anthropic_key_required(self):
        """Test that Anthropic API key is required."""
        with patch.dict(
            os.environ,
            {
                "ANTHROPIC_API_KEY": "",
                "FIRESTORE_PROJECT_ID": "test-project",
                "CLOUD_STORAGE_BUCKET": "test-bucket",
                "GCP_PROJECT_ID": "test-project",
            },
            clear=False,
        ):
            with pytest.raises(ValueError, match="ANTHROPIC_API_KEY must be set"):
                load_env_config()

    def test_validate_anthropic_key_not_placeholder(self):
        """Test that Anthropic API key cannot be placeholder."""
        with patch.dict(
            os.environ,
            {
                "ANTHROPIC_API_KEY": "your-anthropic-api-key",
                "FIRESTORE_PROJECT_ID": "test-project",
                "CLOUD_STORAGE_BUCKET": "test-bucket",
                "GCP_PROJECT_ID": "test-project",
            },
            clear=False,
        ):
            with pytest.raises(ValueError, match="ANTHROPIC_API_KEY must be set"):
                load_env_config()

    def test_validate_project_id_required(self):
        """Test that project IDs are required."""
        with patch.dict(
            os.environ,
            {
                "ANTHROPIC_API_KEY": "test-key-123",
                "FIRESTORE_PROJECT_ID": "",
                "CLOUD_STORAGE_BUCKET": "test-bucket",
                "GCP_PROJECT_ID": "test-project",
            },
            clear=False,
        ):
            with pytest.raises(ValueError, match="Project ID must be set"):
                load_env_config()

    def test_validate_project_id_not_placeholder(self):
        """Test that project IDs cannot be placeholders."""
        with patch.dict(
            os.environ,
            {
                "ANTHROPIC_API_KEY": "test-key-123",
                "FIRESTORE_PROJECT_ID": "your-project-id",
                "CLOUD_STORAGE_BUCKET": "test-bucket",
                "GCP_PROJECT_ID": "test-project",
            },
            clear=False,
        ):
            with pytest.raises(ValueError, match="Project ID must be set"):
                load_env_config()

