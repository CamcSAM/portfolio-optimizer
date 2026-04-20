import { useParams } from "react-router-dom";
import { useState } from "react";
import ReactECharts from "echarts-for-react";
import { usePortfolioResult } from "../../hooks/usePortfolioResult";
import { fmtPct } from "../../lib/utils";

export default function EfficientFrontier() {
  const { id } = useParams<{ id: string }>();
  const { result, loading, error } = usePortfolioResult(id!);
  const [selectedHoldingIdx, setSelectedHoldingIdx] = useState(0);

  if (loading) return <div className="text-gray-400 py-12 text-center">加载中...</div>;
  if (error || !result) return <div className="text-gray-400 py-12 text-center">暂无回测结果</div>;

  const { efficient_frontier, holdings } = result;
  const currentHolding = holdings[selectedHoldingIdx];

  const scatterData = efficient_frontier.points.map((p: any) => [p.vol, p.ret]);

  const chartOption = {
    tooltip: {
      formatter: (params: any) => {
        if (params.seriesIndex === 0) {
          return `风险: ${(params.data[0] * 100).toFixed(2)}%<br/>收益: ${(params.data[1] * 100).toFixed(2)}%`;
        }
        return `当前组合<br/>风险: ${(params.data[0] * 100).toFixed(2)}%<br/>收益: ${(params.data[1] * 100).toFixed(2)}%`;
      },
    },
    xAxis: { name: "年化波动率", axisLabel: { formatter: (v: number) => (v * 100).toFixed(1) + "%" } },
    yAxis: { name: "年化收益率", axisLabel: { formatter: (v: number) => (v * 100).toFixed(1) + "%" } },
    series: [
      {
        name: "随机组合",
        type: "scatter",
        data: scatterData,
        symbolSize: 4,
        itemStyle: { color: "#2B5BA8", opacity: 0.5 },
      },
    ],
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-brand-deep-blue mb-5">有效前沿</h2>
      <div className="flex gap-4">
        <div className="w-36 shrink-0 bg-white rounded-lg border border-gray-200 overflow-auto max-h-[500px]">
          {holdings.map((h: any, i: number) => (
            <button
              key={h.date}
              onClick={() => setSelectedHoldingIdx(i)}
              className={`w-full text-left px-3 py-2.5 text-xs border-b border-gray-100
                ${i === selectedHoldingIdx
                  ? "border-l-[3px] border-l-brand-red bg-brand-light-red text-brand-red font-medium"
                  : "border-l-[3px] border-l-transparent text-gray-600 hover:bg-gray-50"}`}
            >
              {h.date}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <ReactECharts option={chartOption} style={{ height: 360 }} />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b text-sm font-medium text-gray-700">
              {currentHolding.date} 配置权重
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["资产", "配置权重"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentHolding.positions.map((p: any, i: number) => (
                  <tr key={p.code} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-2.5 font-mono text-brand-deep-blue">{p.code}</td>
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
