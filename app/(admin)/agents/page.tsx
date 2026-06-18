"use client";

import { useEffect, useState } from "react";
import { Loader2, UserPlus, Pencil, Trash2, Building2, X, Check, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AgentPortalPreview, type AgentForPreview } from "@/components/admin/agent-portal-preview";

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  agencyName: string | null;
  propertyCount: number;
  createdAt: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  suburb: string | null;
  buildingId: string | null;
}

interface AgentDetail extends Agent {
  assignedProperties: Property[];
}

const EMPTY_FORM = { name: "", email: "", phone: "", agencyName: "", password: "" };

function AgentFormModal({
  onClose,
  onDone,
  editing,
}: {
  onClose: () => void;
  onDone: () => void;
  editing: AgentDetail | null;
}) {
  const [form, setForm] = useState(
    editing
      ? { name: editing.name, email: editing.email, phone: editing.phone ?? "", agencyName: editing.agencyName ?? "", password: "" }
      : EMPTY_FORM
  );
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(editing?.assignedProperties.map((p) => p.id) ?? [])
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [propSearch, setPropSearch] = useState("");

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((data) => setAllProperties(Array.isArray(data) ? data : []));
  }, []);

  function toggleProp(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const url = editing ? `/api/admin/agents/${editing.id}` : "/api/admin/agents";
      const method = editing ? "PUT" : "POST";
      const body: Record<string, unknown> = { ...form, propertyIds: Array.from(selectedIds) };
      if (!form.password) delete body.password;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onDone();
      } else {
        let msg = "Failed to save";
        try { const d = await res.json(); msg = d.error ?? msg; } catch {}
        setError(msg);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredProps = allProperties.filter(
    (p) =>
      p.name.toLowerCase().includes(propSearch.toLowerCase()) ||
      p.address.toLowerCase().includes(propSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <h2 className="font-semibold text-slate-900">{editing ? "Edit Agent" : "Add Agent"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Full name *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="mt-1" placeholder="Jane Smith" />
              </div>
              <div className="col-span-2">
                <Label>Email address *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required className="mt-1" placeholder="agent@agency.com.au" />
              </div>
              <div>
                <Label>Agency / company</Label>
                <Input value={form.agencyName} onChange={(e) => setForm((f) => ({ ...f, agencyName: e.target.value }))} className="mt-1" placeholder="Ray White, etc." />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1" placeholder="04xx xxx xxx" />
              </div>
              <div className="col-span-2">
                <Label>{editing ? "New password (leave blank to keep)" : "Password *"}</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required={!editing}
                  className="mt-1"
                  placeholder={editing ? "Leave blank to keep current" : "Minimum 8 characters"}
                />
              </div>
            </div>

            {/* Property assignments */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-900">Assigned properties</p>
                <span className="text-xs text-slate-500">{selectedIds.size} selected</span>
              </div>
              <Input
                value={propSearch}
                onChange={(e) => setPropSearch(e.target.value)}
                placeholder="Search properties…"
                className="mb-2"
              />
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {filteredProps.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-slate-400 text-center">No properties found</p>
                ) : filteredProps.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${selectedIds.has(p.id) ? "bg-[#ECFDE8]/50" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleProp(p.id)}
                      className="accent-blue-600"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500 truncate">{p.address}{p.suburb ? `, ${p.suburb}` : ""}</p>
                    </div>
                    {selectedIds.has(p.id) && <Check className="h-4 w-4 text-[#16A34A] ml-auto flex-shrink-0" />}
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600 rounded-lg bg-red-50 border border-red-200 px-3 py-2">{error}</p>}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0 sticky bottom-0 bg-white">
            <Button type="submit" loading={submitting} className="flex-1">
              {editing ? "Save changes" : "Create agent"}
            </Button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AgentDetail | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<AgentForPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/agents")
      .then((r) => r.json())
      .then((data) => { setAgents(Array.isArray(data) ? data : []); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  async function startEdit(agent: Agent) {
    const res = await fetch(`/api/admin/agents/${agent.id}`);
    const data = await res.json();
    setEditing(data);
  }

  async function openPreview(agent: Agent) {
    setPreviewLoading(agent.id);
    try {
      const res = await fetch(`/api/admin/agents/${agent.id}`);
      const data: AgentForPreview = await res.json();
      setPreviewing(data);
    } finally {
      setPreviewLoading(null);
    }
  }

  async function deleteAgent(id: string) {
    if (!confirm("Delete this agent? They will lose access to the portal.")) return;
    setDeleting(id);
    await fetch(`/api/admin/agents/${id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-cabinet">Agents</h1>
          <p className="text-slate-500 text-sm mt-1">Manage property manager accounts and their property assignments</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4" /> Add agent
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <Building2 className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No agents yet</p>
          <p className="text-slate-400 text-sm mt-1">Add your first agent to give them access to the agent portal.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#16A34A] hover:text-green-700 font-medium">
            <UserPlus className="h-4 w-4" /> Add agent
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Agency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Properties</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {agents.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.email}</p>
                    {a.phone && <p className="text-xs text-slate-400">{a.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.agencyName ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                      <Building2 className="h-3.5 w-3.5" /> {a.propertyCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(a.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openPreview(a)}
                        disabled={previewLoading === a.id}
                        title="View agent portal"
                        className="p-1.5 rounded-lg hover:bg-[#ECFDE8] text-slate-400 hover:text-[#16A34A] transition-colors disabled:opacity-50"
                      >
                        {previewLoading === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => startEdit(a)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteAgent(a.id)}
                        disabled={deleting === a.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        {deleting === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showForm || editing) && (
        <AgentFormModal
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onDone={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}

      {previewing && (
        <AgentPortalPreview agent={previewing} onClose={() => setPreviewing(null)} />
      )}
    </div>
  );
}
