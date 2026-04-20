import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Plus, Eye, BarChart2 } from "lucide-react";
import { usePortfolios } from "../hooks/usePortfolios";
import { cn } from "../lib/utils";

const SUB_PAGES = [
  { label: "概览", path: "overview" },
  { label: "收益统计", path: "returns" },
  { label: "历史持仓", path: "holdings" },
  { label: "风险贡献", path: "risk" },
  { label: "有效前沿", path: "frontier" },
];

export default function Sidebar() {
  const { portfolios } = usePortfolios();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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
            <button
              onClick={() => {
                toggle(p.id);
                navigate(`/portfolios/${p.id}/overview`);
              }}
              className="w-full flex items-center gap-1 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {expandedIds.has(p.id)
                ? <ChevronDown className="w-3 h-3 shrink-0" />
                : <ChevronRight className="w-3 h-3 shrink-0" />}
              <span className="truncate">{p.name}</span>
            </button>

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
