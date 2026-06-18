import * as XLSX from "xlsx";
import { JOB_CATEGORIES, formatDate, formatTime } from "./utils";

interface ExportJob {
  id: string;
  title: string;
  jobCategory: string;
  status: string;
  scheduledDate: string | null;
  scheduledTimeStart: string | null;
  scheduledTimeEnd: string | null;
  unitNumber: string | null;
  tenantName: string | null;
  tenantEmail: string | null;
  tenantPhone: string | null;
  notes: string | null;
  ascoraJobId: string | null;
  property: {
    name: string;
    address: string;
    suburb: string | null;
    postcode: string | null;
    state: string | null;
    contactName: string | null;
    contactPhone: string | null;
  };
}

export function buildAscoraRows(jobs: ExportJob[]) {
  return jobs.map((job) => {
    const cat = JOB_CATEGORIES[job.jobCategory as keyof typeof JOB_CATEGORIES];
    const address = [
      job.unitNumber ? `Unit ${job.unitNumber},` : "",
      job.property.address,
      job.property.suburb,
      job.property.state,
      job.property.postcode,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      "Job Number": job.ascoraJobId ?? "",
      "Job Type": cat?.label ?? job.jobCategory,
      Status: job.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      "Client / Property": job.property.name,
      "Site Address": address,
      "Scheduled Date": formatDate(job.scheduledDate),
      "Start Time": formatTime(job.scheduledTimeStart),
      "End Time": formatTime(job.scheduledTimeEnd),
      "Tenant Name": job.tenantName ?? job.property.contactName ?? "",
      "Tenant Phone": job.tenantPhone ?? "",
      "Tenant Email": job.tenantEmail ?? "",
      "Job Title / Description": job.title,
      Notes: job.notes ?? "",
      "RM Scheduler ID": job.id,
    };
  });
}

export function exportToExcel(jobs: ExportJob[], filename = "rm-scheduler-jobs.xlsx"): Buffer {
  const rows = buildAscoraRows(jobs);
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)),
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jobs");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function exportToCsv(jobs: ExportJob[]): string {
  const rows = buildAscoraRows(jobs);
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(escape).join(","), ...rows.map((r) => headers.map((h) => escape(r[h as keyof typeof r])).join(","))].join("\n");
}
