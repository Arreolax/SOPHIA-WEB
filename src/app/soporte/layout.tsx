import Sidebar from '../components/Sidebar-soporte';
import { FallingLeavesWrapper } from '../components/FallingLeavesWrapper'; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      <Sidebar />
      
      <div className="relative flex-1 h-full overflow-hidden">
        <FallingLeavesWrapper
          className="absolute inset-0 pointer-events-none z-0"
          shapes={['maple', 'birch', 'oak', 'oval']}
          count={100}
          speed={2}
          wind={-5}
          size={50}
          colors={['#ff6600', '#e9c46a', '#2a9d8f', '#ff000d']}
        />

        <main className="relative z-10 h-full overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}