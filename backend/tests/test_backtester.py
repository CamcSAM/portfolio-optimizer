import numpy as np
import pandas as pd
import pytest
from services.backtester import run_backtest

np.random.seed(1)
N = 504
dates = pd.date_range("2022-01-03", periods=N, freq="B")
prices = {
    "SPY": pd.DataFrame({"date": dates, "SPY": 100 * np.exp(np.cumsum(np.random.normal(0.0004, 0.01, N)))}),
    "TLT": pd.DataFrame({"date": dates, "TLT": 100 * np.exp(np.cumsum(np.random.normal(0.0002, 0.008, N)))}),
    "GLD": pd.DataFrame({"date": dates, "GLD": 100 * np.exp(np.cumsum(np.random.normal(0.0003, 0.009, N)))}),
}
for k in prices:
    prices[k] = prices[k].set_index("date")

PORTFOLIO_CONFIG = {
    "assets": [
        {"code": "SPY", "weight_lo": 0.0, "weight_hi": 1.0, "initial_weight": 0.4},
        {"code": "TLT", "weight_lo": 0.0, "weight_hi": 1.0, "initial_weight": 0.3},
        {"code": "GLD", "weight_lo": 0.0, "weight_hi": 1.0, "initial_weight": 0.3},
    ],
    "benchmark_code": "SPY",
    "model": "equal_weight",
    "lookback_months": 6,
    "risk_free_rate": 0.02,
    "start_date": "2022-01-03",
    "end_date": "2023-12-29",
    "initial_capital": 1000000,
    "frequency": "daily",
    "rebalance_period": "quarterly",
    "rebalance_timing": "start",
}

def test_run_backtest_returns_required_keys():
    result = run_backtest(PORTFOLIO_CONFIG, prices)
    for key in ["kpis", "nav_series", "weight_series", "holdings", "risk_contribution", "efficient_frontier"]:
        assert key in result, f"Missing key: {key}"

def test_nav_series_structure():
    result = run_backtest(PORTFOLIO_CONFIG, prices)
    nav = result["nav_series"]
    assert "dates" in nav and "portfolio" in nav and "benchmark" in nav
    assert len(nav["dates"]) == len(nav["portfolio"])

def test_holdings_structure():
    result = run_backtest(PORTFOLIO_CONFIG, prices)
    holdings = result["holdings"]
    assert len(holdings) > 0
    first = holdings[0]
    assert "date" in first and "positions" in first
    pos = first["positions"][0]
    assert all(k in pos for k in ["code", "latest_price", "cost_price", "quantity", "market_value", "weight"])

def test_efficient_frontier_has_1000_points():
    result = run_backtest(PORTFOLIO_CONFIG, prices)
    ef = result["efficient_frontier"]
    assert len(ef["points"]) == 1000
