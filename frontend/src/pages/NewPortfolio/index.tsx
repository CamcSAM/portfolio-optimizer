import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Ban } from "lucide-react";
import CollapseSection from "../../components/CollapseSection";
import { useAssets } from "../../hooks/useAssets";
import type { Asset } from "../../hooks/useAssets";
import { portfoliosApi } from "../../lib/api";

interface AssetRow extends Asset {
  weight_lo: number;
  weight_hi: number;
}

const MODELS = [
  { value: "equal_weight", label: "等权重" },
  { value: "min_volatility", label: "最小波动" },
  { value: "max_sharpe", label: "均值方差（最大夏普）" },
  { value: "risk_parity", label: "风险平价" },
];

const LOOKBACK_OPTIONS = [
  { value: 6, label: "前推 6 个月" },
  { value: 12, label: "前推 1 年" },
  { value: 24, label: "前推 2 年" },
  { value: 36, label: "前推 3 年" },
];

const REBALANCE_OPTIONS = [
  { value: "monthly", label: "月度" },
  { value: "quarterly", label: "季度" },
  { value: "semi_annual", label: "半年度" },
  { value: "annual", label: "年度" },
  { value: "buy_and_hold", label: "买入并持有" },
];

export default function NewPortfolio() {
  const navigate = useNavigate();
  const { assets } = useAssets();
  const [name, setName] = useState("");
  const [benchmarkCode, setBenchmarkCode] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<AssetRow[]>([]);
  const [assetSelect, setAssetSelect] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [model, setModel] = useState("equal_weight");
  const [lookback, setLookback] = useState(12);
  const [riskFreeRate, setRiskFreeRate] = useState(2.0);
  const [startDate, setStartDate] = useState("2016-01-01");
  const [endDate, setEndDate] = useState("");
  const [initialCapital, setInitialCapital] = useState(100);
  const [rebalancePeriod, setRebalancePeriod] = useState("quarterly");
  const [rebalanceTiming, setRebalanceTiming] = useState("start");
  const [saving, setSaving] = useState(false);

  const isEqualWeight = model === "equal_weight";

  useEffect(() => {
    if (assets.length > 0 && !endDate) {
      setEndDate(assets.reduce((m, a) => (a.end_date > m ? a.end_date : m), ""));
    }
  }, [assets]);

  const addAsset = (a: Asset) => {
    if (selectedAssets.find((s) => s.code === a.code)) return;
    if (selectedAssets.length >= 50) return;
    const updated = [...selectedAssets, { ...a, weight_lo: 0, weight_hi: 1 }];
    setSelectedAssets(updated);
    if (!benchmarkCode) setBenchmarkCode(updated[0].code);
    setAssetSelect("");
  };

  const removeAsset = (code: string) =>
    setSelectedAssets(selectedAssets.filter((a) => a.code !== code));

  const clearBounds = () =>
    setSelectedAssets(selectedAssets.map((a) => ({ ...a, weight_lo: 0, weight_hi: 1 })));

  const handleSave = async () => {
    if (!name || selectedAssets.length < 2) return;
    setSaving(true);
    try {
      const config = {
        name,
        benchmark_code: benchmarkCode || selectedAssets[0]?.code,
        assets: selectedAssets.map((a) => ({
          code: a.code,
          name: a.name,
          asset_class: a.asset_class,
          weight_lo: a.weight_lo,
          weight_hi: a.weight_hi,
        })),
        model,
        lookback_months: lookback,
        risk_free_rate: riskFreeRate / 100,
        start_date: startDate,
        end_date: endDate,
        initial_capital: initialCapital,
        frequency: "daily",
        rebalance_period: rebalancePeriod,
        rebalance_timing: rebalanceTiming,
      };
      const { data: created } = await portfoliosApi.create(config);
      await portfoliosApi.backtest(created.id);
      navigate(`/portfolios/${created.id}/overview`);
    } finally {
      setSaving(false);
    }
  };

  const assetClasses = [...new Set(assets.map((a) => a.asset_class))].filter(Boolean);

  const filteredAssets = assets.filter(
    (a) =>
      !selectedAssets.find((s) => s.code === a.code) &&
      (!classFilter || a.asset_class === classFilter)
  );

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl font-semibold text-brand-deep-blue mb-6">新建组合</h1>

      <CollapseSection title="① 组合构建">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">组合名称 *</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入组合名称"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">业绩基准</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={benchmarkCode}
              onChange={(e) => setBenchmarkCode(e.target.value)}
            >
              <option value="">-- 选择基准 --</option>
              {assets.map((a) => (
                <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm shrink-0"
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setAssetSelect(""); }}
          >
            <option value="">全部类别</option>
            {assetClasses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
            value={assetSelect}
            onChange={(e) => {
              const a = assets.find((x) => x.code === e.target.value);
              if (a) addAsset(a);
            }}
          >
            <option value="">-- 选择资产 --</option>
            {filteredAssets.map((a) => (
              <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 mb-3">
          <button onClick={clearBounds} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50">
            <Ban className="w-3 h-3" /> 取消比例限制
          </button>
        </div>

        {selectedAssets.length > 0 && (
          <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                {["代码", "名称", "类别", "下限(%)", "上限(%)", ""].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedAssets.map((a, i) => (
                <tr key={a.code} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-3 py-2 font-mono text-brand-deep-blue">{a.code}</td>
                  <td className="px-3 py-2">{a.name}</td>
                  <td className="px-3 py-2 text-gray-500">{a.asset_class}</td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} max={100} step={1}
                      className="w-20 border border-gray-200 rounded px-2 py-1"
                      value={(a.weight_lo * 100).toFixed(0)}
                      onChange={(e) => setSelectedAssets(selectedAssets.map((s) =>
                        s.code === a.code ? { ...s, weight_lo: parseFloat(e.target.value) / 100 } : s
                      ))}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} max={100} step={1}
                      className="w-full border border-gray-200 rounded px-2 py-1"
                      value={(a.weight_hi * 100).toFixed(0)}
                      onChange={(e) => setSelectedAssets(selectedAssets.map((s) =>
                        s.code === a.code ? { ...s, weight_hi: parseFloat(e.target.value) / 100 } : s
                      ))}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeAsset(a.code)} className="text-gray-400 hover:text-brand-red">
                      <X className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CollapseSection>

      <CollapseSection title="② 模型设置">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">资产配置模型</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className={isEqualWeight ? "opacity-40 pointer-events-none" : ""}>
            <label className="text-xs text-gray-500 block mb-1">预期收益/风险区间</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={lookback}
              onChange={(e) => setLookback(parseInt(e.target.value))}
            >
              {LOOKBACK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {model === "max_sharpe" && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">无风险收益率 (%)</label>
              <input
                type="number" step={0.1} min={0} max={20}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={riskFreeRate}
                onChange={(e) => setRiskFreeRate(parseFloat(e.target.value))}
              />
            </div>
          )}
        </div>
      </CollapseSection>

      <CollapseSection title="③ 回测设置">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">开始日期</label>
            <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">结束日期</label>
            <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">初始资金</label>
            <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={initialCapital} onChange={(e) => setInitialCapital(parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">再平衡方式</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={rebalancePeriod} onChange={(e) => setRebalancePeriod(e.target.value)}>
              {REBALANCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">再平衡时机</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={rebalanceTiming} onChange={(e) => setRebalanceTiming(e.target.value)}>
              <option value="start">期初</option>
              <option value="end">期末</option>
            </select>
          </div>
        </div>
      </CollapseSection>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={saving || !name || selectedAssets.length < 2 || !startDate || !endDate}
          className="px-6 py-2.5 bg-brand-red text-white rounded text-sm font-medium disabled:opacity-50"
        >
          {saving ? "保存并回测中..." : "保存并回测"}
        </button>
        <button
          onClick={() => navigate("/assets")}
          className="px-6 py-2.5 border border-brand-mid-blue text-brand-mid-blue rounded text-sm"
        >
          取消
        </button>
      </div>
    </div>
  );
}
