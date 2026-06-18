"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JOB_CATEGORIES } from "@/lib/utils";
import { Plus, Pencil, Trash2, Loader2, Phone, Mail, HardHat, ToggleLeft, ToggleRight, ChevronDown, X as XIcon, CalendarOff } from "lucide-react";

interface Technician {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  specialties: string | null;
  color: string;
  isActive: boolean;
  notes: string | null;
}

interface Blockout {
  id: string;
  blockDate: string;
  reason: string | null;
}

const PRESET_COLORS = [
  "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
];

const emptyForm = {
  name: "", email: "", phone: "", color: "#3b82f6",
  specialties: [] as string[], notes: "",
};

function AvailabilityPanel({ technicianId }: { technicianId: string }) {
  const [blockouts, setBlockouts] = useState<Blockout[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockDate, setBlockDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadBlockouts() {
    setLoading(true);
    const res = await fetch(`/api/admin/technicians/${technicianId}/blockouts`);
    const data = await res.json();
    setBlockouts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadBlockouts(); }, [technicianId]);

  async function addBlockout() {
    if (!blockDate) return;
    setSaving(true);
    const res = await fetch(`/api/admin/technicians/${technicianId}/blockouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockDate, reason: reason || undefined }),
    });
    if (res.ok) {
      setBlockDate("");
      setReason("");
      await loadBlockouts();
    }
    setSaving(false);
  }

  async function removeBlockout(date: string) {
    await fetch(`/api/admin/technicians/${technicianId}/blockouts?date=${date}`, {
      method: "DELETE",
    });
    await loadBlockouts();
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
      <p className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
        <CalendarOff className="h-3.5 w-3.5 text-slate-400" />
        Blocked dates
      </p>

      {/* Add blockout */}
      <div className="flex items-end gap-2 mb-3">
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">Date</label>
          <input
            type="date"
            value={blockDate}
            onChange={(e) => setBlockDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">Reason (optional)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Annual leave"
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          onClick={addBlockout}
          disabled={!blockDate || saving}
          className="flex items-center gap-1 rounded-lg bg-[#9CFF5F] px-3 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#8CFF3F] disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Block date
        </button>
      </div>

      {/* Blockout list */}
      {loading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
        </div>
      ) : blockouts.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No blocked dates — technician is available every day.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {blockouts.map((b) => (
            <span
              key={b.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-100 px-3 py-1 text-sm font-semibold text-red-700"
            >
              {new Date(b.blockDate + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
              {b.reason && <span className="opacity-70">· {b.reason}</span>}
              <button
                onClick={() => removeBlockout(b.blockDate)}
                className="ml-0.5 rounded-full hover:bg-red-200 transition-colors p-0.5"
                aria-label="Remove blockout"
              >
                <XIcon className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [workload, setWorkload] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Technician | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expandedAvail, setExpandedAvail] = useState<string | null>(null);

  async function load() {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [techRes, jobRes] = await Promise.all([
      fetch("/api/technicians").then((r) => r.json()),
      fetch(`/api/jobs?month=${month}`).then((r) => r.json()),
    ]);
    setTechnicians(techRes);
    const counts: Record<string, number> = {};
    for (const j of (jobRes as { technicianId: string | null }[])) {
      if (j.technicianId) counts[j.technicianId] = (counts[j.technicianId] ?? 0) + 1;
    }
    setWorkload(counts);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(t: Technician) {
    setEditing(t);
    setForm({
      name: t.name,
      email: t.email ?? "",
      phone: t.phone ?? "",
      color: t.color,
      specialties: t.specialties ? JSON.parse(t.specialties) : [],
      notes: t.notes ?? "",
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      await fetch(`/api/technicians/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isActive: editing.isActive }),
      });
    } else {
      await fetch("/api/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    setSaving(false);
    await load();
  }

  async function toggleActive(t: Technician) {
    await fetch(`/api/technicians/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...t, specialties: t.specialties ? JSON.parse(t.specialties) : [], isActive: !t.isActive }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this technician?")) return;
    await fetch(`/api/technicians/${id}`, { method: "DELETE" });
    await load();
  }

  function toggleSpecialty(key: string) {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(key)
        ? f.specialties.filter((s) => s !== key)
        : [...f.specialties, key],
    }));
  }

  const active = technicians.filter((t) => t.isActive);
  const inactive = technicians.filter((t) => !t.isActive);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-cabinet">Technicians</h1>
          <p className="text-slate-500 text-sm mt-0.5">{active.length} active · {inactive.length} inactive</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add Technician</Button>
      </div>

      {/* Workload chart */}
      {!loading && technicians.length > 0 && Object.keys(workload).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Workload this month</h2>
          <div className="space-y-2.5">
            {(() => {
              const maxCount = Math.max(...Object.values(workload), 1);
              return technicians.filter((t) => workload[t.id]).sort((a, b) => (workload[b.id] ?? 0) - (workload[a.id] ?? 0)).map((t) => {
                const count = workload[t.id] ?? 0;
                return (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className="w-24 text-xs font-medium text-slate-700 truncate flex-shrink-0">{t.name.split(" ")[0]}</div>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: t.color }} />
                    </div>
                    <div className="w-8 text-right text-xs font-semibold text-slate-600">{count}</div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : technicians.length === 0 ? (
        <div className="text-center py-20">
          <HardHat className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No technicians yet. Add your team members to assign them to jobs.</p>
          <Button onClick={openNew}>Add first technician</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {technicians.map((tech) => {
            const specs: string[] = tech.specialties ? JSON.parse(tech.specialties) : [];
            const availOpen = expandedAvail === tech.id;
            return (
              <div key={tech.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${tech.isActive ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    {/* Avatar with color */}
                    <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm" style={{ backgroundColor: tech.color }}>
                      {tech.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{tech.name}</h3>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tech.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {tech.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {tech.phone && <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" />{tech.phone}</p>}
                        {tech.email && <p className="text-xs text-slate-500 flex items-center gap-1"><Mail className="h-3 w-3" />{tech.email}</p>}
                      </div>
                    </div>
                  </div>

                  {specs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {specs.map((s) => {
                        const cat = JOB_CATEGORIES[s as keyof typeof JOB_CATEGORIES];
                        return cat ? (
                          <span key={s} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cat.color}`}>{cat.label}</span>
                        ) : null;
                      })}
                    </div>
                  )}

                  {tech.notes && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{tech.notes}</p>}

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button onClick={() => openEdit(tech)} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#16A34A] transition-colors">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setExpandedAvail(availOpen ? null : tech.id)}
                      className={`flex items-center gap-1 text-xs transition-colors ${availOpen ? "text-[#16A34A]" : "text-slate-600 hover:text-[#16A34A]"}`}
                    >
                      <CalendarOff className="h-3.5 w-3.5" />
                      Availability
                      <ChevronDown className={`h-3 w-3 transition-transform ${availOpen ? "rotate-180" : ""}`} />
                    </button>
                    <button onClick={() => toggleActive(tech)} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors ml-auto">
                      {tech.isActive ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4" />}
                      {tech.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => handleDelete(tech.id)} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {availOpen && <AvailabilityPanel technicianId={tech.id} />}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit technician" : "Add technician"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div>
              <Label>Full name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. James Smith" required className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="04xx xxx xxx" className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="james@example.com" className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Colour</Label>
              <div className="flex gap-2 mt-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className="h-7 w-7 rounded-full transition-all hover:scale-110"
                    style={{ backgroundColor: c, outline: form.color === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>Specialties</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(JOB_CATEGORIES).map(([key, cat]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSpecialty(key)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border font-medium transition-all ${form.specialties.includes(key) ? cat.color : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any notes about this technician…"
                className="mt-1 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>{editing ? "Save changes" : "Add technician"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
