import { useParams } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import { usePortfolioResult } from "../../hooks/usePortfolioResult";
import KpiCard from "../../components/KpiCard";
import { fmtPct, fmtNum } from "../../lib/utils";

const COLORS = ["#C41230", "#1B3A6B", "#E8899A", "#2B5BA8", "#F2C4CB", "#7BA7D4"];

export default function Overview() {
  const { id } = useParams<{ id: string }>();
  const { result, loading, error } = usePortfolioResult(id!);

  if (loading) return <div className="text-gray-400 py-12 text-center">加载中...</div>;
  if (error || !result) return <div className="text-gray-400 py-12 text-center">暂无回测结果</div>;

  const { kpis, nav_series, weight_series } = result;

  const kpiItems = [
    { label: "总回报", value: fmtPct(kpis.total_return), positive: kpis.total_return > 0 },
    { label: "超越基准回报", value: fmtPct(kpis.excess_return), positive: kpis.excess_return > 0 },
    { label: "年化收益率", value: fmtPct(kpis.annualized_return), positive: kpis.annualized_return > 0 },
    { label: "年化波动率", value: fmtPct(kpis.annualized_vol), positive: null },
    { label: "最大回撤", value: fmtPct(kpis.max_drawdown), positive: false },
    { label: "Alpha", value: fmtNum(kpis.alpha, 4), positive: kpis.alpha > 0 },
    { label: "Beta", value: fmtNum(kpis.beta, 4), positive: null },
    { label: "Sharpe", value: fmtNum(kpis.sharpe, 4), positive: kpis.sharpe > 0 },
    { label: "信息比率", value: fmtNum(kpis.info_ratio, 4), positive: kpis.info_ratio > 0 },
    { label: "下行风险", value: fmtPct(kpis.downside_risk), positive: null },
  ];

  const navOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["组合", "基准"], top: 0 },
    xAxis: { type: "category", data: nav_series.dates, axisLabel: { fontSize: 10 } },
    yAxis: { type: "value", axisLabel: { fontSize: 10 } },
    series: [
      { name: "组合", type: "line", data: nav_series.portfolio, lineStyle: { color: "#C41230" }, showSymbol: false },
      { name: "基准", type: "line", data: nav_series.benchmark, lineStyle: { color: "#1B3A6B" }, showSymbol: false },
    ],
  };

  const assetKeys = Object.keys(weight_series.weights);
  const weightOption = {
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: { data: assetKeys, top: 0 },
    xAxis: { type: "category", data: weight_series.dates, axisLabel: { fontSize: 10 } },
    yAxis: { type: "value", axisLabel: { formatter: (v: number) => (v * 100).toFixed(0) + "%" } },
    series: assetKeys.map((a, i) => ({
      name: a,
      type: "line",
      stack: "total",
      areaStyle: {},
      data: weight_series.weights[a],
      color: COLORS[i % COLORS.length],
      showSymbol: false,
    })),
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-brand-deep-blue mb-5">概览</h2>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {kpiItems.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} positive={k.positive} />
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">业绩表现</h3>
        <ReactECharts option={navOption} style={{ height: 280 }} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">持仓权重</h3>
        <ReactECharts option={weightOption} style={{ height: 240 }} />
      </div>
    </div>
  );
}
