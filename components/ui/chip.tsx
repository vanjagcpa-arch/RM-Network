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
  amber:   "bg-amber-100 text-amber-700",
  blue:    "bg-sky-100 text-sky-600",
  emerald: "bg-emerald-100 text-emerald-700",
  green:   "bg-green-100 text-green-700",
  red:     "bg-red-100 text-red-700",
  orange:  "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  purple:  "bg-purple-100 text-purple-700",
  slate:   "bg-slate-100 text-slate-600",
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
        "inline-flex items-center gap-1 rounded-[8px] px-[9px] py-[5px] text-xs font-semibold",
        CHIP_COLORS[color],
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3 flex-shrink-0" />}
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
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all",
        selected
          ? "bg-slate-900 text-white"
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
