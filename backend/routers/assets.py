import io, os, json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd

router = APIRouter()
ASSETS_DIR = "data/assets"
META_FILE = "data/assets_meta.json"


def _load_meta() -> dict:
    if os.path.exists(META_FILE):
        try:
            with open(META_FILE, encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, ValueError):
            return {}
    return {}


def _save_meta(meta: dict):
    os.makedirs("data", exist_ok=True)
    with open(META_FILE, "w", encoding="utf-8") as f:
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


@router.post("/upload-excel")
async def upload_excel(
    file: UploadFile = File(...),
    asset_class: str = Form(""),
):
    content = await file.read()
    df = pd.read_excel(io.BytesIO(content), parse_dates=[0])
    df.columns = [str(c) for c in df.columns]
    date_col = df.columns[0]
    df = df.rename(columns={date_col: "date"}).set_index("date")

    prices = (1 + df).cumprod()

    os.makedirs(ASSETS_DIR, exist_ok=True)
    meta = _load_meta()
    imported = []
    for code in prices.columns:
        series = prices[code].dropna().reset_index()
        series.columns = ["date", code]
        series["date"] = series["date"].dt.strftime("%Y-%m-%d")
        csv_path = os.path.join(ASSETS_DIR, f"{code}.csv")
        series.to_csv(csv_path, index=False)
        meta[code] = {"name": code, "asset_class": asset_class}
        imported.append(code)

    _save_meta(meta)
    return {"imported": imported, "count": len(imported)}


@router.post("/reload-defaults")
async def reload_defaults():
    path = "data/default_assets.xlsx"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="data/default_assets.xlsx not found")
    with open(path, "rb") as f:
        content = f.read()
    df = pd.read_excel(io.BytesIO(content), parse_dates=[0])
    df.columns = [str(c) for c in df.columns]
    date_col = df.columns[0]
    df = df.rename(columns={date_col: "date"}).set_index("date")
    prices = (1 + df).cumprod()
    os.makedirs(ASSETS_DIR, exist_ok=True)
    meta = _load_meta()
    imported = []
    for code in prices.columns:
        series = prices[code].dropna().reset_index()
        series.columns = ["date", code]
        series["date"] = series["date"].dt.strftime("%Y-%m-%d")
        series.to_csv(os.path.join(ASSETS_DIR, f"{code}.csv"), index=False)
        meta[code] = {"name": code, "asset_class": "macro"}
        imported.append(code)
    _save_meta(meta)
    return {"imported": imported, "count": len(imported)}


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
