"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Calendar,
  Link2,
  Settings,
  LogOut,
  Wrench,
  HardHat,
  ShieldCheck,
  LayoutTemplate,
  Home,
  Users,
  Inbox,
} from "lucide-react";

const navSections = [
  {
    label: "OVERVIEW",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { href: "/jobs", label: "Jobs", icon: ClipboardList },
      { href: "/maintenance-requests", label: "Maintenance Requests", icon: Inbox },
      { href: "/buildings", label: "Buildings", icon: Building2 },
      { href: "/properties", label: "Units / Properties", icon: Home },
    ],
  },
  {
    label: "TEAM",
    items: [
      { href: "/technicians", label: "Technicians", icon: HardHat },
      { href: "/agents", label: "Agents", icon: Users },
      { href: "/templates", label: "Templates", icon: LayoutTemplate },
      { href: "/compliance", label: "Compliance", icon: ShieldCheck },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { href: "/links", label: "Booking Links", icon: Link2 },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-60 flex-col bg-white border-r border-slate-200">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm flex-shrink-0">
          <Wrench className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-slate-900">RM Scheduler</p>
          <p className="text-[10px] text-slate-400 leading-none mt-0.5">Job Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navSections.map(({ label, items }) => (
          <div key={label}>
            <p className="px-3 mb-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase select-none">
              {label}
            </p>
            <div className="space-y-px">
              {items.map(({ href, label: itemLabel, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all group",
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                    <span className="truncate">{itemLabel}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
