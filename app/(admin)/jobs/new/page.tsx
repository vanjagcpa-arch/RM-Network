"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JOB_CATEGORIES, JOB_STATUSES } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Sparkles, Calendar, RefreshCw, LayoutTemplate, Send, Building2, MapPin, User2 } from "lucide-react";
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

interface JobTemplate {
  id: string;
  name: string;
  jobCategory: string;
  titleTemplate: string;
  description: string | null;
  recurringIntervalMonths: number | null;
}

interface Recommendation {
  date: string;
  score: number;
  reason: string;
  jobCount: number;
  buildingJobCount: number;
  technicianJobCount: number;
}

function NewJobForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPropertyId = searchParams.get("propertyId") ?? "";

  const [properties, setProperties] = useState<Property[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendBookingRequest, setSendBookingRequest] = useState(false);
  const skipAutoTitle = useRef(false);
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
    fetch("/api/templates").then((r) => r.json()).then(setTemplates);
  }, []);

  function loadTemplate(tplId: string) {
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    const prop = properties.find((p) => p.id === form.propertyId);
    const title = tpl.titleTemplate.replace("{property}", prop?.name ?? "{property}");
    skipAutoTitle.current = true;
    setForm((f) => ({
      ...f,
      jobCategory: tpl.jobCategory,
      title,
      description: tpl.description ?? "",
      isRecurring: !!tpl.recurringIntervalMonths,
      recurringIntervalMonths: tpl.recurringIntervalMonths ?? 12,
    }));
  }

  useEffect(() => {
    if (!form.propertyId) { setRecommendations([]); return; }
    setLoadingRec(true);
    const params = new URLSearchParams({ propertyId: form.propertyId, daysAhead: "60" });
    if (form.technicianId) params.set("technicianId", form.technicianId);
    fetch(`/api/scheduling/recommendations?${params}`)
      .then((r) => r.json())
      .then((data) => setRecommendations(Array.isArray(data) ? data : []))
      .finally(() => setLoadingRec(false));
  }, [form.propertyId, form.technicianId]);

  // Auto-fill title when category changes (skip once after template load)
  useEffect(() => {
    if (skipAutoTitle.current) { skipAutoTitle.current = false; return; }
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
    if (res.ok) {
      const job = await res.json();
      if (sendBookingRequest && form.tenantEmail) {
        await fetch("/api/jobs/request-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: job.id }),
        }).catch(() => {});
      }
      router.push("/jobs");
    } else {
      setSaving(false);
    }
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
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">Job details</h2>
            {templates.length > 0 && (
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-3.5 w-3.5 text-slate-400" />
                <select onChange={(e) => loadTemplate(e.target.value)} defaultValue=""
                  className="text-xs rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="" disabled>Load template…</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
          </div>

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
                {(["pending", "confirmed", "in_progress"] as const).map((k) => (
                  <option key={k} value={k}>{JOB_STATUSES[k].label}</option>
                ))}
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
            <p className="text-sm text-slate-400">Select a property to see smart scheduling suggestions.</p>
          ) : loadingRec ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin" />
              Finding the best days…
            </div>
          ) : recommendations.length > 0 ? (
            <div>
              <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wide">Recommended days — click to select</p>
              <div className="space-y-2">
                {recommendations.map((rec) => {
                  const d = new Date(rec.date + "T00:00:00");
                  const label = d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
                  const isBuildingMatch = rec.buildingJobCount > 0;
                  const isTechMatch = rec.technicianJobCount > 0;
                  const selected = form.scheduledDate === rec.date;
                  return (
                    <button
                      key={rec.date}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, scheduledDate: rec.date }))}
                      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${selected ? "border-blue-500 bg-blue-50 shadow-sm" : isBuildingMatch ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-400" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}
                    >
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? "bg-blue-600" : isBuildingMatch ? "bg-emerald-100" : "bg-slate-100"}`}>
                        {isBuildingMatch
                          ? <Building2 className={`h-4 w-4 ${selected ? "text-white" : "text-emerald-600"}`} />
                          : <Calendar className={`h-4 w-4 ${selected ? "text-white" : "text-slate-500"}`} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{label}</p>
                          {isBuildingMatch && <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Same building</span>}
                          {!isBuildingMatch && isTechMatch && <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Tech available</span>}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{rec.reason} · {rec.jobCount} job{rec.jobCount !== 1 ? "s" : ""} that day</p>
                      </div>
                      {selected && <span className="text-xs text-blue-600 font-semibold flex-shrink-0">✓ Selected</span>}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-2.5">Or pick any date in the fields below.</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No other jobs scheduled in the next 60 days — pick any available date below.</p>
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
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User2 className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Tenant / contact details</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tenant name</Label>
              <Input value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} placeholder="Full name" className="mt-1" />
            </div>
            <div>
              <Label>Unit / apartment number</Label>
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

        {/* Tenant booking request */}
        {form.tenantEmail && (
          <div className={`rounded-xl border p-5 transition-colors ${sendBookingRequest ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sendBookingRequest ? "bg-blue-600" : "bg-slate-100"}`}>
                  <Send className={`h-4 w-4 ${sendBookingRequest ? "text-white" : "text-slate-500"}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Send booking request to tenant</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Email {form.tenantEmail} a link to choose their own appointment time. The link expires in 7 days.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                <input
                  type="checkbox"
                  checked={sendBookingRequest}
                  onChange={(e) => {
                    setSendBookingRequest(e.target.checked);
                    if (e.target.checked) setForm((f) => ({ ...f, scheduledDate: "", scheduledTimeStart: "", scheduledTimeEnd: "" }));
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span className="text-sm font-medium text-slate-700">Enable</span>
              </label>
            </div>
            {sendBookingRequest && (
              <p className="mt-3 text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2">
                The scheduled date is optional — the tenant will choose a time via the booking link. The job will be created with status &quot;Awaiting Tenant&quot;.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href="/jobs"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" loading={saving}>
            {sendBookingRequest ? "Create job & send booking request" : "Create job"}
          </Button>
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
