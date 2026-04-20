import { cn } from "../lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  positive?: boolean | null;
}

export default function KpiCard({ label, value, positive }: KpiCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 px-4 py-3 flex flex-col gap-1 shadow-sm">
      <span className="text-xs text-gray-500">{label}</span>
      <span
        className={cn(
          "text-lg font-semibold",
          positive === true && "text-brand-red",
          positive === false && "text-brand-deep-blue",
          positive === null || positive === undefined ? "text-gray-800" : ""
        )}
      >
        {value}
      </span>
    </div>
  );
}
