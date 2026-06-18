"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Building2, Plus, Search, MapPin, Phone, Mail, ChevronRight, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Suspense } from "react";

interface Property {
  id: string;
  name: string;
  address: string;
  suburb: string | null;
  postcode: string | null;
  state: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
}

function PropertiesPageInner() {
  const searchParams = useSearchParams();
  const defaultBuildingId = searchParams.get("buildingId") ?? "";
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(!!defaultBuildingId);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", suburb: "", postcode: "", state: "VIC", contactName: "", contactEmail: "", contactPhone: "", notes: "", buildingId: defaultBuildingId });

  async function loadProperties() {
    const res = await fetch("/api/properties");
    const data = await res.json();
    setProperties(data);
    setLoading(false);
  }

  useEffect(() => { loadProperties(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowNew(false);
    setForm({ name: "", address: "", suburb: "", postcode: "", state: "VIC", contactName: "", contactEmail: "", contactPhone: "", notes: "", buildingId: defaultBuildingId });
    await loadProperties();
    setSaving(false);
  }

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || (p.suburb?.toLowerCase() ?? "").includes(q);
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-500 text-sm mt-0.5">{properties.length} managed properties</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" /> Add Property
        </Button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search properties…"
          className="w-full max-w-sm pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No properties found</p>
          {!search && <Button className="mt-4" onClick={() => setShowNew(true)}>Add your first property</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((property) => (
            <Link key={property.id} href={`/properties/${property.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-violet-200 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 leading-tight">{property.name}</h3>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-violet-500 transition-colors flex-shrink-0" />
              </div>
              <div className="space-y-1.5 text-sm text-slate-500">
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                  <span>{[property.address, property.suburb, property.state].filter(Boolean).join(", ")}</span>
                </div>
                {property.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span>{property.contactPhone}</span>
                  </div>
                )}
                {property.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{property.contactEmail}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-violet-600 font-medium group-hover:underline">View jobs & booking links →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add unit / property dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add new property</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 gap-4">
              {defaultBuildingId && (
                <p className="text-xs text-violet-600 bg-violet-50 rounded-lg px-3 py-2">
                  This unit will be linked to its building automatically.
                </p>
              )}
              <div>
                <Label htmlFor="p-name">Unit name *</Label>
                <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Unit 12B" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="p-address">Street address *</Label>
                <Input id="p-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main Street" required className="mt-1" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Label>Suburb</Label>
                  <Input value={form.suburb} onChange={(e) => setForm({ ...form, suburb: e.target.value })} placeholder="Suburb" className="mt-1" />
                </div>
                <div>
                  <Label>Postcode</Label>
                  <Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} placeholder="3000" className="mt-1" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="VIC" className="mt-1" />
                </div>
              </div>
              <hr className="border-slate-100" />
              <div>
                <Label>Contact name</Label>
                <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Property manager name" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Contact email</Label>
                  <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="email@example.com" className="mt-1" />
                </div>
                <div>
                  <Label>Contact phone</Label>
                  <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="04xx xxx xxx" className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Access instructions, special requirements…" rows={3}
                  className="mt-1 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Create property</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense>
      <PropertiesPageInner />
    </Suspense>
  );
}
