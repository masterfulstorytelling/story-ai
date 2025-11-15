"""Integration tests for health check endpoint."""
from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint returns correct response."""
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "ai-processing"
    assert "timestamp" in data


def test_process_endpoint_placeholder():
    """Test that process endpoint returns placeholder message."""
    response = client.post("/process")

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Processing endpoint is implemented in the evaluation pipeline"

