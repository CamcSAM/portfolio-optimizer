import { useParams } from "react-router-dom";
import { usePortfolioResult } from "../../hooks/usePortfolioResult";
import { fmtPct, fmtNum } from "../../lib/utils";

const PERIODS = [
  { key: "3m", label: "最近3月" },
  { key: "6m", label: "最近6月" },
  { key: "ytd", label: "今年以来" },
  { key: "1y", label: "最近1年" },
  { key: "3y", label: "最近3年" },
  { key: "inception", label: "成立以来" },
];

const METRICS = [
  { key: "total_return", label: "总回报", fmt: fmtPct },
  { key: "relative_return", label: "相对回报", fmt: fmtPct },
  { key: "max_gain", label: "最大涨幅", fmt: fmtPct },
  { key: "max_loss", label: "最大跌幅", fmt: fmtPct },
  { key: "ann_return", label: "年化平均回报", fmt: fmtPct },
  { key: "ann_excess_return", label: "年化平均超额回报", fmt: fmtPct },
  { key: "downside_risk", label: "下行风险", fmt: fmtPct },
  { key: "ann_vol", label: "年化波动率", fmt: fmtPct },
  { key: "alpha", label: "Alpha", fmt: (v: number) => fmtNum(v, 4) },
  { key: "sharpe", label: "Sharpe", fmt: (v: number) => fmtNum(v, 4) },
  { key: "treynor", label: "Treynor", fmt: (v: number) => fmtNum(v, 4) },
  { key: "jenson", label: "Jenson", fmt: (v: number) => fmtNum(v, 4) },
  { key: "beta", label: "Beta", fmt: (v: number) => fmtNum(v, 4) },
  { key: "sortino", label: "Sortino", fmt: (v: number) => fmtNum(v, 4) },
];

export default function ReturnStats() {
  const { id } = useParams<{ id: string }>();
  const { result, loading, error } = usePortfolioResult(id!);

  if (loading) return <div className="text-gray-400 py-12 text-center">加载中...</div>;
  if (error || !result) return <div className="text-gray-400 py-12 text-center">暂无回测结果</div>;

  const { period_stats } = result;

  return (
    <div>
      <h2 className="text-lg font-semibold text-brand-deep-blue mb-5">收益统计</h2>
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 w-40">指标</th>
              {PERIODS.map((p) => (
                <th key={p.key} className="text-right px-4 py-3 text-xs font-medium text-gray-600">{p.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m, i) => (
              <tr key={m.key} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                <td className="px-4 py-2.5 text-xs text-gray-600">{m.label}</td>
                {PERIODS.map((p) => {
                  const v = period_stats?.[p.key]?.[m.key];
                  const formatted = v !== undefined ? m.fmt(v) : "—";
                  const isPositive = typeof v === "number" && v > 0;
                  const isNegative = typeof v === "number" && v < 0;
                  return (
                    <td key={p.key} className={`px-4 py-2.5 text-xs text-right font-mono
                      ${isPositive ? "text-brand-red" : isNegative ? "text-brand-deep-blue" : "text-gray-600"}`}>
                      {formatted}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
