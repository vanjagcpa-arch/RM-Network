import { cn } from "@/lib/utils";

export type ChipColor =
  | "amber"
  | "blue"
  | "emerald"
  | "green"
  | "red"
  | "orange"
  | "purple"
  | "slate";

export const CHIP_COLORS: Record<ChipColor, string> = {
  amber:   "bg-amber-100 text-amber-700 border-amber-200",
  blue:    "bg-blue-100 text-blue-700 border-blue-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  green:   "bg-green-100 text-green-700 border-green-200",
  red:     "bg-red-100 text-red-700 border-red-200",
  orange:  "bg-orange-100 text-orange-700 border-orange-200",
  purple:  "bg-purple-100 text-purple-700 border-purple-200",
  slate:   "bg-slate-100 text-slate-600 border-slate-200",
};

interface ChipProps {
  label: string;
  color?: ChipColor;
  icon?: React.ElementType;
  className?: string;
}

export function Chip({ label, color = "slate", icon: Icon, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold",
        CHIP_COLORS[color],
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
      {label}
    </span>
  );
}

interface FilterChipProps {
  label: string;
  color?: ChipColor;
  selected?: boolean;
  count?: number;
  icon?: React.ElementType;
  onClick?: () => void;
  className?: string;
}

export function FilterChip({
  label,
  color = "slate",
  selected,
  count,
  icon: Icon,
  onClick,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all",
        selected
          ? "bg-slate-900 text-white border-slate-900"
          : cn(CHIP_COLORS[color], "hover:opacity-80"),
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
      {label}
      {typeof count === "number" && (
        <span className={selected ? "opacity-60" : "opacity-50"}>
          {count}
        </span>
      )}
    </button>
  );
}
