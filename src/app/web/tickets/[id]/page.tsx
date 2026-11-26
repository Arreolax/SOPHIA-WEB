"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  History,
  Laptop,
  Loader2,
  Mail,
  MessageSquare,
  Search,
  ShieldAlert,
  Tag,
  User,
  UserCheck,
} from "lucide-react";

type Prioridad = "Crítica" | "Alta" | "Media" | "Baja";
type EstadoTicket = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "DRAFT";

interface Tecnico {
  id: string;
  nombre: string;
  rol: string;
  correo: string;
  iniciales: string;
  estado: "Activo" | "Invitado" | "Inactivo";
  activos: number;
  capacidad: number;
}

interface HistorialItem {
  hora: string;
  autor: string;
  accion: string;
}

interface TicketDetalle {
  id: string;
  folio: string;
  hace: string;
  prioridad: Prioridad;
  asunto: string;
  categoria: string;
  contexto: string;
  solicitante: {
    nombre: string;
    username?: string;
    correo: string;
    modalidad: string;
    tipo: string;
  };
  estado: EstadoTicket;
  tecnico: string | null;
  tecnico_id: string | null;
  impactoUrgencia: string;
  descripcion: string;
  historial: HistorialItem[];
}

const estiloPrioridad: Record<Prioridad, { chip: string; dot: string }> = {
  Crítica: { chip: "bg-red-50 text-red-600", dot: "bg-red-500" },
  Alta: { chip: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500" },
  Media: { chip: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  Baja: { chip: "bg-slate-50 text-slate-500", dot: "bg-slate-300" },
};

const coloresAvatar = [
  "bg-indigo-200 text-indigo-900",
  "bg-[#313652] text-white",
  "bg-slate-800 text-white",
  "bg-sky-200 text-sky-900",
  "bg-violet-200 text-violet-900",
];

function obtenerIniciales(nombre: string) {
  return (
    nombre
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("") || "US"
  );
}

function mapearPrioridadDesdeApi(raw?: string | null): Prioridad {
  const val = String(raw || "").toUpperCase();
  if (val === "CRITICAL" || val === "CRITICA" || val === "CRÍTICA") return "Crítica";
  if (val === "HIGH" || val === "ALTA") return "Alta";
  if (val === "LOW" || val === "BAJA") return "Baja";
  return "Media";
}

function mapearPrioridadHaciaApi(p: Prioridad): string {
  switch (p) {
    case "Crítica":
      return "CRITICAL";
    case "Alta":
      return "HIGH";
    case "Baja":
      return "LOW";
    default:
      return "MEDIUM";
  }
}

function formatearTiempoRelativo(fechaIso?: string | null): string {
  if (!fechaIso) return "Reciente";
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "Reciente";

  const diffMin = Math.floor((Date.now() - fecha.getTime()) / 60000);
  if (diffMin < 1) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `Hace ${diffHoras} h`;
  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SkeletonDetalleTicket() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 py-4">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200/70" />
      <div className="grid gap-5 lg:grid-cols-[1fr_430px]">
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    </div>
  );
}

function ContenidoDetalleTicket() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const ticketId = params?.id;

  const [ticket, setTicket] = useState<TicketDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [prioridadActual, setPrioridadActual] = useState<Prioridad>("Media");
  const [tecnicoAsignadoActual, setTecnicoAsignadoActual] = useState<string | null>(null);
  const [estadoActual, setEstadoActual] = useState<EstadoTicket>("OPEN");
  const [tecnicoSeleccionadoId, setTecnicoSeleccionadoId] = useState<string>("");
  const [notaInterna, setNotaInterna] = useState("");
  const [toast, setToast] = useState<{ show: boolean; msg: string; error?: boolean }>({
    show: false,
    msg: "",
  });
  const [historial, setHistorial] = useState<HistorialItem[]>([]);

  const mostrarToast = (msg: string, error = false) => {
    setToast({ show: true, msg, error });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3200);
  };

  useEffect(() => {
    if (!ticketId) return;

    const cargarDatos = async () => {
      try {
        setCargando(true);
        setErrorCarga(null);

        // Consultar el ticket y la lista de usuarios en paralelo
        const [resTicket, resUsers, resTicketsLista] = await Promise.all([
          fetch(`/api/tickets/${ticketId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
          fetch(`/api/users`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
          fetch(`/api/tickets`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }).catch(() => null),
        ]);

        if (!resTicket.ok) {
          const errJson = await resTicket.json().catch(() => ({}));
          throw new Error(errJson.error || `No se pudo cargar el ticket (${resTicket.status})`);
        }

        const dataTicket = await resTicket.json();
        const raw = dataTicket.ticket;

        if (!raw) {
          throw new Error("La respuesta de la API no contiene datos del ticket.");
        }

        // Calcular carga activa por técnico si /api/tickets respondió correctamente
        const conteoPorTecnico: Record<string, number> = {};
        if (resTicketsLista && resTicketsLista.ok) {
          const dataLista = await resTicketsLista.json().catch(() => ({}));
          const lista = Array.isArray(dataLista.tickets) ? dataLista.tickets : [];
          for (const t of lista) {
            const st = String(t.status || "").toUpperCase();
            if (t.assigned_to && st !== "CLOSED" && st !== "RESOLVED" && st !== "DRAFT") {
              conteoPorTecnico[t.assigned_to] = (conteoPorTecnico[t.assigned_to] || 0) + 1;
            }
          }
        }

        // Procesar y filtrar SOLO los usuarios con rol "Técnico"
        let listaTecnicos: Tecnico[] = [];
        if (resUsers.ok) {
          const dataUsers = await resUsers.json();
          const todosUsuarios = Array.isArray(dataUsers.usuarios) ? dataUsers.usuarios : [];

          listaTecnicos = todosUsuarios
            .filter(
              (u: { rol?: string; estado?: string }) =>
                u.rol === "Técnico" && u.estado !== "Inactivo"
            )
            .map(
              (u: {
                id: string;
                nombre: string;
                correo: string;
                iniciales?: string;
                estado?: "Activo" | "Invitado" | "Inactivo";
              }) => ({
                id: u.id,
                nombre: u.nombre,
                rol: "Técnico de Soporte",
                correo: u.correo,
                iniciales: u.iniciales || obtenerIniciales(u.nombre),
                estado: u.estado || "Activo",
                activos: conteoPorTecnico[u.id] ?? 0,
                capacidad: 8,
              })
            );
        }

        setTecnicos(listaTecnicos);

        // Construir historial desde los comentarios reales del ticket + eventos base
        const comentariosHistorial: HistorialItem[] = Array.isArray(raw.comments)
          ? raw.comments.map(
              (c: {
                created_at?: string;
                content?: string;
                user?: { name?: string };
              }) => ({
                hora: formatearTiempoRelativo(c.created_at),
                autor: c.user?.name || "Usuario",
                accion: c.content || "",
              })
            )
          : [];

        const eventosBase: HistorialItem[] = [
          {
            hora: formatearTiempoRelativo(raw.created_at),
            autor: raw.creator?.name || "Solicitante",
            accion: `Ticket creado con prioridad ${mapearPrioridadDesdeApi(raw.priority)}.`,
          },
        ];

        if (raw.assignee?.name) {
          eventosBase.unshift({
            hora: formatearTiempoRelativo(raw.updated_at || raw.created_at),
            autor: "Sistema SOPHIA",
            accion: `Asignado actualmente a ${raw.assignee.name}.`,
          });
        }

        const folioCorto = String(raw.id).slice(0, 8).toUpperCase();
        const impacto = raw.impact ? String(raw.impact).toUpperCase() : "MEDIUM";
        const urgencia = raw.urgency ? String(raw.urgency).toUpperCase() : "MEDIUM";

        const ticketNormalizado: TicketDetalle = {
          id: String(raw.id),
          folio: folioCorto,
          hace: formatearTiempoRelativo(raw.created_at),
          prioridad: mapearPrioridadDesdeApi(raw.priority),
          asunto: raw.title || "Sin título",
          categoria: raw.category?.name || raw.subcategory || "General",
          contexto: [raw.type, raw.subcategory].filter(Boolean).join(" • ") || "Soporte técnico",
          solicitante: {
            nombre: raw.creator?.name || "Usuario",
            username: raw.creator?.username ? `@${raw.creator.username}` : undefined,
            correo: raw.creator?.email || "sin-correo@empresa.com",
            modalidad: raw.modality || "Remoto",
            tipo: raw.type || "Incidente",
          },
          estado: (String(raw.status || "OPEN").toUpperCase() as EstadoTicket),
          tecnico: raw.assignee?.name || null,
          tecnico_id: raw.assigned_to || raw.assignee?.id || null,
          impactoUrgencia: `Impacto: ${impacto} · Urgencia: ${urgencia}`,
          descripcion: raw.description || "Sin descripción detallada.",
          historial: [...comentariosHistorial, ...eventosBase],
        };

        setTicket(ticketNormalizado);
        setPrioridadActual(ticketNormalizado.prioridad);
        setTecnicoAsignadoActual(ticketNormalizado.tecnico);
        setEstadoActual(ticketNormalizado.estado);
        setHistorial(ticketNormalizado.historial);

        // Preseleccionar técnico asignado actual o el técnico con menor carga
        if (ticketNormalizado.tecnico_id) {
          setTecnicoSeleccionadoId(String(ticketNormalizado.tecnico_id));
        } else if (listaTecnicos.length > 0) {
          const menorCarga = [...listaTecnicos]
            .filter((t) => t.activos < t.capacidad)
            .sort((a, b) => a.activos / a.capacidad - b.activos / b.capacidad)[0];
          if (menorCarga) setTecnicoSeleccionadoId(menorCarga.id);
        }
      } catch (err) {
        console.error("Error al obtener datos:", err);
        setErrorCarga(
          err instanceof Error ? err.message : "Error al cargar los detalles del ticket."
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [ticketId]);

  const tecnicosOrdenados = useMemo(() => {
    return [...tecnicos].sort((a, b) => {
      const pctA = a.activos / a.capacidad;
      const pctB = b.activos / b.capacidad;
      if (pctA !== pctB) return pctA - pctB;
      return a.activos - b.activos;
    });
  }, [tecnicos]);

  const handleCambioPrioridad = async (nuevaPrioridad: Prioridad) => {
    const anterior = prioridadActual;
    setPrioridadActual(nuevaPrioridad);

    if (!ticket) return;

    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priority: mapearPrioridadHaciaApi(nuevaPrioridad),
        }),
      });

      if (!res.ok) throw new Error("No se pudo actualizar la prioridad");

      setHistorial((prev) => [
        {
          hora: "Ahora",
          autor: "Administrador",
          accion: `Prioridad actualizada de ${anterior} a ${nuevaPrioridad}.`,
        },
        ...prev,
      ]);
      mostrarToast(`Prioridad actualizada a ${nuevaPrioridad}`);
    } catch {
      setPrioridadActual(anterior);
      mostrarToast("Error al actualizar la prioridad", true);
    }
  };

  const handleConfirmarAsignacion = async () => {
    if (!tecnicoSeleccionadoId || !ticket) return;

    const tecnicoObj = tecnicos.find((t) => t.id === tecnicoSeleccionadoId);
    if (!tecnicoObj) return;

    try {
      setGuardando(true);

      const nuevoEstado: EstadoTicket =
        estadoActual === "OPEN" ? "IN_PROGRESS" : estadoActual;

      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigned_to: tecnicoObj.id,
          status: nuevoEstado,
          priority: mapearPrioridadHaciaApi(prioridadActual),
          reason: notaInterna.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo asignar el técnico");
      }

      // Actualizar contador visual de carga
      setTecnicos((prev) =>
        prev.map((t) => {
          if (t.id === tecnicoObj.id && t.id !== ticket.tecnico_id && t.activos < t.capacidad) {
            return { ...t, activos: t.activos + 1 };
          }
          if (t.id === ticket.tecnico_id && t.id !== tecnicoObj.id && t.activos > 0) {
            return { ...t, activos: t.activos - 1 };
          }
          return t;
        })
      );

      setTicket((prev) => (prev ? { ...prev, tecnico_id: tecnicoObj.id } : prev));
      setTecnicoAsignadoActual(tecnicoObj.nombre);
      setEstadoActual(nuevoEstado);
      setHistorial((prev) => [
        {
          hora: "Ahora",
          autor: "Administrador",
          accion: `Ticket asignado a ${tecnicoObj.nombre}${
            notaInterna.trim() ? ` — Nota: "${notaInterna.trim()}"` : ""
          }`,
        },
        ...prev,
      ]);
      setNotaInterna("");

      mostrarToast(`Ticket #${ticket.folio} asignado a ${tecnicoObj.nombre}`);
    } catch (error) {
      console.error("Error al asignar técnico:", error);
      mostrarToast(
        error instanceof Error ? error.message : "Error al asignar técnico",
        true
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <SkeletonDetalleTicket />;
  }

  if (errorCarga || !ticket) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <h2 className="mt-3 text-base font-bold text-slate-800">
          No se encontró el ticket
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {errorCarga ?? "Verifica que el identificador del ticket sea válido."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/web/tickets")}
          className="mt-5 rounded-xl bg-[#262a40] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1c2033]"
        >
          Volver a la Cola de Solicitudes
        </button>
      </div>
    );
  }

  const etiquetaEstado: Record<EstadoTicket, { texto: string; clase: string }> = {
    OPEN: { texto: "Abierto", clase: "bg-amber-50 text-amber-700" },
    IN_PROGRESS: { texto: "En curso", clase: "bg-emerald-50 text-emerald-700" },
    RESOLVED: { texto: "Resuelto", clase: "bg-blue-50 text-blue-700" },
    CLOSED: { texto: "Cerrado", clase: "bg-slate-100 text-slate-600" },
    DRAFT: { texto: "Borrador", clase: "bg-slate-100 text-slate-500" },
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Toast */}
      <div
        className={`fixed left-1/2 top-6 z-100 flex -translate-x-1/2 items-center gap-2 rounded-lg px-6 py-3 text-white shadow-xl transition-all duration-500 ${
          toast.error ? "bg-red-600" : "bg-emerald-500"
        } ${
          toast.show
            ? "translate-y-0 opacity-100"
            : "-translate-y-24 opacity-0 pointer-events-none"
        }`}
      >
        {toast.error ? (
          <AlertCircle className="h-5 w-5" />
        ) : (
          <CheckCircle2 className="h-5 w-5" />
        )}
        <span className="font-medium">{toast.msg}</span>
      </div>

      {/* Barra superior */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> En Guardia
          </span>
          <button
            type="button"
            aria-label="Notificaciones"
            className="relative rounded-full p-2 text-slate-600 hover:bg-white"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </div>
      </div>

      {/* Breadcrumb directo desde Cola de Solicitudes */}
      <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-400">
        <button
          type="button"
          onClick={() => router.push("/web/tickets")}
          className="cursor-pointer hover:text-slate-600"
        >
          Cola de Solicitudes
        </button>
        <span>›</span>
        <span className="font-semibold text-slate-600">#{ticket.folio}</span>
      </nav>

      {/* Encabezado del Ticket */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-[#313652]">
                #{ticket.folio}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                  estiloPrioridad[prioridadActual]?.chip ?? "bg-slate-100 text-slate-600"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    estiloPrioridad[prioridadActual]?.dot ?? "bg-slate-400"
                  }`}
                />
                {prioridadActual}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                  etiquetaEstado[estadoActual]?.clase ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {etiquetaEstado[estadoActual]?.texto ?? estadoActual}
              </span>
              <span className="text-[11px] text-slate-400">• {ticket.hace}</span>
            </div>

            <h1 className="mt-1.5 text-xl font-bold leading-snug text-slate-800">
              {ticket.asunto}
            </h1>
          </div>
        </div>

        {/* Selector de prioridad */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Prioridad:</span>
          <select
            value={prioridadActual}
            onChange={(e) => handleCambioPrioridad(e.target.value as Prioridad)}
            className="rounded-lg border border-slate-200 bg-indigo-50/60 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#313652]"
          >
            <option value="Crítica">Crítica</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>
        </div>
      </div>

      {/* Grid Principal: Datos del Ticket (Izquierda) + Lista scrolleable de Técnicos (Derecha) */}
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_430px]">
        {/* COLUMNA IZQUIERDA: Detalles del Ticket */}
        <div className="space-y-5">
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <FileText className="h-4 w-4 text-[#313652]" />
                Datos del ticket
              </h2>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {ticket.categoria}
              </span>
            </div>

            {/* Métricas clave */}
            <div className="grid gap-3 text-xs sm:grid-cols-3">
              <div className="rounded-xl bg-indigo-50/50 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <Clock className="h-3 w-3" /> Severidad
                </p>
                <p
                  className={`mt-1 font-bold ${
                    prioridadActual === "Crítica" ? "text-red-600" : "text-slate-800"
                  }`}
                >
                  {ticket.impactoUrgencia}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50/50 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <UserCheck className="h-3 w-3" /> Técnico actual
                </p>
                <p className="mt-1 font-bold text-slate-800">
                  {tecnicoAsignadoActual ?? "Sin asignar"}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50/50 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <Tag className="h-3 w-3" /> Clasificación
                </p>
                <p className="mt-1 font-semibold text-slate-700">{ticket.contexto}</p>
              </div>
            </div>

            {/* Datos del Solicitante */}
            <div className="space-y-2.5 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold text-slate-800">Información del solicitante</h3>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-200 text-xs font-bold text-indigo-900">
                    {obtenerIniciales(ticket.solicitante.nombre)}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-800">{ticket.solicitante.nombre}</p>
                      {ticket.solicitante.username && (
                        <span className="text-[11px] text-slate-400">
                          {ticket.solicitante.username}
                        </span>
                      )}
                    </div>
                    <p className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Mail className="h-3 w-3 text-slate-400" />
                      {ticket.solicitante.correo}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span className="flex items-center gap-1 rounded-md border border-slate-200/80 bg-white px-2.5 py-1">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    {ticket.solicitante.tipo}
                  </span>
                  <span className="flex items-center gap-1 rounded-md border border-slate-200/80 bg-white px-2.5 py-1">
                    <Laptop className="h-3 w-3 text-slate-400" />
                    {ticket.solicitante.modalidad}
                  </span>
                </div>
              </div>
            </div>

            {/* Descripción del problema */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold text-slate-800">Descripción del incidente</h3>
              <p className="whitespace-pre-line rounded-xl bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600">
                {ticket.descripcion}
              </p>
            </div>
          </section>

          {/* Bitácora / Actividad */}
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <History className="h-4 w-4 text-[#313652]" />
              Historial y comentarios del ticket
            </h2>

            <div className="space-y-3">
              {historial.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#313652]" />
                  <div>
                    <p className="font-medium text-slate-700">{item.accion}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {item.autor} • {item.hora}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: Solo Técnicos ordenados de menor a mayor carga (con scroll) */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <User className="h-4 w-4 text-[#313652]" />
                Asignar técnico responsable
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Técnicos disponibles ordenados de menor a mayor carga actual.
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
              {tecnicosOrdenados.length} técnicos
            </span>
          </div>

          {/* Lista con Scroll de solo técnicos */}
          {tecnicosOrdenados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
              No hay técnicos registrados o activos en el sistema.
            </div>
          ) : (
            <div className="max-h-85 space-y-2.5 overflow-y-auto pr-1">
              {tecnicosOrdenados.map((tec, i) => {
                const saturado = tec.activos >= tec.capacidad;
                const pct = Math.min(100, Math.round((tec.activos / tec.capacidad) * 100));
                const seleccionado = tecnicoSeleccionadoId === tec.id;

                return (
                  <button
                    key={tec.id}
                    type="button"
                    disabled={saturado}
                    onClick={() => setTecnicoSeleccionadoId(tec.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      saturado
                        ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                        : seleccionado
                        ? "border-[#313652] bg-indigo-50/80 ring-1 ring-[#313652]"
                        : "border-transparent bg-indigo-50/40 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                            seleccionado
                              ? "bg-[#313652] text-white"
                              : coloresAvatar[i % coloresAvatar.length]
                          }`}
                        >
                          {tec.iniciales}
                        </span>
                        <div className="leading-tight">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-800">{tec.nombre}</p>
                            {i === 0 && !saturado && (
                              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                                Menor carga
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500">{tec.correo}</p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          saturado
                            ? "bg-red-100 text-red-600"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {tec.activos} / {tec.capacidad} ({pct}%)
                        {saturado && " · Saturado"}
                      </span>
                    </div>

                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          saturado ? "bg-red-600" : "bg-[#313652]"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Nota interna opcional */}
          <div className="border-t border-slate-100 pt-3">
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
              <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
              Motivo o nota de asignación (opcional)
            </label>
            <textarea
              rows={2}
              value={notaInterna}
              onChange={(e) => setNotaInterna(e.target.value)}
              placeholder="Añade contexto adicional o indicaciones para el técnico..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#313652] focus:bg-white"
            />
          </div>

          {/* Botones de acción */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              disabled={guardando || !tecnicoSeleccionadoId}
              onClick={handleConfirmarAsignacion}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#262a40] px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-[#1c2033] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {guardando
                ? "Guardando..."
                : tecnicoAsignadoActual
                ? "Reasignar Ticket"
                : "Confirmar Asignación"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/web/tickets")}
              className="w-full rounded-xl bg-indigo-50 px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-indigo-100"
            >
              Volver a la Cola
            </button>
          </div>

          <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            El cambio se registra en auditoría y notifica al técnico asignado.
          </p>
        </section>
      </div>
    </div>
  );
}

export default function DetalleTicketAdminPage() {
  return (
    <Suspense fallback={<SkeletonDetalleTicket />}>
      <ContenidoDetalleTicket />
    </Suspense>
  );
}