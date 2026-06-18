"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, ClipboardList, Send, Clock, CheckCircle2, XCircle, MessageCircle, Search, X } from "lucide-react";
import { JOB_CATEGORIES, REQUEST_STATUS_CHIP } from "@/lib/utils";
import { Chip, FilterChip } from "@/components/ui/chip";

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

interface Comment {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

const ALL_STATUSES = [
  { value: "", label: "All requests" },
  { value: "pending", label: "Awaiting review" },
  { value: "sent", label: "Booking link sent" },
  { value: "booked", label: "Booked by tenant" },
  { value: "rejected", label: "Not approved" },
];

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
    const res = await fetch(`/api/agent/requests/${requestId}/comments`);
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
    const res = await fetch(`/api/agent/requests/${requestId}/comments`, {
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
    <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
      <p className="text-xs font-semibold text-slate-700 mb-3">Internal comments</p>

      {loading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-slate-400 italic mb-3">No comments yet.</p>
      ) : (
        <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
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

      {/* Input */}
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

export default function AgentRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expandedComments, setExpandedComments] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agent/requests")
      .then((r) => r.json())
      .then((data) => { setRequests(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const filtered = requests.filter((r) => {
    if (filter && r.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.propertyName?.toLowerCase() ?? "").includes(q) ||
        (r.tenantName?.toLowerCase() ?? "").includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 font-cabinet">Maintenance Requests</h1>
        <p className="text-slate-500 text-sm mt-1">All requests you have submitted across your properties</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <FilterChip
          label="All requests"
          color="slate"
          selected={filter === ""}
          count={requests.length}
          onClick={() => setFilter("")}
        />
        {(["pending", "sent", "booked", "rejected"] as const).map((val) => {
          const chip = REQUEST_STATUS_CHIP[val];
          return (
            <FilterChip
              key={val}
              label={chip.label}
              color={chip.color}
              selected={filter === val}
              count={requests.filter((r) => r.status === val).length}
              onClick={() => setFilter(val)}
            />
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search requests…"
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <ClipboardList className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No requests found</p>
          <Link href="/agent/properties" className="mt-2 inline-block text-sm text-[#16A34A] hover:underline">
            Submit a request from a property
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filtered.map((r) => {
              const s = REQUEST_STATUS_CHIP[r.status] ?? REQUEST_STATUS_CHIP.pending;
              const cat = JOB_CATEGORIES[r.jobCategory as keyof typeof JOB_CATEGORIES];
              const commentsOpen = expandedComments === r.id;

              return (
                <div key={r.id}>
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                        </div>
                        <Link href={`/agent/properties/${r.propertyId}`} className="text-xs text-[#16A34A] hover:text-[#16A34A] font-medium">
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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Chip label={s.label} color={s.color} />
                        <button
                          onClick={() => setExpandedComments(commentsOpen ? null : r.id)}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors ${commentsOpen ? "bg-[#ECFDE8] border-[#CFF8C8] text-[#16A34A]" : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}
                          title="Comments"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {commentsOpen && <CommentsPanel requestId={r.id} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
