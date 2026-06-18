"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

interface Building {
  id: string;
  name: string;
  address: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  notes: string | null;
}

export function BuildingDetailActions({ building }: { building: Building }) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: building.name,
    address: building.address,
    suburb: building.suburb ?? "",
    state: building.state ?? "",
    postcode: building.postcode ?? "",
    notes: building.notes ?? "",
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/buildings/${building.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowEdit(false);
    setSaving(false);
    router.refresh();
  }

  async function handleDelete() {
    await fetch(`/api/buildings/${building.id}`, { method: "DELETE" });
    router.push("/buildings");
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => setShowEdit(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button onClick={() => setShowDelete(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-200 hover:bg-red-500/30 transition-colors">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit building</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 mt-2">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" /></div>
            <div><Label>Address *</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required className="mt-1" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Suburb</Label><Input value={form.suburb} onChange={(e) => setForm({ ...form, suburb: e.target.value })} className="mt-1" /></div>
              <div><Label>Postcode</Label><Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} className="mt-1" /></div>
              <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Notes</Label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                className="mt-1 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Save changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete building?</DialogTitle>
            <DialogDescription>
              This will delete &quot;{building.name}&quot;. Its units will be unlinked but not deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete building</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
