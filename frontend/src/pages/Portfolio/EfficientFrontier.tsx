import { useParams } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import { usePortfolioResult } from "../../hooks/usePortfolioResult";

export default function EfficientFrontier() {
  const { id } = useParams<{ id: string }>();
  const { result, loading, error } = usePortfolioResult(id!);

  if (loading) return <div className="text-gray-400 py-12 text-center">加载中...</div>;
  if (error || !result) return <div className="text-gray-400 py-12 text-center">暂无回测结果</div>;

  const { efficient_frontier } = result;
  const scatterData = efficient_frontier.points.map((p: any) => [p.vol, p.ret]);
  const actual = efficient_frontier.actual;

  const chartOption = {
    tooltip: {
      formatter: (params: any) => {
        if (params.seriesName === "实际组合") {
          return `实际组合<br/>风险: ${(params.data[0] * 100).toFixed(2)}%<br/>收益: ${(params.data[1] * 100).toFixed(2)}%`;
        }
        return `风险: ${(params.data[0] * 100).toFixed(2)}%<br/>收益: ${(params.data[1] * 100).toFixed(2)}%`;
      },
    },
    legend: { data: ["随机组合", ...(actual ? ["实际组合"] : [])], top: 0 },
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
      ...(actual ? [{
        name: "实际组合",
        type: "scatter",
        data: [[actual.vol, actual.ret]],
        symbolSize: 14,
        itemStyle: { color: "#C41230" },
        label: { show: true, formatter: "实际", position: "top", fontSize: 10, color: "#C41230" },
      }] : []),
    ],
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-brand-deep-blue mb-5">有效前沿</h2>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <ReactECharts option={chartOption} style={{ height: 500 }} />
      </div>
    </div>
  );
}
