# Portfolio Optimizer

A multi-asset portfolio backtesting platform supporting multiple allocation models, risk analytics, and performance attribution.

## Features

- **Multiple allocation models**: Equal weight, Min volatility, Max Sharpe (Mean-Variance), Risk Parity
- **Backtest engine**: Daily NAV simulation with configurable rebalancing (monthly / quarterly / semi-annual / annual / buy-and-hold)
- **Weight constraints**: Per-asset lower/upper bounds
- **Performance analytics**: KPIs, period stats (3M / 6M / YTD / 1Y / 3Y / inception), drawdown
- **Risk attribution**: Marginal risk contribution per asset over time
- **Efficient frontier**: Monte Carlo scatter with realized portfolio point
- **Asset management**: Batch import via Excel (daily returns → cumulative price index)
- **Public sharing**: ngrok tunnel support via Vite proxy

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Uvicorn |
| Optimization | PyPortfolioOpt, SciPy |
| Data | pandas, NumPy |
| Frontend | React 18 + TypeScript + Vite |
| Charts | Apache ECharts (echarts-for-react) |
| Styling | Tailwind CSS |

## Project Structure

```
├── backend/
│   ├── main.py                  # FastAPI app, CORS config
│   ├── routers/
│   │   ├── assets.py            # Asset CRUD, Excel import
│   │   └── portfolios.py        # Portfolio CRUD, backtest trigger
│   ├── services/
│   │   ├── backtester.py        # Backtest engine, risk contribution, efficient frontier
│   │   ├── optimizer.py         # Weight optimization models
│   │   └── metrics.py           # KPIs, period stats, Sharpe/Calmar/Sortino
│   └── data/
│       ├── assets/              # Per-asset price CSV files
│       ├── portfolios/          # Portfolio config + results (JSON)
│       └── default_assets.xlsx  # Default asset universe (place here to enable reload)
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── AssetWatch/      # Asset management table
    │   │   ├── NewPortfolio/    # Portfolio creation form
    │   │   └── Portfolio/       # Overview, ReturnStats, Holdings, RiskContrib, EfficientFrontier
    │   ├── components/          # Sidebar, KpiCard, CollapseSection
    │   ├── hooks/               # useAssets, usePortfolioResult
    │   └── lib/                 # axios API client
    └── vite.config.ts           # Dev server + proxy config
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- (Optional) [ngrok](https://ngrok.com) for public access

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 3. Import Assets

Prepare an Excel file where:
- Column 1: date
- Remaining columns: daily return series for each asset (one column = one asset)

Upload via **资产观察 → 批量导入 Excel**, or place the file at `backend/data/default_assets.xlsx` and click **重新导入默认资产**.

### 4. Create a Portfolio

Go to **新建组合**, select assets, configure the model and backtest parameters, then click **保存并回测**.

## Public Access via ngrok

The Vite dev server proxies all API calls (`/assets`, `/portfolios`, `/auth`) to `localhost:8000`, so only port 5173 needs to be exposed.

```bash
ngrok http 5173 --domain=<your-ngrok-domain>
```

Add your ngrok domain to `backend/main.py` CORS origins and `frontend/vite.config.ts` `allowedHosts`.

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/assets/` | List all assets |
| POST | `/assets/upload-excel` | Batch import from Excel |
| POST | `/assets/reload-defaults` | Re-import from `data/default_assets.xlsx` |
| DELETE | `/assets/{code}` | Delete asset |
| GET | `/portfolios/` | List portfolios |
| POST | `/portfolios/` | Create portfolio |
| POST | `/portfolios/{id}/backtest` | Run backtest |
| GET | `/portfolios/{id}/result` | Get backtest result |
| POST | `/portfolios/{id}/duplicate` | Duplicate portfolio |
| PATCH | `/portfolios/{id}/rename` | Rename portfolio |
| DELETE | `/portfolios/{id}` | Delete portfolio |
