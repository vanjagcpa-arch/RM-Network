"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Check, X, Send, ChevronDown, MessageCircle, Search } from "lucide-react";
import { JOB_CATEGORIES, REQUEST_STATUS_CHIP } from "@/lib/utils";
import { Chip } from "@/components/ui/chip";

interface Request {
  id: string;
  agentName: string | null;
  agencyName: string | null;
  agentEmail: string | null;
  propertyName: string | null;
  propertyAddress: string | null;
  propertySuburb: string | null;
  jobCategory: string;
  title: string;
  description: string | null;
  status: string;
  tenantName: string | null;
  tenantEmail: string | null;
  tenantPhone: string | null;
  unitNumber: string | null;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface Comment {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

function CommentsPanel({ requestId }: { requestId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadComments() {
    const res = await fetch(`/api/admin/maintenance-requests/${requestId}/comments`);
    const data = await res.json();
    setComments(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadComments();
    const interval = setInterval(loadComments, 15000);
    return () => clearInterval(interval);
  }, [requestId]);

  async function sendComment() {
    if (!content.trim()) return;
    setSending(true);
    const res = await fetch(`/api/admin/maintenance-requests/${requestId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      setContent("");
      await loadComments();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
    setSending(false);
  }

  const roleChipColor: Record<string, import("@/components/ui/chip").ChipColor> = {
    admin: "blue",
    agent: "emerald",
  };

  return (
    <div className="bg-slate-50/50 px-5 py-4 border-t border-slate-100">
      <p className="text-xs font-semibold text-slate-700 mb-3">Internal comments</p>
      {loading ? (
        <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-slate-300" /></div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-slate-400 italic mb-3">No comments yet. Start the thread below.</p>
      ) : (
        <div className="space-y-3 mb-3 max-h-64 overflow-y-auto">
          {[...comments].reverse().map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">
                {getInitials(c.authorName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="text-xs font-semibold text-slate-800">{c.authorName}</span>
                  <Chip label={c.authorRole} color={roleChipColor[c.authorRole] ?? "slate"} className="px-2 py-0.5 text-[10px]" />
                  <span className="text-[10px] text-slate-400">
                    {new Date(c.createdAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Write a comment…"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendComment(); }}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
        <button
          onClick={sendComment}
          disabled={!content.trim() || sending}
          className="self-end flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          Send
        </button>
      </div>
    </div>
  );
}

function ApproveModal({ request, onClose, onDone }: { request: Request; onClose: () => void; onDone: () => void }) {
  const [allowedWeekdays, setAllowedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [allowedTimeStart, setAllowedTimeStart] = useState("08:00");
  const [allowedTimeEnd, setAllowedTimeEnd] = useState("17:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleDay(day: number) {
    setAllowedWeekdays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort());
  }

  async function submit() {
    setError("");
    setSubmitting(true);
    const res = await fetch(`/api/admin/maintenance-requests/${request.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", allowedWeekdays, allowedTimeStart: allowedTimeStart || null, allowedTimeEnd: allowedTimeEnd || null }),
    });
    if (res.ok) {
      onDone();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to approve");
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Approve Request</h2>
          <p className="text-sm text-slate-500 mt-0.5">Set booking constraints before sending link to tenant</p>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
            <p className="font-medium text-slate-900">{request.title}</p>
            <p className="text-slate-500 text-xs mt-0.5">{request.propertyName} · {JOB_CATEGORIES[request.jobCategory as keyof typeof JOB_CATEGORIES]?.label ?? request.jobCategory}</p>
            {request.tenantEmail && <p className="text-slate-400 text-xs mt-1">Booking link → {request.tenantEmail}</p>}
          </div>
          {!request.tenantEmail && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
              No tenant email — booking link cannot be sent automatically.
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">Available days</p>
            <div className="flex gap-1.5 flex-wrap">
              {WEEKDAYS.map((day, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${allowedWeekdays.includes(i) ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">Time window <span className="font-normal text-slate-400">(optional)</span></p>
            <div className="flex items-center gap-3">
              <div>
                <label className="text-xs text-slate-500">From</label>
                <input type="time" value={allowedTimeStart} onChange={(e) => setAllowedTimeStart(e.target.value)}
                  className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Until</label>
                <input type="time" value={allowedTimeEnd} onChange={(e) => setAllowedTimeEnd(e.target.value)}
                  className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={submit} disabled={submitting || allowedWeekdays.length === 0 || !request.tenantEmail}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send booking link
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ request, onClose, onDone }: { request: Request; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const res = await fetch(`/api/admin/maintenance-requests/${request.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", rejectionReason: reason }),
    });
    if (res.ok) onDone();
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Reject Request</h2>
          <p className="text-sm text-slate-500 mt-0.5">The agent will be notified with your reason.</p>
        </div>
        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason (optional)</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
            placeholder="e.g. This falls outside our service scope…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={submit} disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Reject request
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [approving, setApproving] = useState<Request | null>(null);
  const [rejecting, setRejecting] = useState<Request | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRejecting, setBulkRejecting] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [bulkWorking, setBulkWorking] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/admin/maintenance-requests")
      .then((r) => r.json())
      .then((data) => { setRequests(Array.isArray(data) ? data : []); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  const filtered = requests.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.propertyName?.toLowerCase() ?? "").includes(q) ||
        (r.agentName?.toLowerCase() ?? "").includes(q) ||
        (r.tenantName?.toLowerCase() ?? "").includes(q)
      );
    }
    return true;
  });

  const pendingFiltered = filtered.filter((r) => r.status === "pending");

  useEffect(() => { setSelected(new Set()); }, [filterStatus]);

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function toggleSelectAll() {
    if (selected.size === pendingFiltered.length && pendingFiltered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingFiltered.map((r) => r.id)));
    }
  }

  async function bulkApprove() {
    setBulkWorking(true);
    await fetch("/api/admin/maintenance-requests/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], action: "approve" }),
    });
    setSelected(new Set());
    setBulkWorking(false);
    load();
  }

  async function bulkReject() {
    setBulkWorking(true);
    await fetch("/api/admin/maintenance-requests/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], action: "reject", rejectionReason: bulkRejectReason }),
    });
    setSelected(new Set());
    setBulkRejectReason("");
    setBulkRejecting(false);
    setBulkWorking(false);
    load();
  }

  const statusOptions = [
    { value: "", label: "All statuses" },
    { value: "pending", label: "Awaiting review" },
    { value: "sent", label: "Booking link sent" },
    { value: "booked", label: "Booked by tenant" },
    { value: "rejected", label: "Not approved" },
  ];

  return (
    <div className="p-8 pb-32">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-cabinet">Maintenance Requests</h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} of {requests.length} requests
            {requests.filter((r) => r.status === "pending").length > 0 && (
              <span className="ml-2 text-amber-600 font-medium">· {requests.filter((r) => r.status === "pending").length} pending review</span>
            )}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests…"
            className="pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-56"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="py-2 px-3 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}{o.value ? ` (${requests.filter((r) => r.status === o.value).length})` : ""}</option>
          ))}
        </select>
        {(filterStatus || search) && (
          <button onClick={() => { setFilterStatus(""); setSearch(""); }} className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-slate-400">No {filterStatus || ""} requests{search ? ` matching "${search}"` : ""}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {filterStatus === "pending" && (
                  <th className="pl-5 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selected.size === pendingFiltered.length && pendingFiltered.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-[#16A34A] focus:ring-green-500"
                    />
                  </th>
                )}
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Request</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Property</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const s = REQUEST_STATUS_CHIP[r.status] ?? REQUEST_STATUS_CHIP.pending;
                const cat = JOB_CATEGORIES[r.jobCategory as keyof typeof JOB_CATEGORIES];
                const isOpen = expanded === r.id;
                const commentsOpen = expandedComments === r.id;
                const isPending = r.status === "pending";

                return (
                  <>
                    <tr
                      key={r.id}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors group cursor-pointer ${isOpen ? "bg-slate-50/60" : ""}`}
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                    >
                      {filterStatus === "pending" && (
                        <td className="pl-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          {isPending && (
                            <input
                              type="checkbox"
                              checked={selected.has(r.id)}
                              onChange={() => toggleSelect(r.id)}
                              className="h-4 w-4 rounded border-slate-300 text-[#16A34A] focus:ring-green-500"
                            />
                          )}
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">{r.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {cat?.label ?? r.jobCategory}
                          {r.tenantName ? ` · ${r.tenantName}` : ""}
                          {r.unitNumber ? ` · Unit ${r.unitNumber}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-slate-700 max-w-[160px] truncate">{r.propertyName ?? "—"}</p>
                        {r.propertySuburb && <p className="text-xs text-slate-400">{r.propertySuburb}</p>}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-slate-700">{r.agentName ?? "—"}</p>
                        {r.agencyName && <p className="text-xs text-slate-400">{r.agencyName}</p>}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-slate-500 text-xs">
                        {new Date(r.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3.5">
                        <Chip label={s.label} color={s.color} />
                      </td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setApproving(r); }}
                                className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
                              >
                                <Check className="h-3 w-3" /> Approve
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setRejecting(r); }}
                                className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedComments(commentsOpen ? null : r.id); }}
                            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium border transition-colors ${commentsOpen ? "bg-[#ECFDE8] border-[#CFF8C8] text-[#16A34A]" : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"}`}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>
                          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isOpen && (
                      <tr key={`${r.id}-detail`} className="border-b border-slate-100">
                        <td colSpan={filterStatus === "pending" ? 7 : 6} className="bg-slate-50/50 px-5 py-4">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-semibold text-slate-700 mb-1.5">Request details</p>
                              <dl className="space-y-1 text-slate-600">
                                <div className="flex gap-2"><dt className="text-slate-400 w-24 flex-shrink-0">Property</dt><dd>{r.propertyName}</dd></div>
                                {r.propertyAddress && <div className="flex gap-2"><dt className="text-slate-400 w-24 flex-shrink-0">Address</dt><dd>{r.propertyAddress}{r.propertySuburb ? `, ${r.propertySuburb}` : ""}</dd></div>}
                                <div className="flex gap-2"><dt className="text-slate-400 w-24 flex-shrink-0">Category</dt><dd>{cat?.label ?? r.jobCategory}</dd></div>
                                {r.description && <div className="flex gap-2"><dt className="text-slate-400 w-24 flex-shrink-0">Description</dt><dd>{r.description}</dd></div>}
                                {r.notes && <div className="flex gap-2"><dt className="text-slate-400 w-24 flex-shrink-0">Agent notes</dt><dd>{r.notes}</dd></div>}
                              </dl>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700 mb-1.5">Tenant details</p>
                              <dl className="space-y-1 text-slate-600">
                                {r.tenantName ? <div className="flex gap-2"><dt className="text-slate-400 w-24 flex-shrink-0">Name</dt><dd>{r.tenantName}</dd></div> : null}
                                {r.tenantEmail ? <div className="flex gap-2"><dt className="text-slate-400 w-24 flex-shrink-0">Email</dt><dd>{r.tenantEmail}</dd></div> : null}
                                {r.tenantPhone ? <div className="flex gap-2"><dt className="text-slate-400 w-24 flex-shrink-0">Phone</dt><dd>{r.tenantPhone}</dd></div> : null}
                                {r.unitNumber ? <div className="flex gap-2"><dt className="text-slate-400 w-24 flex-shrink-0">Unit</dt><dd>{r.unitNumber}</dd></div> : null}
                                {!r.tenantName && !r.tenantEmail && !r.tenantPhone && <dd className="text-slate-400 italic">No tenant details provided</dd>}
                              </dl>
                            </div>
                            {r.status === "rejected" && r.rejectionReason && (
                              <div className="col-span-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-red-700">
                                <strong>Rejection reason:</strong> {r.rejectionReason}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Comments panel row */}
                    {commentsOpen && (
                      <tr key={`${r.id}-comments`} className="border-b border-slate-100">
                        <td colSpan={filterStatus === "pending" ? 7 : 6}>
                          <CommentsPanel requestId={r.id} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-8 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">{selected.size} selected</span>
            {bulkRejecting ? (
              <>
                <input
                  type="text"
                  value={bulkRejectReason}
                  onChange={(e) => setBulkRejectReason(e.target.value)}
                  placeholder="Rejection reason (optional)"
                  className="flex-1 min-w-48 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <button onClick={bulkReject} disabled={bulkWorking}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {bulkWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Confirm reject {selected.size}
                </button>
                <button onClick={() => { setBulkRejecting(false); setBulkRejectReason(""); }} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={bulkApprove} disabled={bulkWorking}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors">
                  {bulkWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Approve {selected.size} selected
                </button>
                <button onClick={() => setBulkRejecting(true)} disabled={bulkWorking}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors">
                  <X className="h-4 w-4" /> Reject {selected.size} selected
                </button>
                <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  Clear selection
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {approving && (
        <ApproveModal request={approving} onClose={() => setApproving(null)} onDone={() => { setApproving(null); load(); }} />
      )}
      {rejecting && (
        <RejectModal request={rejecting} onClose={() => setRejecting(null)} onDone={() => { setRejecting(null); load(); }} />
      )}
    </div>
  );
}
