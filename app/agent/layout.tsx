import { requireAgentSession } from "@/lib/auth";
import { AgentSidebar } from "@/components/agent/sidebar";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  await requireAgentSession();
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AgentSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
