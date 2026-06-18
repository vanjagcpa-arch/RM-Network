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
      { href: "/buildings", label: "Buildings", icon: Building2 },
      { href: "/properties", label: "Units / Properties", icon: Home },
    ],
  },
  {
    label: "TEAM",
    items: [
      { href: "/technicians", label: "Technicians", icon: HardHat },
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
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/40">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-900/40 flex-shrink-0">
          <Wrench className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">RM Scheduler</p>
          <p className="text-xs text-slate-400">Job Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map(({ label, items }) => (
          <div key={label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase select-none">
              {label}
            </p>
            <div className="space-y-0.5">
              {items.map(({ href, label: itemLabel, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0 transition-colors",
                        active ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                      )}
                    />
                    <span className="truncate">{itemLabel}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700/40 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          <LogOut className="h-4 w-4 text-slate-500" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
