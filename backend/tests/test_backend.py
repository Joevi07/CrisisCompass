import pytest
from sqlalchemy import create_engine, inspect, text
from fastapi.testclient import TestClient
from app.main import app
from app.database import _migrate_user_profile_columns
from app.services.verifier_service import source_verifier
from app.models.schemas import VerificationStatus

client = TestClient(app)

def test_user_profile_migration_adds_missing_columns():
    test_engine = create_engine("sqlite://")
    try:
        with test_engine.begin() as connection:
            connection.execute(text(
                "CREATE TABLE users (id VARCHAR PRIMARY KEY, email VARCHAR NOT NULL)"
            ))

        _migrate_user_profile_columns(test_engine)

        columns = {column["name"] for column in inspect(test_engine).get_columns("users")}
        assert {"city", "state", "blood_group"} <= columns
    finally:
        test_engine.dispose()

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "CrisisCompass" in data["service"]

def test_weather_endpoint_known_city():
    response = client.get("/api/weather?location=chennai")
    assert response.status_code == 200
    data = response.json()
    assert "current" in data
    assert "temperature" in data["current"]
    assert "data_origin" in data["current"]

def test_alerts_endpoint():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert "alerts" in data
    assert data["total"] > 0
    # Every alert must have data_origin, severity, verification_status
    for alert in data["alerts"]:
        assert "data_origin" in alert
        assert "severity" in alert
        assert "verification_status" in alert

def test_alert_by_id():
    response = client.get("/api/alerts/alert-demo-001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "alert-demo-001"
    assert "Red Alert" in data["title"]

def test_map_hazards_and_shelters():
    res_hazards = client.get("/api/map/hazards")
    assert res_hazards.status_code == 200
    hazards = res_hazards.json()
    assert len(hazards) > 0

    res_shelters = client.get("/api/map/shelters")
    assert res_shelters.status_code == 200
    shelters = res_shelters.json()
    assert len(shelters) > 0
    for s in shelters:
        assert "is_open" in s
        assert "capacity" in s

def test_source_verifier_allowlist_and_ssrf():
    # Official trusted domain
    assert source_verifier.is_domain_allowed("https://imd.gov.in/bulletin") == True
    assert source_verifier.is_domain_allowed("https://subdomain.weather.gov/alerts") == True
    
    # Untrusted domain
    assert source_verifier.is_domain_allowed("https://random-blog.xyz/scam") == False
    
    # SSRF protection
    assert source_verifier.is_domain_allowed("http://localhost:8080/exploit") == False
    assert source_verifier.is_domain_allowed("http://127.0.0.1/admin") == False
    assert source_verifier.is_domain_allowed("http://192.168.1.1/router") == False

def test_assistant_chat_rule_based_fallback():
    req_payload = {
        "message": "What should I do during a flash flood?",
        "language": "en"
    }
    response = client.post("/api/assistant/chat", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    assert "higher ground" in data["reply"].lower()
    assert len(data["citations"]) > 0
    assert data["is_ai_generated"] == False
    assert "disclaimer" in data

def test_config_status():
    response = client.get("/api/config/status")
    assert response.status_code == 200
    data = response.json()
    assert "services" in data
    assert data["trusted_domains_count"] > 0
