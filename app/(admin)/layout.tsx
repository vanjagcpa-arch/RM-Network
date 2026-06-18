import { requireAdminSession } from "@/lib/auth";
import { Sidebar } from "@/components/admin/sidebar";
import { TopBar } from "@/components/ui/top-bar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar userName={session.name} userRole={session.role as string || "admin"} accent="violet" />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
