import { db } from "@/db";
import { properties, jobs, bookingLinks, technicians } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { JobCategoryBadge } from "@/components/admin/job-category-badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate, formatTime, JOB_STATUSES } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Phone, Mail, Plus, Calendar,
  ClipboardList, Link2, CheckCircle2, Clock, AlertCircle, TrendingUp, User
} from "lucide-react";
import { BuildingActions } from "./building-actions";

export default async function BuildingViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;

  const [property, propJobs, propLinks] = await Promise.all([
    db.select().from(properties).where(eq(properties.id, id)).limit(1).then((r) => r[0]),
    db
      .select({ job: jobs, tech: technicians })
      .from(jobs)
      .leftJoin(technicians, eq(jobs.technicianId, technicians.id))
      .where(eq(jobs.propertyId, id))
      .orderBy(desc(jobs.createdAt)),
    db.select().from(bookingLinks).where(eq(bookingLinks.propertyId, id)).orderBy(desc(bookingLinks.createdAt)),
  ]);

  if (!property) notFound();

  const today = new Date().toISOString().split("T")[0];

  const allJobs = propJobs.map((r) => ({ ...r.job, technician: r.tech }));
  const pending = allJobs.filter((j) => j.status === "pending");
  const confirmed = allJobs.filter((j) => j.status === "confirmed");
  const upcoming = allJobs.filter((j) => j.scheduledDate && j.scheduledDate >= today && j.status !== "cancelled" && j.status !== "completed");
  const completed = allJobs.filter((j) => j.status === "completed");
  const overdue = allJobs.filter((j) => j.scheduledDate && j.scheduledDate < today && j.status !== "completed" && j.status !== "cancelled");

  const grouped: Record<string, typeof allJobs> = {
    overdue: overdue,
    upcoming: upcoming.sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? "")),
    pending: pending.filter((j) => !j.scheduledDate),
    completed: completed.slice(0, 10),
  };

  const stats = [
    { label: "Total Jobs", value: allJobs.length, icon: ClipboardList, bg: "bg-slate-50", color: "text-slate-600" },
    { label: "Upcoming", value: upcoming.length, icon: Calendar, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Pending", value: pending.length, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "Overdue", value: overdue.length, icon: AlertCircle, bg: overdue.length > 0 ? "bg-red-50" : "bg-slate-50", color: overdue.length > 0 ? "text-red-600" : "text-slate-400" },
    { label: "Completed", value: completed.length, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
  ];

  return (
    <div className="p-8">
      <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-5 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to properties
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{property.name}</h1>
            <div className="flex items-center gap-1.5 mt-1.5 text-slate-300 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{[property.address, property.suburb, property.state, property.postcode].filter(Boolean).join(", ")}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-slate-400 text-sm">
              {property.contactName && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{property.contactName}</span>}
              {property.contactPhone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{property.contactPhone}</span>}
              {property.contactEmail && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{property.contactEmail}</span>}
            </div>
          </div>
          <BuildingActions property={property} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg} mb-2`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main job list */}
        <div className="lg:col-span-2 space-y-4">

          {/* Overdue */}
          {grouped.overdue.length > 0 && (
            <Section title="Overdue" icon={<AlertCircle className="h-4 w-4 text-red-500" />} count={grouped.overdue.length} accent="border-red-200 bg-red-50/30">
              {grouped.overdue.map((job) => <JobRow key={job.id} job={job} />)}
            </Section>
          )}

          {/* Upcoming */}
          <Section title="Upcoming" icon={<Calendar className="h-4 w-4 text-blue-600" />} count={grouped.upcoming.length} action={{ label: "New job", href: `/jobs/new?propertyId=${property.id}` }}>
            {grouped.upcoming.length === 0 ? (
              <EmptyState message="No upcoming jobs scheduled">
                <Link href={`/jobs/new?propertyId=${property.id}`} className="text-sm text-blue-600 hover:underline">Schedule one →</Link>
              </EmptyState>
            ) : grouped.upcoming.map((job) => <JobRow key={job.id} job={job} />)}
          </Section>

          {/* Unscheduled pending */}
          {grouped.pending.length > 0 && (
            <Section title="Unscheduled" icon={<Clock className="h-4 w-4 text-amber-500" />} count={grouped.pending.length}>
              {grouped.pending.map((job) => <JobRow key={job.id} job={job} />)}
            </Section>
          )}

          {/* Completed */}
          {grouped.completed.length > 0 && (
            <Section title="Recently completed" icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} count={completed.length}>
              {grouped.completed.map((job) => <JobRow key={job.id} job={job} muted />)}
            </Section>
          )}

          {allJobs.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <TrendingUp className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No jobs for this property yet</p>
              <Link href={`/jobs/new?propertyId=${property.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" /> Create first job
              </Link>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick actions</h3>
            <div className="space-y-2">
              <Link href={`/jobs/new?propertyId=${property.id}`}
                className="flex items-center gap-2.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-blue-200 transition-all">
                <Plus className="h-4 w-4 text-blue-600" /> Create new job
              </Link>
              <Link href={`/links?propertyId=${property.id}`}
                className="flex items-center gap-2.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-blue-200 transition-all">
                <Link2 className="h-4 w-4 text-blue-600" /> Generate booking link
              </Link>
              <Link href={`/calendar`}
                className="flex items-center gap-2.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-blue-200 transition-all">
                <Calendar className="h-4 w-4 text-blue-600" /> View calendar
              </Link>
            </div>
          </div>

          {/* Notes */}
          {property.notes && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Property notes</h3>
              <p className="text-sm text-amber-900 whitespace-pre-line">{property.notes}</p>
            </div>
          )}

          {/* Active booking links */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-900">Booking links</span>
              </div>
              <Link href={`/links?propertyId=${property.id}`} className="text-xs text-blue-600 hover:underline">Manage →</Link>
            </div>
            {propLinks.length === 0 ? (
              <p className="px-4 py-4 text-sm text-slate-500 text-center">
                No links yet.{" "}
                <Link href={`/links?propertyId=${property.id}`} className="text-blue-600 hover:underline">Create one →</Link>
              </p>
            ) : (
              <div className="divide-y divide-slate-50">
                {propLinks.slice(0, 4).map((link) => (
                  <div key={link.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${link.isActive ? "bg-green-400" : "bg-slate-300"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{link.label || "Booking link"}</p>
                      <p className="text-xs text-slate-400">{link.currentBookings} booking{link.currentBookings !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Job breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">By status</h3>
            <div className="space-y-2">
              {Object.entries(JOB_STATUSES).map(([key, cfg]) => {
                const count = allJobs.filter((j) => j.status === key).length;
                if (count === 0) return null;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>{cfg.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 rounded-full bg-slate-100 w-20 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${(count / allJobs.length) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 w-4 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title, icon, count, action, accent, children
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  action?: { label: string; href: string };
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${accent ?? "border-slate-200"}`}>
      <div className={`flex items-center justify-between px-5 py-3 border-b ${accent ? "border-red-200" : "border-slate-100"}`}>
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          <span className="text-xs text-slate-400">({count})</span>
        </div>
        {action && (
          <Link href={action.href} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <Plus className="h-3 w-3" />{action.label}
          </Link>
        )}
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  );
}

function EmptyState({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="px-5 py-6 text-center">
      <p className="text-sm text-slate-500">{message}</p>
      {children}
    </div>
  );
}

function JobRow({ job, muted = false }: {
  job: {
    id: string; title: string; jobCategory: string; status: string;
    scheduledDate: string | null; scheduledTimeStart: string | null;
    tenantName: string | null; unitNumber: string | null;
    technician?: { name: string; color: string } | null;
  };
  muted?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3 group ${muted ? "opacity-60" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{job.title}</p>
        <div className="flex items-center flex-wrap gap-2 mt-0.5 text-xs text-slate-500">
          {job.scheduledDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(job.scheduledDate)}{job.scheduledTimeStart ? ` · ${formatTime(job.scheduledTimeStart)}` : ""}
            </span>
          )}
          {job.unitNumber && <span>Unit {job.unitNumber}</span>}
          {job.tenantName && <span>{job.tenantName}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {job.technician && (
            <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 text-white" style={{ backgroundColor: job.technician.color }}>
              {job.technician.name.split(" ")[0]}
            </span>
          )}
          <StatusBadge status={job.status} />
        </div>
        <JobCategoryBadge category={job.jobCategory} />
      </div>
    </div>
  );
}
