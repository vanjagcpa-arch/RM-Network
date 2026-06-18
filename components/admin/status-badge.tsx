import { JOB_STATUSES, JOB_STATUS_CHIP_COLOR, type JobStatus } from "@/lib/utils";
import { Chip } from "@/components/ui/chip";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = JOB_STATUSES[status as JobStatus];
  const label = config?.label ?? status;
  const color = JOB_STATUS_CHIP_COLOR[status] ?? "slate";
  return <Chip label={label} color={color} className={className} />;
}
