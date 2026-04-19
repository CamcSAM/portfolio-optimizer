import os, shutil, pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
TEST_DATA_DIR = "data/assets"

@pytest.fixture(autouse=True)
def clean_assets():
    backup = TEST_DATA_DIR + "_backup"
    if os.path.exists(TEST_DATA_DIR):
        shutil.copytree(TEST_DATA_DIR, backup)
    os.makedirs(TEST_DATA_DIR, exist_ok=True)
    yield
    shutil.rmtree(TEST_DATA_DIR)
    if os.path.exists(backup):
        shutil.move(backup, TEST_DATA_DIR)

def test_list_assets_empty():
    resp = client.get("/assets/")
    assert resp.status_code == 200
    assert resp.json() == []

def test_upload_and_list_asset():
    csv_content = b"date,AAPL\n2020-01-02,300.00\n2020-01-03,301.50\n"
    resp = client.post(
        "/assets/upload",
        files={"file": ("AAPL.csv", csv_content, "text/csv")},
        data={"name": "Apple Inc", "asset_class": "equity"}
    )
    assert resp.status_code == 200
    assets = client.get("/assets/").json()
    assert len(assets) == 1
    assert assets[0]["code"] == "AAPL"
    assert assets[0]["name"] == "Apple Inc"

def test_delete_asset():
    csv_content = b"date,TEST\n2020-01-02,100.00\n"
    client.post("/assets/upload",
        files={"file": ("TEST.csv", csv_content, "text/csv")},
        data={"name": "Test", "asset_class": "equity"})
    resp = client.delete("/assets/TEST")
    assert resp.status_code == 200
    assert client.get("/assets/").json() == []
