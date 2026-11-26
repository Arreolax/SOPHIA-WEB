"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  User,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import Image from "next/image";
import {
  USER_PROFILE_UPDATED_EVENT,
  getRoleLabel,
  type UserProfile,
} from "../lib/userProfile";

const navItems = [
  { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { name: "Menu de los usuarios", href: "/portal", icon: UserCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "Cargando...",
    username: "",
    avatar: "/images/avatar.jpg",
    role: "usuario",
  });
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ show: true, message, type });

    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
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
            username: data.username || "",
            avatar: data.avatar || "/images/avatar.jpg",
            role: data.role || "usuario",
          });
        } else {
          setUserInfo({
            name: "Invitado",
            username: "Invitado",
            avatar: "/images/avatar.jpg",
            role: "usuario",
          });
        }
      } catch (error) {
        setUserInfo({
          name: "Invitado",
          username: "Invitado",
          avatar: "/images/avatar.jpg",
          role: "usuario",
        });
      }
    };

    const handleProfileUpdate = (event: Event) => {
      const profile = (event as CustomEvent<UserProfile>).detail;
      setUserInfo({
        name: profile.name || "",
        username: profile.username || "",
        avatar: profile.avatar || "/images/avatar.jpg",
        role: profile.role || "usuario",
      });
    };

    window.addEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdate);
    void fetchUser();
    return () =>
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdate);
  }, []);

  return (
    <>
      <div
        className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-100 flex items-center gap-2 px-6 py-3 rounded-lg shadow-xl transition-all duration-500 ${
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
                  href="/portal/profile"
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
                          setNotification((prev) => ({ ...prev, show: false }));
                          router.push("/");
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
                  src={userInfo.avatar}
                  alt="Avatar de usuario"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-white truncate">
                  {userInfo.name}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{getRoleLabel(userInfo.role)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}