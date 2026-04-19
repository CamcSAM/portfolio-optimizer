from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_login_success():
    resp = client.post("/auth/login", json={"username": "admin", "password": "admin123"})
    assert resp.status_code == 200
    assert "token" in resp.json()

def test_login_fail():
    resp = client.post("/auth/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401
