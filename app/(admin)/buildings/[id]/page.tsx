import { db } from "@/db";
import { buildings, properties, jobs } from "@/db/schema";
import { eq, inArray, and, ne, desc, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Home, ClipboardList, AlertCircle, Calendar,
  CheckCircle2, Clock, Plus, ChevronRight,
} from "lucide-react";
import { JobCategoryBadge } from "@/components/admin/job-category-badge";
import { BuildingDetailActions } from "./building-actions";

export default async function BuildingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const today = new Date().toISOString().split("T")[0];

  const [building] = await db.select().from(buildings).where(eq(buildings.id, id)).limit(1);
  if (!building) notFound();

  const units = await db
    .select()
    .from(properties)
    .where(eq(properties.buildingId, id))
    .orderBy(asc(properties.name));

  let unitsWithStats: UnitWithStats[] = [];

  if (units.length > 0) {
    const unitIds = units.map((u) => u.id);
    const jobRows = await db
      .select()
      .from(jobs)
      .where(and(inArray(jobs.propertyId, unitIds), ne(jobs.status, "cancelled")))
      .orderBy(desc(jobs.scheduledDate));

    const jobsByUnit: Record<string, typeof jobRows> = {};
    for (const j of jobRows) {
      if (!jobsByUnit[j.propertyId]) jobsByUnit[j.propertyId] = [];
      jobsByUnit[j.propertyId].push(j);
    }

    unitsWithStats = units.map((unit) => {
      const unitJobs = jobsByUnit[unit.id] ?? [];
      const active = unitJobs.filter((j) => j.status !== "completed");
      const overdue = active.filter((j) => j.scheduledDate && j.scheduledDate < today);
      const upcoming = active
        .filter((j) => j.scheduledDate && j.scheduledDate >= today)
        .sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? ""));
      const completed = unitJobs.filter((j) => j.status === "completed")
        .sort((a, b) => (b.scheduledDate ?? "").localeCompare(a.scheduledDate ?? ""));

      return {
        ...unit,
        overdue: overdue.length,
        upcoming: upcoming.length,
        active: active.length,
        nextDate: upcoming[0]?.scheduledDate ?? null,
        nextTitle: upcoming[0]?.title ?? null,
        nextCategory: upcoming[0]?.jobCategory ?? null,
        lastDate: completed[0]?.scheduledDate ?? null,
        overdueJobs: overdue,
      };
    }).sort((a, b) => {
      if (b.overdue !== a.overdue) return b.overdue - a.overdue;
      if (b.active !== a.active) return b.active - a.active;
      return a.name.localeCompare(b.name);
    });
  }

  const totalOverdue = unitsWithStats.reduce((s, u) => s + u.overdue, 0);
  const totalUpcoming = unitsWithStats.reduce((s, u) => s + u.upcoming, 0);
  const totalActive = unitsWithStats.reduce((s, u) => s + u.active, 0);
  const unitsNeedingAttention = unitsWithStats.filter((u) => u.overdue > 0 || u.active > 0);
  const allClear = unitsWithStats.filter((u) => u.overdue === 0 && u.active === 0);

  return (
    <div className="p-8">
      <Link href="/buildings" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-5 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to buildings
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{building.name}</h1>
            <div className="flex items-center gap-1.5 mt-1.5 text-slate-300 text-sm">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{[building.address, building.suburb, building.state, building.postcode].filter(Boolean).join(", ")}</span>
            </div>
            {building.notes && <p className="text-slate-400 text-sm mt-2">{building.notes}</p>}
          </div>
          <BuildingDetailActions building={building} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Units", value: units.length, icon: Home, bg: "bg-slate-50", color: "text-slate-600" },
          { label: "Active Jobs", value: totalActive, icon: ClipboardList, bg: "bg-[#ECFDE8]", color: "text-[#16A34A]" },
          { label: "Upcoming", value: totalUpcoming, icon: Calendar, bg: "bg-[#ECFDE8]", color: "text-[#16A34A]" },
          { label: "Overdue", value: totalOverdue, icon: AlertCircle, bg: totalOverdue > 0 ? "bg-red-50" : "bg-slate-50", color: totalOverdue > 0 ? "text-red-600" : "text-slate-400" },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg} mb-2`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Add unit button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-900">
          Units <span className="text-slate-400 font-normal text-sm">({units.length})</span>
        </h2>
        <Link href={`/properties?buildingId=${building.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#9CFF5F] px-3 py-1.5 text-sm font-medium text-[#0F172A] hover:bg-[#8CFF3F] transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add unit
        </Link>
      </div>

      {units.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <Home className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No units linked to this building yet.</p>
          <Link href={`/properties?buildingId=${building.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[#9CFF5F] px-4 py-2 text-sm font-semibold text-[#0F172A] hover:bg-[#8CFF3F] transition-colors">
            <Plus className="h-4 w-4" /> Add first unit
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Next Scheduled</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Last Completed</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {unitsWithStats.map((unit) => (
                <UnitRow key={unit.id} unit={unit} today={today} buildingId={id} />
              ))}
            </tbody>
          </table>

          {allClear.length > 0 && unitsNeedingAttention.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-400">{allClear.length} unit{allClear.length !== 1 ? "s" : ""} with no active jobs</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type UnitWithStats = {
  id: string; name: string; address: string; suburb: string | null;
  contactName: string | null; contactPhone: string | null;
  overdue: number; upcoming: number; active: number;
  nextDate: string | null; nextTitle: string | null; nextCategory: string | null;
  lastDate: string | null;
  overdueJobs: { id: string; title: string; scheduledDate: string | null; jobCategory: string }[];
};

function UnitRow({ unit, today, buildingId }: { unit: UnitWithStats; today: string; buildingId: string }) {
  void today; void buildingId;

  let statusDot = <span className="h-2.5 w-2.5 rounded-full bg-green-400 flex-shrink-0 inline-block" />;
  let statusText = <span className="text-xs text-slate-400">All clear</span>;

  if (unit.overdue > 0) {
    statusDot = <span className="h-2.5 w-2.5 rounded-full bg-red-500 flex-shrink-0 inline-block" />;
    statusText = (
      <span className="text-xs font-medium text-red-600 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {unit.overdue} overdue
      </span>
    );
  } else if (unit.active > 0) {
    statusDot = <span className="h-2.5 w-2.5 rounded-full bg-amber-400 flex-shrink-0 inline-block" />;
    statusText = (
      <span className="text-xs text-amber-600 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {unit.active} pending
      </span>
    );
  } else if (unit.upcoming > 0) {
    statusDot = <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A] flex-shrink-0 inline-block" />;
    statusText = (
      <span className="text-xs text-[#16A34A] flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Scheduled
      </span>
    );
  }

  return (
    <tr className={`group hover:bg-slate-50/80 transition-colors ${unit.overdue > 0 ? "bg-red-50/30" : ""}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {statusDot}
          <span className="font-medium text-slate-900">{unit.name}</span>
        </div>
        {unit.overdue > 0 && (
          <div className="mt-1 space-y-0.5 ml-4">
            {unit.overdueJobs.slice(0, 2).map((j) => (
              <div key={j.id} className="flex items-center gap-1.5">
                <JobCategoryBadge category={j.jobCategory} />
                <span className="text-[10px] text-red-500">{formatDate(j.scheduledDate)}</span>
              </div>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {unit.contactName ? (
          <div>
            <p className="text-slate-700 text-xs font-medium">{unit.contactName}</p>
            {unit.contactPhone && <p className="text-slate-400 text-xs">{unit.contactPhone}</p>}
          </div>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">{statusText}</div>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">
        {unit.nextDate ? (
          <div>
            <p>{formatDate(unit.nextDate)}</p>
            {unit.nextTitle && <p className="text-slate-400 truncate max-w-[180px]">{unit.nextTitle}</p>}
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-400">
        {unit.lastDate ? formatDate(unit.lastDate) : <span className="text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <Link href={`/properties/${unit.id}`}
          className="inline-flex items-center gap-0.5 text-xs text-slate-400 hover:text-[#16A34A] transition-colors opacity-0 group-hover:opacity-100">
          View <ChevronRight className="h-3 w-3" />
        </Link>
      </td>
    </tr>
  );
}
