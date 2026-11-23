"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  Bookmark,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns3,
  Hourglass,
  Laptop,
  ListChecks,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Smartphone,
  Table2,
  TimerOff,
  TriangleAlert,
  UserCheck,
  X,
  Zap,
} from "lucide-react";

/* ---------- Tipos ---------- */
type Prioridad = "Crítica" | "Alta" | "Media" | "Baja";
type EstadoFlujo =
  | "Nuevo"
  | "En Investigación"
  | "En Triaje L2"
  | "Esperando Aprobación"
  | "Esperando Usuario";

type Ticket = {
  uuid: string;
  id: string;
  hace: string;
  minutos: number;
  prioridad: Prioridad;
  asunto: string;
  categoria: string;
  contexto: string;
  solicitante: { nombre: string; area: string; equipo: string };
  estado: EstadoFlujo;
  tecnico: string | null;
  resueltoHoy: boolean;
  sla: { texto: string; restantePct: number; pausado: boolean };
};

type ApiTicket = {
  id: string;
  title: string;
  description: string;
  type: string;
  modalidad: string | null;
  subcategory: string | null;
  impact: string;
  urgency: string;
  priority: string;
  status: string;
  diagnosis: string | null;
  resolution: string | null;
  draft: boolean | null;
  category_id: string;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string | null;
  category?: { id: string; name: string } | null;
  creator?: { id: string; name: string; username: string | null; email: string } | null;
  assignee?: { id: string; name: string; username: string | null; email: string } | null;
};

type PerfilResponse = {
  name?: string;
  lastname?: string;
};

const ESTADOS: EstadoFlujo[] = [
  "Nuevo",
  "En Investigación",
  "En Triaje L2",
  "Esperando Aprobación",
  "Esperando Usuario",
];

const PRIORIDADES: Prioridad[] = ["Crítica", "Alta", "Media", "Baja"];

const SLA_TOTAL: Record<Prioridad, number> = {
  Crítica: 240,
  Alta: 480,
  Media: 1440,
  Baja: 1440,
};

const textoDuracion = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
};

const formatearHace = (min: number) => {
  if (min < 1) return "Hace un momento";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m > 0 ? `Hace ${h}h ${String(m).padStart(2, "0")}m` : `Hace ${h}h`;
  const d = Math.floor(h / 24);
  return `Hace ${d}d`;
};

const mapearPrioridad = (val?: string): Prioridad => {
  const p = String(val || "").toUpperCase();
  if (p === "CRITICAL" || p === "CRITICA" || p === "CRÍTICA") return "Crítica";
  if (p === "HIGH" || p === "ALTA") return "Alta";
  if (p === "MEDIUM" || p === "MEDIA") return "Media";
  return "Baja";
};

const mapearEstado = (status?: string, prioridad?: Prioridad): EstadoFlujo => {
  const s = String(status || "").toUpperCase();
  if (s === "OPEN" || s === "NEW" || s === "NUEVO") return "Nuevo";
  if (s === "PENDING_APPROVAL" || s === "WAITING_APPROVAL") return "Esperando Aprobación";
  if (s === "PENDING" || s === "ON_HOLD" || s === "WAITING_USER") return "Esperando Usuario";
  if (s === "ESCALATED" || prioridad === "Crítica") return "En Triaje L2";
  return "En Investigación";
};

