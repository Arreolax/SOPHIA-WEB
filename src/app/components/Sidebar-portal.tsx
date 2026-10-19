"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  Settings,
  PieChart,
  LogOut,
  User,
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  Wrench,
} from "lucide-react";
import Image from "next/image";

const navItems = [
  { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { name: "Mis Tickets", href: "/portal/tickets", icon: Ticket },
  { name: "Base de Conocimiento", href: "/portal/knowledge", icon: BookOpen },
  { name: "Reportes", href: "/portal/reports", icon: PieChart },
  { name: "Menu del Portal", href: "/portal", icon: ShieldCheck}
];

const renderRoleIcon = (role: string) => {
  const norm = role?.toLowerCase() || "";
  if (norm.includes("admin")) {
    return <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  }
  if (norm.includes("tecnic")) {
    return <Wrench className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
  }
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "Cargando...",
    lastname: "",
    role: "",
  });
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success", 
  });

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ show: true, message, type });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/me");
        if (response.ok) {
          const data = await response.json();
          setUserInfo({
            name: data.name || "",
            lastname: data.lastname || "",
            role: data.role || "",
          });
        } else {
          setUserInfo({ name: "Invitado", lastname: "", role: "" });
        }
      } catch (error) {
        setUserInfo({ name: "Invitado", lastname: "", role: "" });
      }
    };

    fetchUser();
  }, []);

  return (
    <>
      <div
        className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-2 px-6 py-3 rounded-lg shadow-xl transition-all duration-500 ${
          notification.show
            ? "translate-y-0 opacity-100"
            : "-translate-y-24 opacity-0 pointer-events-none"
        } ${
          notification.type === "success"
            ? "bg-emerald-500 text-white"
            : "bg-red-500 text-white"
        }`}
      >
        {notification.type === "success" ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <AlertCircle className="w-5 h-5" />
        )}
        <span className="font-medium">{notification.message}</span>
      </div>

      <aside className="w-64 h-screen bg-[#313652] text-gray-200 flex flex-col justify-between p-4 shrink-0">
        <nav className="flex flex-col gap-2 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-white/10 text-white font-medium"
                    : "hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col pb-4">
          <hr className="border-gray-500/50 mx-4 my-2" />

          <div className="relative">
            {isMenuOpen && (
              <div className="absolute left-full bottom-0 ml-2 w-48 bg-[#262a40] border border-gray-600/50 rounded-lg shadow-xl overflow-hidden z-50">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Mi Perfil</span>
                </Link>

                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-red-400 hover:text-red-300 transition-colors"
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/logout", {
                        method: "POST",
                      });
                      const data = await response.json();

                      if (response.ok) {
                        showNotification("Sesión cerrada con éxito", "success");
                        setIsMenuOpen(false);

                        setTimeout(() => {
                          setNotification(prev => ({ ...prev, show: false })); 
                          router.push('/login');
                          router.refresh();
                        }, 1500);
                      } else {
                        showNotification(`Error: ${data.mensaje}`, "error");
                      }
                    } catch (error) {
                      showNotification(
                        "Error de conexión con el servidor",
                        "error",
                      );
                    }
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Cerrar Sesión</span>
                </button>
              </div>
            )}

            <div
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center gap-3 px-4 py-3 mt-2 cursor-pointer rounded-lg transition-colors ${
                isMenuOpen ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-400 relative">
                <Image
                  src="/images/avatar.jpg"
                  alt="Sarah J."
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-white truncate capitalize">
                {userInfo.name} {userInfo.lastname}
              </span>

              <div className="flex items-center gap-1.5 text-xs text-gray-400 capitalize mt-0.5">
                {renderRoleIcon(userInfo.role)}
                <span className="truncate">{userInfo.role || "Cargando..."}</span>
              </div>
            </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
