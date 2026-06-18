"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JOB_CATEGORIES, JOB_CATEGORY_CHIP_COLOR } from "@/lib/utils";
import { Chip } from "@/components/ui/chip";
import { Plus, Pencil, Trash2, Loader2, LayoutTemplate, RefreshCw, Clock } from "lucide-react";

interface Template {
  id: string;
  name: string;
  jobCategory: string;
  titleTemplate: string;
  description: string | null;
  recurringIntervalMonths: number | null;
  estimatedMinutes: number | null;
  notes: string | null;
}

const emptyForm = {
  name: "", jobCategory: "", titleTemplate: "", description: "",
  recurringIntervalMonths: 0, estimatedMinutes: 0, notes: "",
};

const DURATION_OPTIONS = [
  { value: 0, label: "Not specified" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const res = await fetch("/api/templates");
    setTemplates(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(t: Template) {
    setEditing(t);
    setForm({
      name: t.name,
      jobCategory: t.jobCategory,
      titleTemplate: t.titleTemplate,
      description: t.description ?? "",
      recurringIntervalMonths: t.recurringIntervalMonths ?? 0,
      estimatedMinutes: t.estimatedMinutes ?? 0,
      notes: t.notes ?? "",
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      await fetch(`/api/templates/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    setSaving(false);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-cabinet">Job Templates</h1>
          <p className="text-slate-500 text-sm mt-0.5">Reusable job presets to speed up job creation</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New template</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20">
          <LayoutTemplate className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 mb-1">No templates yet.</p>
          <p className="text-sm text-slate-400 mb-4">Create templates for your most common job types so you can fill in a new job with one click.</p>
          <Button onClick={openNew}>Create first template</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t) => {
            const cat = JOB_CATEGORIES[t.jobCategory as keyof typeof JOB_CATEGORIES];
            return (
              <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{t.name}</h3>
                    {cat && <Chip label={cat.label} color={JOB_CATEGORY_CHIP_COLOR[t.jobCategory] ?? "slate"} className="mt-1" />}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-2 font-mono truncate">"{t.titleTemplate}"</p>
                {t.description && <p className="text-xs text-slate-400 line-clamp-2 mb-3">{t.description}</p>}
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {t.recurringIntervalMonths ? (
                    <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" />Every {t.recurringIntervalMonths}mo</span>
                  ) : null}
                  {t.estimatedMinutes ? (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.estimatedMinutes < 60 ? `${t.estimatedMinutes}min` : `${t.estimatedMinutes / 60}h`}</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100">
                  <button onClick={() => openEdit(t)} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#16A34A] transition-colors">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors ml-auto">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit template" : "New template"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div>
              <Label>Template name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Annual Smoke Alarm Check" required className="mt-1" />
            </div>
            <div>
              <Label>Job type *</Label>
              <select required value={form.jobCategory} onChange={(e) => setForm({ ...form, jobCategory: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select…</option>
                {Object.entries(JOB_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Title template *</Label>
              <Input value={form.titleTemplate} onChange={(e) => setForm({ ...form, titleTemplate: e.target.value })}
                placeholder="e.g. Smoke Alarm Service — {property}" required className="mt-1" />
              <p className="text-xs text-slate-400 mt-1">Use <code className="bg-slate-100 px-1 rounded">{"{property}"}</code> to insert the property name automatically.</p>
            </div>
            <div>
              <Label>Description</Label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                className="mt-1 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Recurring every</Label>
                <select value={form.recurringIntervalMonths} onChange={(e) => setForm({ ...form, recurringIntervalMonths: Number(e.target.value) })}
                  className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value={0}>Not recurring</option>
                  <option value={1}>1 month</option>
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                </select>
              </div>
              <div>
                <Label>Est. duration</Label>
                <select value={form.estimatedMinutes} onChange={(e) => setForm({ ...form, estimatedMinutes: Number(e.target.value) })}
                  className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                className="mt-1 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>{editing ? "Save changes" : "Create template"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
