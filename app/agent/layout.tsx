import { requireAgentSession } from "@/lib/auth";
import { AgentSidebar } from "@/components/agent/sidebar";
import { TopBar } from "@/components/ui/top-bar";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAgentSession();
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AgentSidebar agencyName={session.agencyName as string | undefined} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar userName={session.name} userRole="agent" />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
