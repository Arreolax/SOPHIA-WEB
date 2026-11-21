"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  Camera,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  Clock,
  FilePlus2,
  Home,
  IdCard,
  KeyRound,
  Laptop,
  Loader2,
  LogOut,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  User,
  AtSign,
  XCircle,
} from "lucide-react";

type PerfilUsuario = {
  id: string;
  nombre: string;
  username: string;
  role: string;
  email: string;
  telefono: string;
  emailVerificado: boolean;
  avatar: string;
  actividad: {
    creados: string;
    enProgreso: string;
    resueltos: string;
    periodo: string;
  };
  equipos: string[];
  dispositivo: { nombre: string; detalle: string };
};

const PERFIL_VACIO: PerfilUsuario = {
  id: "",
  nombre: "",
  username: "",
  role: "",
  email: "",
  telefono: "",
  emailVerificado: false,
  avatar: "/images/avatar.jpg",
  actividad: { creados: "0", enProgreso: "0", resueltos: "0", periodo: "Este mes" },
  equipos: [],
  dispositivo: { nombre: "Sesión Web Actual", detalle: "Navegador verificado" },
};

type Preferencias = {
  nombre: string;
  username: string;
  telefono: string;
  cambiosEstado: boolean;
  notifCorreo: boolean;
  resumenSemanal: boolean;
};

const PREFS_INICIALES: Preferencias = {
  nombre: "",
  username: "",
  telefono: "",
  cambiosEstado: true,
  notifCorreo: true,
  resumenSemanal: false,
};

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const isValidUsername = (username: string) =>
  /^[a-zA-Z0-9._]{3,20}$/.test(username.replace(/^@/, "").trim());

/* ---------- Componentes pequeños ---------- */
function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#313652] focus-visible:ring-offset-2 ${checked ? "bg-[#313652]" : "bg-slate-300"
        }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
      />
    </button>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function CardHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-[#313652]">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      {right}
    </div>
  );
}

function FieldLabel({
  icon,
  children,
  htmlFor,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600"
    >
      {icon}
      {children}
    </label>
  );
}

