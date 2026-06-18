"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileSpreadsheet, Info, Database, Key } from "lucide-react";
import { JOB_CATEGORIES } from "@/lib/utils";

export default function SettingsPage() {
  const [exportStatus, setExportStatus] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  function buildExportUrl(format: "xlsx" | "csv") {
    const params = new URLSearchParams({ format });
    if (filterStatus) params.set("status", filterStatus);
    if (filterCategory) params.set("category", filterCategory);
    return `/api/export/ascora?${params}`;
  }

  function handleExport(format: "xlsx" | "csv") {
    setExportStatus(`Downloading ${format.toUpperCase()}…`);
    window.open(buildExportUrl(format), "_blank");
    setTimeout(() => setExportStatus(""), 2000);
  }

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-cabinet">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Configure integrations and app settings</p>
      </div>

      {/* Ascora integration */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
          <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
            <FileSpreadsheet className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Ascora Integration</h2>
            <p className="text-sm text-slate-500">Export jobs for import into Ascora job management software</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-[#ECFDE8] border border-[#CFF8C8] p-4">
            <Info className="h-4 w-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#166534]">
              <p className="font-medium">How to import into Ascora</p>
              <ol className="mt-1 space-y-1 list-decimal list-inside text-[#166534]">
                <li>Export jobs below as Excel or CSV</li>
                <li>Open Ascora → Jobs → Import</li>
                <li>Upload the downloaded file</li>
                <li>Map fields and confirm import</li>
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Filter by status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Filter by job type</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">All job types</option>
                {Object.entries(JOB_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => handleExport("xlsx")}>
              <Download className="h-4 w-4" /> Export Excel (.xlsx)
            </Button>
            <Button variant="outline" onClick={() => handleExport("csv")}>
              <FileSpreadsheet className="h-4 w-4" /> Export CSV (Ascora)
            </Button>
            {exportStatus && <span className="text-sm text-green-600 font-medium">{exportStatus}</span>}
          </div>
        </div>

        {/* API placeholder */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Key className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Ascora API Integration</h3>
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Coming soon</span>
          </div>
          <p className="text-sm text-slate-500 mb-3">Direct API integration will automatically sync jobs to Ascora when configured.</p>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Ascora API Key</label>
            <div className="flex gap-2">
              <input type="password" placeholder="Paste your Ascora API key here" disabled
                className="flex h-9 w-full max-w-sm rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-sm cursor-not-allowed opacity-60" />
              <Button disabled variant="outline">Save</Button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">API integration will be enabled in a future update. Use CSV export for now.</p>
          </div>
        </div>
      </div>

      {/* Database info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center">
            <Database className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Database Setup</h2>
            <p className="text-sm text-slate-500">Neon Serverless PostgreSQL</p>
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 font-mono text-xs text-slate-700 space-y-1">
          <p><span className="text-slate-400">DATABASE_URL</span>=postgresql://…</p>
          <p><span className="text-slate-400">SESSION_SECRET</span>=your-32-char-secret</p>
          <p><span className="text-slate-400">SETUP_KEY</span>=your-setup-key</p>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Set these in your <code className="bg-slate-100 px-1 rounded">.env.local</code> file or Vercel environment variables.
          Run <code className="bg-slate-100 px-1 rounded">npx drizzle-kit push</code> to create database tables.
        </p>
      </div>

      {/* First admin user */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-2">First-time Setup</h2>
        <p className="text-sm text-slate-500 mb-4">
          To create the first admin user, POST to <code className="bg-slate-100 px-1 rounded">/api/auth/setup</code> with your <code className="bg-slate-100 px-1 rounded">SETUP_KEY</code>.
        </p>
        <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-green-400 overflow-x-auto">
          <p>curl -X POST {typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"}/api/auth/setup \</p>
          <p className="pl-4">-H &quot;Content-Type: application/json&quot; \</p>
          <p className="pl-4">-d &apos;&#123;&quot;name&quot;:&quot;Your Name&quot;,&quot;email&quot;:&quot;you@example.com&quot;,&quot;password&quot;:&quot;secure-password&quot;,&quot;setupKey&quot;:&quot;YOUR_SETUP_KEY&quot;&#125;&apos;</p>
        </div>
      </div>
    </div>
  );
}
