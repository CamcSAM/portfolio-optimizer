from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, assets, portfolios

app = FastAPI(title="Portfolio Backtest API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://essence-anchor-tiling.ngrok-free.app", "https://essence-anchor-tiling.ngrok-free.dev"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(assets.router, prefix="/assets")
app.include_router(portfolios.router, prefix="/portfolios")
