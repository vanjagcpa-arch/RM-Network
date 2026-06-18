"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BREADCRUMB_MAP: Record<string, { section: string; page?: string }> = {
  "/dashboard":              { section: "Dashboard" },
  "/calendar":               { section: "Calendar" },
  "/jobs":                   { section: "Jobs" },
  "/jobs/new":               { section: "Jobs", page: "New Job" },
  "/buildings":              { section: "Buildings" },
  "/properties":             { section: "Properties" },
  "/technicians":            { section: "Technicians" },
  "/agents":                 { section: "Agents" },
  "/templates":              { section: "Templates" },
  "/compliance":             { section: "Compliance" },
  "/links":                  { section: "Booking Links" },
  "/settings":               { section: "Settings" },
  "/maintenance-requests":   { section: "Maintenance Requests" },
  "/agent":                  { section: "Dashboard" },
  "/agent/properties":       { section: "Properties" },
  "/agent/requests":         { section: "Maintenance Requests" },
};

function getBreadcrumb(pathname: string) {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];
  // Sub-page fallback: /jobs/[id] → Jobs > Job Detail
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const parent = "/" + segments[0];
    const parentLabel = BREADCRUMB_MAP[parent]?.section;
    if (parentLabel) return { section: parentLabel, page: "Detail" };
  }
  return { section: "RM Scheduler" };
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface TopBarProps {
  userName: string;
  userRole?: string;
  accent?: "violet" | "emerald";
}

export function TopBar({ userName, userRole = "admin", accent = "violet" }: TopBarProps) {
  const pathname = usePathname();
  const { section, page } = getBreadcrumb(pathname);

  const avatarBg = accent === "emerald" ? "bg-emerald-600" : "bg-violet-600";
  const roleBg = accent === "emerald"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-violet-50 text-violet-700 border-violet-200";
  const roleLabel = userRole === "agent" ? "Agent" : "Admin";

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm">
        <span className={cn("font-medium", page ? "text-slate-400" : "text-slate-900")}>
          {section}
        </span>
        {page && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="font-semibold text-slate-900">{page}</span>
          </>
        )}
      </nav>

      {/* User */}
      <div className="flex items-center gap-2.5">
        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold", roleBg)}>
          {roleLabel}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 hidden sm:block">{userName}</span>
          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0", avatarBg)}>
            {getInitials(userName)}
          </div>
        </div>
      </div>
    </header>
  );
}
