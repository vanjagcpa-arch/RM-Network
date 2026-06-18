import { JOB_CATEGORIES, JOB_CATEGORY_CHIP_COLOR, type JobCategory } from "@/lib/utils";
import { Chip } from "@/components/ui/chip";

export function JobCategoryBadge({ category, className }: { category: string; className?: string }) {
  const config = JOB_CATEGORIES[category as JobCategory];
  const label = config?.label ?? category;
  const color = JOB_CATEGORY_CHIP_COLOR[category] ?? "slate";
  return <Chip label={label} color={color} className={className} />;
}
