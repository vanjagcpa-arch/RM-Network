"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, ClipboardList, Send, Clock, CheckCircle2, XCircle, MessageCircle } from "lucide-react";
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

interface Comment {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  pending: { label: "Awaiting review", color: "bg-amber-100 text-amber-700" },
  sent: { label: "Booking link sent", color: "bg-blue-100 text-blue-700" },
  booked: { label: "Booked by tenant", color: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Not approved", color: "bg-red-100 text-red-700" },
};

const ALL_STATUSES = [
  { value: "", label: "All requests" },
  { value: "pending", label: "Awaiting review", icon: Clock },
  { value: "sent", label: "Booking link sent", icon: Send },
  { value: "booked", label: "Booked", icon: CheckCircle2 },
  { value: "rejected", label: "Not approved", icon: XCircle },
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

  const roleColor: Record<string, string> = {
    admin: "bg-blue-100 text-blue-700",
    agent: "bg-emerald-100 text-emerald-700",
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
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${roleColor[c.authorRole] ?? "bg-slate-100 text-slate-600"}`}>
                    {c.authorRole}
                  </span>
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
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
        <button
          onClick={sendComment}
          disabled={!content.trim() || sending}
          className="self-end flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
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
  const [expandedComments, setExpandedComments] = useState<string | null>(null);

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
              const commentsOpen = expandedComments === r.id;

              return (
                <div key={r.id}>
                  <div className="px-5 py-4">
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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${s.color}`}>
                          {s.label}
                        </span>
                        <button
                          onClick={() => setExpandedComments(commentsOpen ? null : r.id)}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors ${commentsOpen ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}
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
