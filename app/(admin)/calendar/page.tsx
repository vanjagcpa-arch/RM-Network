"use client";

import { useState, useEffect } from "react";
import { JOB_CATEGORIES, JOB_STATUSES, formatTime } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { JobCategoryBadge } from "@/components/admin/job-category-badge";
import { StatusBadge } from "@/components/admin/status-badge";

interface Job {
  id: string;
  title: string;
  jobCategory: string;
  status: string;
  scheduledDate: string | null;
  scheduledTimeStart: string | null;
  tenantName: string | null;
  unitNumber: string | null;
  property: { name: string } | null;
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
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
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
          <h1 className="text-2xl font-bold text-slate-900">{MONTH_NAMES[month]} {year}</h1>
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
                  className={`min-h-[100px] border-b border-r border-slate-100 p-2 cursor-pointer transition-colors ${isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-slate-50"} ${(i + firstDay) % 7 === 6 ? "border-r-0" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold inline-flex h-6 w-6 items-center justify-center rounded-full ${isToday ? "bg-blue-600 text-white" : isSelected ? "text-blue-700" : "text-slate-700"}`}>
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
      <div className="w-72 flex-shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full">
          {!selectedDay ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 px-6 text-center">
              <p className="text-sm">Click a day to see its jobs</p>
            </div>
          ) : (
            <div>
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="font-semibold text-slate-900 text-sm">
                  {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedJobs.length} job{selectedJobs.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="divide-y divide-slate-50 max-h-[calc(100vh-280px)] overflow-y-auto">
                {selectedJobs.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-500 text-center">No jobs scheduled</p>
                ) : (
                  selectedJobs
                    .sort((a, b) => (a.scheduledTimeStart ?? "").localeCompare(b.scheduledTimeStart ?? ""))
                    .map((job) => (
                      <div key={job.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          {job.scheduledTimeStart && <span className="text-xs font-mono text-slate-500">{formatTime(job.scheduledTimeStart)}</span>}
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="text-sm font-semibold text-slate-900 leading-snug">{job.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{job.property?.name}</p>
                        {job.tenantName && <p className="text-xs text-slate-400 mt-0.5">Tenant: {job.tenantName}{job.unitNumber ? ` · Unit ${job.unitNumber}` : ""}</p>}
                        <div className="mt-2">
                          <JobCategoryBadge category={job.jobCategory} />
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
