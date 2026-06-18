"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JOB_CATEGORIES, JOB_CATEGORY_CHIP_COLOR } from "@/lib/utils";
import { Chip } from "@/components/ui/chip";
import { Link2, Plus, Copy, Check, ExternalLink, Trash2, Loader2, Building2, ToggleLeft, ToggleRight } from "lucide-react";

interface BookingLink {
  id: string;
  token: string;
  propertyId: string;
  jobCategory: string | null;
  label: string | null;
  isActive: boolean;
  maxBookings: number | null;
  currentBookings: number;
  allowedWeekdays: string | null;
  expiresAt: string | null;
}

interface Property {
  id: string;
  name: string;
  suburb: string | null;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function LinksContent() {
  const searchParams = useSearchParams();
  const defaultPropertyId = searchParams.get("propertyId") ?? "";

  const [links, setLinks] = useState<BookingLink[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({
    propertyId: defaultPropertyId,
    jobCategory: "",
    label: "",
    maxBookings: "",
    allowedWeekdays: [] as number[],
  });

  async function load() {
    const [l, p] = await Promise.all([fetch("/api/booking-links").then((r) => r.json()), fetch("/api/properties").then((r) => r.json())]);
    setLinks(l);
    setProperties(p);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/booking-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        maxBookings: form.maxBookings ? parseInt(form.maxBookings) : 0,
        allowedWeekdays: form.allowedWeekdays.length > 0 ? form.allowedWeekdays : null,
      }),
    });
    setShowNew(false);
    setSaving(false);
    setForm({ propertyId: "", jobCategory: "", label: "", maxBookings: "", allowedWeekdays: [] });
    await load();
  }

  async function toggleActive(link: BookingLink) {
    await fetch(`/api/booking-links/${link.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !link.isActive }),
    });
    await load();
  }

  async function deleteLink(id: string) {
    await fetch(`/api/booking-links/${id}`, { method: "DELETE" });
    await load();
  }

  function copyUrl(token: string) {
    const url = `${window.location.origin}/book/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  function toggleWeekday(day: number) {
    setForm((f) => ({
      ...f,
      allowedWeekdays: f.allowedWeekdays.includes(day) ? f.allowedWeekdays.filter((d) => d !== day) : [...f.allowedWeekdays, day],
    }));
  }

  const propMap = new Map(properties.map((p) => [p.id, p]));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-cabinet">Booking Links</h1>
          <p className="text-slate-500 text-sm mt-0.5">Generate unique links for tenants to book jobs</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" /> New Link
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : links.length === 0 ? (
        <div className="text-center py-20">
          <Link2 className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No booking links yet. Create one to share with tenants.</p>
          <Button onClick={() => setShowNew(true)}>Create booking link</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => {
            const prop = propMap.get(link.propertyId);
            const cat = link.jobCategory ? JOB_CATEGORIES[link.jobCategory as keyof typeof JOB_CATEGORIES] : null;
            const bookingUrl = typeof window !== "undefined" ? `${window.location.origin}/book/${link.token}` : `/book/${link.token}`;

            return (
              <div key={link.id} className={`bg-white rounded-xl border shadow-sm p-5 ${link.isActive ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${link.isActive ? "bg-green-500" : "bg-slate-300"}`} />
                      <h3 className="font-semibold text-slate-900">{link.label || "Booking link"}</h3>
                      {cat && <Chip label={cat.label} color={JOB_CATEGORY_CHIP_COLOR[link.jobCategory ?? ""] ?? "slate"} />}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                      {prop && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{prop.name}</span>}
                      {link.maxBookings ? <span>{link.currentBookings}/{link.maxBookings} bookings</span> : <span>{link.currentBookings} bookings</span>}
                      {link.allowedWeekdays && (
                        <span>Days: {JSON.parse(link.allowedWeekdays).map((d: number) => WEEKDAYS[d]).join(", ")}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-slate-100 rounded px-2 py-1 text-slate-600 font-mono truncate max-w-xs">{bookingUrl}</code>
                      <button onClick={() => copyUrl(link.token)} className="p-1.5 rounded hover:bg-slate-100 transition-colors flex-shrink-0" title="Copy link">
                        {copied === link.token ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                      </button>
                      <a href={`/book/${link.token}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-slate-100 transition-colors flex-shrink-0" title="Open booking page">
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(link)} title={link.isActive ? "Deactivate" : "Activate"} className="p-1.5 rounded hover:bg-slate-100 transition-colors">
                      {link.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-slate-400" />}
                    </button>
                    <button onClick={() => deleteLink(link.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New link dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create booking link</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div>
              <Label>Property *</Label>
              <select required value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select property…</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Job type (optional)</Label>
              <select value={form.jobCategory} onChange={(e) => setForm({ ...form, jobCategory: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Tenant can choose…</option>
                {Object.entries(JOB_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Link label</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Smoke alarm inspection 2025" className="mt-1" />
            </div>
            <div>
              <Label>Max bookings (0 = unlimited)</Label>
              <Input type="number" min="0" value={form.maxBookings} onChange={(e) => setForm({ ...form, maxBookings: e.target.value })} placeholder="0" className="mt-1 w-32" />
            </div>
            <div>
              <Label>Restrict to days of week</Label>
              <p className="text-xs text-slate-500 mt-0.5 mb-2">Leave all unselected to allow any day</p>
              <div className="flex gap-2">
                {WEEKDAYS.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekday(i)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${form.allowedWeekdays.includes(i) ? "bg-[#9CFF5F] text-[#0F172A]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Create link</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LinksPage() {
  return <Suspense><LinksContent /></Suspense>;
}
