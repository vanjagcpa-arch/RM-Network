"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { JobCategoryBadge } from "@/components/admin/job-category-badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate, formatTime, JOB_STATUSES, JOB_CATEGORIES, JOB_STATUS_CHIP_COLOR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Search, ClipboardList, Calendar, Building2, Loader2, Download, ExternalLink, HardHat } from "lucide-react";
import { FilterChip, Chip } from "@/components/ui/chip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  technicianId: string | null;
  tenantName: string | null;
  unitNumber: string | null;
  notes: string | null;
  property: { id: string; name: string; address: string; suburb: string | null } | null;
  technician: { id: string; name: string; color: string } | null;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTechnician, setFilterTechnician] = useState("");
  const [showEdit, setShowEdit] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ status: "", scheduledDate: "", scheduledTimeStart: "", scheduledTimeEnd: "", notes: "", technicianId: "" });

  async function load() {
    const [jobsRes, techRes] = await Promise.all([fetch("/api/jobs"), fetch("/api/technicians")]);
    setJobs(await jobsRes.json());
    setTechnicians(await techRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(job: Job) {
    setEditForm({
      status: job.status,
      scheduledDate: job.scheduledDate ?? "",
      scheduledTimeStart: job.scheduledTimeStart ?? "",
      scheduledTimeEnd: "",
      notes: job.notes ?? "",
      technicianId: job.technicianId ?? "",
    });
    setShowEdit(job);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!showEdit) return;
    setSaving(true);
    await fetch(`/api/jobs/${showEdit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setShowEdit(null);
    setSaving(false);
    await load();
  }

  function handleExport(format: "xlsx" | "csv") {
    const params = new URLSearchParams({ format });
    if (filterStatus) params.set("status", filterStatus);
    window.open(`/api/export/ascora?${params}`, "_blank");
  }

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

  const today = new Date().toISOString().split("T")[0];

  const counts = Object.fromEntries(
    Object.keys(JOB_STATUSES).map((k) => [k, jobs.filter((j) => j.status === k).length])
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-cabinet">Jobs</h1>
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

      {/* Status pill tabs */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <FilterChip
          label="All"
          color="slate"
          selected={filterStatus === ""}
          count={jobs.length}
          onClick={() => setFilterStatus("")}
        />
        {Object.entries(JOB_STATUSES).map(([k]) => (
          <FilterChip
            key={k}
            label={JOB_STATUSES[k as keyof typeof JOB_STATUSES].label}
            color={(JOB_STATUS_CHIP_COLOR[k] ?? "slate") as import("@/components/ui/chip").ChipColor}
            selected={filterStatus === k}
            count={counts[k]}
            onClick={() => setFilterStatus(filterStatus === k ? "" : k)}
          />
        ))}
      </div>

      {/* Secondary filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs…"
            className="pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="py-2 px-3 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All job types</option>
          {Object.entries(JOB_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterTechnician} onChange={(e) => setFilterTechnician(e.target.value)}
          className="py-2 px-3 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All technicians</option>
          {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {(filterCategory || filterTechnician || search) && (
          <button onClick={() => { setFilterCategory(""); setFilterTechnician(""); setSearch(""); }} className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No jobs found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
          <Link href="/jobs/new"><Button className="mt-4">Create a job</Button></Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((job) => {
              const isOverdue = job.scheduledDate && job.scheduledDate < today && job.status !== "completed" && job.status !== "cancelled";
              return (
                <div key={job.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group ${isOverdue ? "border-l-2 border-l-red-400" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{job.title}</p>
                      {isOverdue && (
                        <Chip label="Overdue" color="red" className="flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{job.property?.name ?? "Unknown"}</span>
                      {job.scheduledDate && (
                        <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500" : ""}`}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(job.scheduledDate)}{job.scheduledTimeStart && ` · ${formatTime(job.scheduledTimeStart)}`}
                        </span>
                      )}
                      {job.tenantName && <span>Tenant: {job.tenantName}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {job.technician && (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold rounded-full border px-3 py-1 text-white" style={{ backgroundColor: job.technician.color, borderColor: job.technician.color }}>
                        <HardHat className="h-3.5 w-3.5" />{job.technician.name.split(" ")[0]}
                      </span>
                    )}
                    <JobCategoryBadge category={job.jobCategory} />
                    <StatusBadge status={job.status} />
                    <button onClick={() => openEdit(job)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-600 hover:underline ml-1 font-medium">
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit job dialog */}
      <Dialog open={!!showEdit} onOpenChange={(o) => !o && setShowEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update job</DialogTitle>
          </DialogHeader>
          {showEdit && (
            <form onSubmit={saveEdit} className="space-y-4 mt-2">
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">{showEdit.title}</p>
                <p className="text-xs text-slate-500">{showEdit.property?.name}</p>
              </div>
              <div>
                <Label>Status</Label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(JOB_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Scheduled date</Label>
                  <Input type="date" value={editForm.scheduledDate} onChange={(e) => setEditForm({ ...editForm, scheduledDate: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Start time</Label>
                  <Input type="time" value={editForm.scheduledTimeStart} onChange={(e) => setEditForm({ ...editForm, scheduledTimeStart: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Assign technician</Label>
                <select value={editForm.technicianId} onChange={(e) => setEditForm({ ...editForm, technicianId: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Unassigned</option>
                  {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Notes</Label>
                <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3}
                  className="mt-1 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEdit(null)}>Cancel</Button>
                <Button type="submit" loading={saving}>Save</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
