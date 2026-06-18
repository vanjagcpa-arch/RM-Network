"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { JobCategoryBadge } from "@/components/admin/job-category-badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate, formatTime, JOB_STATUSES, JOB_CATEGORIES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, ClipboardList, Calendar, Building2, Loader2, Download, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Job {
  id: string;
  title: string;
  jobCategory: string;
  status: string;
  scheduledDate: string | null;
  scheduledTimeStart: string | null;
  tenantName: string | null;
  unitNumber: string | null;
  notes: string | null;
  property: { id: string; name: string; address: string; suburb: string | null } | null;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showEdit, setShowEdit] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ status: "", scheduledDate: "", scheduledTimeStart: "", scheduledTimeEnd: "", notes: "" });

  async function load() {
    const res = await fetch("/api/jobs");
    setJobs(await res.json());
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
    if (search) {
      const q = search.toLowerCase();
      return j.title.toLowerCase().includes(q) || (j.property?.name.toLowerCase() ?? "").includes(q) || (j.tenantName?.toLowerCase() ?? "").includes(q);
    }
    return true;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
          <p className="text-slate-500 text-sm mt-0.5">{jobs.length} total jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-10 hidden group-hover:block">
              <button onClick={() => handleExport("xlsx")} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50">Excel (.xlsx)</button>
              <button onClick={() => handleExport("csv")} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50">CSV for Ascora</button>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")}>
              <Download className="h-3.5 w-3.5" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
              <ExternalLink className="h-3.5 w-3.5" /> Ascora CSV
            </Button>
          </div>
          <Link href="/jobs/new">
            <Button><Plus className="h-4 w-4" /> New Job</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs…"
            className="pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="py-2 px-3 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All statuses</option>
          {Object.entries(JOB_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="py-2 px-3 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All job types</option>
          {Object.entries(JOB_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {(filterStatus || filterCategory || search) && (
          <button onClick={() => { setFilterStatus(""); setFilterCategory(""); setSearch(""); }} className="text-sm text-slate-500 hover:text-slate-900">
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No jobs found</p>
          <Link href="/jobs/new"><Button className="mt-4">Create a job</Button></Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((job) => (
              <div key={job.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                    {job.unitNumber && <span className="text-xs text-slate-500">Unit {job.unitNumber}</span>}
                  </div>
                  <div className="flex items-center flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{job.property?.name ?? "Unknown"}</span>
                    {job.scheduledDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(job.scheduledDate)}{job.scheduledTimeStart && ` · ${formatTime(job.scheduledTimeStart)}`}
                      </span>
                    )}
                    {job.tenantName && <span>Tenant: {job.tenantName}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <JobCategoryBadge category={job.jobCategory} />
                  <StatusBadge status={job.status} />
                  <button onClick={() => openEdit(job)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-600 hover:underline ml-2">
                    Edit
                  </button>
                </div>
              </div>
            ))}
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
