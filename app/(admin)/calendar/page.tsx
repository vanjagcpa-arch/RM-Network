"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { JOB_CATEGORIES, formatTime } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, Map, ExternalLink, List } from "lucide-react";
import { JobCategoryBadge } from "@/components/admin/job-category-badge";
import { StatusBadge } from "@/components/admin/status-badge";

const DayMap = dynamic(() => import("@/components/admin/day-map").then((m) => m.DayMap), {
  ssr: false,
  loading: () => <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>,
});

interface Job {
  id: string;
  title: string;
  jobCategory: string;
  status: string;
  scheduledDate: string | null;
  scheduledTimeStart: string | null;
  tenantName: string | null;
  unitNumber: string | null;
  property: { name: string; address: string; suburb: string | null } | null;
  technician?: { name: string; color: string } | null;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<"list" | "map" | "route">("list");

  useEffect(() => {
    const ym = `${year}-${String(month + 1).padStart(2, "0")}`;
    setLoading(true);
    fetch(`/api/jobs?month=${ym}`)
      .then((r) => r.json())
      .then((data) => { setJobs(Array.isArray(data) ? data : []); setLoading(false); });
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDay(null); setPanelTab("list");
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDay(null); setPanelTab("list");
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  function getJobsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return jobs.filter((j) => j.scheduledDate === dateStr);
  }

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const selectedJobs = selectedDay ? jobs.filter((j) => j.scheduledDate === selectedDay) : [];

  return (
    <div className="p-8 flex gap-6 h-full">
      {/* Calendar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 font-cabinet">{MONTH_NAMES[month]} {year}</h1>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 font-medium">
              Today
            </button>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-200">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells before month start */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-slate-100 bg-slate-50/50" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const ds = dateStr(day);
              const dayJobs = getJobsForDay(day);
              const isToday = ds === today;
              const isSelected = ds === selectedDay;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : ds)}
                  className={`min-h-[100px] border-b border-r border-slate-100 p-2 cursor-pointer transition-colors ${isSelected ? "bg-[#ECFDE8] border-[#CFF8C8]" : "hover:bg-slate-50"} ${(i + firstDay) % 7 === 6 ? "border-r-0" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold inline-flex h-6 w-6 items-center justify-center rounded-full ${isToday ? "bg-slate-900 text-white" : isSelected ? "text-[#16A34A]" : "text-slate-700"}`}>
                      {day}
                    </span>
                    {dayJobs.length > 0 && (
                      <span className="text-xs text-slate-500 font-medium">{dayJobs.length}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayJobs.slice(0, 3).map((job) => {
                      const cat = JOB_CATEGORIES[job.jobCategory as keyof typeof JOB_CATEGORIES];
                      return (
                        <div key={job.id} className="flex items-center gap-1 rounded px-1 py-0.5 text-xs truncate" style={{ backgroundColor: (cat?.calColor ?? "#64748b") + "20", color: cat?.calColor ?? "#64748b" }}>
                          {job.scheduledTimeStart && <span className="font-mono text-[10px] flex-shrink-0">{formatTime(job.scheduledTimeStart).replace(" AM", "a").replace(" PM", "p")}</span>}
                          <span className="truncate font-medium">{job.title}</span>
                        </div>
                      );
                    })}
                    {dayJobs.length > 3 && (
                      <p className="text-[10px] text-slate-400 px-1">+{dayJobs.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(JOB_CATEGORIES).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: v.calColor }} />
              {v.label}
            </div>
          ))}
        </div>
      </div>


      {/* Day detail panel */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
          {!selectedDay ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 px-6 text-center">
              <Map className="h-8 w-8 text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-500">Click a day to see jobs & map</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0">
                <p className="font-semibold text-slate-900 text-sm">
                  {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedJobs.length} job{selectedJobs.length !== 1 ? "s" : ""} scheduled</p>
              </div>

              {/* Tabs */}
              {selectedJobs.length > 0 && (
                <div className="flex border-b border-slate-100 flex-shrink-0">
                  {[
                    { id: "list" as const, label: "Jobs", icon: List },
                    { id: "map" as const, label: "Map", icon: Map },
                    { id: "route" as const, label: "Route", icon: ExternalLink },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setPanelTab(id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${panelTab === id ? "border-[#16A34A] text-[#16A34A]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto">
                {panelTab === "list" || selectedJobs.length === 0 ? (
                  <div className="divide-y divide-slate-50">
                    {selectedJobs.length === 0 ? (
                      <p className="px-5 py-8 text-sm text-slate-400 text-center">No jobs scheduled</p>
                    ) : (
                      [...selectedJobs]
                        .sort((a, b) => (a.scheduledTimeStart ?? "").localeCompare(b.scheduledTimeStart ?? ""))
                        .map((job) => (
                          <div key={job.id} className="px-4 py-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-mono text-slate-400">{formatTime(job.scheduledTimeStart) || "No time"}</span>
                              <StatusBadge status={job.status} />
                            </div>
                            <p className="text-sm font-semibold text-slate-900 leading-snug">{job.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{job.property?.name}</p>
                            {job.tenantName && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                {job.tenantName}{job.unitNumber ? ` · Unit ${job.unitNumber}` : ""}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <JobCategoryBadge category={job.jobCategory} />
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                ) : panelTab === "map" ? (
                  <div className="p-4">
                    <DayMap jobs={selectedJobs.map((j) => ({ ...j, technician: j.technician ?? null }))} />
                  </div>
                ) : (
                  <RoutePanel jobs={selectedJobs} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RoutePanel({ jobs }: { jobs: Job[] }) {
  const sorted = [...jobs].sort((a, b) => (a.scheduledTimeStart ?? "").localeCompare(b.scheduledTimeStart ?? ""));
  const addresses = sorted
    .map((j) => j.property ? `${j.property.address}${j.property.suburb ? `, ${j.property.suburb}` : ""}` : null)
    .filter(Boolean) as string[];

  const mapsUrl = addresses.length >= 2
    ? `https://www.google.com/maps/dir/${addresses.map(encodeURIComponent).join("/")}`
    : addresses.length === 1
    ? `https://www.google.com/maps/search/?q=${encodeURIComponent(addresses[0])}`
    : null;

  return (
    <div>
      <div className="divide-y divide-slate-50">
        {sorted.map((job, i) => (
          <div key={job.id} className="px-4 py-3 flex items-start gap-3">
            <div
              className="h-5 w-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: (job as { technician?: { color: string } | null }).technician?.color ?? "#3b82f6" }}
            >
              {i + 1}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{job.title}</p>
              {job.scheduledTimeStart && (
                <p className="text-xs text-slate-500 font-mono">{formatTime(job.scheduledTimeStart)}</p>
              )}
              {job.property && (
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {job.property.address}{job.property.suburb ? `, ${job.property.suburb}` : ""}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-100">
        {mapsUrl ? (
          <a href={mapsUrl} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors">
            <ExternalLink className="h-3.5 w-3.5" /> Open route in Google Maps
          </a>
        ) : (
          <p className="text-xs text-slate-400 text-center">No addresses available</p>
        )}
      </div>
    </div>
  );
}
