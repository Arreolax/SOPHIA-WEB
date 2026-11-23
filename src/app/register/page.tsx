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
  ArrowLeft,
  Phone,
  XCircle,
} from "lucide-react";

import { FallingLeavesWrapper } from "../components/FallingLeavesWrapper";

type FieldErrors = {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

type UsernameStatus = "idle" | "checking" | "available" | "taken";

const isValidName = (name: string) =>
  /^[a-zA-ZÁÉÍÓÚáéíóúÑñÜü\s]{2,50}$/.test(name.trim());

const isValidUsername = (username: string) =>
  /^[a-zA-Z0-9._]{3,20}$/.test(username.replace(/^@/, "").trim());

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim());

const isValidPhone = (phone: string) => {
  const digitsOnly = phone.replace(/\D/g, "");
  return (
    /^\+?[\d\s\-()]{10,18}$/.test(phone.trim()) &&
    digitsOnly.length >= 10 &&
    digitsOnly.length <= 15
  );
};

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [nameValue, setNameValue] = useState("");
  const [usernameValue, setUsernameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsWarning, setCapsWarning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const rules = {
    minLength: passwordValue.length >= 8,
    hasUppercase: /[A-Z]/.test(passwordValue),
    hasNumber: /[0-9]/.test(passwordValue),
    hasSpecialChar: /[@#$%^&*(),.?":{}|<>]/.test(passwordValue),
  };

  const passwordStrength = Object.values(rules).filter(Boolean).length;
  const isPasswordStrong = passwordStrength === 4;

  useEffect(() => {
    const resetForm = () => {
      setIsLoading(false);
      setIsSuccess(false);
      setErrorMessage("");
      setNameValue("");
      setUsernameValue("");
      setEmailValue("");
      setPhoneValue("");
      setPasswordValue("");
      setConfirmPasswordValue("");
      setUsernameStatus("idle");
      setTouched({});
      setFieldErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      setCapsWarning(false);
    };

    resetForm();

    window.addEventListener("pageshow", resetForm);
    return () => window.removeEventListener("pageshow", resetForm);
  }, []);

  useEffect(() => {
    setIsLoading(false);
    setIsSuccess(false);
    setErrorMessage("");
    setNameValue("");
    setUsernameValue("");
    setEmailValue("");
    setPhoneValue("");
    setPasswordValue("");
    setConfirmPasswordValue("");
    setUsernameStatus("idle");
    setTouched({});
    setFieldErrors({});
  }, []);

  useEffect(() => {
    if (searchParams.get("session") === "expired") {
      setErrorMessage(
        "Sesión no válida o expirada. Por favor regístrate o inicia sesión."
      );
    }
  }, [searchParams]);

  // Verificación de disponibilidad de username con debounce
  useEffect(() => {
    const cleanUser = usernameValue.replace(/^@/, "").trim();

    if (!cleanUser || !isValidUsername(cleanUser)) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/register?username=${encodeURIComponent(cleanUser)}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          setUsernameStatus("idle");
          return;
        }
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setUsernameStatus("idle");
        }
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [usernameValue]);

  // Validación reactiva de campos
  useEffect(() => {
    const errors: FieldErrors = {};

    if (!nameValue.trim()) {
      errors.name = "El nombre es obligatorio.";
    } else if (!isValidName(nameValue)) {
      errors.name = "Ingresa un nombre válido (solo letras, mín. 2 caracteres).";
    }

    const cleanUser = usernameValue.replace(/^@/, "").trim();
    if (!cleanUser) {
      errors.username = "El nombre de usuario es obligatorio.";
    } else if (!isValidUsername(cleanUser)) {
      errors.username = "Usa 3-20 caracteres (letras, números, punto o _).";
    } else if (usernameStatus === "taken") {
      errors.username = "Este nombre de usuario ya está en uso.";
    }

    if (!emailValue.trim()) {
      errors.email = "El correo electrónico es obligatorio.";
    } else if (!isValidEmail(emailValue)) {
      errors.email = "Ingresa un correo electrónico válido.";
    }

    if (!phoneValue.trim()) {
      errors.phone = "El teléfono es obligatorio.";
    } else if (!isValidPhone(phoneValue)) {
      errors.phone = "Ingresa un teléfono válido (10 a 15 dígitos).";
    }

    if (!passwordValue) {
      errors.password = "La contraseña es obligatoria.";
    } else if (!isPasswordStrong) {
      errors.password = "La contraseña debe cumplir todos los requisitos.";
    }

    if (!confirmPasswordValue) {
      errors.confirmPassword = "Confirma tu contraseña.";
    } else if (passwordValue !== confirmPasswordValue) {
      errors.confirmPassword = "Las contraseñas no coinciden.";
    }

    setFieldErrors(errors);
  }, [
    nameValue,
    usernameValue,
    usernameStatus,
    emailValue,
    phoneValue,
    passwordValue,
    confirmPasswordValue,
    isPasswordStrong,
  ]);

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsWarning(e.getModifierState("CapsLock"));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^\d\s\-()+]/g, "");
    setPhoneValue(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    setTouched({
      name: true,
      username: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    if (usernameStatus === "checking") {
      setErrorMessage("Espera un momento mientras verificamos el usuario.");
      return;
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrorMessage("Por favor corrige los campos marcados antes de continuar.");
      return;
    }

    setIsLoading(true);
    setIsSuccess(false);

    try {
      const cleanUsername = usernameValue.replace(/^@/, "").trim();

      const respuesta = await fetch("/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nameValue.trim(),
          username: cleanUsername,
          email: emailValue.trim().toLowerCase(),
          phone: phoneValue.trim(),
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
        const targetUrl =
          data.redirectTo ||
          (cleanRole.includes("admin")
            ? "/web"
            : cleanRole.includes("tecnic")
              ? "/soporte/dashboard"
              : "/portal/dashboard");

        setTimeout(() => {
          setNameValue("");
          setUsernameValue("");
          setEmailValue("");
          setPhoneValue("");
          setPasswordValue("");
          setConfirmPasswordValue("");
          setTouched({});
          setUsernameStatus("idle");

          router.push(targetUrl);
          router.refresh();
        }, 800);
      } else {
        setIsLoading(false);
        const errorData = await respuesta.json();
        if (errorData.campo === "username") {
          setUsernameStatus("taken");
          setTouched((prev) => ({ ...prev, username: true }));
        }
        setErrorMessage(
          errorData.mensaje || errorData.message || "Error en el registro."
        );
      }
    } catch {
      setIsLoading(false);
      setErrorMessage("Ocurrió un error al intentar conectarse al servidor.");
    }
  };

  const inputBorderClass = (field: keyof FieldErrors) => {
    if (field === "username" && usernameStatus === "taken") {
      return "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-500/15";
    }
    if (!touched[field]) {
      return "border-slate-200 focus:border-[#323454] focus:ring-[#323454]/15";
    }
    return fieldErrors[field]
      ? "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-500/15"
      : "border-emerald-400 focus:border-[#323454] focus:ring-[#323454]/15";
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#F4F7FB] p-4 font-sans">
      <FallingLeavesWrapper
        className="fixed inset-0 pointer-events-none z-0"
        shapes={["maple", "birch", "oak", "oval"]}
        count={50}
        speed={2}
        wind={-5}
        size={100}
      />

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

          <form
            id="registerForm"
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre */}
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
                    onBlur={() => markTouched("name")}
                    placeholder="Ej. Alejandro"
                    disabled={isLoading || isSuccess}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-800 bg-slate-50/50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 transition-all placeholder:text-slate-400 disabled:opacity-60 ${inputBorderClass("name")}`}
                    required
                  />
                </div>
                {touched.name && fieldErrors.name && (
                  <p className="mt-1 text-[11px] font-medium text-red-600">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Nombre de Usuario */}
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
                    onChange={(e) => setUsernameValue(e.target.value)}
                    onBlur={() => markTouched("username")}
                    placeholder="ej. alejandro.dev"
                    disabled={isLoading || isSuccess}
                    className={`w-full pl-10 pr-9 py-2.5 text-sm text-slate-800 bg-slate-50/50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 transition-all placeholder:text-slate-400 disabled:opacity-60 ${inputBorderClass("username")}`}
                    required
                  />
                  {/* Indicador de disponibilidad */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    )}
                    {usernameStatus === "available" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {usernameStatus === "taken" && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                {(touched.username || usernameStatus === "taken") &&
                  fieldErrors.username ? (
                  <p className="mt-1 text-[11px] font-medium text-red-600">
                    {fieldErrors.username}
                  </p>
                ) : (
                  usernameStatus === "available" && (
                    <p className="mt-1 text-[11px] font-medium text-emerald-600">
                      Nombre de usuario disponible
                    </p>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    onBlur={() => markTouched("email")}
                    placeholder="usuario@empresa.com"
                    disabled={isLoading || isSuccess}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-800 bg-slate-50/50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 transition-all placeholder:text-slate-400 disabled:opacity-60 ${inputBorderClass("email")}`}
                    required
                  />
                </div>
                {touched.email && fieldErrors.email && (
                  <p className="mt-1 text-[11px] font-medium text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={phoneValue}
                    onChange={handlePhoneChange}
                    onBlur={() => markTouched("phone")}
                    placeholder="618 123 4567"
                    maxLength={18}
                    disabled={isLoading || isSuccess}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-800 bg-slate-50/50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 transition-all placeholder:text-slate-400 disabled:opacity-60 ${inputBorderClass("phone")}`}
                    required
                  />
                </div>
                {touched.phone && fieldErrors.phone && (
                  <p className="mt-1 text-[11px] font-medium text-red-600">
                    {fieldErrors.phone}
                  </p>
                )}
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
                  onBlur={() => markTouched("password")}
                  onKeyUp={handleKeyUp}
                  placeholder="••••••••••••"
                  disabled={isLoading || isSuccess}
                  className={`w-full pl-10 pr-10 py-2.5 text-sm text-slate-800 bg-slate-50/50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 transition-all placeholder:text-slate-400 tracking-wider disabled:opacity-60 ${inputBorderClass("password")}`}
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

              {capsWarning && (
                <div className="text-xs text-amber-600 flex items-center gap-1.5 mt-2 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Bloq Mayús activado</span>
                </div>
              )}

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
                  onBlur={() => markTouched("confirmPassword")}
                  onKeyUp={handleKeyUp}
                  placeholder="••••••••••••"
                  disabled={isLoading || isSuccess}
                  className={`w-full pl-10 pr-10 py-2.5 text-sm text-slate-800 bg-slate-50/50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 transition-all placeholder:text-slate-400 tracking-wider disabled:opacity-60 ${inputBorderClass("confirmPassword")}`}
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
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <p className="mt-1 text-[11px] font-medium text-red-600">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {errorMessage && (
              <div className="text-xs text-red-600 font-semibold rounded-xl p-3 bg-red-50 border border-red-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isSuccess || usernameStatus === "checking"}
                className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2.5 ${isSuccess
                    ? "bg-emerald-600 shadow-[0_8px_20px_rgba(5,150,105,0.25)]"
                    : "bg-[#323454] hover:bg-[#181928] active:scale-[0.99] shadow-[0_8px_20px_rgba(50,52,84,0.25)]"
                  } ${isLoading || isSuccess || usernameStatus === "checking"
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
                  <span>Registrar Cuenta</span>
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