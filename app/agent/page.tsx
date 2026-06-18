"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ClipboardList, Clock, CheckCircle2, ChevronRight, Plus, Loader2 } from "lucide-react";
import { JOB_CATEGORIES } from "@/lib/utils";

interface Property {
  id: string;
  name: string;
  address: string;
  suburb: string | null;
  buildingName: string | null;
  pendingRequests: number;
}

interface Request {
  id: string;
  propertyName: string | null;
  jobCategory: string;
  title: string;
  status: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: "Awaiting review", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  sent: { label: "Booking link sent", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  booked: { label: "Booked", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  rejected: { label: "Not approved", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400" },
};

export default function AgentDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/agent/properties").then((r) => r.json()),
      fetch("/api/agent/requests").then((r) => r.json()),
    ]).then(([props, reqs]) => {
      setProperties(Array.isArray(props) ? props : []);
      setRequests(Array.isArray(reqs) ? reqs : []);
      setLoading(false);
    });
  }, []);

  const pending = requests.filter((r) => r.status === "pending").length;
  const sent = requests.filter((r) => r.status === "sent").length;
  const booked = requests.filter((r) => r.status === "booked").length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Submit and track maintenance requests for your properties</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Properties", value: properties.length, icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Awaiting review", value: pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Booking link sent", value: sent, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Booked", value: booked, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Properties */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 text-sm">My Properties</h2>
                <Link href="/agent/properties" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                  View all
                </Link>
              </div>
              {properties.length === 0 ? (
                <p className="px-5 py-8 text-sm text-slate-400 text-center">No properties assigned yet</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {properties.slice(0, 5).map((p) => (
                    <Link key={p.id} href={`/agent/properties/${p.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500 truncate">{p.address}{p.suburb ? `, ${p.suburb}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {p.pendingRequests > 0 && (
                          <span className="h-5 w-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center">
                            {p.pendingRequests}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent requests */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 text-sm">Recent Requests</h2>
                <Link href="/agent/requests" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                  View all
                </Link>
              </div>
              {requests.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-slate-400 mb-3">No requests submitted yet</p>
                  <Link href="/agent/properties" className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                    <Plus className="h-3.5 w-3.5" /> Submit your first request
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {requests.slice(0, 5).map((r) => {
                    const s = STATUS_STYLES[r.status] ?? STATUS_STYLES.pending;
                    const cat = JOB_CATEGORIES[r.jobCategory as keyof typeof JOB_CATEGORIES];
                    return (
                      <div key={r.id} className="px-5 py-3">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-sm font-medium text-slate-900 truncate">{r.title}</p>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium flex-shrink-0 ${s.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{r.propertyName} · {cat?.label ?? r.jobCategory}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
