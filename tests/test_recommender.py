import pytest
from app.database import db
from app.recommender import SHLRecommender

def test_database_search():
    """Verify that searching the vector database returns matching records."""
    # Search for personality tests
    results = db.search("personality assessment behavior traits", k=3)
    assert len(results) > 0
    # The top result should ideally be OPQ or similar personality questionnaire
    top_result_name = results[0]["name"].lower()
    assert "personality" in top_result_name or "opq" in top_result_name

    # Search for coding/java
    results_coding = db.search("java coding assessment programming developer", k=2)
    assert len(results_coding) > 0
    assert any("java" in r["name"].lower() or "coding" in r["name"].lower() for r in results_coding)

def test_recommender_mock_fallback():
    """Test recommender's mock fallback behaviors when API is unavailable."""
    recommender = SHLRecommender()
    
    # 1. Test vague query (should clarify)
    response = recommender._call_mock([{"role": "user", "content": "hello there"}])
    assert len(response["recommendations"]) == 0
    assert response["end_of_conversation"] is False
    assert "clarify" in response["reply"].lower() or "suggest" in response["reply"].lower()

    # 2. Test specific Java developer query
    response_java = recommender._call_mock([{"role": "user", "content": "I need a Java developer assessment"}])
    assert len(response_java["recommendations"]) > 0
    assert response_java["end_of_conversation"] is True
    assert "java" in response_java["recommendations"][0]["name"].lower()

    # 3. Test comparison query
    response_compare = recommender._call_mock([{"role": "user", "content": "Compare OPQ and G+"}])
    assert len(response_compare["recommendations"]) == 0
    assert response_compare["end_of_conversation"] is False
