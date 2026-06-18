"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JOB_CATEGORIES } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Sparkles, Calendar, RefreshCw } from "lucide-react";
import { Suspense } from "react";

interface Property {
  id: string;
  name: string;
  address: string;
  suburb: string | null;
  postcode: string | null;
}

interface Technician {
  id: string;
  name: string;
  color: string;
  specialties: string | null;
  isActive: boolean;
}

interface Recommendation {
  date: string;
  score: number;
  reason: string;
  jobCount: number;
}

function NewJobForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPropertyId = searchParams.get("propertyId") ?? "";

  const [properties, setProperties] = useState<Property[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    propertyId: defaultPropertyId,
    jobCategory: "",
    title: "",
    description: "",
    scheduledDate: "",
    scheduledTimeStart: "",
    scheduledTimeEnd: "",
    tenantName: "",
    tenantEmail: "",
    tenantPhone: "",
    unitNumber: "",
    notes: "",
    status: "pending",
    technicianId: "",
    isRecurring: false,
    recurringIntervalMonths: 12,
  });

  useEffect(() => {
    fetch("/api/properties").then((r) => r.json()).then(setProperties);
    fetch("/api/technicians").then((r) => r.json()).then((data: Technician[]) => setTechnicians(data.filter((t) => t.isActive)));
  }, []);

  useEffect(() => {
    if (!form.propertyId) { setRecommendations([]); return; }
    setLoadingRec(true);
    fetch(`/api/scheduling/recommendations?propertyId=${form.propertyId}&daysAhead=30`)
      .then((r) => r.json())
      .then((data) => setRecommendations(Array.isArray(data) ? data : []))
      .finally(() => setLoadingRec(false));
  }, [form.propertyId]);

  // Auto-fill title when category changes
  useEffect(() => {
    if (form.jobCategory && form.propertyId) {
      const prop = properties.find((p) => p.id === form.propertyId);
      const cat = JOB_CATEGORIES[form.jobCategory as keyof typeof JOB_CATEGORIES];
      if (cat && prop) {
        setForm((f) => ({ ...f, title: `${cat.label} — ${prop.name}` }));
      }
    }
  }, [form.jobCategory, form.propertyId, properties]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { isRecurring, ...rest } = form;
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rest, recurringIntervalMonths: isRecurring ? form.recurringIntervalMonths : null }),
    });
    if (res.ok) router.push("/jobs");
    else setSaving(false);
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Create new job</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">Job details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="propertyId">Property *</Label>
              <select id="propertyId" required value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select property…</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="jobCategory">Job type *</Label>
              <select id="jobCategory" required value={form.jobCategory} onChange={(e) => setForm({ ...form, jobCategory: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select job type…</option>
                {Object.entries(JOB_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Job title *</Label>
            <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Smoke alarm inspection — Main St" className="mt-1" />
          </div>

          <div>
            <Label>Description</Label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional job description…"
              className="mt-1 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>
            <div>
              <Label>Assign technician</Label>
              <select value={form.technicianId} onChange={(e) => setForm({ ...form, technicianId: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Unassigned</option>
                {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Smart scheduling */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Smart Scheduling</h2>
          </div>

          {!form.propertyId ? (
            <p className="text-sm text-slate-500">Select a property to see scheduling recommendations.</p>
          ) : loadingRec ? (
            <p className="text-sm text-slate-500">Loading recommendations…</p>
          ) : recommendations.length > 0 ? (
            <div>
              <p className="text-sm text-slate-600 mb-3">
                <span className="font-medium text-blue-700">Smart suggestion:</span> Schedule on a day when other jobs are already nearby to reduce driving.
              </p>
              <div className="space-y-2">
                {recommendations.map((rec) => {
                  const d = new Date(rec.date + "T00:00:00");
                  const label = d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
                  return (
                    <button
                      key={rec.date}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, scheduledDate: rec.date }))}
                      className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${form.scheduledDate === rec.date ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"}`}
                    >
                      <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{label}</p>
                        <p className="text-xs text-slate-500">{rec.reason} · {rec.jobCount} job{rec.jobCount !== 1 ? "s" : ""} already scheduled</p>
                      </div>
                      {form.scheduledDate === rec.date && <span className="text-xs text-blue-600 font-medium">Selected</span>}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-2">Or pick any date below.</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No nearby jobs found in the next 30 days — pick any available date.</p>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Scheduled date</Label>
              <Input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Start time</Label>
              <Input type="time" value={form.scheduledTimeStart} onChange={(e) => setForm({ ...form, scheduledTimeStart: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>End time</Label>
              <Input type="time" value={form.scheduledTimeEnd} onChange={(e) => setForm({ ...form, scheduledTimeEnd: e.target.value })} className="mt-1" />
            </div>
          </div>
        </div>

        {/* Recurring schedule */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">Recurring schedule</h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600" />
              <span className="text-sm text-slate-600">Enable</span>
            </label>
          </div>
          {form.isRecurring && (
            <div>
              <Label>Repeat every</Label>
              <select value={form.recurringIntervalMonths}
                onChange={(e) => setForm({ ...form, recurringIntervalMonths: Number(e.target.value) })}
                className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value={1}>1 month</option>
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months (annual)</option>
                <option value={24}>24 months (biennial)</option>
              </select>
              <p className="text-xs text-slate-400 mt-1.5">A new pending job is automatically created when this one is marked complete.</p>
            </div>
          )}
        </div>

        {/* Tenant details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">Tenant / contact details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tenant name</Label>
              <Input value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} placeholder="Full name" className="mt-1" />
            </div>
            <div>
              <Label>Unit / apartment</Label>
              <Input value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} placeholder="e.g. 12B" className="mt-1" />
            </div>
            <div>
              <Label>Tenant email</Label>
              <Input type="email" value={form.tenantEmail} onChange={(e) => setForm({ ...form, tenantEmail: e.target.value })} placeholder="tenant@email.com" className="mt-1" />
            </div>
            <div>
              <Label>Tenant phone</Label>
              <Input value={form.tenantPhone} onChange={(e) => setForm({ ...form, tenantPhone: e.target.value })} placeholder="04xx xxx xxx" className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Internal notes</Label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="mt-1 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/jobs"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" loading={saving}>Create job</Button>
        </div>
      </form>
    </div>
  );
}

export default function NewJobPage() {
  return (
    <Suspense>
      <NewJobForm />
    </Suspense>
  );
}
