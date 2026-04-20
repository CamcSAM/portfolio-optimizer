import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapseSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapseSection({ title, defaultOpen = true, children }: CollapseSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 bg-brand-mid-blue text-white text-sm font-medium"
        style={{ borderLeft: "4px solid #C41230" }}
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div className="bg-white p-5">{children}</div>}
    </div>
  );
}
