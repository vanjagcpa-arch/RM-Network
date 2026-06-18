"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate, formatTime, JOB_STATUSES, JOB_CATEGORIES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Search, ClipboardList, Calendar, Loader2, Download, ExternalLink, HardHat, X, ChevronRight, Send, CheckCircle2, XCircle, RotateCcw, User, Phone, Mail, Building2, Clock, Zap } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Technician {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface Job {
  id: string;
  title: string;
  jobCategory: string;
  status: string;
  scheduledDate: string | null;
  scheduledTimeStart: string | null;
  scheduledTimeEnd: string | null;
  technicianId: string | null;
  tenantName: string | null;
  tenantEmail: string | null;
  tenantPhone: string | null;
  unitNumber: string | null;
  notes: string | null;
  property: { id: string; name: string; address: string; suburb: string | null } | null;
  technician: { id: string; name: string; color: string } | null;
}

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function JobPanel({
  job,
  technicians,
  onClose,
  onRefresh,
}: {
  job: Job;
  technicians: Technician[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [form, setForm] = useState({
    status: job.status,
    scheduledDate: job.scheduledDate ?? "",
    scheduledTimeStart: job.scheduledTimeStart ?? "",
    scheduledTimeEnd: job.scheduledTimeEnd ?? "",
    technicianId: job.technicianId ?? "",
    notes: job.notes ?? "",
    tenantName: job.tenantName ?? "",
    tenantEmail: job.tenantEmail ?? "",
    tenantPhone: job.tenantPhone ?? "",
    unitNumber: job.unitNumber ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingDays, setBookingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [bookingTimeStart, setBookingTimeStart] = useState("08:00");
  const [bookingTimeEnd, setBookingTimeEnd] = useState("17:00");
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null);

  function showFlash(ok: boolean, msg: string) {
    setFlash({ ok, msg });
    setTimeout(() => setFlash(null), 4000);
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { showFlash(true, "Job updated"); onRefresh(); }
    else showFlash(false, "Failed to save");
  }

  async function quickStatus(status: string) {
    setActionLoading(status);
    await fetch(`/api/jobs/${job.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActionLoading(null);
    onRefresh();
    onClose();
  }

  async function requestBooking() {
    setActionLoading("booking");
    const res = await fetch(`/api/jobs/${job.id}/request-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allowedWeekdays: bookingDays,
        allowedTimeStart: bookingTimeStart || null,
        allowedTimeEnd: bookingTimeEnd || null,
      }),
    });
    setActionLoading(null);
    if (res.ok) {
      showFlash(true, "Booking link sent to tenant!");
      setShowBookingForm(false);
      onRefresh();
    } else {
      const d = await res.json();
      showFlash(false, d.error ?? "Failed to send booking link");
    }
  }

  async function sendConfirmation() {
    setActionLoading("confirmation");
    // Trigger confirmation by setting status to confirmed again (the PUT handler re-sends email)
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed", _resendConfirmation: true }),
    });
    setActionLoading(null);
    if (res.ok) showFlash(true, "Confirmation email sent!");
    else showFlash(false, "Failed to send confirmation");
  }

  function toggleDay(d: number) {
    setBookingDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());
  }

  const cat = JOB_CATEGORIES[job.jobCategory as keyof typeof JOB_CATEGORIES];
  const today = new Date().toISOString().split("T")[0];
  const isOverdue = job.scheduledDate && job.scheduledDate < today && job.status !== "completed" && job.status !== "cancelled";
  const canRequestBooking = form.tenantEmail && job.status !== "completed" && job.status !== "cancelled";
  const canSendConfirmation = form.status === "confirmed" && form.tenantEmail && form.scheduledDate;
  const canComplete = job.status !== "completed" && job.status !== "cancelled";
  const canCancel = job.status !== "cancelled";
  const canReopen = job.status === "cancelled";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-screen w-[420px] bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 leading-snug">{job.title}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StatusBadge status={job.status} />
                {cat && <span className="text-xs text-slate-400">{cat.label}</span>}
                {isOverdue && <Chip label="Overdue" color="red" />}
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 mt-0.5">
              <X className="h-5 w-5" />
            </button>
          </div>
          {job.property && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{job.property.name}{job.property.suburb ? `, ${job.property.suburb}` : ""}</span>
            </div>
          )}
        </div>

        {/* Flash */}
        {flash && (
          <div className={`mx-5 mt-3 flex-shrink-0 rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1.5 ${flash.ok ? "bg-[#ECFDE8] text-[#16A34A]" : "bg-red-50 text-red-700"}`}>
            {flash.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {flash.msg}
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Quick actions */}
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick actions</p>
            <div className="space-y-2">
              {canRequestBooking && (
                <div>
                  <button
                    onClick={() => setShowBookingForm((v) => !v)}
                    className="w-full flex items-center justify-between gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Request availability from tenant</span>
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${showBookingForm ? "rotate-90" : ""}`} />
                  </button>
                  {showBookingForm && (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-slate-700 mb-1.5">Available days</p>
                        <div className="flex flex-wrap gap-1">
                          {WEEKDAYS_SHORT.map((d, i) => (
                            <button key={i} type="button" onClick={() => toggleDay(i)}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${bookingDays.includes(i) ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}>
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-500">From</label>
                          <input type="time" value={bookingTimeStart} onChange={(e) => setBookingTimeStart(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">Until</label>
                          <input type="time" value={bookingTimeEnd} onChange={(e) => setBookingTimeEnd(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                      </div>
                      <button
                        onClick={requestBooking}
                        disabled={bookingDays.length === 0 || actionLoading === "booking"}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === "booking" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        Send booking link to {form.tenantEmail || "tenant"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {canSendConfirmation && (
                <button
                  onClick={sendConfirmation}
                  disabled={actionLoading === "confirmation"}
                  className="w-full flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {actionLoading === "confirmation" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                  Re-send confirmation email
                </button>
              )}

              <div className="flex gap-2">
                {canComplete && (
                  <button
                    onClick={() => quickStatus("completed")}
                    disabled={!!actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#CFF8C8] bg-[#ECFDE8] px-3 py-2 text-xs font-medium text-[#16A34A] hover:bg-green-100 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === "completed" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Mark complete
                  </button>
                )}
                {canReopen && (
                  <button
                    onClick={() => quickStatus("pending")}
                    disabled={!!actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === "pending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    Re-open
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => quickStatus("cancelled")}
                    disabled={!!actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === "cancelled" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Editable details */}
          <div className="px-5 py-4 space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Job details</p>

            <div>
              <Label className="text-xs">Status</Label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {Object.entries(JOB_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Start time</Label>
                <Input type="time" value={form.scheduledTimeStart} onChange={(e) => setForm({ ...form, scheduledTimeStart: e.target.value })} className="mt-1 h-9 text-sm" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Assign technician</Label>
              <select value={form.technicianId} onChange={(e) => setForm({ ...form, technicianId: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Unassigned</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Notes</Label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                className="mt-1 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          {/* Tenant */}
          <div className="px-5 py-4 border-t border-slate-100 space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tenant</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Name</Label>
                <Input value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} placeholder="Tenant full name" className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Unit</Label>
                <Input value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} placeholder="e.g. 3B" className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={form.tenantPhone} onChange={(e) => setForm({ ...form, tenantPhone: e.target.value })} placeholder="04xx xxx xxx" className="mt-1 h-9 text-sm" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={form.tenantEmail} onChange={(e) => setForm({ ...form, tenantEmail: e.target.value })} placeholder="tenant@email.com" className="mt-1 h-9 text-sm" />
              </div>
            </div>
          </div>

          {/* Property (read-only) */}
          {job.property && (
            <div className="px-5 py-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Property</p>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p className="font-medium text-slate-800">{job.property.name}</p>
                <p>{job.property.address}{job.property.suburb ? `, ${job.property.suburb}` : ""}</p>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="px-5 pb-6 border-t border-slate-100 pt-4">
            <Button onClick={save} loading={saving} className="w-full">Save changes</Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTechnician, setFilterTechnician] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const load = useCallback(async () => {
    const [jobsRes, techRes] = await Promise.all([fetch("/api/jobs"), fetch("/api/technicians")]);
    const jobsData = await jobsRes.json();
    setJobs(Array.isArray(jobsData) ? jobsData : []);
    setTechnicians(await techRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh panel job data after save
  function onRefresh() {
    load().then(() => {
      if (selectedJob) {
        setJobs((prev) => {
          const updated = prev.find((j) => j.id === selectedJob.id);
          if (updated) setSelectedJob(updated);
          return prev;
        });
      }
    });
  }

  function handleExport(format: "xlsx" | "csv") {
    const params = new URLSearchParams({ format });
    if (filterStatus) params.set("status", filterStatus);
    window.open(`/api/export/ascora?${params}`, "_blank");
  }

  const today = new Date().toISOString().split("T")[0];

  const filtered = jobs.filter((j) => {
    if (filterStatus && j.status !== filterStatus) return false;
    if (filterCategory && j.jobCategory !== filterCategory) return false;
    if (filterTechnician && j.technicianId !== filterTechnician) return false;
    if (search) {
      const q = search.toLowerCase();
      return j.title.toLowerCase().includes(q) || (j.property?.name.toLowerCase() ?? "").includes(q) || (j.tenantName?.toLowerCase() ?? "").includes(q);
    }
    return true;
  });

  const hasFilters = !!(filterStatus || filterCategory || filterTechnician || search);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-cabinet">Jobs</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} of {jobs.length} jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")}>
            <Download className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
            <ExternalLink className="h-3.5 w-3.5" /> Ascora CSV
          </Button>
          <Link href="/jobs/new">
            <Button><Plus className="h-4 w-4" /> New Job</Button>
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs…"
            className="pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-56"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="py-2 px-3 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All statuses</option>
          {Object.entries(JOB_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="py-2 px-3 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All job types</option>
          {Object.entries(JOB_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterTechnician} onChange={(e) => setFilterTechnician(e.target.value)}
          className="py-2 px-3 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All technicians</option>
          {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setFilterStatus(""); setFilterCategory(""); setFilterTechnician(""); setSearch(""); }}
            className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No jobs found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
          <Link href="/jobs/new"><Button className="mt-4">Create a job</Button></Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Job</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Property</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Scheduled</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Technician</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((job) => {
                const isOverdue = job.scheduledDate && job.scheduledDate < today && job.status !== "completed" && job.status !== "cancelled";
                const cat = JOB_CATEGORIES[job.jobCategory as keyof typeof JOB_CATEGORIES];
                const isSelected = selectedJob?.id === job.id;
                return (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedJob(isSelected ? null : job)}
                    className={`hover:bg-slate-50/60 transition-colors cursor-pointer ${isSelected ? "bg-slate-50" : ""} ${isOverdue ? "border-l-2 border-l-red-400" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {cat && <span className="text-xs text-slate-400">{cat.label}</span>}
                        {job.tenantName && <span className="text-xs text-slate-400">· {job.tenantName}</span>}
                        {isOverdue && <Chip label="Overdue" color="red" />}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-slate-700 max-w-[160px] truncate">{job.property?.name ?? "—"}</p>
                      {job.property?.suburb && <p className="text-xs text-slate-400 truncate">{job.property.suburb}</p>}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {job.scheduledDate ? (
                        <div>
                          <p className={isOverdue ? "text-red-600 font-medium" : "text-slate-700"}>{formatDate(job.scheduledDate)}</p>
                          {job.scheduledTimeStart && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3" />{formatTime(job.scheduledTimeStart)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">Not scheduled</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {job.technician ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-md px-2 py-1 text-white whitespace-nowrap" style={{ backgroundColor: job.technician.color }}>
                          <HardHat className="h-3 w-3" />{job.technician.name.split(" ")[0]}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {job.tenantEmail && job.status !== "completed" && job.status !== "cancelled" && (
                          <span className="text-xs text-[#16A34A] font-medium opacity-60 group-hover:opacity-100">
                            <Send className="h-3 w-3 inline mr-0.5" />
                          </span>
                        )}
                        <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Side panel */}
      {selectedJob && (
        <JobPanel
          job={selectedJob}
          technicians={technicians}
          onClose={() => setSelectedJob(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
