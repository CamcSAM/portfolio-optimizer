from typing import Dict, Tuple
import numpy as np
import pandas as pd
from pypfopt import EfficientFrontier, expected_returns, risk_models
from scipy.optimize import minimize


def optimize(
    model: str,
    prices: pd.DataFrame,
    bounds: Dict[str, Tuple[float, float]],
    params: dict,
) -> Dict[str, float]:
    assets = list(prices.columns)

    if model == "equal_weight":
        n = len(assets)
        return {a: 1.0 / n for a in assets}

    lookback = params.get("lookback_months", 12)
    window_prices = prices.iloc[-lookback * 21:]

    if model in ("min_volatility", "max_sharpe"):
        mu = expected_returns.mean_historical_return(window_prices)
        S = risk_models.sample_cov(window_prices)
        weight_bounds = [(bounds[a][0], bounds[a][1]) for a in assets]
        ef = EfficientFrontier(mu, S, weight_bounds=weight_bounds)
        if model == "min_volatility":
            ef.min_volatility()
        else:
            rf = params.get("risk_free_rate", 0.02)
            ef.max_sharpe(risk_free_rate=rf)
        cleaned = ef.clean_weights()
        return {a: cleaned.get(a, 0.0) for a in assets}

    if model == "risk_parity":
        returns = window_prices.pct_change().dropna()
        cov = returns.cov().values * 252
        n = len(assets)
        lo = np.array([bounds[a][0] for a in assets])
        hi = np.array([bounds[a][1] for a in assets])

        def risk_parity_objective(w):
            port_var = w @ cov @ w
            port_vol = np.sqrt(port_var) if port_var > 0 else 1e-8
            mrc = cov @ w
            rc = w * mrc / port_vol
            rc_mean = rc.mean()
            return float(np.sum((rc - rc_mean) ** 2))

        constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1.0}]
        bounds_list = [(lo[i], hi[i]) for i in range(n)]
        w0 = np.ones(n) / n

        result = minimize(
            risk_parity_objective,
            w0,
            method="SLSQP",
            bounds=bounds_list,
            constraints=constraints,
            options={"ftol": 1e-12, "maxiter": 1000},
        )
        w = result.x
        w = np.clip(w, lo, hi)
        w = w / w.sum()
        return {a: float(w[i]) for i, a in enumerate(assets)}

    raise ValueError(f"Unknown model: {model}")
