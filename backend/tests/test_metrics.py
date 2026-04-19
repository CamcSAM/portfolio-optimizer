import numpy as np
import pandas as pd
import pytest
from services.metrics import compute_kpis, compute_period_stats

np.random.seed(0)
N = 504  # 2 years
dates = pd.date_range("2022-01-03", periods=N, freq="B")
nav = pd.Series(
    100 * np.exp(np.cumsum(np.random.normal(0.0004, 0.01, N))),
    index=dates, name="portfolio"
)
benchmark = pd.Series(
    100 * np.exp(np.cumsum(np.random.normal(0.0003, 0.009, N))),
    index=dates, name="benchmark"
)

def test_compute_kpis_keys():
    kpis = compute_kpis(nav, benchmark, risk_free_rate=0.02)
    for key in ["total_return", "excess_return", "annualized_return",
                "annualized_vol", "max_drawdown", "alpha", "beta",
                "sharpe", "info_ratio", "downside_risk"]:
        assert key in kpis, f"Missing KPI: {key}"

def test_total_return():
    kpis = compute_kpis(nav, benchmark, risk_free_rate=0.02)
    expected = (nav.iloc[-1] / nav.iloc[0]) - 1
    assert abs(kpis["total_return"] - expected) < 1e-6

def test_max_drawdown_negative():
    kpis = compute_kpis(nav, benchmark, risk_free_rate=0.02)
    assert kpis["max_drawdown"] <= 0

def test_period_stats_keys():
    stats = compute_period_stats(nav, benchmark, risk_free_rate=0.02)
    for period in ["3m", "6m", "ytd", "1y", "3y", "inception"]:
        assert period in stats
    for period in stats.values():
        for key in ["total_return", "relative_return", "max_gain",
                    "max_loss", "ann_return", "ann_excess_return",
                    "downside_risk", "ann_vol", "alpha", "sharpe",
                    "treynor", "jenson", "beta", "sortino"]:
            assert key in period
