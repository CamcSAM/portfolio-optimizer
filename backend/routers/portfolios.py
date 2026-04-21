import math, os, json, uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


def _sanitize(obj):
    if isinstance(obj, float):
        return None if (math.isnan(obj) or math.isinf(obj)) else obj
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    return obj
PORTFOLIOS_DIR = "data/portfolios"


def _portfolio_path(pid: str) -> str:
    return os.path.join(PORTFOLIOS_DIR, f"{pid}.json")


def _load_portfolio(pid: str) -> dict:
    path = _portfolio_path(pid)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Portfolio not found")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _save_portfolio(pid: str, data: dict):
    os.makedirs(PORTFOLIOS_DIR, exist_ok=True)
    with open(_portfolio_path(pid), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class AssetConfig(BaseModel):
    code: str
    name: str
    asset_class: str
    initial_weight: float = 0.0
    weight_lo: float
    weight_hi: float


class PortfolioConfig(BaseModel):
    name: str
    benchmark_code: str
    assets: List[AssetConfig]
    model: str
    lookback_months: int = 12
    risk_free_rate: float = 0.02
    start_date: str
    end_date: str
    initial_capital: float = 1000000
    frequency: str = "daily"
    rebalance_period: str = "quarterly"
    rebalance_timing: str = "start"


@router.get("/")
def list_portfolios():
    os.makedirs(PORTFOLIOS_DIR, exist_ok=True)
    result = []
    for fname in os.listdir(PORTFOLIOS_DIR):
        if fname.endswith(".json"):
            with open(os.path.join(PORTFOLIOS_DIR, fname), encoding="utf-8") as f:
                data = json.load(f)
            result.append({"id": data["id"], "name": data["name"],
                           "created_at": data.get("created_at", ""),
                           "has_result": "result" in data})
    return result


@router.post("/")
def create_portfolio(config: PortfolioConfig):
    pid = str(uuid.uuid4())[:8]
    from datetime import datetime
    data = {"id": pid, "created_at": datetime.now().isoformat(), **config.model_dump()}
    _save_portfolio(pid, data)
    return {"id": pid}


@router.get("/{pid}")
def get_portfolio(pid: str):
    data = _load_portfolio(pid)
    return {k: v for k, v in data.items() if k != "result"}


@router.put("/{pid}")
def update_portfolio(pid: str, config: PortfolioConfig):
    data = _load_portfolio(pid)
    data.update(config.model_dump())
    data.pop("result", None)
    _save_portfolio(pid, data)
    return {"id": pid}


@router.delete("/{pid}")
def delete_portfolio(pid: str):
    _load_portfolio(pid)
    os.remove(_portfolio_path(pid))
    return {"status": "deleted"}


@router.post("/{pid}/duplicate")
def duplicate_portfolio(pid: str):
    data = _load_portfolio(pid)
    new_pid = str(uuid.uuid4())[:8]
    new_data = {**data, "id": new_pid, "name": data["name"] + " (副本)"}
    new_data.pop("result", None)
    _save_portfolio(new_pid, new_data)
    return {"id": new_pid}


@router.post("/{pid}/backtest")
def run_backtest_endpoint(pid: str):
    import pandas as pd
    from services.backtester import run_backtest
    data = _load_portfolio(pid)
    asset_codes = [a["code"] for a in data["assets"]]
    benchmark_code = data["benchmark_code"]
    all_codes = list(set(asset_codes + [benchmark_code]))

    price_data = {}
    for code in all_codes:
        csv_path = f"data/assets/{code}.csv"
        if not os.path.exists(csv_path):
            raise HTTPException(status_code=400, detail=f"Price data not found for {code}")
        df = pd.read_csv(csv_path, parse_dates=["date"], index_col="date")
        price_data[code] = df

    result = _sanitize(run_backtest(data, price_data))
    data["result"] = result
    _save_portfolio(pid, data)
    return result


class RenameRequest(BaseModel):
    name: str


@router.patch("/{pid}/rename")
def rename_portfolio(pid: str, req: RenameRequest):
    data = _load_portfolio(pid)
    data["name"] = req.name
    _save_portfolio(pid, data)
    return {"id": pid, "name": req.name}


@router.get("/{pid}/result")
def get_result(pid: str):
    data = _load_portfolio(pid)
    if "result" not in data:
        raise HTTPException(status_code=404, detail="No backtest result found")
    return _sanitize(data["result"])
