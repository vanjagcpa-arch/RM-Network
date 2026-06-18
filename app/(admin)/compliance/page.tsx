import { db } from "@/db";
import { jobs, properties } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { JOB_CATEGORIES, COMPLIANCE_INTERVALS } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Clock, ShieldCheck, Building2, Plus } from "lucide-react";

const COMPLIANCE_CATS = Object.keys(COMPLIANCE_INTERVALS) as (keyof typeof COMPLIANCE_INTERVALS)[];

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function cellStatus(lastDate: string | null, intervalMonths: number, today: string) {
  if (!lastDate) return "never";
  const daysAgo = daysBetween(lastDate, today);
  const intervalDays = intervalMonths * 30.44;
  if (daysAgo >= intervalDays) return "overdue";
  if (daysAgo >= intervalDays - 60) return "due_soon";
  return "ok";
}

function nextDueDate(lastDate: string, intervalMonths: number): string {
  const [y, m, d] = lastDate.split("-").map(Number);
  const next = new Date(y, m - 1 + intervalMonths, d);
  return next.toISOString().split("T")[0];
}

function fmtDate(s: string) {
  const [y, mo, d] = s.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default async function CompliancePage() {
  await requireSession();

  const today = new Date().toISOString().split("T")[0];

  const [allProperties, completedJobs] = await Promise.all([
    db.select().from(properties).orderBy(properties.name),
    db
      .select({ id: jobs.id, propertyId: jobs.propertyId, jobCategory: jobs.jobCategory, scheduledDate: jobs.scheduledDate })
      .from(jobs)
      .where(and(eq(jobs.status, "completed"), inArray(jobs.jobCategory, COMPLIANCE_CATS))),
  ]);

  // Build lookup: propertyId → jobCategory → latest scheduledDate
  const lookup: Record<string, Record<string, string>> = {};
  for (const j of completedJobs) {
    if (!j.scheduledDate) continue;
    if (!lookup[j.propertyId]) lookup[j.propertyId] = {};
    const existing = lookup[j.propertyId][j.jobCategory];
    if (!existing || j.scheduledDate > existing) {
      lookup[j.propertyId][j.jobCategory] = j.scheduledDate;
    }
  }

  // Compute per-property stats
  const propertyStats = allProperties.map((prop) => {
    const cats = COMPLIANCE_CATS.map((cat) => {
      const last = lookup[prop.id]?.[cat] ?? null;
      const interval = COMPLIANCE_INTERVALS[cat]!;
      const status = cellStatus(last, interval, today);
      return { cat, last, interval, status };
    });
    const overdue = cats.filter((c) => c.status === "overdue" || c.status === "never").length;
    const dueSoon = cats.filter((c) => c.status === "due_soon").length;
    return { prop, cats, overdue, dueSoon };
  });

  const totalOverdue = propertyStats.filter((p) => p.overdue > 0).length;
  const totalDueSoon = propertyStats.filter((p) => p.overdue === 0 && p.dueSoon > 0).length;
  const totalCompliant = propertyStats.filter((p) => p.overdue === 0 && p.dueSoon === 0).length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Compliance Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track compliance status across all properties</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Building2 className="h-5 w-5 text-slate-500" />} label="Total properties" value={allProperties.length} bg="bg-slate-50" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} label="Fully compliant" value={totalCompliant} bg="bg-green-50" valueColor="text-green-700" />
        <StatCard icon={<Clock className="h-5 w-5 text-amber-500" />} label="Due within 2 months" value={totalDueSoon} bg="bg-amber-50" valueColor="text-amber-700" />
        <StatCard icon={<AlertCircle className="h-5 w-5 text-red-500" />} label="Overdue / never done" value={totalOverdue} bg="bg-red-50" valueColor={totalOverdue > 0 ? "text-red-700" : "text-slate-400"} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-400 inline-block" /> Compliant</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-400 inline-block" /> Due within 2 months</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-400 inline-block" /> Overdue</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-slate-300 inline-block" /> Never serviced</span>
      </div>

      {/* Compliance matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-5 py-3 font-semibold text-slate-700 w-56">Property</th>
              {COMPLIANCE_CATS.map((cat) => {
                const cfg = JOB_CATEGORIES[cat];
                const interval = COMPLIANCE_INTERVALS[cat]!;
                return (
                  <th key={cat} className="text-center px-3 py-3 font-semibold text-slate-700 min-w-[140px]">
                    <div>{cfg.label}</div>
                    <div className="text-xs font-normal text-slate-400">Every {interval}mo</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {propertyStats.map(({ prop, cats }) => (
              <tr key={prop.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3">
                  <Link href={`/buildings/${prop.id}`} className="font-medium text-slate-900 hover:text-violet-600 transition-colors">
                    {prop.name}
                  </Link>
                  {prop.suburb && <p className="text-xs text-slate-400">{prop.suburb}</p>}
                </td>
                {cats.map(({ cat, last, interval, status }) => (
                  <td key={cat} className="px-3 py-3 text-center">
                    <ComplianceCell
                      status={status}
                      lastDate={last}
                      nextDue={last ? nextDueDate(last, interval) : null}
                      today={today}
                      propertyId={prop.id}
                      jobCategory={cat}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {allProperties.length === 0 && (
          <div className="py-16 text-center">
            <ShieldCheck className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">No properties added yet.</p>
            <Link href="/properties" className="text-sm text-violet-600 hover:underline mt-1 inline-block">Add a property →</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg, valueColor = "text-slate-900" }: {
  icon: React.ReactNode; label: string; value: number; bg: string; valueColor?: string;
}) {
  return (
    <div className={`${bg} rounded-xl border border-slate-200 p-4 shadow-sm`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function ComplianceCell({ status, lastDate, nextDue, today, propertyId, jobCategory }: {
  status: string; lastDate: string | null; nextDue: string | null;
  today: string; propertyId: string; jobCategory: string;
}) {
  if (status === "never") {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" />
        <span className="text-xs text-slate-400">Never</span>
        <Link href={`/jobs/new?propertyId=${propertyId}&jobCategory=${jobCategory}`}
          className="text-xs text-violet-600 hover:underline flex items-center gap-0.5">
          <Plus className="h-2.5 w-2.5" />Schedule
        </Link>
      </div>
    );
  }

  const dotColor = status === "ok" ? "bg-green-400" : status === "due_soon" ? "bg-amber-400" : "bg-red-400";
  const daysUntil = nextDue ? daysBetween(today, nextDue) : 0;
  const isOverdue = daysUntil < 0;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`h-2.5 w-2.5 rounded-full ${dotColor} inline-block mb-0.5`} />
      <span className="text-xs text-slate-600">{lastDate ? fmtDate(lastDate) : ""}</span>
      <span className={`text-xs font-medium ${isOverdue ? "text-red-600" : "text-slate-400"}`}>
        {isOverdue ? `${Math.abs(daysUntil)}d overdue` : `due in ${daysUntil}d`}
      </span>
      {(status === "overdue" || status === "due_soon") && (
        <Link href={`/jobs/new?propertyId=${propertyId}&jobCategory=${jobCategory}`}
          className="text-xs text-violet-600 hover:underline flex items-center gap-0.5 mt-0.5">
          <Plus className="h-2.5 w-2.5" />Schedule
        </Link>
      )}
    </div>
  );
}
