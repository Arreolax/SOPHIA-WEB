"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Loader2,
  Check,
  Mail,
  ArrowLeft
} from "lucide-react";


function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [nameValue, setNameValue] = useState("");
  const [usernameValue, setusernameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsWarning, setCapsWarning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reglas de validación de contraseña
  const rules = {
    minLength: passwordValue.length >= 8,
    hasUppercase: /[A-Z]/.test(passwordValue),
    hasNumber: /[0-9]/.test(passwordValue),
    hasSpecialChar: /[@#$%^&*(),.?":{}|<>]/.test(passwordValue),
  };

  // Cálculo de fuerza de contraseña (0 a 4)
  const passwordStrength = Object.values(rules).filter(Boolean).length;

  useEffect(() => {
    setIsLoading(false);
    setIsSuccess(false);
    setErrorMessage("");
    setNameValue("");
    setusernameValue("");
    setEmailValue("");
    setPasswordValue("");
    setConfirmPasswordValue("");
  }, []);

  useEffect(() => {
    if (searchParams.get("session") === "expired") {
      setErrorMessage(
        "Sesión no válida o expirada. Por favor regístrate o inicia sesión."
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

    // Validación de coincidencia de contraseñas
    if (passwordValue !== confirmPasswordValue) {
      setErrorMessage("Las contraseñas no coinciden. Verifica ambos campos.");
      return;
    }

    setIsLoading(true);
    setIsSuccess(false);

    try {

      const respuesta = await fetch("/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nameValue,
          username: usernameValue,
          email: emailValue,
          password: passwordValue,
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
          errorData.mensaje || errorData.message || "Error en el registro."
        );
      }
    } catch (error) {
      setIsLoading(false);
      setErrorMessage("Ocurrió un error al intentar conectarse al servidor.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#F4F7FB] p-4 font-sans">

      <Link
        href="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#323454] transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Volver al inicio</span>
      </Link>

      <div className="absolute top-[-10%] left-[-10%] w-125 h-125 rounded-full bg-[#323454]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-150 h-150 rounded-full bg-[#323454]/20 blur-[130px] pointer-events-none" />

      <div className="text-center mb-6 z-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1.5">
          Crear Cuenta
        </h1>
        <p className="text-sm text-slate-500">
          Regístrate para gestionar tus tickets y solicitudes de soporte
          técnico con tu identidad de red empresarial.
        </p>
      </div>

      <div className="w-full max-w-135 bg-white rounded-2xl shadow-[0_20px_50px_rgba(50,52,84,0.08)] relative overflow-hidden z-10 border border-slate-100">

        <div className="h-1.5 w-full bg-linear-to-r from-[#323454] via-[#454873] to-[#323454]" />

        <div className="p-8 sm:p-10">

          <hr className="border-slate-100 mb-6" />

          {/* Formulario */}
          <form id="registerForm" onSubmit={handleSubmit} className="space-y-5">
            {/* Fila: Nombre y Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Nombre
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder="Ej. Alejandro"
                    disabled={isLoading || isSuccess}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#323454] focus:ring-2 focus:ring-[#323454]/15 transition-all placeholder:text-slate-400 disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={usernameValue}
                    onChange={(e) => setusernameValue(e.target.value)}
                    placeholder="@ejemplo"
                    disabled={isLoading || isSuccess}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#323454] focus:ring-2 focus:ring-[#323454]/15 transition-all placeholder:text-slate-400 disabled:opacity-60"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Correo Electrónico */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="nombre.apellido@empresa.com"
                  disabled={isLoading || isSuccess}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#323454] focus:ring-2 focus:ring-[#323454]/15 transition-all placeholder:text-slate-400 disabled:opacity-60"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-slate-700"
                >
                  Contraseña
                </label>
                <span className="text-[11px] text-slate-400">
                  Introduce tu clave
                </span>
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

              {/* Barra de progreso de seguridad (4 segmentos) */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 rounded-full transition-colors duration-300 ${passwordStrength >= level
                      ? passwordStrength <= 2
                        ? "bg-amber-400"
                        : "bg-[#323454]"
                      : "bg-slate-200"
                      }`}
                  />
                ))}
              </div>

              {/* Checklist de requisitos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mt-3 text-xs">
                <RequirementItem
                  met={rules.minLength}
                  text="Mínimo 8 caracteres"
                />
                <RequirementItem
                  met={rules.hasUppercase}
                  text="Una letra mayúscula"
                />
                <RequirementItem
                  met={rules.hasNumber}
                  text="Al menos un número"
                />
                <RequirementItem
                  met={rules.hasSpecialChar}
                  text="Un carácter especial (@#$%)"
                />
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Confirmar Contraseña
              </label>
              <div className="relative">
                <RotateCcw className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPasswordValue}
                  onChange={(e) => setConfirmPasswordValue(e.target.value)}
                  onKeyUp={handleKeyUp}
                  placeholder="••••••••••••"
                  disabled={isLoading || isSuccess}
                  className="w-full pl-10 pr-10 py-2.5 text-sm text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#323454] focus:ring-2 focus:ring-[#323454]/15 transition-all placeholder:text-slate-400 tracking-wider disabled:opacity-60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading || isSuccess}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Mensaje de Error */}
            {errorMessage && (
              <div className="text-xs text-red-600 font-semibold rounded-xl p-3 bg-red-50 border border-red-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Botón Principal con el azul #323454 y hover #181928 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2.5 ${isSuccess
                  ? "bg-emerald-600 shadow-[0_8px_20px_rgba(5,150,105,0.25)]"
                  : "bg-[#323454] hover:bg-[#181928] active:scale-[0.99] shadow-[0_8px_20px_rgba(50,52,84,0.25)]"
                  } ${isLoading || isSuccess
                    ? "opacity-90 cursor-not-allowed"
                    : "cursor-pointer"
                  }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Registrado!</span>
                  </>
                ) : (
                  <>
                    <span>Registrar Cuenta</span>

                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-500 z-10">
        ¿Ya dispones de una cuenta?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#323454] hover:text-[#181928] transition-colors inline-flex items-center gap-0.5"
        >
          Iniciar sesión
          <span aria-hidden="true">›</span>
        </Link>
      </p>



    </div>
  );
}

// Subcomponente para los ítems de validación
function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-2 transition-colors ${met ? "text-[#323454] font-medium" : "text-slate-400"
        }`}
    >
      {met ? (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#323454]" />
      ) : (
        <Circle className="w-3.5 h-3.5 shrink-0 text-slate-300" />
      )}
      <span>{text}</span>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB] text-slate-500 text-sm">
          Cargando plataforma...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}