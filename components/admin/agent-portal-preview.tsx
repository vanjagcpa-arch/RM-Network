"use client";

import { useEffect, useState } from "react";
import { X, Building2, ClipboardList, Loader2, Wrench } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { JOB_CATEGORIES } from "@/lib/utils";

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
  property: Property | null;
}

const NAV = [
  { key: "properties", label: "My Properties", icon: Building2 },
  { key: "requests", label: "Maintenance Requests", icon: ClipboardList },
] as const;

type Tab = "properties" | "requests";

export function AgentPortalPreview({ agent, onClose }: { agent: AgentForPreview; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("properties");
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);

  useEffect(() => {
    if (tab !== "requests") return;
    setLoadingReqs(true);
    fetch(`/api/admin/agents/${agent.id}/requests`)
      .then((r) => r.json())
      .then((d) => setRequests(Array.isArray(d) ? d : []))
      .finally(() => setLoadingReqs(false));
  }, [tab, agent.id]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">
      {/* Admin banner */}
      <div className="flex items-center justify-between px-5 py-2 bg-slate-900 text-white text-xs flex-shrink-0">
        <span>
          Admin preview — viewing <strong>{agent.name}</strong>
          {agent.agencyName ? ` (${agent.agencyName})` : ""}
        </span>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 rounded px-2.5 py-1 bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Exit preview
        </button>
      </div>

      {/* Portal layout */}
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

        {/* Main */}
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
                          onClick={() => setTab("requests")}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                        >
                          <ClipboardList className="h-3.5 w-3.5" /> Submit maintenance request
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
              <div className="mb-6">
                <h1 className="text-3xl font-cabinet text-slate-900">Maintenance Requests</h1>
                <p className="text-sm text-slate-500 mt-1">All requests submitted across your properties</p>
              </div>

              {loadingReqs ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : requests.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <ClipboardList className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No requests yet</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Requests will appear here after this agent submits them from a property page.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Request</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Property</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tenant</th>
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
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs">{r.property?.name ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-600 text-xs">
                            {r.tenantName ?? "—"}
                            {r.unitNumber && <span className="text-slate-400"> · {r.unitNumber}</span>}
                          </td>
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
    </div>
  );
}
