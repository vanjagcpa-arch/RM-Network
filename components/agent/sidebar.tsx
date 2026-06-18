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

export function AgentSidebar({ agencyName }: { agencyName?: string }) {
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
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 shadow-sm flex-shrink-0">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-cabinet text-slate-900 leading-none">RM Network</p>
            {agencyName && (
              <p className="text-[11px] text-slate-400 leading-none mt-1.5 pl-3">+ {agencyName}</p>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-px">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all group",
                active
                  ? "bg-[#ECFDE8] text-[#16A34A]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", active ? "text-[#16A34A]" : "text-slate-400 group-hover:text-slate-600")} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

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
