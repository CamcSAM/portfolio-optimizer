import { useParams } from "react-router-dom";
import { useState } from "react";
import { usePortfolioResult } from "../../hooks/usePortfolioResult";
import { fmtPct, fmtNum } from "../../lib/utils";

export default function Holdings() {
  const { id } = useParams<{ id: string }>();
  const { result, loading, error } = usePortfolioResult(id!);
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (loading) return <div className="text-gray-400 py-12 text-center">加载中...</div>;
  if (error || !result) return <div className="text-gray-400 py-12 text-center">暂无回测结果</div>;

  const { holdings } = result;
  const current = holdings[selectedIdx];

  return (
    <div>
      <h2 className="text-lg font-semibold text-brand-deep-blue mb-5">历史持仓</h2>
      <div className="flex gap-4">
        <div className="w-36 shrink-0 bg-white rounded-lg border border-gray-200 overflow-auto max-h-[600px]">
          {holdings.map((h: any, i: number) => (
            <button
              key={h.date}
              onClick={() => setSelectedIdx(i)}
              className={`w-full text-left px-3 py-2.5 text-xs border-b border-gray-100 transition-colors
                ${i === selectedIdx
                  ? "border-l-[3px] border-l-brand-red bg-brand-light-red text-brand-red font-medium"
                  : "border-l-[3px] border-l-transparent text-gray-600 hover:bg-gray-50"}`}
            >
              {h.date}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: "净资产", value: `¥${(current.net_assets / 1e4).toFixed(2)}万` },
              { label: "现金", value: `¥${(current.cash / 1e4).toFixed(2)}万` },
              { label: "持仓市值", value: `¥${(current.positions_value / 1e4).toFixed(2)}万` },
              { label: "持仓个数", value: String(current.positions_count) },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-lg border border-gray-100 px-4 py-3">
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <div className="text-base font-semibold text-gray-800">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["证券代码", "最新价", "成本价", "持仓数量", "持仓市值", "最新权重"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.positions.map((p: any, i: number) => (
                  <tr key={p.code} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-2.5 font-mono text-brand-deep-blue">{p.code}</td>
                    <td className="px-4 py-2.5">{fmtNum(p.latest_price)}</td>
                    <td className="px-4 py-2.5">{fmtNum(p.cost_price)}</td>
                    <td className="px-4 py-2.5">{fmtNum(p.quantity, 0)}</td>
                    <td className="px-4 py-2.5">{fmtNum(p.market_value, 0)}</td>
                    <td className="px-4 py-2.5 text-brand-red">{fmtPct(p.weight)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
