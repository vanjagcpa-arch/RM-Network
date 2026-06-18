"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ClipboardList, Send, Clock, CheckCircle2, XCircle } from "lucide-react";
import { JOB_CATEGORIES } from "@/lib/utils";

interface Request {
  id: string;
  propertyId: string;
  propertyName: string | null;
  propertyAddress: string | null;
  jobCategory: string;
  title: string;
  status: string;
  tenantName: string | null;
  unitNumber: string | null;
  createdAt: string;
  rejectionReason: string | null;
}

const STATUS_STYLES: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: "Awaiting review", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  sent: { label: "Booking link sent", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  booked: { label: "Booked by tenant", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  rejected: { label: "Not approved", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400" },
};

const ALL_STATUSES = [
  { value: "", label: "All requests" },
  { value: "pending", label: "Awaiting review", icon: Clock },
  { value: "sent", label: "Booking link sent", icon: Send },
  { value: "booked", label: "Booked", icon: CheckCircle2 },
  { value: "rejected", label: "Not approved", icon: XCircle },
];

export default function AgentRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/agent/requests")
      .then((r) => r.json())
      .then((data) => { setRequests(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const filtered = filter ? requests.filter((r) => r.status === filter) : requests;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Maintenance Requests</h1>
        <p className="text-slate-500 text-sm mt-1">All requests you have submitted across your properties</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {ALL_STATUSES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filter === value ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
          >
            {label}
            {value && (
              <span className="ml-1.5 opacity-60">
                {requests.filter((r) => r.status === value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <ClipboardList className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No requests found</p>
          <Link href="/agent/properties" className="mt-2 inline-block text-sm text-emerald-600 hover:underline">
            Submit a request from a property
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filtered.map((r) => {
              const s = STATUS_STYLES[r.status] ?? STATUS_STYLES.pending;
              const cat = JOB_CATEGORIES[r.jobCategory as keyof typeof JOB_CATEGORIES];
              return (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                      </div>
                      <Link href={`/agent/properties/${r.propertyId}`} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                        {r.propertyName ?? "View property"}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cat?.label ?? r.jobCategory}
                        {r.tenantName ? ` · ${r.tenantName}` : ""}
                        {r.unitNumber ? ` · Unit ${r.unitNumber}` : ""}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(r.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {r.status === "rejected" && r.rejectionReason && (
                        <div className="mt-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700 inline-block">
                          Reason: {r.rejectionReason}
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium flex-shrink-0 ${s.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
