import { useParams } from "react-router-dom";
import { useState } from "react";
import ReactECharts from "echarts-for-react";
import { usePortfolioResult } from "../../hooks/usePortfolioResult";
import { fmtPct } from "../../lib/utils";

const COLORS = ["#C41230", "#1B3A6B", "#E8899A", "#2B5BA8", "#F2C4CB", "#7BA7D4"];

export default function RiskContrib() {
  const { id } = useParams<{ id: string }>();
  const { result, loading, error } = usePortfolioResult(id!);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (loading) return <div className="text-gray-400 py-12 text-center">加载中...</div>;
  if (error || !result) return <div className="text-gray-400 py-12 text-center">暂无回测结果</div>;

  const { risk_contribution } = result;
  const assets = Object.keys(risk_contribution.contributions);
  const activeDate = selectedDate || risk_contribution.dates[risk_contribution.dates.length - 1];
  const detail = risk_contribution.detail.find((d: any) => d.date === activeDate);

  const totalContrib = risk_contribution.dates.map((_: string, j: number) =>
    assets.reduce((sum: number, a: string) => sum + (risk_contribution.contributions[a][j] ?? 0), 0)
  );

  const chartOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any[]) =>
        params.map((p: any) => `${p.seriesName}: ${((p.data as number) * 100).toFixed(2)}%`).join("<br/>"),
    },
    legend: { data: [...assets, "总风险"], top: 0 },
    xAxis: { type: "category", data: risk_contribution.dates, axisLabel: { fontSize: 10 } },
    yAxis: { type: "value", min: 0, axisLabel: { formatter: (v: number) => (v * 100).toFixed(1) + "%" } },
    series: [
      ...assets.map((a, i) => ({
        name: a,
        type: "bar",
        stack: "total",
        data: risk_contribution.contributions[a],
        color: COLORS[i % COLORS.length],
        emphasis: { focus: "series" },
      })),
      {
        name: "总风险",
        type: "line",
        data: totalContrib,
        color: "#374151",
        showSymbol: true,
        symbol: "circle",
        symbolSize: 5,
        lineStyle: { width: 2 },
        itemStyle: { color: "#374151", borderWidth: 1.5, borderColor: "#fff" },
        z: 10,
      },
    ],
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-brand-deep-blue mb-5">风险贡献</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <ReactECharts
          option={chartOption}
          style={{ height: 400 }}
          onEvents={{
            click: (params: any) => setSelectedDate(params.name),
          }}
        />
      </div>

      {detail && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
            {activeDate} 风险贡献明细
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["证券代码", "配置权重", "风险贡献", "风险贡献占比"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detail.assets.map((a: any, i: number) => (
                <tr key={a.code} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-2.5 font-mono text-brand-deep-blue">{a.code}</td>
                  <td className="px-4 py-2.5">{fmtPct(a.weight)}</td>
                  <td className="px-4 py-2.5">{fmtPct(a.risk_contribution)}</td>
                  <td className="px-4 py-2.5">{fmtPct(a.contribution_pct)}</td>
                </tr>
              ))}
              <tr className="border-t border-gray-200 font-medium bg-gray-50">
                <td className="px-4 py-2.5 text-gray-700">合计</td>
                <td className="px-4 py-2.5">{fmtPct(detail.assets.reduce((s: number, a: any) => s + a.weight, 0))}</td>
                <td className="px-4 py-2.5">{fmtPct(detail.assets.reduce((s: number, a: any) => s + a.risk_contribution, 0))}</td>
                <td className="px-4 py-2.5">{fmtPct(detail.assets.reduce((s: number, a: any) => s + a.contribution_pct, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
