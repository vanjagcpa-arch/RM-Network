"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2, Plus, Search, MapPin, Loader2, ChevronRight,
  AlertCircle, Calendar, Home, Pencil, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface BuildingWithStats {
  id: string;
  name: string;
  address: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  notes: string | null;
  unitCount: number;
  total: number;
  overdue: number;
  upcoming: number;
}

const emptyForm = { name: "", address: "", suburb: "", state: "VIC", postcode: "", notes: "" };

function HealthDot({ overdue, upcoming, total }: { overdue: number; upcoming: number; total: number }) {
  if (overdue > 0) return <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 flex-shrink-0" />;
  if (total > 0) return <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 flex-shrink-0" />;
  if (upcoming > 0) return <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0" />;
  return <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-400 flex-shrink-0" />;
}

export default function BuildingsPage() {
  const [buildingsList, setBuildingsList] = useState<BuildingWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BuildingWithStats | null>(null);
  const [showDelete, setShowDelete] = useState<BuildingWithStats | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const data = await fetch("/api/buildings").then((r) => r.json());
    setBuildingsList(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(b: BuildingWithStats) {
    setEditing(b);
    setForm({ name: b.name, address: b.address, suburb: b.suburb ?? "", state: b.state ?? "VIC", postcode: b.postcode ?? "", notes: b.notes ?? "" });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      await fetch(`/api/buildings/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/buildings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setShowForm(false);
    setSaving(false);
    await load();
  }

  async function handleDelete() {
    if (!showDelete) return;
    await fetch(`/api/buildings/${showDelete.id}`, { method: "DELETE" });
    setShowDelete(null);
    await load();
  }

  const filtered = buildingsList.filter((b) => {
    const q = search.toLowerCase();
    return !q || b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q) || (b.suburb?.toLowerCase() ?? "").includes(q);
  });

  const totalUnits = buildingsList.reduce((s, b) => s + b.unitCount, 0);
  const totalOverdue = buildingsList.reduce((s, b) => s + b.overdue, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-cabinet">Buildings</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {buildingsList.length} building{buildingsList.length !== 1 ? "s" : ""} · {totalUnits} units
            {totalOverdue > 0 && <span className="ml-1.5 text-red-500 font-medium">· {totalOverdue} overdue</span>}
          </p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add Building</Button>
      </div>

      {/* Summary cards */}
      {!loading && buildingsList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Buildings", value: buildingsList.length, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Total Units", value: totalUnits, icon: Home, color: "text-slate-600", bg: "bg-slate-50" },
            { label: "Upcoming Jobs", value: buildingsList.reduce((s, b) => s + b.upcoming, 0), icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Overdue", value: totalOverdue, icon: AlertCircle, color: totalOverdue > 0 ? "text-red-600" : "text-slate-400", bg: totalOverdue > 0 ? "bg-red-50" : "bg-slate-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg} mb-2`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search buildings…"
          className="w-full max-w-sm pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">{search ? "No buildings match your search" : "No buildings yet"}</p>
          {!search && <Button onClick={openNew}>Add your first building</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <div key={b.id} className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all group ${b.overdue > 0 ? "border-red-200" : "border-slate-200"}`}>
              <Link href={`/buildings/${b.id}`} className="block p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${b.overdue > 0 ? "bg-red-50" : "bg-blue-50"}`}>
                      <Building2 className={`h-4 w-4 ${b.overdue > 0 ? "text-red-500" : "text-blue-600"}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 leading-tight truncate">{b.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{[b.suburb, b.state].filter(Boolean).join(", ") || b.address}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  {[
                    { label: "Units", value: b.unitCount },
                    { label: "Active", value: b.total },
                    { label: "Upcoming", value: b.upcoming },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-lg py-1.5">
                      <p className="text-base font-bold text-slate-900">{value}</p>
                      <p className="text-[10px] text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <HealthDot overdue={b.overdue} upcoming={b.upcoming} total={b.total} />
                  {b.overdue > 0 ? (
                    <span className="text-xs font-medium text-red-600">{b.overdue} overdue job{b.overdue !== 1 ? "s" : ""}</span>
                  ) : b.upcoming > 0 ? (
                    <span className="text-xs text-slate-500">{b.upcoming} upcoming</span>
                  ) : b.total > 0 ? (
                    <span className="text-xs text-slate-500">{b.total} pending</span>
                  ) : (
                    <span className="text-xs text-slate-400">All clear</span>
                  )}
                </div>
              </Link>

              <div className="flex items-center gap-1 px-5 py-2.5 border-t border-slate-100">
                <button onClick={(e) => { e.preventDefault(); openEdit(b); }}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors py-0.5 px-1.5 rounded hover:bg-slate-50">
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button onClick={(e) => { e.preventDefault(); setShowDelete(b); }}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors py-0.5 px-1.5 rounded hover:bg-slate-50">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit building dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit building" : "Add building"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div>
              <Label>Building name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Richmond Gardens" required className="mt-1" />
            </div>
            <div>
              <Label>Street address *</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="145 Church Street" required className="mt-1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Label>Suburb</Label>
                <Input value={form.suburb} onChange={(e) => setForm({ ...form, suburb: e.target.value })} placeholder="Richmond" className="mt-1" />
              </div>
              <div>
                <Label>Postcode</Label>
                <Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} placeholder="3121" className="mt-1" />
              </div>
              <div>
                <Label>State</Label>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="VIC" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                placeholder="Access instructions, strata details…"
                className="mt-1 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>{editing ? "Save changes" : "Add building"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete building?</DialogTitle>
            <DialogDescription>
              This will delete &quot;{showDelete?.name}&quot;. Units (properties) linked to it will become unlinked — their jobs and data are kept.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete building</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
