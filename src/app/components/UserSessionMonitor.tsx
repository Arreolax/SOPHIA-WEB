"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  USER_PROFILE_UPDATED_EVENT,
  getRoleHome,
  type UserProfile,
} from "../lib/userProfile";

export default function UserSessionMonitor() {
  const router = useRouter();
  const pathname = usePathname();
  const [inactive, setInactive] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    let previousProfile: string | null = null;

    const checkUserProfile = async () => {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`La verificación del usuario falló (${response.status}).`);
        }

        const profile = (await response.json()) as UserProfile;
        const serializedProfile = JSON.stringify(profile);
        if (serializedProfile !== previousProfile) {
          previousProfile = serializedProfile;
          window.dispatchEvent(
            new CustomEvent<UserProfile>(USER_PROFILE_UPDATED_EVENT, {
              detail: profile,
            }),
          );
        }

        if (profile.status === false) {
          setInactive(true);
          return;
        }

        setInactive(false);
        setLoggingOut(false);
        setLogoutError("");

        const roleHome = getRoleHome(profile.role);
        const currentArea = pathname.split("/")[1];
        const roleArea = roleHome.split("/")[1];
        if (currentArea && currentArea !== roleArea) {
          router.replace(roleHome);
        }
      } catch (error) {
        console.error("No se pudo comprobar el estado del usuario:", error);
      }
    };

    void checkUserProfile();
    const intervalId = window.setInterval(() => {
      void checkUserProfile();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [pathname, router]);

  const handleContinue = async () => {
    setLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) {
        const result = (await response.json()) as { mensaje?: string };
        throw new Error(result.mensaje || "No se pudo cerrar la sesión.");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "No se pudo cerrar la sesión. Inténtalo de nuevo.",
      );
      setLoggingOut(false);
    }
  };

  if (!inactive) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-4">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="inactive-account-title"
        aria-describedby="inactive-account-description"
        className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2
          id="inactive-account-title"
          className="text-center text-lg font-bold text-slate-900"
        >
          Cuenta desactivada
        </h2>
        {logoutError && (
          <p role="alert" className="mt-4 text-center text-sm text-red-600">
            {logoutError}
          </p>
        )}
        <button
          type="button"
          onClick={handleContinue}
          disabled={loggingOut}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#313652] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#25283f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loggingOut && <Loader2 className="h-4 w-4 animate-spin" />}
          Cerrar Sesión
        </button>
      </section>
    </div>
  );
}
