"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AtSign,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Check,
  ArrowRight,
} from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [capsWarning, setCapsWarning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setIsLoading(false);
    setIsSuccess(false);
    setErrorMessage("");
  }, []);

  useEffect(() => {
    if (searchParams.get("session") === "expired") {
      setErrorMessage(
        "Sesión no válida o expirada. Por favor inicia sesión nuevamente."
      );
    }
  }, [searchParams]);

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState("CapsLock")) {
      setCapsWarning(true);
    } else {
      setCapsWarning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    setIsSuccess(false);

    try {
      const respuesta = await fetch("/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailValue,
          password: passwordValue,
          remember: rememberMe,
        }),
      });

      if (respuesta.ok) {
        const data = await respuesta.json();
        setIsLoading(false);
        setIsSuccess(true);

        const cleanRole = String(data.role || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();
        const isTecnicoOrAdmin =
          cleanRole === "tecnico" ||
          cleanRole === "admin" ||
          cleanRole.includes("tecnic") ||
          cleanRole.includes("admin");
        const targetUrl =
          data.redirectTo ||
          (isTecnicoOrAdmin ? "/portal/dashboard" : "/soporte/dashboard");

        setTimeout(() => {
          router.push(targetUrl);
          router.refresh();
        }, 800);
      } else {
        setIsLoading(false);
        const errorData = await respuesta.json();
        setErrorMessage(
          errorData.mensaje ||
            errorData.message ||
            "Credenciales incorrectas. Verifica tus datos."
        );
      }
    } catch (error) {
      setIsLoading(false);
      setErrorMessage("Ocurrió un error al intentar conectarse al servidor.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#F4F7FB] p-4 font-sans">
      {/* Efectos de luz difuminada en el fondo con el tono #323454 */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#323454]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#323454]/20 blur-[130px] pointer-events-none" />

      {/* Encabezado externo centrado */}
      <div className="text-center mb-6 z-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1.5">
          Iniciar sesión
        </h1>
        <p className="text-sm text-slate-500">
          Ingresa tus credenciales para continuar
        </p>
      </div>

      {/* Tarjeta principal con el estilo del registro */}
      <div className="w-full max-w-[460px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(50,52,84,0.08)] relative overflow-hidden z-10 border border-slate-100">
        {/* Borde superior con el azul #323454 */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#323454] via-[#454873] to-[#323454]" />

        <div className="p-8 sm:p-10">
          {/* Separador superior con texto */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-slate-100 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase whitespace-nowrap">
              INGRESA TUS CREDENCIALES
            </span>
            <div className="border-t border-slate-100 w-full" />
          </div>

          {/* Formulario */}
          <form id="loginForm" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Usuario o Correo
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="usuario@empresa.com"
                  disabled={isLoading || isSuccess}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#323454] focus:ring-2 focus:ring-[#323454]/15 transition-all placeholder:text-slate-400 disabled:opacity-60"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-slate-700"
                >
                  Contraseña
                </label>
                <Link
                  href="/recuperar-contrasena"
                  className="text-xs font-semibold text-[#323454] hover:text-[#181928] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  onKeyUp={handleKeyUp}
                  placeholder="••••••••••••"
                  disabled={isLoading || isSuccess}
                  className="w-full pl-10 pr-10 py-2.5 text-sm text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#323454] focus:ring-2 focus:ring-[#323454]/15 transition-all placeholder:text-slate-400 tracking-wider disabled:opacity-60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isSuccess}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Advertencia de Bloq Mayús */}
              {capsWarning && (
                <div className="text-xs text-amber-600 flex items-center gap-1.5 mt-2 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Bloq Mayús activado</span>
                </div>
              )}
            </div>

            {/* Recordar sesión */}
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading || isSuccess}
                className="h-4 w-4 rounded border-slate-300 text-[#323454] focus:ring-[#323454] cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-xs font-medium text-slate-600 cursor-pointer select-none"
              >
                Recordar sesión
              </label>
            </div>

            {/* Mensaje de Error */}
            {errorMessage && (
              <div className="text-xs text-red-600 font-semibold rounded-xl p-3 bg-red-50 border border-red-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Botón Principal con el azul #323454 */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  isSuccess
                    ? "bg-emerald-600 shadow-[0_8px_20px_rgba(5,150,105,0.25)]"
                    : "bg-[#323454] hover:bg-[#181928] active:scale-[0.99] shadow-[0_8px_20px_rgba(50,52,84,0.25)]"
                } ${
                  isLoading || isSuccess
                    ? "opacity-90 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Bienvenido!</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Enlace inferior externo */}
      <p className="mt-6 text-xs text-slate-500 z-10">
        ¿No tienes cuenta?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#323454] hover:text-[#181928] transition-colors inline-flex items-center gap-0.5"
        >
          Regístrate aquí
          <span aria-hidden="true">›</span>
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB] text-slate-500 text-sm">
          Cargando plataforma...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}