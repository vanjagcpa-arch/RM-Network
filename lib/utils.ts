import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const JOB_CATEGORIES = {
  smoke_alarm: {
    label: "Smoke Alarm Service",
    color: "bg-red-100 text-red-800 border-red-200",
    dotColor: "bg-red-500",
    calColor: "#dc2626",
  },
  test_and_tag: {
    label: "Test & Tag",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    dotColor: "bg-blue-500",
    calColor: "#2563eb",
  },
  electrical: {
    label: "Other Electrical",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    dotColor: "bg-amber-500",
    calColor: "#d97706",
  },
  gas_appliance: {
    label: "Gas Appliance Safety",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    dotColor: "bg-orange-500",
    calColor: "#ea580c",
  },
  maintenance: {
    label: "General Maintenance",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dotColor: "bg-slate-500",
    calColor: "#64748b",
  },
} as const;

export const JOB_STATUSES = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800 border-blue-200" },
  in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-800 border-purple-200" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200" },
} as const;

export type JobCategory = keyof typeof JOB_CATEGORIES;
export type JobStatus = keyof typeof JOB_STATUSES;

export const COMPLIANCE_INTERVALS: Partial<Record<JobCategory, number>> = {
  smoke_alarm: 12,
  test_and_tag: 12,
  gas_appliance: 12,
  electrical: 24,
};

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Not scheduled";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function getWeekdayName(day: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}
