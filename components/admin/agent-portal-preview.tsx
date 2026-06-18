"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Building2, ClipboardList, Loader2, Wrench, Plus, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { JOB_CATEGORIES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Property {
  id: string;
  name: string;
  address: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
}

export interface AgentForPreview {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  agencyName: string | null;
  assignedProperties: Property[];
}

interface MaintenanceRequest {
  id: string;
  title: string;
  status: string;
  jobCategory: string;
  createdAt: string;
  tenantName: string | null;
  unitNumber: string | null;
  submittedByAdminName: string | null;
  property: Property | null;
}

const NAV = [
  { key: "properties", label: "My Properties", icon: Building2 },
  { key: "requests", label: "Maintenance Requests", icon: ClipboardList },
] as const;

type Tab = "properties" | "requests";

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
  allowedWeekdays: [] as string[],
  allowedTimeStart: "",
  allowedTimeEnd: "",
};

function RequestFormModal({
  property,
  agentId,
  onClose,
  onSuccess,
}: {
  property: Property;
  agentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          ...form,
          allowedWeekdays: form.allowedWeekdays.length > 0 ? form.allowedWeekdays.join(",") : null,
          allowedTimeStart: form.allowedTimeStart || null,
          allowedTimeEnd: form.allowedTimeEnd || null,
        }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error ?? "Submission failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-semibold text-slate-900">New Maintenance Request</h2>
            <p className="text-xs text-slate-500 mt-0.5">{property.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {/* Notice */}
          <div className="rounded-lg bg-sky-50 border border-sky-200 px-3 py-2.5 text-xs text-sky-700">
            This request will be submitted on behalf of <strong>{agentId ? "the agent" : "agent"}</strong> and marked as admin-submitted.
          </div>

          {/* Job type */}
          <div>
            <Label className="mb-2 block">Service type *</Label>
            <div className="grid grid-cols-1 gap-1.5">
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
              placeholder="Provide as much detail as possible…"
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
                <Label htmlFor="tenantEmail">Email</Label>
                <Input id="tenantEmail" type="email" value={form.tenantEmail} onChange={(e) => setForm((f) => ({ ...f, tenantEmail: e.target.value }))} placeholder="tenant@email.com" className="mt-1" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Urgency, access requirements, preferred contact times…"
              className="mt-1 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Preferred availability */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-900 mb-1">Preferred availability <span className="font-normal text-slate-400">(optional)</span></p>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="mb-2 block text-xs">Available days</Label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((day) => {
                    const selected = form.allowedWeekdays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            allowedWeekdays: selected
                              ? f.allowedWeekdays.filter((d) => d !== day)
                              : [...f.allowedWeekdays, day],
                          }))
                        }
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
                  <Label htmlFor="timeStart" className="text-xs">Earliest time</Label>
                  <Input id="timeStart" type="time" value={form.allowedTimeStart} onChange={(e) => setForm((f) => ({ ...f, allowedTimeStart: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="timeEnd" className="text-xs">Latest time</Label>
                  <Input id="timeEnd" type="time" value={form.allowedTimeEnd} onChange={(e) => setForm((f) => ({ ...f, allowedTimeEnd: e.target.value }))} className="mt-1" />
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <Button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={!form.jobCategory || !form.title || submitting}
            loading={submitting}
            className="flex-1"
          >
            Submit request
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function AgentPortalPreview({ agent, onClose }: { agent: AgentForPreview; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("properties");
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [formProperty, setFormProperty] = useState<Property | null>(null);
  const [successProperty, setSuccessProperty] = useState<string | null>(null);

  const loadRequests = useCallback(() => {
    setLoadingReqs(true);
    fetch(`/api/admin/agents/${agent.id}/requests`)
      .then((r) => r.json())
      .then((d) => setRequests(Array.isArray(d) ? d : []))
      .finally(() => setLoadingReqs(false));
  }, [agent.id]);

  useEffect(() => {
    if (tab === "requests") loadRequests();
  }, [tab, loadRequests]);

  function handleRequestSuccess() {
    setSuccessProperty(formProperty?.name ?? null);
    setFormProperty(null);
    if (tab === "requests") loadRequests();
    setTimeout(() => setSuccessProperty(null), 4000);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">
      {/* Admin banner */}
      <div className="flex items-center justify-between px-5 py-2 bg-slate-900 text-white text-xs flex-shrink-0">
        <span>
          Admin preview — viewing <strong>{agent.name}</strong>
          {agent.agencyName ? ` (${agent.agencyName})` : ""}
          <span className="ml-2 text-slate-400">· Any requests you submit will be marked "via admin"</span>
        </span>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 rounded px-2.5 py-1 bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Exit preview
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex h-full w-60 flex-col bg-white border-r border-slate-200 flex-shrink-0">
          <div className="px-4 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 shadow-sm flex-shrink-0">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-cabinet text-slate-900 leading-none">RM Network</p>
                {agent.agencyName && (
                  <p className="text-[11px] text-slate-400 leading-none mt-1.5 pl-3">+ {agent.agencyName}</p>
                )}
              </div>
            </div>
          </div>

          <nav className="flex-1 px-2 py-3 space-y-px">
            {NAV.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                    active ? "bg-[#ECFDE8] text-[#16A34A]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? "text-[#16A34A]" : "text-slate-400"}`} />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 px-4 py-3">
            <p className="text-[11px] text-slate-400 mb-0.5">Signed in as</p>
            <p className="text-xs font-medium text-slate-800 truncate">{agent.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{agent.email}</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {tab === "properties" && (
            <div className="p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-cabinet text-slate-900">My Properties</h1>
                <p className="text-sm text-slate-500 mt-1">
                  {agent.assignedProperties.length === 0
                    ? "No properties assigned yet"
                    : `${agent.assignedProperties.length} propert${agent.assignedProperties.length === 1 ? "y" : "ies"} assigned to you`}
                </p>
              </div>

              {successProperty && (
                <div className="mb-6 flex items-center gap-2 rounded-lg bg-[#ECFDE8] border border-[#CFF8C8] px-4 py-3 text-sm text-[#16A34A]">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  Request submitted for <strong>{successProperty}</strong> — it will appear in Maintenance Requests pending admin review.
                </div>
              )}

              {agent.assignedProperties.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <Building2 className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No properties assigned</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Contact your administrator to assign properties to your account.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agent.assignedProperties.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 hover:shadow transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{p.address}</p>
                          {p.suburb && (
                            <p className="text-xs text-slate-400">
                              {p.suburb}{p.state ? `, ${p.state}` : ""}{p.postcode ? ` ${p.postcode}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => setFormProperty(p)}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" /> Submit maintenance request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "requests" && (
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-cabinet text-slate-900">Maintenance Requests</h1>
                  <p className="text-sm text-slate-500 mt-1">All requests submitted across your properties</p>
                </div>
                {agent.assignedProperties.length > 0 && (
                  <button
                    onClick={() => setFormProperty(agent.assignedProperties[0])}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> New request
                  </button>
                )}
              </div>

              {successProperty && (
                <div className="mb-6 flex items-center gap-2 rounded-lg bg-[#ECFDE8] border border-[#CFF8C8] px-4 py-3 text-sm text-[#16A34A]">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  Request submitted — pending admin review.
                </div>
              )}

              {loadingReqs ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : requests.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <ClipboardList className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No requests yet</p>
                  <p className="text-slate-400 text-sm mt-1">Requests will appear here after submission.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Request</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Property</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Submitted</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {requests.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3">
                            <p className="font-medium text-slate-900">{r.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {JOB_CATEGORIES[r.jobCategory as keyof typeof JOB_CATEGORIES]?.label ?? r.jobCategory}
                              {r.tenantName && ` · ${r.tenantName}`}
                              {r.unitNumber && ` · Unit ${r.unitNumber}`}
                            </p>
                            {r.submittedByAdminName && (
                              <span className="inline-flex items-center mt-1 rounded-[6px] bg-sky-50 border border-sky-200 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                                via admin · {r.submittedByAdminName}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs">{r.property?.name ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {new Date(r.createdAt).toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Request form modal — renders on top of preview */}
      {formProperty && (
        <RequestFormModal
          property={formProperty}
          agentId={agent.id}
          onClose={() => setFormProperty(null)}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
}
