import React, { Suspense } from 'react';
import Sidebar from '../components/Sidebar-web';
import { FallingLeavesWrapper } from '../components/FallingLeavesWrapper';
import UserSessionMonitor from '../components/UserSessionMonitor';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      <Suspense fallback={null}>
        <UserSessionMonitor />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-full w-64 shrink-0 border-r border-slate-200 bg-white" />
        }
      >
        <Sidebar />
      </Suspense>

      <div className="relative flex-1 h-full overflow-hidden">
        <FallingLeavesWrapper
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          shapes={["maple", "birch", "oak", "oval"]}
          count={25}
          speed={0}
          wind={0}
          size={50}
        />

        <main className="relative z-10 h-full overflow-y-auto p-8">
          <Suspense
            fallback={
              <div className="mx-auto w-full max-w-6xl space-y-6 py-4">
                <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200/70" />
                <div className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}