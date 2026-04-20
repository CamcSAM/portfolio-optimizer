import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { useAssets } from "../../hooks/useAssets";

export default function AssetWatch() {
  const { assets, loading, upload, remove } = useAssets();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadClass, setUploadClass] = useState("equity");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await upload(file, uploadName || file.name.replace(".csv", ""), uploadClass);
      setUploadName("");
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-deep-blue mb-6">资产观察</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">资产名称</label>
          <input
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-40"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="可选"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">资产类别</label>
          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={uploadClass}
            onChange={(e) => setUploadClass(e.target.value)}
          >
            <option value="equity">权益</option>
            <option value="bond">固收</option>
            <option value="commodity">商品</option>
            <option value="cash">现金</option>
            <option value="alternative">另类</option>
          </select>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded text-sm disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "上传中..." : "上传 CSV"}
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {["代码", "名称", "资产类别", "起始日期", "最新日期", "更新频率", "操作"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">加载中...</td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">暂无资产，请上传 CSV 文件</td></tr>
            ) : (
              assets.map((a, i) => (
                <tr key={a.code} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
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
