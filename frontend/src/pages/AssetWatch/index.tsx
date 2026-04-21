import { useRef, useState } from "react";
import { Trash2, FileSpreadsheet, RefreshCw } from "lucide-react";
import { useAssets } from "../../hooks/useAssets";
import { assetsApi } from "../../lib/api";

export default function AssetWatch() {
  const { assets, loading, remove, refresh } = useAssets();
  const excelRef = useRef<HTMLInputElement>(null);
  const [excelClass, setExcelClass] = useState("macro");
  const [excelUploading, setExcelUploading] = useState(false);
  const [importedMsg, setImportedMsg] = useState("");
  const [reloading, setReloading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleReloadDefaults = async () => {
    setReloading(true);
    setImportedMsg("");
    try {
      const { data } = await assetsApi.reloadDefaults();
      setImportedMsg(`已导入 ${data.count} 个默认资产：${data.imported.join("、")}`);
      refresh();
    } catch (e: any) {
      setImportedMsg("导入失败：" + (e?.response?.data?.detail || e?.message || String(e)));
    } finally {
      setReloading(false);
    }
  };

  const handleExcelChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelUploading(true);
    setImportedMsg("");
    try {
      const { data } = await assetsApi.uploadExcel(file, excelClass);
      setImportedMsg(`已导入 ${data.count} 个资产：${data.imported.join("、")}`);
      refresh();
      if (excelRef.current) excelRef.current.value = "";
    } finally {
      setExcelUploading(false);
    }
  };

  const toggleSelect = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === assets.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(assets.map((a) => a.code)));
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`确认删除选中的 ${selected.size} 个资产？`)) return;
    for (const code of selected) {
      await assetsApi.delete(code);
    }
    setSelected(new Set());
    refresh();
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-deep-blue mb-6">资产观察</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">资产类别（批量）</label>
          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={excelClass}
            onChange={(e) => setExcelClass(e.target.value)}
          >
            <option value="equity">权益</option>
            <option value="bond">固收</option>
            <option value="commodity">商品</option>
            <option value="cash">现金</option>
            <option value="alternative">另类</option>
            <option value="macro">大类</option>
          </select>
        </div>
        <button
          onClick={() => excelRef.current?.click()}
          disabled={excelUploading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-mid-blue text-white rounded text-sm disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {excelUploading ? "导入中..." : "批量导入 Excel"}
        </button>
        <input ref={excelRef} type="file" accept=".xlsx" className="hidden" onChange={handleExcelChange} />
        <button
          onClick={handleReloadDefaults}
          disabled={reloading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          {reloading ? "导入中..." : "重新导入默认资产"}
        </button>
        {importedMsg && <span className="text-xs text-green-600">{importedMsg}</span>}

        {selected.size > 0 && (
          <button
            onClick={deleteSelected}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded text-sm"
          >
            <Trash2 className="w-4 h-4" />
            删除选中 ({selected.size})
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={assets.length > 0 && selected.size === assets.length}
                  onChange={toggleAll}
                />
              </th>
              {["代码", "名称", "资产类别", "起始日期", "最新日期", "更新频率", "操作"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">加载中...</td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">暂无资产，请导入 Excel 文件</td></tr>
            ) : (
              assets.map((a, i) => (
                <tr key={a.code} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(a.code)}
                      onChange={() => toggleSelect(a.code)}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-brand-deep-blue">{a.code}</td>
                  <td className="px-4 py-3">{a.name}</td>
                  <td className="px-4 py-3 text-gray-500">{a.asset_class}</td>
                  <td className="px-4 py-3 text-gray-500">{a.start_date}</td>
                  <td className="px-4 py-3 text-gray-500">{a.end_date}</td>
                  <td className="px-4 py-3 text-gray-500">{a.frequency}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => remove(a.code)}
                      className="text-gray-400 hover:text-brand-red transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
