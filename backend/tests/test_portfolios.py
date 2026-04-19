import os, shutil, json, pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

PORTFOLIO_PAYLOAD = {
    "name": "Test Portfolio",
    "benchmark_code": "SPY",
    "assets": [
        {"code": "SPY", "name": "S&P 500 ETF", "asset_class": "equity",
         "initial_weight": 0.6, "weight_lo": 0.0, "weight_hi": 1.0},
        {"code": "TLT", "name": "Treasury ETF", "asset_class": "bond",
         "initial_weight": 0.4, "weight_lo": 0.0, "weight_hi": 1.0},
    ],
    "model": "equal_weight",
    "lookback_months": 6,
    "risk_free_rate": 0.02,
    "start_date": "2022-01-03",
    "end_date": "2022-12-30",
    "initial_capital": 1000000,
    "frequency": "daily",
    "rebalance_period": "quarterly",
    "rebalance_timing": "start",
}

@pytest.fixture(autouse=True)
def clean_portfolios():
    backup = "data/portfolios_backup"
    if os.path.exists("data/portfolios"):
        shutil.copytree("data/portfolios", backup)
    os.makedirs("data/portfolios", exist_ok=True)
    yield
    shutil.rmtree("data/portfolios")
    if os.path.exists(backup):
        shutil.move(backup, "data/portfolios")

def test_create_and_list_portfolio():
    resp = client.post("/portfolios/", json=PORTFOLIO_PAYLOAD)
    assert resp.status_code == 200
    pid = resp.json()["id"]
    lst = client.get("/portfolios/").json()
    assert any(p["id"] == pid for p in lst)

def test_get_portfolio():
    pid = client.post("/portfolios/", json=PORTFOLIO_PAYLOAD).json()["id"]
    resp = client.get(f"/portfolios/{pid}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Test Portfolio"

def test_update_portfolio():
    pid = client.post("/portfolios/", json=PORTFOLIO_PAYLOAD).json()["id"]
    updated = {**PORTFOLIO_PAYLOAD, "name": "Updated"}
    resp = client.put(f"/portfolios/{pid}", json=updated)
    assert resp.status_code == 200
    assert client.get(f"/portfolios/{pid}").json()["name"] == "Updated"

def test_delete_portfolio():
    pid = client.post("/portfolios/", json=PORTFOLIO_PAYLOAD).json()["id"]
    client.delete(f"/portfolios/{pid}")
    assert client.get(f"/portfolios/{pid}").status_code == 404

def test_duplicate_portfolio():
    pid = client.post("/portfolios/", json=PORTFOLIO_PAYLOAD).json()["id"]
    resp = client.post(f"/portfolios/{pid}/duplicate")
    new_pid = resp.json()["id"]
    assert new_pid != pid
    assert client.get(f"/portfolios/{new_pid}").json()["name"].startswith("Test Portfolio")
