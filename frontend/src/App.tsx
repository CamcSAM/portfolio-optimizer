import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import AssetWatch from "./pages/AssetWatch";
import NewPortfolio from "./pages/NewPortfolio";
import Overview from "./pages/Portfolio/Overview";
import ReturnStats from "./pages/Portfolio/ReturnStats";
import Holdings from "./pages/Portfolio/Holdings";
import RiskContrib from "./pages/Portfolio/RiskContrib";
import EfficientFrontier from "./pages/Portfolio/EfficientFrontier";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 text-gray-800">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/assets" replace />} />
            <Route path="/assets" element={<AssetWatch />} />
            <Route path="/portfolios/new" element={<NewPortfolio />} />
            <Route path="/portfolios/:id/overview" element={<Overview />} />
            <Route path="/portfolios/:id/returns" element={<ReturnStats />} />
            <Route path="/portfolios/:id/holdings" element={<Holdings />} />
            <Route path="/portfolios/:id/risk" element={<RiskContrib />} />
            <Route path="/portfolios/:id/frontier" element={<EfficientFrontier />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