const mapearTicketApi = (t: ApiTicket): Ticket => {
  const creado = new Date(t.created_at).getTime();
  const minutos = Math.max(0, Math.floor((Date.now() - creado) / 60000));
  const prioridad = mapearPrioridad(t.priority);
  const estado = mapearEstado(t.status, prioridad);
  const pausado = estado === "Esperando Usuario" || estado === "Esperando Aprobación";

  const total = SLA_TOTAL[prioridad];
  const restante = Math.max(0, total - minutos);
  const restantePct = Math.max(0, Math.min(100, Math.round((restante / total) * 100)));

  const prefijo = String(t.type || "").toUpperCase().startsWith("REQ") ? "REQ" : "INC";
  const codigo = `${prefijo}-${t.id.slice(0, 8).toUpperCase()}`;

  const statusUpper = String(t.status || "").toUpperCase();
  const esResuelto = statusUpper === "RESOLVED" || statusUpper === "CLOSED";
  const refFecha = t.updated_at ? new Date(t.updated_at) : new Date(t.created_at);
  const hoy = new Date();
  const resueltoHoy =
    esResuelto &&
    refFecha.getDate() === hoy.getDate() &&
    refFecha.getMonth() === hoy.getMonth() &&
    refFecha.getFullYear() === hoy.getFullYear();

  return {
    uuid: t.id,
    id: codigo,
    hace: formatearHace(minutos),
    minutos,
    prioridad,
    asunto: t.title,
    categoria: t.category?.name || "General",
    contexto:
      [t.subcategory, `Impacto: ${t.impact}`, `Urgencia: ${t.urgency}`]
        .filter(Boolean)
        .join(" • "),
    solicitante: {
      nombre: t.creator?.name || t.creator?.username || t.creator?.email || "Usuario",
      area: t.modalidad || "Sede Central",
      equipo: t.type || "INCIDENTE",
    },
    estado,
    tecnico: t.assignee?.name || t.assignee?.username || null,
    resueltoHoy,
    sla: pausado
      ? { texto: "En pausa: SLA Pausado", restantePct, pausado: true }
      : {
          texto: restante > 0 ? `${textoDuracion(restante)} restante` : "SLA Vencido",
          restantePct,
          pausado: false,
        },
  };
};

