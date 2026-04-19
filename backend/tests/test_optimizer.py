import numpy as np
import pandas as pd
import pytest
from services.optimizer import optimize

np.random.seed(42)
N = 252
dates = pd.date_range("2020-01-01", periods=N)
prices = pd.DataFrame({
    "A": 100 * np.exp(np.cumsum(np.random.normal(0.0005, 0.01, N))),
    "B": 100 * np.exp(np.cumsum(np.random.normal(0.0003, 0.008, N))),
    "C": 100 * np.exp(np.cumsum(np.random.normal(0.0004, 0.012, N))),
}, index=dates)

BOUNDS = {"A": (0.0, 1.0), "B": (0.0, 1.0), "C": (0.0, 1.0)}

def test_equal_weight():
    w = optimize("equal_weight", prices, BOUNDS, {})
    assert abs(w["A"] - 1/3) < 1e-6
    assert abs(sum(w.values()) - 1.0) < 1e-6

def test_min_volatility():
    w = optimize("min_volatility", prices, BOUNDS, {"lookback_months": 6})
    assert abs(sum(w.values()) - 1.0) < 1e-4
    assert all(v >= -1e-6 for v in w.values())

def test_max_sharpe():
    w = optimize("max_sharpe", prices, BOUNDS, {"lookback_months": 6, "risk_free_rate": 0.02})
    assert abs(sum(w.values()) - 1.0) < 1e-4

def test_risk_parity():
    w = optimize("risk_parity", prices, BOUNDS, {"lookback_months": 6})
    assert abs(sum(w.values()) - 1.0) < 1e-4
    assert all(v >= -1e-6 for v in w.values())

def test_weight_bounds_respected():
    bounds = {"A": (0.1, 0.5), "B": (0.2, 0.6), "C": (0.1, 0.4)}
    w = optimize("min_volatility", prices, bounds, {"lookback_months": 6})
    for asset, (lo, hi) in bounds.items():
        assert w[asset] >= lo - 1e-4
        assert w[asset] <= hi + 1e-4