/** Campo de texto que se edita al pulsar el lápiz o hacer clic */
function EditableField({
  id,
  value,
  onChange,
  label,
  placeholder = "Sin especificar",
  status = "idle",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
  status?: UsernameStatus;
}) {
  const [editando, setEditando] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editando) ref.current?.focus();
  }, [editando]);

  const borderStyle =
    status === "taken" || status === "invalid"
      ? "border-red-400 bg-red-50/40 ring-2 ring-red-500/10"
      : status === "available"
        ? "border-emerald-400 bg-white ring-2 ring-emerald-500/10"
        : editando
          ? "border-[#313652] bg-white ring-2 ring-[#313652]/10"
          : "border-slate-200 bg-slate-50 hover:border-slate-300";

  return (
    <div
      onClick={() => setEditando(true)}
      className={`flex cursor-text items-center rounded-lg border px-3 py-2.5 transition-colors ${borderStyle}`}
    >
      <input
        ref={ref}
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        readOnly={!editando}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditando(false)}
        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
      />
      {status === "checking" && (
        <Loader2 className="ml-2 h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />
      )}
      {status === "available" && (
        <CheckCircle2 className="ml-2 h-3.5 w-3.5 shrink-0 text-emerald-500" />
      )}
      {(status === "taken" || status === "invalid") && (
        <XCircle className="ml-2 h-3.5 w-3.5 shrink-0 text-red-500" />
      )}
      <button
        type="button"
        aria-label={`Editar ${label}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          setEditando(true);
        }}
        className="ml-2 text-slate-400 hover:text-slate-700"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ---------- Skeleton Loader ---------- */
function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando perfil..." className="animate-pulse">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 rounded-lg bg-slate-200" />
          <div className="h-4 w-80 max-w-full rounded-md bg-slate-200" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-slate-200" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="flex flex-col">
          <div className="flex flex-col items-center">
            <div className="h-24 w-24 rounded-full bg-slate-200" />
            <div className="mt-4 h-5 w-44 rounded-md bg-slate-200" />
            <div className="mt-2 h-3.5 w-32 rounded-md bg-slate-200" />
            <div className="mt-2.5 h-3.5 w-48 rounded-md bg-slate-200" />
          </div>
          <hr className="my-5 border-slate-200" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-20 rounded-xl bg-slate-100" />
            ))}
          </div>
          <div className="mt-8 h-10 w-full rounded-lg bg-slate-200" />
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((field) => (
                <div key={field} className="space-y-2">
                  <div className="h-3.5 w-32 rounded bg-slate-200" />
                  <div className="h-10 w-full rounded-lg bg-slate-200" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Página ---------- */
export default function EmployeeProfilePage() {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [perfil, setPerfil] = useState<PerfilUsuario>(PERFIL_VACIO);
  const [prefs, setPrefs] = useState<Preferencias>(PREFS_INICIALES);
  const [guardado, setGuardado] = useState<Preferencias>(PREFS_INICIALES);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [errorPerfil, setErrorPerfil] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error";
  }>({ show: false, msg: "", type: "success" });

  const hayCambios = JSON.stringify(prefs) !== JSON.stringify(guardado);
  const usernameInvalido =
    usernameStatus === "taken" ||
    usernameStatus === "invalid" ||
    usernameStatus === "checking";

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const [meResponse, ticketsResponse] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/tickets?mine=true"),
        ]);

        if (!meResponse.ok) {
          throw new Error("No se pudo cargar la información del perfil.");
        }

        const data = await meResponse.json();
        const nombre = data.name || "";
        const username = data.username || "";
        const telefono = data.phone || "";

        // Calcular métricas de tickets del usuario (solo del mes actual)
        let creados = 0;
        let enProgreso = 0;
        let resueltos = 0;

        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          const allTickets = Array.isArray(ticketsData.tickets)
            ? ticketsData.tickets
            : [];

          // 1. Excluir borradores (draft === 1)
          const validTickets = allTickets.filter(
            (t: { draft?: number | boolean }) => Number(t.draft) !== 1
          );

          // 2. Filtrar únicamente los tickets creados en el mes y año actual
          const now = new Date();
          const monthTickets = validTickets.filter(
            (t: { created_at?: string }) => {
              if (!t.created_at) return false;
              const d = new Date(t.created_at);
              return (
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear()
              );
            }
          );

          // 3. Contar sobre monthTickets
          creados = monthTickets.length;

          for (const t of monthTickets) {
            const st = String(t.status || "").toUpperCase().trim();
            if (
              st === "IN_PROGRESS" ||
              st === "EN_PROGRESO" ||
              st === "PENDING" ||
              st === "PENDIENTE" ||
              st === "ASSIGNED"
            ) {
              enProgreso++;
            } else if (
              st === "RESOLVED" ||
              st === "RESUELTO" ||
              st === "CLOSED" ||
              st === "CERRADO"
            ) {
              resueltos++;
            }
          }
        }

        setPerfil({
          ...PERFIL_VACIO,
          id: data.id || "",
          nombre,
          username,
          role: data.role || "usuario",
          email: data.email || "",
          telefono,
          emailVerificado: Boolean(data.emailVerified),
          avatar: data.avatar || "/images/avatar.jpg",
          actividad: {
            creados: String(creados),
            enProgreso: String(enProgreso),
            resueltos: String(resueltos),
            periodo: "Este mes", // <-- Mantener etiqueta "Este mes"
          },
        });

        const preferenciasActualizadas: Preferencias = {
          nombre,
          username,
          telefono,
          cambiosEstado: data.notifications?.cambiosEstado ?? true,
          notifCorreo: data.notifications?.notifCorreo ?? true,
          resumenSemanal: data.notifications?.resumenSemanal ?? false,
        };

        setPrefs(preferenciasActualizadas);
        setGuardado(preferenciasActualizadas);
      } catch {
        setErrorPerfil("No se pudo cargar la información de tu perfil.");
      } finally {
        setCargando(false);
      }
    };

    void cargarPerfil();
  }, []);

  // Verificación de disponibilidad de username cuando cambia respecto al guardado
  useEffect(() => {
    if (cargando) return;

    const cleanCurrent = prefs.username.replace(/^@/, "").trim();
    const cleanSaved = guardado.username.replace(/^@/, "").trim();

    if (cleanCurrent.toLowerCase() === cleanSaved.toLowerCase()) {
      setUsernameStatus("idle");
      return;
    }

    if (!cleanCurrent || !isValidUsername(cleanCurrent)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/me?checkUsername=${encodeURIComponent(cleanCurrent)}`,
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
  }, [prefs.username, guardado.username, cargando]);

  useEffect(() => {
    if (!hayCambios) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hayCambios]);

  const mostrarToast = (msg: string, type: "success" | "error") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const set = <K extends keyof Preferencias>(k: K, v: Preferencias[K]) =>
    setPrefs((p) => ({ ...p, [k]: v }));

  const guardar = async () => {
    if (usernameInvalido) {
      mostrarToast("Corrige el nombre de usuario antes de guardar", "error");
      return;
    }

    setGuardando(true);
    try {
      const cleanUsername = prefs.username.replace(/^@/, "").trim();
      const payload = { ...prefs, username: cleanUsername };

      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.campo === "username") {
          setUsernameStatus("taken");
        }
        throw new Error(errData.error || "Error al actualizar");
      }

      setPrefs(payload);
      setGuardado(payload);
      setUsernameStatus("idle");
      setPerfil((prev) => ({
        ...prev,
        nombre: payload.nombre,
        username: payload.username,
        telefono: payload.telefono,
      }));
      mostrarToast("Cambios guardados en la base de datos", "success");
    } catch (err) {
      mostrarToast(
        err instanceof Error ? err.message : "No se pudieron guardar los cambios",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const restablecer = () => {
    setPrefs(guardado);
    setUsernameStatus("idle");
  };

  const cerrarSesion = async () => {
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (!res.ok) throw new Error();
      router.push("/login");
      router.refresh();
    } catch {
      mostrarToast("Error al cerrar sesión", "error");
    }
  };

  const { actividad } = perfil;

  return (
    <div className="mx-auto w-full max-w-6xl">
      {errorPerfil && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {errorPerfil}
        </p>
      )}
      <div
        className={`fixed left-1/2 top-6 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-lg px-6 py-3 text-white shadow-xl transition-all duration-500 ${toast.show
            ? "translate-y-0 opacity-100"
            : "-translate-y-24 opacity-0 pointer-events-none"
          } ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
      >
        {toast.type === "success" ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <AlertCircle className="h-5 w-5" />
        )}
        <span className="font-medium">{toast.msg}</span>
      </div>

      {/* Barra superior */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-slate-300 pb-4">
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Home className="h-3.5 w-3.5" />
          <Link href="/portal/dashboard" className="hover:text-slate-800">
            Inicio
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="rounded-md bg-slate-200 px-2 py-0.5 font-semibold text-slate-700">
            Mi Perfil
          </span>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notificaciones"
            className="relative rounded-full p-2 text-slate-600 hover:bg-white"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <button
            type="button"
            aria-label="Ayuda"
            className="rounded-full p-2 text-slate-600 hover:bg-white"
          >
            <CircleHelp className="h-4 w-4" />
          </button>
        </div>
      </div>

      {cargando ? (
        <ProfileSkeleton />
      ) : (
        <>
          {/* Título */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Configuración de Perfil
              </h1>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Gestiona tu información personal, preferencias de notificación de
                tus solicitudes y accesos.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            {/* ============ Columna izquierda ============ */}
            <Card className="flex flex-col">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-md ring-2 ring-indigo-100">
                    <Image
                      src={perfil.avatar}
                      alt={prefs.nombre || "Avatar"}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Cambiar foto"
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#313652] text-white shadow hover:bg-[#262a40]"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>

                <h2 className="mt-4 text-lg font-bold text-slate-800">
                  {prefs.nombre || "Sin nombre"}
                </h2>
                {prefs.username && (
                  <p className="text-xs font-medium text-indigo-600">
                    @{prefs.username.replace(/^@/, "")}
                  </p>
                )}
                <p className="mt-1 text-xs capitalize text-slate-600">
                  {perfil.role}
                </p>
                <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-slate-500">
                  <Mail className="h-3.5 w-3.5" />
                  {perfil.email}
                </p>
              </div>

              <hr className="my-5 border-slate-200" />

              {/* Actividad de soporte */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Actividad de soporte
                  </h3>
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                    {actividad.periodo}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center rounded-xl border border-slate-200 p-3 text-center">
                    <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <FilePlus2 className="h-4 w-4" />
                    </div>
                    <span className="text-lg font-bold text-slate-800">
                      {actividad.creados}
                    </span>
                    <span className="text-[10px] text-slate-500">Creados</span>
                  </div>
                  <div className="flex flex-col items-center rounded-xl border border-slate-200 p-3 text-center">
                    <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                      <Clock className="h-4 w-4" />
                    </div>
                    <span className="text-lg font-bold text-slate-800">
                      {actividad.enProgreso}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      En Progreso
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-xl border border-slate-200 p-3 text-center">
                    <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <CircleCheck className="h-4 w-4" />
                    </div>
                    <span className="text-lg font-bold text-slate-800">
                      {actividad.resueltos}
                    </span>
                    <span className="text-[10px] text-slate-500">Resueltos</span>
                  </div>
                </div>
              </div>

              {perfil.equipos.length > 0 && (
                <>
                  <hr className="my-5 border-slate-200" />
                  <div>
                    <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Equipos asignados
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {perfil.equipos.map((e, i) => {
                        const dots = [
                          "bg-indigo-500",
                          "bg-sky-500",
                          "bg-emerald-500",
                          "bg-violet-500",
                        ];
                        return (
                          <span
                            key={e}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${dots[i % 4]}`}
                            />
                            {e}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </Card>

            {/* ============ Columna derecha ============ */}
            <div className="flex flex-col gap-6">
              {/* Datos del usuario */}
              <Card>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel
                      htmlFor="nombre"
                      icon={<User className="h-3.5 w-3.5" />}
                    >
                      Nombre Completo
                    </FieldLabel>
                    <EditableField
                      id="nombre"
                      label="nombre"
                      value={prefs.nombre}
                      onChange={(v) => set("nombre", v)}
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Mail className="h-3.5 w-3.5" />
                        Correo Electrónico Corporativo
                      </span>
                      {perfil.emailVerificado && (
                        <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <BadgeCheck className="h-3 w-3" />
                          Verificado
                        </span>
                      )}
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500">
                      {perfil.email}
                    </div>
                  </div>

                  <div>
                    <FieldLabel
                      htmlFor="username"
                      icon={<AtSign className="h-3.5 w-3.5" />}
                    >
                      Nombre de Usuario
                    </FieldLabel>
                    <EditableField
                      id="username"
                      label="nombre de usuario"
                      value={prefs.username}
                      onChange={(v) => set("username", v)}
                      status={usernameStatus}
                    />
                    {usernameStatus === "taken" && (
                      <p className="mt-1 text-[11px] font-medium text-red-600">
                        Este nombre de usuario ya está en uso.
                      </p>
                    )}
                    {usernameStatus === "invalid" && (
                      <p className="mt-1 text-[11px] font-medium text-red-600">
                        Usa 3-20 caracteres (letras, números, punto o _).
                      </p>
                    )}
                    {usernameStatus === "available" && (
                      <p className="mt-1 text-[11px] font-medium text-emerald-600">
                        Nombre de usuario disponible
                      </p>
                    )}
                  </div>

                  <div>
                    <FieldLabel
                      htmlFor="telefono"
                      icon={<Phone className="h-3.5 w-3.5" />}
                    >
                      Teléfono / Extensión
                    </FieldLabel>
                    <EditableField
                      id="telefono"
                      label="teléfono"
                      value={prefs.telefono}
                      onChange={(v) => set("telefono", v)}
                      placeholder="+52 618 123 4567"
                    />
                  </div>
                </div>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Notificaciones */}
                <Card className="flex flex-col">
                  <CardHeader
                    icon={<Bell className="h-4 w-4" />}
                    title="Notificaciones de Solicitudes"
                    subtitle="Alertas del estado de tus tickets"
                  />
                  <ul className="flex flex-1 flex-col gap-5">
                    <li className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Cambios de estado
                        </p>
                        <p className="text-xs text-slate-500">
                          Avisos push cuando un técnico actualice o responda
                        </p>
                      </div>
                      <Switch
                        label="Cambios de estado"
                        checked={prefs.cambiosEstado}
                        onChange={(v) => set("cambiosEstado", v)}
                      />
                    </li>
                    <li className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Notificaciones por correo
                        </p>
                        <p className="text-xs text-slate-500">
                          Avisos al resolver o solicitar información adicional
                        </p>
                      </div>
                      <Switch
                        label="Notificaciones por correo"
                        checked={prefs.notifCorreo}
                        onChange={(v) => set("notifCorreo", v)}
                      />
                    </li>
                    <li className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Resumen semanal
                        </p>
                        <p className="text-xs text-slate-500">
                          Estado consolidado cada lunes a las 08:00
                        </p>
                      </div>
                      <Switch
                        label="Resumen semanal"
                        checked={prefs.resumenSemanal}
                        onChange={(v) => set("resumenSemanal", v)}
                      />
                    </li>
                  </ul>
                  <p className="mt-6 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                    <RefreshCw className="h-3 w-3 text-indigo-500" />
                    Preferencias sincronizadas con el portal de ayuda
                  </p>
                </Card>

                {/* Seguridad */}
                <Card className="flex flex-col">
                  <CardHeader
                    icon={<ShieldCheck className="h-4 w-4" />}
                    title="Seguridad y Acceso"
                    subtitle="Opciones de acceso de tu cuenta"
                  />
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          Cambiar Contraseña
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>

                    <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                        <Laptop className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {perfil.dispositivo.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {perfil.dispositivo.detalle}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Sesión activa ({perfil.role})
                    </span>
                    <Link
                      href="#"
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      Ver historial de accesos
                    </Link>
                  </div>
                </Card>
              </div>

              {/* Barra de guardado */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2
                    className={`h-4 w-4 ${hayCambios ? "text-amber-500" : "text-emerald-500"
                      }`}
                  />
                  {hayCambios
                    ? "Tienes cambios sin guardar. Se perderán al salir del navegador."
                    : "Todos tus datos están sincronizados."}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={restablecer}
                    disabled={!hayCambios || guardando}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Restablecer Valores
                  </button>
                  <button
                    type="button"
                    onClick={guardar}
                    disabled={!hayCambios || guardando || usernameInvalido}
                    className="flex items-center gap-2 rounded-lg bg-[#313652] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-[#262a40] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {guardando ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}