"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, ClipboardList, LogOut, Wrench } from "lucide-react";

const navItems = [
  { href: "/agent", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/agent/properties", label: "My Properties", icon: Building2 },
  { href: "/agent/requests", label: "Maintenance Requests", icon: ClipboardList },
];

export function AgentSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/40">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-900/40 flex-shrink-0">
          <Wrench className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">Agent Portal</p>
          <p className="text-xs text-slate-400">Maintenance Requests</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                active
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", active ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

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
