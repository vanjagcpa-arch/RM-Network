import { db } from "@/db";
import { jobs, properties, bookingLinks } from "@/db/schema";
import { desc, eq, gte, and, not } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { JobCategoryBadge } from "@/components/admin/job-category-badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import {
  ClipboardList,
  Building2,
  Clock,
  CheckCircle2,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await requireSession();

  const today = new Date().toISOString().split("T")[0];

  const [allJobs, allProperties, allLinks, recentJobs, todayJobs] = await Promise.all([
    db.select().from(jobs),
    db.select().from(properties),
    db.select().from(bookingLinks).where(eq(bookingLinks.isActive, true)),
    db
      .select({ job: jobs, property: properties })
      .from(jobs)
      .leftJoin(properties, eq(jobs.propertyId, properties.id))
      .orderBy(desc(jobs.createdAt))
      .limit(5),
    db
      .select({ job: jobs, property: properties })
      .from(jobs)
      .leftJoin(properties, eq(jobs.propertyId, properties.id))
      .where(eq(jobs.scheduledDate, today))
      .orderBy(jobs.scheduledTimeStart),
  ]);

  const pending = allJobs.filter((j) => j.status === "pending").length;
  const confirmed = allJobs.filter((j) => j.status === "confirmed").length;
  const completed = allJobs.filter((j) => j.status === "completed").length;
  const total = allJobs.length;

  const stats = [
    { label: "Total Jobs", value: total, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Properties", value: allProperties.length, icon: Building2, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Pending", value: pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {session.name.split(" ")[0]}
          </h1>
          <p className="text-slate-500 mt-1">
            {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          + New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">{label}</span>
              <div className={`rounded-lg ${bg} p-2`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's jobs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Schedule</h2>
            </div>
            <span className="text-xs text-slate-500">{todayJobs.length} jobs</span>
          </div>
          <div className="divide-y divide-slate-50">
            {todayJobs.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CalendarDays className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No jobs scheduled for today</p>
              </div>
            ) : (
              todayJobs.map(({ job, property }) => (
                <Link key={job.id} href={`/jobs?highlight=${job.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 text-xs font-mono text-slate-500 w-14 text-right">
                    {formatTime(job.scheduledTimeStart) || "—"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{job.title}</p>
                    <p className="text-xs text-slate-500 truncate">{property?.name}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent jobs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">Recent Jobs</h2>
            </div>
            <Link href="/jobs" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentJobs.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No jobs yet</p>
                <Link href="/jobs/new" className="mt-2 inline-block text-sm text-blue-600 hover:underline">Create your first job →</Link>
              </div>
            ) : (
              recentJobs.map(({ job, property }) => (
                <Link key={job.id} href={`/jobs?highlight=${job.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{job.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{property?.name}</span>
                      {job.scheduledDate && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-500">{formatDate(job.scheduledDate)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={job.status} />
                    <JobCategoryBadge category={job.jobCategory} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      {confirmed > 0 || pending > 0 ? (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            You have <strong>{pending}</strong> pending and <strong>{confirmed}</strong> confirmed jobs. {" "}
            <Link href="/calendar" className="underline font-medium">View calendar →</Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
