import Sidebar from "../components/Sidebar-portal";
import { FallingLeavesWrapper } from "../components/FallingLeavesWrapper";
import UserSessionMonitor from "../components/UserSessionMonitor";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      <UserSessionMonitor />
      <div className="relative z-20 shrink-0">
        <Sidebar />
      </div>

      <main className="relative flex-1 overflow-y-auto p-8">

        <FallingLeavesWrapper
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          shapes={["maple", "birch", "oak", "oval"]}
          count={25}
          speed={0}
          wind={0}
          size={50}
        />

        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}