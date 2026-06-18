import { JOB_STATUSES, type JobStatus } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = JOB_STATUSES[status as JobStatus] ?? {
    label: status,
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", config.color, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", "dot" in config ? config.dot : "bg-slate-400")} />
      {config.label}
    </span>
  );
}
