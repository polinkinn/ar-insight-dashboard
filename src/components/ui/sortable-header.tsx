import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { SortDirection } from "@/hooks/use-sortable";
import { cn } from "@/lib/utils";

interface SortableHeaderProps {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  className?: string;
}

export function SortableHeader({ label, active, direction, onClick, className }: SortableHeaderProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 hover:text-foreground transition-colors select-none",
        active ? "text-foreground" : "text-muted-foreground",
        className
      )}
    >
      {label}
      {active && direction === "asc" ? (
        <ArrowUp className="w-3 h-3" />
      ) : active && direction === "desc" ? (
        <ArrowDown className="w-3 h-3" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );
}
