"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  Camera,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  CircleHelp,
  Home,
  IdCard,
  KeyRound,
  LogOut,
  Mail,
  Pencil,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Star,
  Gauge,
  CircleCheck,
} from "lucide-react";

/* ---------- Datos de ejemplo (luego los reemplazas por Supabase) ---------- */
const EMPLEADO = {
  id: "EMP-84920",
  nombre: "Tom Hansen",
  puesto: "Ingeniero de Operaciones TI • Soporte Nivel 2",
  email: "tom.hansen@company.com",
  turno: "Turno Principal (08:00 - 17:00 CET)",
  avatar: "/images/avatar.jpg",
  stats: { resueltos: 14, csat: 4.9, sla: 98 },
  colas: ["L2 Escalaciones", "Redes & VPN", "Active Directory", "Servidores Linux"],
};

type Preferencias = {
  nombre: string;
  alertasUrgentes: boolean;
  notifCorreo: boolean;
  resumenDiario: boolean;
};

const PREFS_INICIALES: Preferencias = {
  nombre: EMPLEADO.nombre,
  alertasUrgentes: true,
  notifCorreo: true,
  resumenDiario: false,
};

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
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#313652] focus-visible:ring-offset-2 ${
        checked ? "bg-[#313652]" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
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

/* ---------- Página ---------- */
export default function ProfilePage() {
  const router = useRouter();

  const [prefs, setPrefs] = useState<Preferencias>(PREFS_INICIALES);
  const [guardado, setGuardado] = useState<Preferencias>(PREFS_INICIALES);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error";
  }>({ show: false, msg: "", type: "success" });

  const hayCambios = JSON.stringify(prefs) !== JSON.stringify(guardado);

  // Avisa al navegador si intentas cerrar la pestaña con cambios sin guardar
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
    setGuardando(true);
    try {
      // TODO: aquí llamas a tu API, por ejemplo:
      // const res = await fetch("/api/profile", {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(prefs),
      // });
      // if (!res.ok) throw new Error();
      await new Promise((r) => setTimeout(r, 600)); // simulación
      setGuardado(prefs);
      setEditandoNombre(false);
      mostrarToast("Cambios guardados correctamente", "success");
    } catch {
      mostrarToast("No se pudieron guardar los cambios", "error");
    } finally {
      setGuardando(false);
    }
  };

  const restablecer = () => {
    setPrefs(guardado);
    setEditandoNombre(false);
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

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Toast */}
      <div
        className={`fixed left-1/2 top-6 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-lg px-6 py-3 text-white shadow-xl transition-all duration-500 ${
          toast.show
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

      {/* Barra superior: breadcrumb + buscador + acciones */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-slate-300 pb-4">
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Home className="h-3.5 w-3.5" />
          <Link href="/portal/dashboard" className="hover:text-slate-800">
            Inicio
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span>Configuración</span>
          <ChevronRight className="h-3 w-3" />
          <span className="rounded-md bg-slate-200 px-2 py-0.5 font-semibold text-slate-700">
            Mi Perfil
          </span>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-400 md:flex md:w-72">
            <Search className="h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Buscar tickets, artículos, ajustes..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </div>
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
          <button
            type="button"
            onClick={restablecer}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Restablecer
          </button>
        </div>
      </div>

      {/* Título */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Configuración de Perfil
          </h1>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            Administra tu información corporativa de técnico, preferencias de
            alerta y credenciales de acceso.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            En turno • Disponible para asignaciones
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
            <IdCard className="h-4 w-4 text-[#313652]" />
            {EMPLEADO.id}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* ============ Columna izquierda ============ */}
        <Card className="flex flex-col">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-md ring-2 ring-indigo-100">
                <Image
                  src={EMPLEADO.avatar}
                  alt={prefs.nombre}
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
              {prefs.nombre}
            </h2>
            <p className="mt-1 text-xs text-slate-600">{EMPLEADO.puesto}</p>
            <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              {EMPLEADO.email}
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {EMPLEADO.turno}
            </div>
          </div>

          <hr className="my-5 border-slate-200" />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Desempeño del mes
              </h3>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                Abril 2024
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center rounded-xl border border-slate-200 p-3 text-center">
                <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <CircleCheck className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold text-slate-800">
                  {EMPLEADO.stats.resueltos}
                </span>
                <span className="text-[10px] text-slate-500">Resueltos</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-slate-200 p-3 text-center">
                <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                  <Star className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold text-slate-800">
                  {EMPLEADO.stats.csat} ★
                </span>
                <span className="text-[10px] text-slate-500">CSAT Valor</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-slate-200 p-3 text-center">
                <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Gauge className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold text-slate-800">
                  {EMPLEADO.stats.sla}%
                </span>
                <span className="text-[10px] text-slate-500">SLA Éxito</span>
              </div>
            </div>
          </div>

          <hr className="my-5 border-slate-200" />

          <div>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Colas de soporte asignadas
            </h3>
            <div className="flex flex-wrap gap-2">
              {EMPLEADO.colas.map((c, i) => {
                const dots = [
                  "bg-indigo-500",
                  "bg-sky-500",
                  "bg-emerald-500",
                  "bg-violet-500",
                ];
                return (
                  <span
                    key={c}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${dots[i % 4]}`} />
                    {c}
                  </span>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={cerrarSesion}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión Segura
          </button>
        </Card>

        {/* ============ Columna derecha ============ */}
        <div className="flex flex-col gap-6">
          {/* Datos del empleado */}
          <Card>
            <CardHeader
              icon={<IdCard className="h-4 w-4" />}
              title="Datos del Empleado"
              subtitle="Información personal e identificación corporativa registrada"
              right={
                <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600">
                  {EMPLEADO.id}
                </span>
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="nombre"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  Nombre Completo
                </label>
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-[#313652]">
                  <input
                    id="nombre"
                    type="text"
                    value={prefs.nombre}
                    readOnly={!editandoNombre}
                    onChange={(e) => set("nombre", e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Editar nombre"
                    onClick={() => setEditandoNombre(true)}
                    className="ml-2 text-slate-400 hover:text-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">
                    Correo Electrónico Corporativo
                  </span>
                  <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <BadgeCheck className="h-3 w-3" />
                    Verificado
                  </span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-700">
                  {EMPLEADO.email}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Notificaciones */}
            <Card className="flex flex-col">
              <CardHeader
                icon={<Bell className="h-4 w-4" />}
                title="Notificaciones y Alertas"
                subtitle="Canales para incidencias y guardias"
              />
              <ul className="flex flex-1 flex-col gap-5">
                <li className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Alertas urgentes
                    </p>
                    <p className="text-xs text-slate-500">
                      Notificaciones push críticas e interrupciones del servicio
                    </p>
                  </div>
                  <Switch
                    label="Alertas urgentes"
                    checked={prefs.alertasUrgentes}
                    onChange={(v) => set("alertasUrgentes", v)}
                  />
                </li>
                <li className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Notificaciones por correo
                    </p>
                    <p className="text-xs text-slate-500">
                      Asignación de tickets y respuestas de usuarios
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
                      Resumen diario de actividad
                    </p>
                    <p className="text-xs text-slate-500">
                      Informe ejecutivo matutino a las 08:30 CET
                    </p>
                  </div>
                  <Switch
                    label="Resumen diario de actividad"
                    checked={prefs.resumenDiario}
                    onChange={(v) => set("resumenDiario", v)}
                  />
                </li>
              </ul>
              <p className="mt-6 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                <RefreshCw className="h-3 w-3 text-indigo-500" />
                Preferencias sincronizadas con el cliente de escritorio
              </p>
            </Card>

            {/* Seguridad */}
            <Card className="flex flex-col">
              <CardHeader
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Seguridad y Credenciales"
                subtitle="Acceso corporativo federado SSO"
              />
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
                  <p className="text-[11px] text-slate-500">
                    Última actualización hace 45 días
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Protocolo SSO Azure AD activo
                </span>
                <Link
                  href="#"
                  className="font-medium text-indigo-600 hover:underline"
                >
                  Ver auditoría de accesos
                </Link>
              </div>
            </Card>
          </div>

          {/* Barra de guardado */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2
                className={`h-4 w-4 ${
                  hayCambios ? "text-amber-500" : "text-emerald-500"
                }`}
              />
              {hayCambios
                ? "Tienes cambios sin guardar. Se perderán al salir del navegador."
                : "Los cambios no guardados se perderán al salir del navegador."}
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
                disabled={!hayCambios || guardando}
                className="flex items-center gap-2 rounded-lg bg-[#313652] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-[#262a40] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {guardando ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}