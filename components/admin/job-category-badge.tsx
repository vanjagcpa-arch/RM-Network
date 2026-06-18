import { JOB_CATEGORIES, type JobCategory } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface JobCategoryBadgeProps {
  category: string;
  className?: string;
}

export function JobCategoryBadge({ category, className }: JobCategoryBadgeProps) {
  const config = JOB_CATEGORIES[category as JobCategory];
  if (!config) return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600", className)}>{category}</span>;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", config.color, className)}>
      {config.label}
    </span>
  );
}
