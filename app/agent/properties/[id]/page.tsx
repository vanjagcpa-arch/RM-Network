"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, MapPin, Plus, X, Loader2, ChevronLeft, Send, Clock, CheckCircle2, XCircle } from "lucide-react";
import { JOB_CATEGORIES, REQUEST_STATUS_CHIP } from "@/lib/utils";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Property {
  id: string;
  name: string;
  address: string;
  suburb: string | null;
  postcode: string | null;
  buildingName: string | null;
}

interface Request {
  id: string;
  jobCategory: string;
  title: string;
  status: string;
  tenantName: string | null;
  unitNumber: string | null;
  createdAt: string;
  rejectionReason: string | null;
}


const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EMPTY_FORM = {
  jobCategory: "",
  title: "",
  description: "",
  tenantName: "",
  tenantEmail: "",
  tenantPhone: "",
  unitNumber: "",
  notes: "",
  sendDirectly: false,
  allowedWeekdays: [] as string[],
  allowedTimeStart: "",
  allowedTimeEnd: "",
};

export default function AgentPropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function loadData() {
    Promise.all([
      fetch("/api/agent/properties").then((r) => r.json()),
      fetch(`/api/agent/requests?propertyId=${id}`).then((r) => r.json()),
    ]).then(([props, reqs]) => {
      const prop = Array.isArray(props) ? props.find((p: Property) => p.id === id) : null;
      setProperty(prop ?? null);
      setRequests(Array.isArray(reqs) ? reqs : []);
      setLoading(false);
    });
  }

  useEffect(() => { loadData(); }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.jobCategory || !form.title) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    const res = await fetch("/api/agent/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: id,
        ...form,
        allowedWeekdays: form.allowedWeekdays.length > 0 ? form.allowedWeekdays.join(",") : null,
        allowedTimeStart: form.allowedTimeStart || null,
        allowedTimeEnd: form.allowedTimeEnd || null,
      }),
    });

    if (res.ok) {
      setSuccess(form.sendDirectly && form.tenantEmail
        ? "Booking link sent to tenant!"
        : "Request submitted for admin review.");
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadData();
    } else {
      const data = await res.json();
      setError(data.error ?? "Submission failed");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Property not found or not assigned to you.</p>
        <button onClick={() => router.push("/agent/properties")} className="mt-3 text-sm text-[#16A34A] hover:underline">
          ← Back to properties
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back */}
      <button onClick={() => router.push("/agent/properties")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4" /> My Properties
      </button>

      {/* Property header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-[#ECFDE8] flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-[#16A34A]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-cabinet">{property.name}</h1>
              {property.buildingName && (
                <p className="text-sm text-slate-400">{property.buildingName}</p>
              )}
              <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {property.address}{property.suburb ? `, ${property.suburb}` : ""}{property.postcode ? ` ${property.postcode}` : ""}
              </div>
            </div>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> New Request
            </Button>
          )}
        </div>
      </div>

      {/* Success / Error banners */}
      {success && (
        <div className="mb-4 rounded-lg bg-[#ECFDE8] border border-[#CFF8C8] px-4 py-3 text-sm text-[#16A34A] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* New request form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-[#CFF8C8] shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900">New Maintenance Request</h2>
            <button onClick={() => { setShowForm(false); setError(""); }} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Job type */}
            <div>
              <Label className="mb-2 block">Service type *</Label>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(JOB_CATEGORIES).map(([key, cat]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, jobCategory: key }))}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition-all ${form.jobCategory === key ? "border-slate-900 bg-[#ECFDE8]" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.calColor }} />
                    <span className="text-sm font-medium text-slate-900">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Issue title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Smoke detector beeping in unit 3B"
                required
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Provide as much detail as possible about the issue…"
                className="mt-1 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Tenant details */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-900 mb-3">Tenant details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="tenantName">Tenant name</Label>
                  <Input id="tenantName" value={form.tenantName} onChange={(e) => setForm((f) => ({ ...f, tenantName: e.target.value }))} placeholder="Full name" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="unitNumber">Unit number</Label>
                  <Input id="unitNumber" value={form.unitNumber} onChange={(e) => setForm((f) => ({ ...f, unitNumber: e.target.value }))} placeholder="e.g. 3B" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="tenantPhone">Phone</Label>
                  <Input id="tenantPhone" value={form.tenantPhone} onChange={(e) => setForm((f) => ({ ...f, tenantPhone: e.target.value }))} placeholder="04xx xxx xxx" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="tenantEmail">Email {form.sendDirectly ? "*" : "(for booking link)"}</Label>
                  <Input id="tenantEmail" type="email" value={form.tenantEmail} onChange={(e) => setForm((f) => ({ ...f, tenantEmail: e.target.value }))} placeholder="tenant@email.com" className="mt-1" />
                </div>
              </div>
            </div>

            {/* Notes for admin */}
            <div>
              <Label htmlFor="notes">Notes for admin (optional)</Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Urgency, access requirements, preferred contact times…"
                className="mt-1 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Preferred time window */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-900 mb-1">Preferred availability <span className="font-normal text-slate-400">(optional)</span></p>
              <p className="text-xs text-slate-500 mb-3">Help us schedule at a convenient time for the tenant.</p>
              <div className="space-y-3">
                <div>
                  <Label className="mb-2 block text-xs">Available days</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((day) => {
                      const selected = form.allowedWeekdays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setForm((f) => ({
                            ...f,
                            allowedWeekdays: selected
                              ? f.allowedWeekdays.filter((d) => d !== day)
                              : [...f.allowedWeekdays, day],
                          }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selected ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="allowedTimeStart" className="text-xs">Earliest time</Label>
                    <Input id="allowedTimeStart" type="time" value={form.allowedTimeStart} onChange={(e) => setForm((f) => ({ ...f, allowedTimeStart: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="allowedTimeEnd" className="text-xs">Latest time</Label>
                    <Input id="allowedTimeEnd" type="time" value={form.allowedTimeEnd} onChange={(e) => setForm((f) => ({ ...f, allowedTimeEnd: e.target.value }))} className="mt-1" />
                  </div>
                </div>
              </div>
            </div>

            {/* Send mode */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-900">How should this request proceed?</p>
              {[
                {
                  value: false,
                  label: "Submit for admin review",
                  desc: "Admin will review and set available days/times before sending the booking link to your tenant.",
                },
                {
                  value: true,
                  label: "Send booking link directly to tenant",
                  desc: "Tenant receives a booking link immediately to choose their own appointment time. Requires tenant email.",
                },
              ].map(({ value, label, desc }) => (
                <label key={String(value)} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${form.sendDirectly === value ? "border-slate-900 bg-[#ECFDE8]/50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <input
                    type="radio"
                    name="sendMode"
                    checked={form.sendDirectly === value}
                    onChange={() => setForm((f) => ({ ...f, sendDirectly: value }))}
                    className="mt-0.5 accent-green-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="submit"
                loading={submitting}
                disabled={!form.jobCategory || !form.title || (form.sendDirectly && !form.tenantEmail)}
                className="flex-1"
              >
                {form.sendDirectly ? "Send to tenant" : "Submit for review"}
              </Button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Request history */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-sm">Maintenance History</h2>
        </div>
        {requests.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-slate-400">No requests submitted for this property yet.</p>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#16A34A] hover:text-[#16A34A] font-medium">
                <Plus className="h-3.5 w-3.5" /> Submit your first request
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {requests.map((r) => {
              const s = REQUEST_STATUS_CHIP[r.status] ?? REQUEST_STATUS_CHIP.pending;
              const cat = JOB_CATEGORIES[r.jobCategory as keyof typeof JOB_CATEGORIES];
              return (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                    <Chip label={s.label} color={s.color} className="flex-shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500">
                    {cat?.label ?? r.jobCategory}
                    {r.tenantName ? ` · ${r.tenantName}` : ""}
                    {r.unitNumber ? ` · Unit ${r.unitNumber}` : ""}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(r.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {r.status === "rejected" && r.rejectionReason && (
                    <div className="mt-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
                      <strong>Reason:</strong> {r.rejectionReason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
