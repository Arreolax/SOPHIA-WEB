import Sidebar from '../components/Sidebar-soporte';

export default function DashboardLayout({
  children, 
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      {/* El menú lateral fijo */}
      <Sidebar />
      
      {/* El área dinámica donde se carga cada pantalla */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}