/* ---------- Utilidades de estilo ---------- */
const estiloPrioridad: Record<Prioridad, { chip: string; dot: string }> = {
  Crítica: { chip: "bg-red-50 text-red-600", dot: "bg-red-500" },
  Alta: { chip: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500" },
  Media: { chip: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  Baja: { chip: "bg-slate-50 text-slate-500", dot: "bg-slate-300" },
};

const estiloEstado: Record<EstadoFlujo, string> = {
  Nuevo: "bg-indigo-100 text-indigo-800",
  "En Investigación": "bg-indigo-50 text-indigo-700",
  "En Triaje L2": "bg-indigo-50 text-indigo-700",
  "Esperando Aprobación": "bg-slate-200 text-slate-700",
  "Esperando Usuario": "bg-slate-100 text-slate-600",
};

const coloresAvatar = [
  "bg-indigo-200 text-indigo-900",
  "bg-[#313652] text-white",
  "bg-slate-800 text-white",
  "bg-sky-200 text-sky-900",
  "bg-violet-200 text-violet-900",
];

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const esRiesgo = (t: Ticket) => !t.sla.pausado && t.sla.restantePct <= 20;

const RANGOS = [
  { id: "8h", label: "Últimas 8 h", max: 480 },
  { id: "24h", label: "Hoy (24h)", max: 1440 },
  { id: "7d", label: "Últimos 7 días", max: 10080 },
  { id: "all", label: "Todo el historial", max: Infinity },
];

function Select({
  value,
  onChange,
  children,
  label,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-slate-200 bg-indigo-50/60 py-2 pl-3 pr-8 text-xs font-medium text-slate-700 outline-none focus:border-[#313652]"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

/* ---------- Skeleton de Carga ---------- */
function TicketsSoporteSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse" aria-busy="true" aria-label="Cargando panel de tickets">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="h-9 w-full max-w-md rounded-xl bg-slate-200/80" />
          <div className="h-9 w-36 rounded-lg bg-slate-200/80" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-7 w-28 rounded-full bg-slate-200/80" />
          <div className="h-8 w-8 rounded-full bg-slate-200/80" />
          <div className="h-8 w-8 rounded-full bg-slate-300/80" />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-md space-y-2">
          <div className="h-7 w-52 rounded-lg bg-slate-200/90" />
          <div className="h-4 w-full rounded bg-slate-200/70" />
          <div className="h-4 w-3/4 rounded bg-slate-200/70" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-8 w-36 rounded-lg bg-slate-200/80" />
          <div className="h-8 w-44 rounded-lg bg-slate-200/80" />
          <div className="h-8 w-36 rounded-lg bg-slate-200/80" />
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded bg-slate-200/80" />
              <div className="h-7 w-7 rounded-lg bg-slate-200/80" />
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div className="h-8 w-12 rounded-md bg-slate-200/90" />
              <div className="h-4 w-16 rounded bg-slate-200/70" />
            </div>
            <div className="mt-3 h-3 w-32 rounded bg-slate-200/70" />
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-200/90" />
          <div className="space-y-2">
            <div className="h-4 w-72 max-w-full rounded bg-slate-200/90" />
            <div className="h-3 w-48 rounded bg-slate-200/70" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div className="h-3 w-32 rounded bg-slate-200/70" />
          <div className="h-3 w-32 rounded bg-slate-200/70" />
          <div className="h-3 w-32 rounded bg-slate-200/70" />
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-9 min-w-55 flex-1 rounded-lg bg-slate-200/80" />
          <div className="h-9 w-36 rounded-lg bg-slate-200/80" />
          <div className="h-9 w-44 rounded-lg bg-slate-200/80" />
          <div className="h-9 w-44 rounded-lg bg-slate-200/80" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="h-4 w-44 rounded bg-slate-200/70" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-36 rounded-lg bg-slate-200/80" />
            <div className="h-8 w-44 rounded-lg bg-slate-200/80" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-275 text-left">
            <thead>
              <tr className="bg-indigo-50/70">
                <th className="w-10 px-4 py-3.5"><div className="h-3.5 w-3.5 rounded bg-slate-300/80" /></th>
                <th className="px-3 py-3.5"><div className="h-3 w-16 rounded bg-slate-300/80" /></th>
                <th className="px-3 py-3.5"><div className="h-3 w-16 rounded bg-slate-300/80" /></th>
                <th className="px-3 py-3.5"><div className="h-3 w-32 rounded bg-slate-300/80" /></th>
                <th className="px-3 py-3.5"><div className="h-3 w-24 rounded bg-slate-300/80" /></th>
                <th className="px-3 py-3.5"><div className="h-3 w-24 rounded bg-slate-300/80" /></th>
                <th className="px-3 py-3.5"><div className="h-3 w-16 rounded bg-slate-300/80" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-4 align-top">
                    <div className="mt-1 h-3.5 w-3.5 rounded bg-slate-200/80" />
                  </td>
                  <td className="px-3 py-4 align-top space-y-1.5">
                    <div className="h-3.5 w-24 rounded bg-slate-200/90" />
                    <div className="h-2.5 w-16 rounded bg-slate-200/70" />
                  </td>
                  <td className="px-3 py-4 align-top">
                    <div className="h-5 w-16 rounded-full bg-slate-200/80" />
                  </td>
                  <td className="px-3 py-4 align-top space-y-2">
                    <div className="h-3.5 w-72 rounded bg-slate-200/90" />
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-20 rounded bg-slate-200/70" />
                      <div className="h-3 w-40 rounded bg-slate-200/70" />
                    </div>
                  </td>
                  <td className="px-3 py-4 align-top">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200/90" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-28 rounded bg-slate-200/90" />
                        <div className="h-2.5 w-32 rounded bg-slate-200/70" />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 align-top">
                    <div className="w-40 space-y-2">
                      <div className="flex justify-between">
                        <div className="h-3 w-24 rounded bg-slate-200/80" />
                        <div className="h-3 w-8 rounded bg-slate-200/80" />
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200/80" />
                    </div>
                  </td>
                  <td className="px-3 py-4 align-top">
                    <div className="h-5 w-28 rounded-full bg-slate-200/80" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="h-3.5 w-48 rounded bg-slate-200/70" />
            <div className="h-6 w-32 rounded bg-slate-200/70" />
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-7 w-7 rounded-md bg-slate-200/80" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="h-4 w-40 rounded bg-slate-200/90" />
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-slate-200/70" />
          <div className="h-3 w-5/6 rounded bg-slate-200/70" />
        </div>
        <div className="h-16 w-full rounded-xl bg-slate-200/70" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 w-32 rounded bg-slate-200/70" />
          <div className="h-3 w-24 rounded bg-slate-200/80" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Página ---------- */
export default function TicketsSoportePage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [nombreTecnico, setNombreTecnico] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [fPrioridad, setFPrioridad] = useState("todas");
  const [fCategoria, setFCategoria] = useState("todas");
  const [fEstado, setFEstado] = useState("todos");
  const [fRango, setFRango] = useState("all");
  const [vista, setVista] = useState<"tabla" | "kanban">("tabla");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(5);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [sync, setSync] = useState("--:--:--");
  const [refrescando, setRefrescando] = useState(false);
  const [actualizandoLote, setActualizandoLote] = useState(false);
  const [vistaGuardada, setVistaGuardada] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  const cargarDatos = useCallback(async (esRefrescoManual = false) => {
    if (esRefrescoManual) setRefrescando(true);
    setErrorCarga("");

    try {
      const [resPerfil, resTickets] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/tickets?assigned=true"),
      ]);

      if (resPerfil.ok) {
        const perfil = (await resPerfil.json()) as PerfilResponse;
        const nombre = [perfil.name, perfil.lastname]
          .filter((parte): parte is string => Boolean(parte?.trim()))
          .join(" ")
          .trim();
        setNombreTecnico(nombre || "Técnico");
      }

      if (!resTickets.ok) {
        throw new Error("No se pudieron obtener los tickets asignados.");
      }

      const dataTickets = (await resTickets.json()) as { tickets?: ApiTicket[] };
      const mapeados = (dataTickets.tickets || []).map(mapearTicketApi);
      setTickets(mapeados);
      setSync(new Date().toLocaleTimeString("es-MX", { hour12: false }));
    } catch {
      setErrorCarga("No se pudieron cargar tus tickets asignados.");
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const mostrarToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const abrirTicket = (ticket: Ticket) => {
    router.push(`/soporte/ticket?id=${encodeURIComponent(ticket.uuid)}`);
  };

  const categoriasDisponibles = useMemo(() => {
    return Array.from(new Set(tickets.map((t) => t.categoria))).sort();
  }, [tickets]);

  /* ---- Indicadores calculados ---- */
  const kpi = useMemo(() => {
    const activos = tickets.filter((t) => !t.resueltoHoy);
    const total = activos.length;
    return {
      riesgo: activos.filter(esRiesgo).length,
      criticosRiesgo: activos.filter((t) => esRiesgo(t) && t.prioridad === "Crítica").length,
      mios: total,
      total,
      capacidad: Math.min(100, Math.round((total / 32) * 100)),
      resueltosHoy: tickets.filter((t) => t.resueltoHoy).length,
    };
  }, [tickets]);

  /* ---- Filtrado ---- */
  const rangoMax = RANGOS.find((r) => r.id === fRango)?.max ?? Infinity;
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return tickets.filter((t) => {
      if (q && !`${t.id} ${t.asunto} ${t.solicitante.nombre} ${t.categoria}`.toLowerCase().includes(q)) return false;
      if (fPrioridad !== "todas" && t.prioridad !== fPrioridad) return false;
      if (fCategoria !== "todas" && t.categoria !== fCategoria) return false;
      if (fEstado !== "todos" && t.estado !== fEstado) return false;
      return t.minutos <= rangoMax;
    });
  }, [tickets, busqueda, fPrioridad, fCategoria, fEstado, rangoMax]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const visibles = filtrados.slice(inicio, inicio + porPagina);

  const chips: { clave: string; texto: string; quitar: () => void }[] = [];
  if (fPrioridad !== "todas") chips.push({ clave: "p", texto: `Prioridad: ${fPrioridad}`, quitar: () => setFPrioridad("todas") });
  if (fCategoria !== "todas") chips.push({ clave: "c", texto: `Categoría: ${fCategoria}`, quitar: () => setFCategoria("todas") });
  if (fEstado !== "todos") chips.push({ clave: "e", texto: `Estado: ${fEstado}`, quitar: () => setFEstado("todos") });
  if (fRango !== "all") chips.push({ clave: "r", texto: `Rango: ${RANGOS.find((r) => r.id === fRango)?.label}`, quitar: () => setFRango("all") });

  const limpiarFiltros = () => {
    setBusqueda("");
    setFPrioridad("todas");
    setFCategoria("todas");
    setFEstado("todos");
    setFRango("all");
    setPagina(1);
  };

  /* ---- Selección y acciones ---- */
  const todosVisiblesMarcados = visibles.length > 0 && visibles.every((t) => seleccion.includes(t.uuid));
  const alternarTodos = () =>
    setSeleccion((prev) =>
      todosVisiblesMarcados
        ? prev.filter((uuid) => !visibles.some((t) => t.uuid === uuid))
        : Array.from(new Set([...prev, ...visibles.map((t) => t.uuid)])),
    );
  const alternarUno = (uuid: string) =>
    setSeleccion((prev) => (prev.includes(uuid) ? prev.filter((x) => x !== uuid) : [...prev, uuid]));

  const subirPrioridad = async () => {
    if (seleccion.length === 0 || actualizandoLote) return;
    setActualizandoLote(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketIds: seleccion,
          priority: "HIGH",
        }),
      });

      if (!res.ok) {
        throw new Error("Error al actualizar prioridad");
      }

      setTickets((prev) =>
        prev.map((t) => (seleccion.includes(t.uuid) ? { ...t, prioridad: "Alta" as Prioridad } : t))
      );
      mostrarToast(`${seleccion.length} ticket(s) marcados con prioridad Alta`);
      setSeleccion([]);
    } catch {
      mostrarToast("No se pudo actualizar la prioridad");
    } finally {
      setActualizandoLote(false);
    }
  };

  const paginas = (): (number | "…")[] => {
    if (totalPaginas <= 6) return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    const set = new Set<number>([1, totalPaginas, paginaActual - 1, paginaActual, paginaActual + 1]);
    if (paginaActual <= 3) [2, 3].forEach((n) => set.add(n));
    const orden = Array.from(set)
      .filter((n) => n >= 1 && n <= totalPaginas)
      .sort((x, y) => x - y);
    const res: (number | "…")[] = [];
    orden.forEach((n, i) => {
      if (i > 0 && n - orden[i - 1] > 1) res.push("…");
      res.push(n);
    });
    return res;
  };

  const Avatar = ({ nombre, i, tam = "h-7 w-7" }: { nombre: string; i: number; tam?: string }) => (
    <span className={`flex ${tam} shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${coloresAvatar[i % coloresAvatar.length]}`}>
      {iniciales(nombre)}
    </span>
  );

  const ChipPrioridad = ({ p }: { p: Prioridad }) => (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${estiloPrioridad[p].chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${estiloPrioridad[p].dot}`} />
      {p}
    </span>
  );

  const CeldaSla = ({ t }: { t: Ticket }) => {
    if (t.sla.pausado)
      return (
        <div className="w-40">
          <p className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
            <TimerOff className="h-3 w-3" /> {t.sla.texto}
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-slate-400" style={{ width: `${100 - t.sla.restantePct}%` }} />
          </div>
        </div>
      );
    const rojo = esRiesgo(t);
    return (
      <div className="w-40">
        <div className="flex items-center justify-between text-[10px] font-semibold">
          <span className={`flex items-center gap-1 ${rojo ? "text-red-600" : "text-slate-600"}`}>
            {rojo ? (
              t.sla.restantePct <= 10 ? <Hourglass className="h-3 w-3" /> : <TriangleAlert className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {t.sla.texto}
          </span>
          <span className={rojo ? "text-red-600" : "text-slate-400"}>{t.sla.restantePct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full ${rojo ? "bg-red-600" : "bg-[#313652]"}`}
            style={{ width: `${100 - t.sla.restantePct}%` }}
          />
        </div>
      </div>
    );
  };

  if (cargando) {
    return <TicketsSoporteSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Toast */}
      <div
        className={`fixed left-1/2 top-6 z-100 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-white shadow-xl transition-all duration-500 ${
          toast.show ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"
        }`}
      >
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-medium">{toast.msg}</span>
      </div>

      {/* Barra superior */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            <Search className="h-3.5 w-3.5" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar tickets, usuarios, incidentes o IPs..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
            <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">⌘K</kbd>
          </div>
          <Select value="general" onChange={() => {}} label="Cola" className="w-36">
            <option value="general">Cola General</option>
            <option value="redes">Cola Redes L2</option>
            <option value="sso">Cola Identidad</option>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> En Guardia
            <ChevronDown className="h-3 w-3 text-indigo-400" />
          </span>
          <button type="button" aria-label="Notificaciones" className="relative rounded-full p-2 text-slate-600 hover:bg-white">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </div>
      </div>

      {/* Encabezado */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold text-slate-800">Tickets de Soporte</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestión centralizada de incidentes, peticiones de servicio y balance de carga técnica en tiempo real.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={seleccion.length === 0}
            onClick={() => mostrarToast(`${seleccion.length} seleccionados: usa las acciones de la barra inferior`)}
            className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-slate-600 enabled:hover:bg-indigo-100 disabled:opacity-60"
          >
            <ListChecks className="h-4 w-4" />
            Acciones por Lote{seleccion.length > 0 && ` (${seleccion.length})`}
          </button>
          <button
            type="button"
            onClick={() => void cargarDatos(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-indigo-100"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refrescando ? "animate-spin" : ""}`} />
            Última sinc.: <span className="font-mono">{sync}</span>
          </button>
          <div className="flex rounded-lg bg-white p-1 text-xs font-medium shadow-sm ring-1 ring-slate-200">
            {[
              { id: "tabla", label: "Tabla", icono: <Table2 className="h-3.5 w-3.5" /> },
              { id: "kanban", label: "Kanban", icono: <Columns3 className="h-3.5 w-3.5" /> },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={vista === v.id}
                onClick={() => setVista(v.id as "tabla" | "kanban")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
                  vista === v.id ? "bg-indigo-50 text-slate-800" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {v.icono}
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Indicadores */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            En Riesgo SLA
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500"><ShieldAlert className="h-4 w-4" /></span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-bold text-red-600">{kpi.riesgo}</span>
            <span className="mb-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">&lt; 1 hora</span>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-red-600">
            <TriangleAlert className="h-3 w-3" /> {kpi.criticosRiesgo} Críticos en cola activa
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            Mis Asignados
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><UserCheck className="h-4 w-4" /></span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-800">{kpi.mios}</span>
            <span className="mb-1 text-[10px] text-slate-400">En progreso</span>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Carga equilibrada (L2)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            Cola Total Activa
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Activity className="h-4 w-4" /></span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-800">{kpi.total}</span>
            <span className="mb-1 text-[10px] text-slate-400">{kpi.capacidad}% cap.</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[#313652]" style={{ width: `${kpi.capacidad}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            Resueltos Hoy
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><CheckCircle2 className="h-4 w-4" /></span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-800">{kpi.resueltosHoy}</span>
            <span className="mb-1 text-[10px] text-slate-400">SLA 92%</span>
          </div>
          <p className="mt-2 text-[10px] font-medium text-slate-600">↗ Seguimiento en tiempo real</p>
        </div>
      </div>

      {/* Banner de guardia */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#313652] text-white"><Shield className="h-5 w-5" /></span>
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
              Guardia L2 Especializada: Redes, Conectividad y SSO
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">Turno A Activo</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Operador responsable: {nombreTecnico || "Técnico"}
            </p>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] text-slate-500">
          <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /><strong className="text-slate-700">Crítico:</strong> 1h resp / 4h resol.</li>
          <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /><strong className="text-slate-700">Alta:</strong> 2h resp / 8h resol.</li>
          <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" /><strong className="text-slate-700">Media | Baja:</strong> 4h resp / 24h</li>
        </ul>
      </div>

      {/* Filtros */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-55 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-indigo-50/60 px-3 py-2 text-xs">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por ID (INC), solicitante, asunto o palabra clave..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </div>
          <Select value={fPrioridad} onChange={(v) => { setFPrioridad(v); setPagina(1); }} label="Prioridad" className="w-36">
            <option value="todas">Prioridad: Todas</option>
            {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
          <Select value={fCategoria} onChange={(v) => { setFCategoria(v); setPagina(1); }} label="Categoría" className="w-44">
            <option value="todas">Todas las Categorías</option>
            {categoriasDisponibles.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={fEstado} onChange={(v) => { setFEstado(v); setPagina(1); }} label="Estado" className="w-44">
            <option value="todos">Estado: Todos</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="font-bold uppercase tracking-wide text-slate-400">Filtros activos:</span>
            {chips.length === 0 && <span className="text-slate-400">Ninguno</span>}
            {chips.map((c) => (
              <span key={c.clave} className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-slate-700">
                {c.texto}
                <button type="button" aria-label={`Quitar ${c.texto}`} onClick={() => { c.quitar(); setPagina(1); }}>
                  <X className="h-3 w-3 text-slate-500 hover:text-slate-800" />
                </button>
              </span>
            ))}
            {chips.length > 0 && (
              <button type="button" onClick={limpiarFiltros} className="font-medium text-indigo-600 hover:underline">
                Limpiar todo
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setVistaGuardada(true);
                mostrarToast("Vista guardada");
              }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-indigo-100"
            >
              <Bookmark className={`h-3.5 w-3.5 ${vistaGuardada ? "fill-[#313652] text-[#313652]" : ""}`} />
              Guardar esta vista
            </button>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <select
                value={fRango}
                aria-label="Rango de fechas"
                onChange={(e) => { setFRango(e.target.value); setPagina(1); }}
                className="appearance-none rounded-lg bg-indigo-50 py-2 pl-9 pr-8 text-[11px] font-medium text-slate-700 outline-none"
              >
                {RANGOS.map((r) => <option key={r.id} value={r.id}>Rango: {r.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de acciones por lote */}
      {seleccion.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#313652] px-4 py-3 text-xs text-white shadow-md">
          <span className="font-semibold">{seleccion.length} ticket(s) seleccionados</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={actualizandoLote}
              onClick={() => void subirPrioridad()}
              className="rounded-lg bg-white/15 px-3 py-1.5 font-medium hover:bg-white/25 disabled:opacity-60"
            >
              {actualizandoLote ? "Actualizando..." : "Marcar prioridad Alta"}
            </button>
            <button type="button" onClick={() => setSeleccion([])} className="rounded-lg px-3 py-1.5 font-medium text-white/80 hover:text-white">
              Limpiar selección
            </button>
          </div>
        </div>
      )}

      {/* Tabla / Kanban */}
      {vista === "tabla" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-275 text-left text-xs">
              <thead>
                <tr className="bg-indigo-50/70 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todos"
                      checked={todosVisiblesMarcados}
                      onChange={alternarTodos}
                      className="h-3.5 w-3.5 rounded border-slate-300 accent-[#313652]"
                    />
                  </th>
                  <th className="px-3 py-3">Ticket ID</th>
                  <th className="px-3 py-3">Prioridad</th>
                  <th className="px-3 py-3">Asunto &amp; Categoría</th>
                  <th className="px-3 py-3">Solicitante</th>
                  <th className="px-3 py-3">SLA | Restante</th>
                  <th className="px-3 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                      {errorCarga ||
                        (tickets.length === 0
                          ? "No tienes tickets asignados actualmente."
                          : "No hay tickets que coincidan con los filtros.")}
                    </td>
                  </tr>
                )}
                {visibles.map((t, i) => (
                  <tr
                    key={t.uuid}
                    onClick={() => abrirTicket(t)}
                    className={`cursor-pointer hover:bg-slate-50 ${seleccion.includes(t.uuid) ? "bg-indigo-50/50" : ""}`}
                  >
                    <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${t.id}`}
                        checked={seleccion.includes(t.uuid)}
                        onChange={() => alternarUno(t.uuid)}
                        className="mt-1 h-3.5 w-3.5 rounded border-slate-300 accent-[#313652]"
                      />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirTicket(t);
                        }}
                        className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-800 hover:text-indigo-700"
                      >
                        {esRiesgo(t) && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                        #{t.id}
                      </button>
                      <p className="mt-0.5 text-[10px] text-slate-400">{t.hace}</p>
                    </td>
                    <td className="px-3 py-3 align-top"><ChipPrioridad p={t.prioridad} /></td>
                    <td className="px-3 py-3 align-top">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirTicket(t);
                        }}
                        className="max-w-sm text-left text-xs font-bold leading-snug text-slate-800 hover:text-indigo-700"
                      >
                        {t.asunto}
                      </button>
                      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">{t.categoria}</span>
                        <span>• {t.contexto}</span>
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Avatar nombre={t.solicitante.nombre} i={inicio + i} tam="h-8 w-8" />
                        <div className="leading-tight">
                          <p className="text-xs font-bold text-slate-800">{t.solicitante.nombre}</p>
                          <p className="flex items-center gap-1 text-[10px] text-slate-500">
                            {t.solicitante.area} •{" "}
                            {t.solicitante.equipo.includes("iPhone") ? <Smartphone className="h-3 w-3" /> : <Laptop className="h-3 w-3" />}
                            {t.solicitante.equipo}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top"><CeldaSla t={t} /></td>
                    <td className="px-3 py-3 align-top">
                      <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${estiloEstado[t.estado]}`}>
                        {t.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500">
            <div className="flex items-center gap-4">
              <span>
                Mostrando {filtrados.length === 0 ? 0 : inicio + 1}-{Math.min(inicio + porPagina, filtrados.length)} de{" "}
                <strong className="text-slate-800">{filtrados.length}</strong> tickets filtrados
              </span>
              <label className="flex items-center gap-2">
                Filas por página:
                <select
                  value={porPagina}
                  onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1); }}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none"
                >
                  {[5, 10, 20].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Página anterior"
                disabled={paginaActual === 1}
                onClick={() => setPagina(paginaActual - 1)}
                className="rounded-md p-1.5 text-slate-500 enabled:hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {paginas().map((p, idx) =>
                p === "…" ? (
                  <span key={`e${idx}`} className="px-1 text-slate-400">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPagina(p)}
                    className={`h-7 w-7 rounded-md text-[11px] font-semibold ${
                      p === paginaActual ? "bg-[#313652] text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPagina(paginaActual + 1)}
                className="rounded-md p-1.5 text-slate-500 enabled:hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {ESTADOS.map((e) => {
            const col = filtrados.filter((t) => t.estado === e);
            return (
              <section key={e} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${estiloEstado[e]}`}>{e}</span>
                  <span className="text-[11px] font-semibold text-slate-500">{col.length}</span>
                </div>
                <div className="flex max-h-130 flex-col gap-2 overflow-y-auto">
                  {col.length === 0 && (
                    <p className="py-6 text-center text-[11px] text-slate-400">
                      {errorCarga || "Sin tickets asignados"}
                    </p>
                  )}
                  {col.map((t) => (
                    <article
                      key={t.uuid}
                      role="link"
                      tabIndex={0}
                      aria-label={`Abrir ticket ${t.id}`}
                      onClick={() => abrirTicket(t)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          abrirTicket(t);
                        }
                      }}
                      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                    >
                      <p className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                          {esRiesgo(t) && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}#{t.id}
                        </span>
                        <ChipPrioridad p={t.prioridad} />
                      </p>
                      <p className="mt-1.5 text-xs font-bold leading-snug text-slate-800">{t.asunto}</p>
                      <div className="mt-2">
                        <CeldaSla t={t} />
                      </div>
                      <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2 text-[10px] text-slate-600">
                        <Avatar nombre={t.solicitante.nombre} i={t.minutos} tam="h-6 w-6" />
                        {t.solicitante.nombre}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Protocolo rápido */}
      <section className="mt-6 max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Zap className="h-4 w-4" /> Protocolo Rápido L2
        </h2>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Incidentes de VPN y autenticación Okta tienen máxima prioridad de escalamiento automático si no hay primera
          respuesta en 20 minutos.
        </p>
        <div className="mt-3 rounded-xl bg-indigo-100/70 p-3">
          <p className="flex items-center gap-2 text-[11px] font-bold text-slate-800">
            <BookOpen className="h-3.5 w-3.5" /> KB-8041: Matriz de Desbloqueo MFA
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
            Verificar siempre token temporal en consola Duo/Okta antes de solicitar autorización física a RRHH.
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
          <span>Mesa de Operaciones L2</span>
          <button type="button" className="flex items-center gap-1 font-semibold text-slate-800 hover:text-[#313652]">
            Abrir Runbook <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </section>
    </div>
  );
}