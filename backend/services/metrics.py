from typing import Dict
import numpy as np
import pandas as pd


def _annualized_return(nav: pd.Series) -> float:
    years = len(nav) / 252
    if years <= 0:
        return 0.0
    return (nav.iloc[-1] / nav.iloc[0]) ** (1 / years) - 1


def _annualized_vol(nav: pd.Series) -> float:
    returns = nav.pct_change().dropna()
    return float(returns.std() * np.sqrt(252))


def _max_drawdown(nav: pd.Series) -> float:
    roll_max = nav.cummax()
    drawdown = (nav - roll_max) / roll_max
    return float(drawdown.min())


def _downside_risk(nav: pd.Series, threshold: float = 0.0) -> float:
    returns = nav.pct_change().dropna() * 252 ** 0.5
    downside = returns[returns < threshold]
    if len(downside) == 0:
        return 0.0
    return float(np.sqrt((downside ** 2).mean()))


def _alpha_beta(nav: pd.Series, bench: pd.Series, rf: float):
    port_ret = nav.pct_change().dropna()
    bench_ret = bench.pct_change().dropna()
    idx = port_ret.index.intersection(bench_ret.index)
    p = port_ret.loc[idx].values
    b = bench_ret.loc[idx].values
    if len(p) < 2:
        return 0.0, 1.0
    rf_daily = rf / 252
    cov = np.cov(p - rf_daily, b - rf_daily)
    beta = cov[0, 1] / cov[1, 1] if cov[1, 1] != 0 else 1.0
    alpha = float(np.mean(p - rf_daily) - beta * np.mean(b - rf_daily)) * 252
    return alpha, float(beta)


def compute_kpis(nav: pd.Series, benchmark: pd.Series, risk_free_rate: float = 0.02) -> Dict:
    bench = benchmark.reindex(nav.index, method="ffill")
    port_ann = _annualized_return(nav)
    bench_ann = _annualized_return(bench)
    vol = _annualized_vol(nav)
    alpha, beta = _alpha_beta(nav, bench, risk_free_rate)
    sharpe = (port_ann - risk_free_rate) / vol if vol > 0 else 0.0
    port_ret = nav.pct_change().dropna()
    bench_ret = bench.pct_change().dropna()
    tracking_error = float((port_ret - bench_ret).std() * np.sqrt(252))
    info_ratio = (port_ann - bench_ann) / tracking_error if tracking_error > 0 else 0.0
    return {
        "total_return": float(nav.iloc[-1] / nav.iloc[0] - 1),
        "excess_return": float(nav.iloc[-1] / nav.iloc[0] - bench.iloc[-1] / bench.iloc[0]),
        "annualized_return": port_ann,
        "annualized_vol": vol,
        "max_drawdown": _max_drawdown(nav),
        "alpha": alpha,
        "beta": beta,
        "sharpe": sharpe,
        "info_ratio": info_ratio,
        "downside_risk": _downside_risk(nav),
    }


def _slice_stats(nav: pd.Series, bench: pd.Series, rf: float) -> Dict:
    if len(nav) < 2:
        return {k: 0.0 for k in ["total_return", "relative_return", "ann_return", "ann_excess_return",
                                   "downside_risk", "ann_vol", "max_drawdown", "alpha", "sharpe",
                                   "calmar", "treynor", "jenson", "beta", "sortino"]}
    bench = bench.reindex(nav.index, method="ffill")
    port_ann = _annualized_return(nav)
    bench_ann = _annualized_return(bench)
    vol = _annualized_vol(nav)
    mdd = _max_drawdown(nav)
    alpha, beta = _alpha_beta(nav, bench, rf)
    sharpe = (port_ann - rf) / vol if vol > 0 else 0.0
    calmar = port_ann / abs(mdd) if mdd < 0 else 0.0
    sortino_denom = _downside_risk(nav)
    sortino = (port_ann - rf) / sortino_denom if sortino_denom > 0 else 0.0
    treynor = (port_ann - rf) / beta if beta != 0 else 0.0
    jenson = port_ann - (rf + beta * (bench_ann - rf))
    port_ret = nav.pct_change().dropna()
    return {
        "total_return": float(nav.iloc[-1] / nav.iloc[0] - 1),
        "relative_return": float((nav.iloc[-1] / nav.iloc[0]) - (bench.iloc[-1] / bench.iloc[0])),
        "ann_return": port_ann,
        "ann_excess_return": port_ann - bench_ann,
        "downside_risk": _downside_risk(nav),
        "ann_vol": vol,
        "max_drawdown": mdd,
        "alpha": alpha,
        "sharpe": sharpe,
        "calmar": calmar,
        "treynor": treynor,
        "jenson": jenson,
        "beta": beta,
        "sortino": sortino,
    }


def compute_period_stats(nav: pd.Series, benchmark: pd.Series, risk_free_rate: float = 0.02) -> Dict:
    end = nav.index[-1]
    bench = benchmark.reindex(nav.index, method="ffill")

    def _slice(start):
        s = nav[nav.index >= start]
        b = bench[bench.index >= start]
        return _slice_stats(s, b, risk_free_rate)

    ytd_start = pd.Timestamp(end.year, 1, 1)
    return {
        "3m": _slice(end - pd.DateOffset(months=3)),
        "6m": _slice(end - pd.DateOffset(months=6)),
        "ytd": _slice(ytd_start),
        "1y": _slice(end - pd.DateOffset(years=1)),
        "3y": _slice(end - pd.DateOffset(years=3)),
        "inception": _slice_stats(nav, bench, risk_free_rate),
    }
