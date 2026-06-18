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
  ChevronRight,
  HardHat,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/jobs", label: "Jobs", icon: ClipboardList },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/technicians", label: "Technicians", icon: HardHat },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/links", label: "Booking Links", icon: Link2 },
  { href: "/settings", label: "Settings", icon: Settings },
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
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-lg">
          <Wrench className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight">RM Scheduler</p>
          <p className="text-xs text-slate-400">Job Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                active
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
              {label}
              {active && <ChevronRight className="ml-auto h-3 w-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700/50 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          <LogOut className="h-4 w-4 text-slate-500" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
