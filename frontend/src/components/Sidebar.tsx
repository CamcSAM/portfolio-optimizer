import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, Plus, Eye, BarChart2, Trash2, Pencil, Check, X } from "lucide-react";
import { usePortfolios } from "../hooks/usePortfolios";
import { portfoliosApi } from "../lib/api";
import { cn } from "../lib/utils";

const SUB_PAGES = [
  { label: "概览", path: "overview" },
  { label: "收益统计", path: "returns" },
  { label: "历史持仓", path: "holdings" },
  { label: "风险贡献", path: "risk" },
  { label: "有效前沿", path: "frontier" },
];

export default function Sidebar() {
  const { portfolios, refresh } = usePortfolios();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { refresh(); }, [location.key]);

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("确认删除该组合？")) return;
    await portfoliosApi.delete(id);
    await refresh();
    navigate("/assets");
  };

  const startRename = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const commitRename = async (id: string) => {
    if (renameValue.trim()) {
      await portfoliosApi.rename(id, renameValue.trim());
      await refresh();
    }
    setRenamingId(null);
  };

  const cancelRename = () => setRenamingId(null);

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-4 py-5 flex items-center gap-2 border-b border-gray-100">
        <div className="w-7 h-7 bg-brand-red rounded flex items-center justify-center">
          <BarChart2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-brand-deep-blue">多资产配置平台</span>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        <NavLink
          to="/assets"
          className={({ isActive }) =>
            cn("flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
              isActive
                ? "border-l-[3px] border-brand-red bg-brand-light-red text-brand-red font-medium"
                : "border-l-[3px] border-transparent text-gray-600 hover:bg-gray-50")
          }
        >
          <Eye className="w-4 h-4" />
          资产观察
        </NavLink>

        <NavLink
          to="/portfolios/new"
          className={({ isActive }) =>
            cn("flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
              isActive
                ? "border-l-[3px] border-brand-red bg-brand-light-red text-brand-red font-medium"
                : "border-l-[3px] border-transparent text-gray-600 hover:bg-gray-50")
          }
        >
          <Plus className="w-4 h-4" />
          新建组合
        </NavLink>

        <div className="mt-2 px-4 py-1 text-xs text-gray-400 uppercase tracking-wider">
          我的组合
        </div>

        {portfolios.map((p) => (
          <div key={p.id}>
            <div className="group flex items-center hover:bg-gray-50 border-l-[3px] border-transparent">
              <button
                onClick={() => { toggle(p.id); navigate(`/portfolios/${p.id}/overview`); }}
                className="flex items-center gap-1 flex-1 px-4 py-2 text-sm text-gray-700 min-w-0"
              >
                {expandedIds.has(p.id)
                  ? <ChevronDown className="w-3 h-3 shrink-0" />
                  : <ChevronRight className="w-3 h-3 shrink-0" />}
                {renamingId === p.id ? (
                  <input
                    autoFocus
                    className="flex-1 min-w-0 text-sm border border-gray-300 rounded px-1 py-0.5"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(p.id);
                      if (e.key === "Escape") cancelRename();
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate">{p.name}</span>
                )}
              </button>

              {renamingId === p.id ? (
                <div className="flex items-center gap-1 pr-2 shrink-0">
                  <button onClick={() => commitRename(p.id)} className="text-green-600 hover:text-green-700">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={cancelRename} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="hidden group-hover:flex items-center gap-1 pr-2 shrink-0">
                  <button
                    onClick={(e) => startRename(e, p.id, p.name)}
                    className="text-gray-400 hover:text-brand-mid-blue"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, p.id)}
                    className="text-gray-400 hover:text-brand-red"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {expandedIds.has(p.id) && (
              <div className="pl-7">
                {SUB_PAGES.map((sp) => (
                  <NavLink
                    key={sp.path}
                    to={`/portfolios/${p.id}/${sp.path}`}
                    className={({ isActive }) =>
                      cn("block px-3 py-1.5 text-xs transition-colors",
                        isActive
                          ? "border-l-[3px] border-brand-red bg-brand-light-red text-brand-red"
                          : "border-l-[3px] border-transparent text-gray-500 hover:bg-gray-50")
                    }
                  >
                    {sp.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
