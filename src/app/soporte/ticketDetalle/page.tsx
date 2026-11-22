"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileImage,
  FileText,
  Flame,
  History,
  Home,
  Laptop,
  Mail,
  MessageSquare,
  Network,
  Paperclip,
  Plane,
  Send,
  Shield,
  Sparkles,
  Tag,
  UserCheck,
} from "lucide-react";

/* ---------- Tipos alineados con la BD ---------- */
type NivelSeveridad = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type EstadoTicket = "OPEN" | "IN_PROGRESS" | "WAITING_USER" | "RESOLVED" | "CLOSED";

interface AdjuntoTicket {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface HistorialItem {
  id: string;
  hora: string;
  autor: string;
  accion: string;
}

interface TicketDetalle {
  id: string;
  code?: string;
  title: string;
  description: string;
  modality: string;
  type: string;
  subcategory: string | null;
  impact: NivelSeveridad;
  urgency: NivelSeveridad;
  priority: NivelSeveridad;
  status: EstadoTicket;
  created_at: string;
  sla_remaining?: string;
  category?: { id: string; name: string } | null;
  requester?: {
    name: string;
    department?: string | null;
    area?: string | null;
    email: string;
    avatar?: string;
  };
  assigned_technician?: {
    name: string;
    role?: string;
  } | null;
  attachments?: AdjuntoTicket[];
}

/* ---------- Mapas de estilo y etiquetas ---------- */
const MAPA_NIVEL: Record<
  NivelSeveridad,
  { label: string; badge: string; dot: string; card: string }
> = {
  LOW: {
    label: "Baja / Bajo",
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    card: "border-slate-200 bg-slate-50 text-slate-700",
  },
  MEDIUM: {
    label: "Media / Medio",
    badge: "bg-indigo-50 text-indigo-700",
    dot: "bg-[#313652]",
    card: "border-indigo-200 bg-indigo-50/60 text-[#313652]",
  },
  HIGH: {
    label: "Alta / Alto",
    badge: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    card: "border-amber-200 bg-amber-50/70 text-amber-800",
  },
  CRITICAL: {
    label: "Crítica / Crítico",
    badge: "bg-red-50 text-red-600",
    dot: "bg-red-500",
    card: "border-red-200 bg-red-50/70 text-red-700",
  },
};

const MAPA_TIPO: Record<string, string> = {
  INCIDENTE: "Incidente / Falla",
  REQUERIMIENTO: "Solicitud / Requerimiento",
  CONSULTA: "Consulta / Soporte",
};

const MAPA_ESTADO: Record<EstadoTicket, { label: string; chip: string }> = {
  OPEN: { label: "Abierto", chip: "bg-sky-50 text-sky-700" },
  IN_PROGRESS: { label: "En curso", chip: "bg-emerald-50 text-emerald-700" },
  WAITING_USER: { label: "En espera de usuario", chip: "bg-amber-50 text-amber-700" },
  RESOLVED: { label: "Resuelto", chip: "bg-indigo-50 text-indigo-700" },
  CLOSED: { label: "Cerrado", chip: "bg-slate-100 text-slate-600" },
};

const formatoTamano = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function IconoModalidad({ modality }: { modality: string }) {
  const norm = modality.toLowerCase();
  if (norm.includes("remoto") || norm.includes("teletrabajo")) {
    return <Laptop className="h-4 w-4 text-[#313652]" />;
  }
  if (norm.includes("tránsito") || norm.includes("transito") || norm.includes("viaje")) {
    return <Plane className="h-4 w-4 text-[#313652]" />;
  }
  return <Building2 className="h-4 w-4 text-[#313652]" />;
}

/* ---------- Componentes UI ---------- */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function SectionHeader({
  icon,
  titulo,
  subtitulo,
  extra,
}: {
  icon: React.ReactNode;
  titulo: string;
  subtitulo: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[#313652]">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">{titulo}</h2>
          <p className="text-xs text-slate-500">{subtitulo}</p>
        </div>
      </div>
      {extra}
    </div>
  );
}

/* ---------- Skeleton Loader ---------- */
function DetalleTicketSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse" aria-busy="true">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-4 w-16 rounded bg-slate-200" />
        <div className="h-3 w-3 rounded bg-slate-200" />
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-3 w-3 rounded bg-slate-200" />
        <div className="h-5 w-24 rounded-md bg-slate-200" />
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <div className="h-5 w-24 rounded bg-slate-200" />
            <div className="h-5 w-20 rounded-full bg-slate-200" />
            <div className="h-5 w-24 rounded-full bg-slate-200" />
          </div>
          <div className="h-8 w-96 max-w-full rounded-lg bg-slate-200" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-40 rounded-xl bg-slate-200" />
          <div className="h-10 w-44 rounded-xl bg-slate-200" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <div className="h-48 rounded-xl bg-slate-100" />
          </Card>
          <Card>
            <div className="h-40 rounded-xl bg-slate-100" />
          </Card>
        </div>
        <aside className="space-y-6">
          <Card className="!p-5">
            <div className="h-36 rounded-xl bg-slate-100" />
          </Card>
          <Card className="!p-5">
            <div className="h-44 rounded-xl bg-slate-100" />
          </Card>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Contenido Principal ---------- */
function DetalleTicketTecnicoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("id") || "";

  const [resultadoCarga, setResultadoCarga] = useState<{
    ticketId: string;
    ticket: TicketDetalle | null;
    error: string;
  }>({ ticketId: "", ticket: null, error: "" });
  const [estadoManual, setEstadoManual] = useState<{
    ticketId: string;
    estado: EstadoTicket;
  } | null>(null);
  const [notaTecnica, setNotaTecnica] = useState("");
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" }>({
    show: false,
    msg: "",
    type: "success",
  });

  const [historial, setHistorial] = useState<HistorialItem[]>([
    {
      id: "h1",
      hora: "Hace 5 min",
      autor: "Mesa de Ayuda",
      accion: "Ticket asignado al técnico responsable para atención.",
    },
    {
      id: "h2",
      hora: "Hace 12 min",
      autor: "Elena Morales",
      accion: "Ticket registrado desde el Portal de Autoservicio.",
    },
  ]);

  const mostrarToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3200);
  }, []);

  /* Cargar los datos del ticket seleccionado desde la API. */
  useEffect(() => {
    let activo = true;
    if (!ticketId) return;

    const cargarTicket = async () => {
      try {
        const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`, {
          cache: "no-store",
          credentials: "include",
        });

        if (!activo) return;

        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "No se encontró el ticket seleccionado."
              : "No se pudieron cargar los datos del ticket.",
          );
        }

        const data = await res.json();
        const t = data.ticket;
        if (!t) {
          throw new Error("La respuesta no contiene los datos del ticket.");
        }

        const solicitante = t.requester || t.creator;
        const tecnico = t.assigned_technician || t.assignee;
        const codigo = `${String(t.type || "").toUpperCase().startsWith("REQ") ? "REQ" : "INC"}-${String(
          t.id || ticketId,
        )
          .slice(0, 8)
          .toUpperCase()}`;
        const normalizado: TicketDetalle = {
          id: t.id || ticketId,
          code: t.code || codigo,
          title: t.title || "Solicitud sin título",
          description: t.description || "Sin descripción detallada.",
          modality: t.modality || t.modalidad || "No especificada",
          type: t.type || "INCIDENTE",
          subcategory: t.subcategory || null,
          impact: ((t.impact || "MEDIUM").toUpperCase() as NivelSeveridad),
          urgency: ((t.urgency || "HIGH").toUpperCase() as NivelSeveridad),
          priority: ((t.priority || "HIGH").toUpperCase() as NivelSeveridad),
          status: ((t.status || "IN_PROGRESS").toUpperCase() as EstadoTicket),
          created_at: t.created_at
            ? new Date(t.created_at).toLocaleString("es-MX")
            : "No disponible",
          sla_remaining: t.sla_remaining || "No disponible",
          category: t.category || null,
          requester: solicitante
            ? {
                name: solicitante.name || solicitante.username || solicitante.email || "Usuario",
                department: solicitante.department || null,
                area: solicitante.area || null,
                email: solicitante.email || "No disponible",
                avatar: "/images/avatar.jpg",
              }
            : undefined,
          assigned_technician: tecnico
            ? { name: tecnico.name || tecnico.username || "Técnico", role: tecnico.role }
            : null,
          attachments: (t.attachments || []).map(
            (attachment: AdjuntoTicket & {
              file_name?: string;
              file_size?: number;
              file_type?: string;
            }) => ({
              id: attachment.id,
              name: attachment.name || attachment.file_name || "Archivo adjunto",
              size: attachment.size || attachment.file_size || 0,
              type: attachment.type || attachment.file_type || "application/octet-stream",
              url: attachment.url,
            }),
          ),
        };

        setResultadoCarga({ ticketId, ticket: normalizado, error: "" });
      } catch (error) {
        if (!activo) return;
        setResultadoCarga({
          ticketId,
          ticket: null,
          error: error instanceof Error ? error.message : "No se pudieron cargar los datos del ticket.",
        });
      }
    };

    void cargarTicket();
    return () => {
      activo = false;
    };
  }, [ticketId]);

  const resultadoActual =
    resultadoCarga.ticketId === ticketId ? resultadoCarga : null;
  const ticket = resultadoActual?.ticket || null;
  const estadoActual =
    (estadoManual?.ticketId === ticketId ? estadoManual.estado : ticket?.status) ||
    "IN_PROGRESS";
  const errorCarga = ticketId
    ? resultadoActual?.error || ""
    : "No se indicó el ticket que quieres consultar.";

  const handleCambiarEstado = async (nuevoEstado: EstadoTicket) => {
    setEstadoManual({ ticketId, estado: nuevoEstado });
    setHistorial((prev) => [
      {
        id: `h-${Date.now()}`,
        hora: "Ahora",
        autor: ticket?.assigned_technician?.name || "Técnico",
        accion: `Estado actualizado a "${MAPA_ESTADO[nuevoEstado].label}".`,
      },
      ...prev,
    ]);
    mostrarToast(`Estado del ticket actualizado a ${MAPA_ESTADO[nuevoEstado].label}`);

    try {
      await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nuevoEstado }),
      });
    } catch {
      // Silencioso en modo demo
    }
  };

  const handleRegistrarAvance = async () => {
    if (!notaTecnica.trim()) {
      mostrarToast("Escribe una nota o diagnóstico antes de registrar", "error");
      return;
    }

    setGuardandoNota(true);
    const texto = notaTecnica.trim();

    setHistorial((prev) => [
      {
        id: `h-${Date.now()}`,
        hora: "Ahora",
        autor: `${ticket?.assigned_technician?.name || "Técnico"} (Técnico)`,
        accion: texto,
      },
      ...prev,
    ]);
    setNotaTecnica("");
    setGuardandoNota(false);
    mostrarToast("Nota técnica registrada en el historial");
  };

  const handleConsultarIA = () => {
    if (!ticket) return;
    router.push(`/soporte/knowledge?ticketId=${encodeURIComponent(ticket.id)}`);
  };

  if (ticketId && !resultadoActual) {
    return <DetalleTicketSkeleton />;
  }

  if (errorCarga || !ticket) {
    return (
      <div
        role="alert"
        className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm"
      >
        <AlertCircle className="h-8 w-8 text-red-500" />
        <h1 className="text-lg font-bold text-slate-800">No se pudo abrir el ticket</h1>
        <p className="text-sm text-slate-600">{errorCarga || "No hay datos disponibles."}</p>
        <button
          type="button"
          onClick={() => router.push("/soporte/dashboard")}
          className="mt-2 rounded-lg bg-[#313652] px-4 py-2 text-sm font-semibold text-white hover:bg-[#262a40]"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  const infoPrioridad = MAPA_NIVEL[ticket.priority] || MAPA_NIVEL.MEDIUM;
  const infoImpacto = MAPA_NIVEL[ticket.impact] || MAPA_NIVEL.LOW;
  const infoUrgencia = MAPA_NIVEL[ticket.urgency] || MAPA_NIVEL.LOW;
  const infoEstado = MAPA_ESTADO[estadoActual] || MAPA_ESTADO.IN_PROGRESS;

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Toast */}
      <div
        className={`fixed left-1/2 top-6 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-lg px-6 py-3 text-white shadow-xl transition-all duration-500 ${
          toast.show ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"
        } ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
      >
        {toast.type === "success" ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <AlertCircle className="h-5 w-5" />
        )}
        <span className="font-medium">{toast.msg}</span>
      </div>

      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/soporte/dashboard"
          className="flex items-center gap-1.5 transition-colors hover:text-slate-800"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Inicio</span>
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/soporte/dashboard" className="transition-colors hover:text-slate-800">
          Mis Tickets Asignados
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="rounded-md bg-slate-200 px-2 py-0.5 font-mono font-semibold text-slate-700">
          #{ticket.code || ticket.id}
        </span>
      </nav>

      {/* Encabezado Principal */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push("/soporte/dashboard")}
            aria-label="Volver"
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
              <span className="rounded bg-indigo-100 px-2 py-0.5 font-mono text-indigo-800">
                #{ticket.code || ticket.id}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ${infoPrioridad.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${infoPrioridad.dot}`} />
                Prioridad {infoPrioridad.label.split(" / ")[0]}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 ${infoEstado.chip}`}>
                {infoEstado.label}
              </span>
              <span className="font-normal normal-case text-slate-500">
                • Creado: {ticket.created_at}
              </span>
            </div>

            <h1 className="max-w-2xl text-2xl font-bold leading-snug text-slate-800">
              {ticket.title}
            </h1>
          </div>
        </div>

        {/* Acciones del Técnico: Selector de Estado + Botón Consultar con IA */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500">Estado:</span>
            <select
              value={estadoActual}
              onChange={(e) => handleCambiarEstado(e.target.value as EstadoTicket)}
              aria-label="Cambiar estado del ticket"
              className="bg-transparent text-xs font-bold text-slate-800 outline-none"
            >
              <option value="OPEN">Abierto</option>
              <option value="IN_PROGRESS">En curso</option>
              <option value="WAITING_USER">En espera de usuario</option>
              <option value="RESOLVED">Resuelto</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleConsultarIA}
            className="flex items-center gap-2 rounded-xl bg-[#313652] px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-[#262a40] active:scale-[0.99]"
          >
            <Sparkles className="h-4 w-4 text-indigo-300" />
            Consultar con IA
          </button>
        </div>
      </div>

      {/* Layout de 2 Columnas idéntico al formulario de creación */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ============ Columna Principal (Datos completos del ticket) ============ */}
        <div className="flex flex-col gap-6">
          {/* Bloque 1: Clasificación y Modalidad */}
          <Card>
            <SectionHeader
              icon={<Tag className="h-4 w-4" />}
              titulo="Clasificación y Contexto de la Solicitud"
              subtitulo="Datos registrados por el solicitante al levantar el ticket"
              extra={
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {MAPA_TIPO[ticket.type] || ticket.type}
                </span>
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <Network className="h-3.5 w-3.5 text-[#313652]" />
                  Categoría del Servicio
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {ticket.category?.name || "General"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <Shield className="h-3.5 w-3.5 text-[#313652]" />
                  Subcategoría / Detalle
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {ticket.subcategory || "No especificada"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <IconoModalidad modality={ticket.modality} />
                  Ubicación / Modalidad afectada
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">{ticket.modality}</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-red-500" />
                  Tiempo SLA restante
                </p>
                <p
                  className={`mt-1 text-sm font-bold ${
                    ticket.priority === "CRITICAL" ? "text-red-600" : "text-slate-800"
                  }`}
                >
                  {ticket.sla_remaining}
                </p>
              </div>
            </div>
          </Card>

          {/* Bloque 2: Descripción detallada, Impacto y Urgencia */}
          <Card>
            <SectionHeader
              icon={<FileText className="h-4 w-4" />}
              titulo="Descripción del Problema e Impacto"
              subtitulo="Detalle técnico proporcionado y nivel de criticidad evaluado"
            />

            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-xs font-semibold text-slate-700">
                  Descripción detallada del incidente
                </h3>
                <div className="whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-700">
                  {ticket.description}
                </div>
              </div>

              {/* Impacto, Urgencia y Prioridad Resultante */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className={`rounded-xl border p-3.5 ${infoImpacto.card}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide opacity-80">
                      <Activity className="h-3.5 w-3.5" />
                      Impacto
                    </span>
                    <span className={`h-2 w-2 rounded-full ${infoImpacto.dot}`} />
                  </div>
                  <p className="mt-1.5 text-sm font-bold">{infoImpacto.label}</p>
                </div>

                <div className={`rounded-xl border p-3.5 ${infoUrgencia.card}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide opacity-80">
                      <Flame className="h-3.5 w-3.5" />
                      Urgencia
                    </span>
                    <span className={`h-2 w-2 rounded-full ${infoUrgencia.dot}`} />
                  </div>
                  <p className="mt-1.5 text-sm font-bold">{infoUrgencia.label}</p>
                </div>

                <div className={`rounded-xl border p-3.5 ${infoPrioridad.card}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                      Prioridad Calculada
                    </span>
                    <span className={`h-2 w-2 rounded-full ${infoPrioridad.dot}`} />
                  </div>
                  <p className="mt-1.5 text-sm font-bold">{infoPrioridad.label}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Bloque 3: Evidencias y Archivos Adjuntos */}
          <Card>
            <SectionHeader
              icon={<Paperclip className="h-4 w-4" />}
              titulo="Evidencias y Archivos Adjuntos"
              subtitulo="Capturas de pantalla, logs o documentos enviados por el usuario"
              extra={
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {ticket.attachments?.length || 0} archivos
                </span>
              }
            />

            {!ticket.attachments || ticket.attachments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                El solicitante no adjuntó archivos en este ticket.
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {ticket.attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-slate-100/70"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#313652] shadow-xs">
                        {file.type.startsWith("image/") ? (
                          <FileImage className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-500">{formatoTamano(file.size)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => mostrarToast(`Descargando ${file.name}...`)}
                      aria-label={`Descargar ${file.name}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-[#313652] hover:text-[#313652]"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Bloque 4: Bitácora / Notas Técnicas */}
          <Card>
            <SectionHeader
              icon={<History className="h-4 w-4" />}
              titulo="Seguimiento y Bitácora Técnica"
              subtitulo="Registra avances, pruebas realizadas o respuestas para el solicitante"
            />

            <div className="mb-5 flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={notaTecnica}
                  onChange={(e) => setNotaTecnica(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegistrarAvance()}
                  placeholder="Escribe un diagnóstico técnico o nota de seguimiento..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#313652] focus:bg-white"
                />
              </div>
              <button
                type="button"
                disabled={guardandoNota}
                onClick={handleRegistrarAvance}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#313652] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#262a40] disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                Registrar avance
              </button>
            </div>

            <div className="space-y-3">
              {historial.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#313652]" />
                  <div>
                    <p className="font-medium text-slate-800">{item.accion}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {item.autor} • {item.hora}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ============ Columna Lateral ============ */}
        <aside className="flex flex-col gap-6">
          {/* Tarjeta del Solicitante (mismo estilo que en Crear Solicitud) */}
          <Card className="!p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Solicitante identificado
              </h3>
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Activo
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-300">
                <Image
                  src={ticket.requester?.avatar || "/images/avatar.jpg"}
                  alt={ticket.requester?.name || "Solicitante"}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">
                  {ticket.requester?.name}
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  {[ticket.requester?.department, ticket.requester?.area]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              </div>
            </div>

            <dl className="mt-2.5 space-y-2 text-[11px]">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <Mail className="h-3.5 w-3.5" /> Correo
                </dt>
                <dd className="truncate font-semibold text-slate-800">
                  {ticket.requester?.email}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <UserCheck className="h-3.5 w-3.5" /> Técnico asignado
                </dt>
                <dd className="truncate font-semibold text-slate-800">
                  {ticket.assigned_technician?.name || "Tú"}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Tarjeta destacada: Asistente IA SOPHIA */}
          <Card className="border-indigo-200 bg-gradient-to-b from-indigo-50/80 to-white !p-5">
            <div className="mb-2.5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#313652] text-white shadow-xs">
                <Sparkles className="h-4 w-4 text-indigo-300" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Asistente Técnico IA</h3>
                <p className="text-[10px] text-slate-500">Diagnóstico guiado SOPHIA</p>
              </div>
            </div>

            <p className="mb-4 text-[11px] leading-relaxed text-slate-600">
              Analiza automáticamente este incidente, busca casos similares resueltos y obtén
              pasos sugeridos de solución para responder más rápido.
            </p>

            <button
              type="button"
              onClick={handleConsultarIA}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#313652] px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-[#262a40]"
            >
              <Sparkles className="h-4 w-4 text-indigo-300" />
              Consultar con IA
            </button>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default function DetalleTicketTecnicoPage() {
  return (
    <Suspense fallback={<DetalleTicketSkeleton />}>
      <DetalleTicketTecnicoContent />
    </Suspense>
  );
}