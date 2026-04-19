from typing import Dict, List
import numpy as np
import pandas as pd
from services.optimizer import optimize
from services.metrics import compute_kpis, compute_period_stats


def _get_rebalance_dates(index: pd.DatetimeIndex, period: str, timing: str) -> List[pd.Timestamp]:
    if period == "buy_and_hold":
        return [index[0]]

    freq_map = {"monthly": "MS", "quarterly": "QS", "semi_annual": "6MS", "annual": "AS"}
    freq = freq_map.get(period, "QS")

    if timing == "start":
        anchors = pd.date_range(index[0], index[-1], freq=freq)
    else:
        end_freq = freq.replace("S", "E").replace("ASE", "A")
        anchors = pd.date_range(index[0], index[-1], freq=end_freq)

    dates = []
    for anchor in anchors:
        candidates = index[index >= anchor]
        if len(candidates) > 0:
            dates.append(candidates[0])
    return sorted(set(dates))


def run_backtest(config: dict, price_data: Dict[str, pd.DataFrame]) -> dict:
    assets = [a["code"] for a in config["assets"]]
    benchmark_code = config["benchmark_code"]
    model = config["model"]
    start = pd.Timestamp(config["start_date"])
    end = pd.Timestamp(config["end_date"])
    initial_capital = config["initial_capital"]
    lookback_months = config.get("lookback_months", 12)
    risk_free_rate = config.get("risk_free_rate", 0.02)
    rebalance_period = config.get("rebalance_period", "quarterly")
    rebalance_timing = config.get("rebalance_timing", "start")

    all_codes = list(set(assets + [benchmark_code]))
    price_frames = {}
    for code in all_codes:
        df = price_data[code]
        s = df.iloc[:, 0] if isinstance(df, pd.DataFrame) else df
        price_frames[code] = s

    prices_df = pd.DataFrame(price_frames).loc[start:end].dropna()
    portfolio_prices = prices_df[assets]
    benchmark_series = prices_df[benchmark_code]
    trading_days = prices_df.index

    bounds = {a["code"]: (a["weight_lo"], a["weight_hi"]) for a in config["assets"]}
    rebalance_dates = set(_get_rebalance_dates(trading_days, rebalance_period, rebalance_timing))

    nav = pd.Series(index=trading_days, dtype=float)
    shares = {a: 0.0 for a in assets}
    cash = float(initial_capital)
    holdings_log = []
    weight_log = {}

    for i, date in enumerate(trading_days):
        if date in rebalance_dates or i == 0:
            historical = portfolio_prices.loc[:date]
            params = {"lookback_months": lookback_months, "risk_free_rate": risk_free_rate}
            weights = optimize(model, historical, bounds, params)

            total_value = cash + sum(shares[a] * portfolio_prices.loc[date, a] for a in assets)
            new_shares = {a: weights[a] * total_value / portfolio_prices.loc[date, a] for a in assets}
            cash = total_value - sum(new_shares[a] * portfolio_prices.loc[date, a] for a in assets)
            shares = new_shares

            positions = []
            for a in assets:
                price = portfolio_prices.loc[date, a]
                mv = shares[a] * price
                positions.append({
                    "code": a,
                    "latest_price": float(price),
                    "cost_price": float(price),
                    "quantity": float(shares[a]),
                    "market_value": float(mv),
                    "weight": float(weights[a]),
                })
            holdings_log.append({
                "date": date.strftime("%Y-%m-%d"),
                "net_assets": float(total_value),
                "cash": float(cash),
                "positions_value": float(total_value - cash),
                "positions_count": len(assets),
                "positions": positions,
            })
            weight_log[date.strftime("%Y-%m-%d")] = {a: float(weights[a]) for a in assets}

        port_value = cash + sum(shares[a] * portfolio_prices.loc[date, a] for a in assets)
        nav[date] = port_value

    nav_normalized = nav / nav.iloc[0] * 100
    bench_normalized = benchmark_series / benchmark_series.iloc[0] * 100

    kpis = compute_kpis(nav_normalized, bench_normalized, risk_free_rate)
    period_stats = compute_period_stats(nav_normalized, bench_normalized, risk_free_rate)

    weight_dates = sorted(weight_log.keys())
    weight_series = {
        "dates": weight_dates,
        "weights": {a: [weight_log[d].get(a, 0.0) for d in weight_dates] for a in assets},
    }

    risk_contrib = _compute_risk_contribution(portfolio_prices, weight_log, assets)
    ef = _compute_efficient_frontier(portfolio_prices, bounds, assets, lookback_months)

    return {
        "kpis": kpis,
        "period_stats": period_stats,
        "nav_series": {
            "dates": [d.strftime("%Y-%m-%d") for d in trading_days],
            "portfolio": nav_normalized.tolist(),
            "benchmark": bench_normalized.tolist(),
        },
        "weight_series": weight_series,
        "holdings": holdings_log,
        "risk_contribution": risk_contrib,
        "efficient_frontier": ef,
    }


def _compute_risk_contribution(prices: pd.DataFrame, weight_log: dict, assets: List[str]) -> dict:
    dates = sorted(weight_log.keys())
    contrib_by_date = {}
    for d in dates:
        w = np.array([weight_log[d].get(a, 0.0) for a in assets])
        historical = prices.loc[:d].iloc[-126:]
        returns = historical.pct_change().dropna()
        cov = returns.cov().values * 252
        port_var = float(w @ cov @ w)
        port_vol = np.sqrt(port_var) if port_var > 0 else 1e-8
        mrc = cov @ w
        rc = w * mrc / port_vol
        contrib_by_date[d] = {a: float(rc[i]) for i, a in enumerate(assets)}

    total_contrib_per_date = {d: sum(contrib_by_date[d].values()) for d in dates}
    return {
        "dates": dates,
        "contributions": {a: [contrib_by_date[d].get(a, 0.0) for d in dates] for a in assets},
        "detail": [
            {
                "date": d,
                "assets": [
                    {
                        "code": a,
                        "weight": weight_log[d].get(a, 0.0),
                        "risk_contribution": contrib_by_date[d].get(a, 0.0),
                        "portfolio_risk": 0.0,
                        "contribution_pct": (
                            contrib_by_date[d].get(a, 0.0) / total_contrib_per_date[d]
                            if total_contrib_per_date[d] > 0 else 0.0
                        ),
                    }
                    for a in assets
                ],
            }
            for d in dates
        ],
    }


def _compute_efficient_frontier(prices: pd.DataFrame, bounds: dict, assets: List[str], lookback_months: int) -> dict:
    historical = prices.iloc[-lookback_months * 21:]
    returns = historical.pct_change().dropna()
    mu = returns.mean().values * 252
    cov = returns.cov().values * 252

    points = []
    np.random.seed(42)
    attempts = 0
    while len(points) < 1000 and attempts < 10000:
        attempts += 1
        w = np.random.dirichlet(np.ones(len(assets)))
        valid = all(bounds[assets[i]][0] <= w[i] <= bounds[assets[i]][1] for i in range(len(assets)))
        if not valid:
            continue
        port_ret = float(w @ mu)
        port_vol = float(np.sqrt(w @ cov @ w))
        points.append({"vol": port_vol, "ret": port_ret})

    while len(points) < 1000:
        w = np.random.dirichlet(np.ones(len(assets)))
        port_ret = float(w @ mu)
        port_vol = float(np.sqrt(w @ cov @ w))
        points.append({"vol": port_vol, "ret": port_ret})

    return {"points": points[:1000]}
