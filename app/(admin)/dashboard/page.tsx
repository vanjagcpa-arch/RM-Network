import { db } from "@/db";
import { jobs, properties } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { JobCategoryBadge } from "@/components/admin/job-category-badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Plus,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await requireSession();

  const today = new Date().toISOString().split("T")[0];

  const [allJobs, allProperties, recentJobs, todayJobs] = await Promise.all([
    db.select().from(jobs),
    db.select().from(properties),
    db
      .select({ job: jobs, property: properties })
      .from(jobs)
      .leftJoin(properties, eq(jobs.propertyId, properties.id))
      .orderBy(desc(jobs.createdAt))
      .limit(6),
    db
      .select({ job: jobs, property: properties })
      .from(jobs)
      .leftJoin(properties, eq(jobs.propertyId, properties.id))
      .where(eq(jobs.scheduledDate, today))
      .orderBy(jobs.scheduledTimeStart),
  ]);

  const active = allJobs.filter((j) => j.status !== "completed" && j.status !== "cancelled").length;
  const pending = allJobs.filter((j) => j.status === "pending").length;
  const completed = allJobs.filter((j) => j.status === "completed").length;
  const overdue = allJobs.filter(
    (j) => j.scheduledDate && j.scheduledDate < today && j.status !== "completed" && j.status !== "cancelled"
  ).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-8 space-y-7">
      {/* Overdue alert */}
      {overdue > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 font-medium">
            {overdue} job{overdue > 1 ? "s are" : " is"} overdue.{" "}
            <Link href="/jobs" className="underline font-semibold">Review now →</Link>
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {session.name.split(" ")[0]}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Jobs</span>
            <div className="rounded-lg bg-blue-50 p-2">
              <ClipboardList className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{active}</p>
          <p className="text-xs text-slate-400 mt-1">{allProperties.length} properties managed</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Awaiting Tenant</span>
            <div className="rounded-lg bg-amber-50 p-2">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{pending}</p>
          <p className="text-xs text-slate-400 mt-1">Tenant confirmation needed</p>
        </div>

        <div className={`rounded-xl border p-5 shadow-sm ${overdue > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${overdue > 0 ? "text-red-400" : "text-slate-400"}`}>Overdue</span>
            <div className={`rounded-lg p-2 ${overdue > 0 ? "bg-red-100" : "bg-slate-50"}`}>
              <AlertTriangle className={`h-4 w-4 ${overdue > 0 ? "text-red-600" : "text-slate-400"}`} />
            </div>
          </div>
          <p className={`text-3xl font-bold ${overdue > 0 ? "text-red-700" : "text-slate-900"}`}>{overdue}</p>
          <p className={`text-xs mt-1 ${overdue > 0 ? "text-red-400" : "text-slate-400"}`}>Past scheduled date</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed</span>
            <div className="rounded-lg bg-emerald-50 p-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{completed}</p>
          <p className="text-xs text-slate-400 mt-1">All time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's jobs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Schedule</h2>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-medium">
              {todayJobs.length} job{todayJobs.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {todayJobs.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <CalendarDays className="h-8 w-8 text-slate-200 mx-auto mb-2.5" />
                <p className="text-sm text-slate-500">No jobs scheduled for today</p>
                <Link href="/jobs/new" className="mt-3 inline-block text-sm text-blue-600 hover:underline font-medium">
                  Schedule a job →
                </Link>
              </div>
            ) : (
              todayJobs.map(({ job, property }) => (
                <Link
                  key={job.id}
                  href={`/jobs?highlight=${job.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-shrink-0 text-xs font-mono text-slate-400 w-14 text-right tabular-nums">
                    {formatTime(job.scheduledTimeStart) || "—"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{job.title}</p>
                    <p className="text-xs text-slate-400 truncate">{property?.name}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent jobs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">Recent Jobs</h2>
            </div>
            <Link href="/jobs" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 font-medium">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentJobs.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-slate-500">No jobs yet</p>
                <Link href="/jobs/new" className="mt-2 inline-block text-sm text-blue-600 hover:underline font-medium">
                  Create your first job →
                </Link>
              </div>
            ) : (
              recentJobs.map(({ job, property }) => (
                <Link
                  key={job.id}
                  href={`/jobs?highlight=${job.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{job.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 truncate">{property?.name}</span>
                      {job.scheduledDate && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-400">{formatDate(job.scheduledDate)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <StatusBadge status={job.status} />
                    <JobCategoryBadge category={job.jobCategory} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
