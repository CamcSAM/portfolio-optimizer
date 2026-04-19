import os, json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd

router = APIRouter()
ASSETS_DIR = "data/assets"
META_FILE = "data/assets_meta.json"


def _load_meta() -> dict:
    if os.path.exists(META_FILE):
        with open(META_FILE) as f:
            return json.load(f)
    return {}


def _save_meta(meta: dict):
    os.makedirs("data", exist_ok=True)
    with open(META_FILE, "w") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


@router.get("/")
def list_assets():
    meta = _load_meta()
    result = []
    for code, info in meta.items():
        csv_path = os.path.join(ASSETS_DIR, f"{code}.csv")
        if not os.path.exists(csv_path):
            continue
        df = pd.read_csv(csv_path, parse_dates=["date"])
        result.append({
            "code": code,
            "name": info.get("name", code),
            "asset_class": info.get("asset_class", ""),
            "start_date": df["date"].min().strftime("%Y-%m-%d"),
            "end_date": df["date"].max().strftime("%Y-%m-%d"),
            "frequency": "daily",
        })
    return result


@router.post("/upload")
async def upload_asset(
    file: UploadFile = File(...),
    name: str = Form(""),
    asset_class: str = Form(""),
):
    code = os.path.splitext(file.filename)[0]
    os.makedirs(ASSETS_DIR, exist_ok=True)
    content = await file.read()
    csv_path = os.path.join(ASSETS_DIR, f"{code}.csv")
    with open(csv_path, "wb") as f:
        f.write(content)
    meta = _load_meta()
    meta[code] = {"name": name or code, "asset_class": asset_class}
    _save_meta(meta)
    return {"code": code, "status": "uploaded"}


@router.delete("/{code}")
def delete_asset(code: str):
    csv_path = os.path.join(ASSETS_DIR, f"{code}.csv")
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Asset not found")
    os.remove(csv_path)
    meta = _load_meta()
    meta.pop(code, None)
    _save_meta(meta)
    return {"status": "deleted"}
