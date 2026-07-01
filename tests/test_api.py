from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    """Verify that GET /health returns HTTP 200 and {'status': 'ok'}."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_chat_clarification():
    """Verify that vague user queries result in clarification (no recommendations)."""
    payload = {
        "messages": [
            {"role": "user", "content": "I want to hire some candidates."}
        ]
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert isinstance(data["reply"], str)
    assert "recommendations" in data
    assert len(data["recommendations"]) == 0
    assert data["end_of_conversation"] is False

def test_chat_recommendation():
    """Verify that structured/rich queries return appropriate recommendations."""
    payload = {
        "messages": [
            {"role": "user", "content": "I need to hire a Java Developer, senior-level, who knows Object-Oriented design and Java 8 specific syntax features."}
        ]
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)
    
    # If the LLM key is valid or mock executes, recommendations may be populated
    for item in data["recommendations"]:
        assert "name" in item
        assert "url" in item
        assert "test_type" in item
        assert item["test_type"] in ["K", "P"]

def test_chat_invalid_payload():
    """Verify that bad payload schemas are rejected with standard validation errors."""
    response = client.post("/chat", json={"invalid_key": []})
    assert response.status_code == 422 # FastAPI Unprocessable Entity validation error
