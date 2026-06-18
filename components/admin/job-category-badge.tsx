import { JOB_CATEGORIES, type JobCategory } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface JobCategoryBadgeProps {
  category: string;
  className?: string;
}

export function JobCategoryBadge({ category, className }: JobCategoryBadgeProps) {
  const config = JOB_CATEGORIES[category as JobCategory];
  if (!config) return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 border-slate-200", className)}>{category}</span>;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", config.color, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", config.dotColor)} />
      {config.label}
    </span>
  );
}
