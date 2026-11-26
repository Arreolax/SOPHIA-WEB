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
  Inbox,
  Laptop,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Smartphone,
  Table2,
  TriangleAlert,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";

const API_TICKETS = "/api/tickets";

/* ---------- Tipos ---------- */
type Prioridad = "Crítica" | "Alta" | "Media" | "Baja";
type Estado = "sin_asignar" | "en_curso" | "resuelto";

interface ApiUser {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
}

interface ApiTicket {
  id: string;
  code?: string | null;
  title: string;
  description?: string | null;
  modality?: string | null;
  type?: string | null;
  subcategory?: string | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at?: string | null;
  category?: { id: string; name: string } | null;
  creator?: ApiUser | null;
  assignee?: ApiUser | null;
}

type Ticket = {
  id: string;
  displayId: string;
  hace: string;
  minutos: number;
  prioridad: Prioridad;
  asunto: string;
  categoria: string;
  contexto: string;
  solicitante: { nombre: string; area: string; equipo: string };
  estado: Estado;
  statusRaw: string;
  tecnico: string | null;
  tecnicoId: string | null;
  riesgoSla: boolean;
  actualizadoHoy: boolean;
};

/* ---------- Mapeadores desde API ---------- */
const PRIORIDADES: Prioridad[] = ["Crítica", "Alta", "Media", "Baja"];

function mapPrioridad(raw?: string): Prioridad {
  const p = String(raw || "").toUpperCase();
  if (p === "CRITICAL" || p === "CRITICA" || p === "CRÍTICA") return "Crítica";
  if (p === "HIGH" || p === "ALTA") return "Alta";
  if (p === "MEDIUM" || p === "MEDIA") return "Media";
  return "Baja";
}

function mapEstado(statusRaw?: string, hasAssignee?: boolean): Estado {
  const s = String(statusRaw || "").toUpperCase();
  if (s === "RESOLVED" || s === "CLOSED" || s === "RESUELTO" || s === "CERRADO") {
    return "resuelto";
  }
  if (!hasAssignee || s === "OPEN" || s === "PENDING" || s === "SIN_ASIGNAR") {
    return hasAssignee ? "en_curso" : "sin_asignar";
  }
  return "en_curso";
}

function calcularTiempoRelativo(isoDate: string): { hace: string; minutos: number } {
  const fecha = new Date(isoDate).getTime();
  if (Number.isNaN(fecha)) return { hace: "Reciente", minutos: 0 };

  const diffMin = Math.max(0, Math.floor((Date.now() - fecha) / 60000));
  if (diffMin < 1) return { hace: "Hace un momento", minutos: 0 };
  if (diffMin < 60) return { hace: `Hace ${diffMin} min`, minutos: diffMin };

  const horas = Math.floor(diffMin / 60);
  const minsRest = diffMin % 60;
  if (horas < 24) {
    return {
      hace: minsRest > 0 ? `Hace ${horas}h ${minsRest}m` : `Hace ${horas}h`,
      minutos: diffMin,
    };
  }

  const dias = Math.floor(horas / 24);
  return { hace: `Hace ${dias}d`, minutos: diffMin };
}

function evaluarRiesgoSla(prioridad: Prioridad, minutos: number, estado: Estado): boolean {
  if (estado === "resuelto") return false;
  if (prioridad === "Crítica") return minutos >= 180;
  if (prioridad === "Alta") return minutos >= 420;
  return minutos >= 1380;
}

function esHoy(isoDate?: string | null): boolean {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  const hoy = new Date();
  return (
    d.getDate() === hoy.getDate() &&
    d.getMonth() === hoy.getMonth() &&
    d.getFullYear() === hoy.getFullYear()
  );
}

function nombreUsuario(u?: ApiUser | null, fallback = "Usuario"): string {
  if (!u) return fallback;
  return u.name?.trim() || u.username?.trim() || u.email?.split("@")[0] || fallback;
}

function mapApiTicket(t: ApiTicket): Ticket {
  const prioridad = mapPrioridad(t.priority);
  const hasAssignee = Boolean(t.assignee?.id);
  const estado = mapEstado(t.status, hasAssignee);
  const { hace, minutos } = calcularTiempoRelativo(t.created_at);
  const displayId = t.code || t.id.slice(0, 8).toUpperCase();

  const detallesContexto = [
    t.type ? `Tipo: ${t.type}` : null,
    t.subcategory ? t.subcategory : null,
    t.modality ? `Modalidad: ${t.modality}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return {
    id: t.id,
    displayId,
    hace,
    minutos,
    prioridad,
    asunto: t.title,
    categoria: t.category?.name || "General",
    contexto: detallesContexto || (t.description ? t.description.slice(0, 70) : "Sin detalles adicionales"),
    solicitante: {
      nombre: nombreUsuario(t.creator, "Solicitante"),
      area: t.creator?.email || "Organización",
      equipo: t.modality || "Soporte",
    },
    estado,
    statusRaw: t.status,
    tecnico: hasAssignee ? nombreUsuario(t.assignee, "Técnico") : null,
    tecnicoId: t.assignee?.id || null,
    riesgoSla: evaluarRiesgoSla(prioridad, minutos, estado),
    actualizadoHoy: esHoy(t.updated_at || t.created_at),
  };
}

/* ---------- Utilidades de estilo ---------- */
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

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "US";

const RANGOS = [
  { id: "all", label: "Todos los tiempos", max: Infinity },
  { id: "8h", label: "Últimas 8 h", max: 480 },
  { id: "24h", label: "Hoy (24h)", max: 1440 },
  { id: "7d", label: "Últimos 7 días", max: 10080 },
  { id: "30d", label: "Últimos 30 días", max: 43200 },
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

/* ---------- Componentes Skeleton ---------- */
function KpiSkeleton() {
  return (
    <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-7 w-7 rounded-lg bg-slate-100" />
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className="h-8 w-12 rounded-md bg-slate-200" />
            <div className="mb-1 h-3 w-14 rounded bg-slate-100" />
          </div>
          <div className="mt-3 h-2.5 w-28 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function TablaSkeleton({ filas = 5 }: { filas?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-205 text-left text-xs">
          <thead>
            <tr className="bg-indigo-50/70 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <th className="w-10 px-4 py-3">
                <div className="h-3.5 w-3.5 rounded bg-slate-200" />
              </th>
              <th className="px-3 py-3">Ticket ID</th>
              <th className="px-3 py-3">Prioridad</th>
              <th className="px-3 py-3">Asunto &amp; Categoría</th>
              <th className="px-3 py-3">Solicitante</th>
              <th className="px-3 py-3">Técnico</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: filas }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="px-4 py-3.5 align-top">
                  <div className="mt-1 h-3.5 w-3.5 rounded bg-slate-200" />
                </td>
                <td className="px-3 py-3.5 align-top">
                  <div className="h-3.5 w-16 rounded bg-slate-200" />
                  <div className="mt-1.5 h-2.5 w-12 rounded bg-slate-100" />
                </td>
                <td className="px-3 py-3.5 align-top">
                  <div className="h-5 w-16 rounded-full bg-slate-200" />
                </td>
                <td className="px-3 py-3.5 align-top">
                  <div className="h-3.5 w-72 max-w-full rounded bg-slate-200" />
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-4 w-20 rounded bg-slate-100" />
                    <div className="h-3 w-36 rounded bg-slate-100" />
                  </div>
                </td>
                <td className="px-3 py-3.5 align-top">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-24 rounded bg-slate-200" />
                      <div className="h-2.5 w-32 rounded bg-slate-100" />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5 align-top">
                  <div className="h-6 w-24 rounded-full bg-slate-100" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <div className="h-3 w-44 animate-pulse rounded bg-slate-100" />
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-7 animate-pulse rounded-md bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {PRIORIDADES.map((p) => (
        <section key={p} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="h-5 w-16 rounded-full bg-slate-200" />
            <div className="h-3 w-5 rounded bg-slate-200" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex justify-between">
                  <div className="h-3 w-14 rounded bg-slate-200" />
                  <div className="h-3 w-12 rounded bg-slate-100" />
                </div>
                <div className="mt-2 h-3.5 w-full rounded bg-slate-200" />
                <div className="mt-1.5 h-3.5 w-3/4 rounded bg-slate-200" />
                <div className="mt-2 h-2.5 w-20 rounded bg-slate-100" />
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-full bg-slate-200" />
                    <div className="h-3 w-20 rounded bg-slate-200" />
                  </div>
                  <div className="h-2.5 w-14 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CargaSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="animate-pulse rounded-xl bg-indigo-50/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-200" />
              <div className="space-y-1.5">
                <div className="h-3 w-28 rounded bg-slate-200" />
                <div className="h-2.5 w-20 rounded bg-slate-100" />
              </div>
            </div>
            <div className="h-5 w-16 rounded-full bg-slate-200" />
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

/* ---------- Página ---------- */
export default function ColaSolicitudesPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [fPrioridad, setFPrioridad] = useState("todas");
  const [fCategoria, setFCategoria] = useState("todas");
  const [fEstado, setFEstado] = useState("todos");
  const [fTecnico, setFTecnico] = useState("todos");
  const [fRango, setFRango] = useState("all");
  const [vista, setVista] = useState<"tabla" | "kanban">("tabla");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [sync, setSync] = useState("--:--:--");
  const [refrescando, setRefrescando] = useState(false);
  const [procesandoLote, setProcesandoLote] = useState(false);
  const [vistaGuardada, setVistaGuardada] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  const mostrarToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  /* ---- Carga desde GET /api/tickets ---- */
  const cargarTickets = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setRefrescando(true);
    setErrorCarga(null);

    try {
      const res = await fetch(API_TICKETS, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || "No se pudieron cargar los tickets");
      }

      const lista: ApiTicket[] = Array.isArray(payload.tickets) ? payload.tickets : [];
      setTickets(lista.map(mapApiTicket));
      setSync(new Date().toLocaleTimeString("es-MX", { hour12: false }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de conexión con la API";
      setErrorCarga(msg);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarTickets();
    const interval = setInterval(() => cargarTickets(true), 30000);
    return () => clearInterval(interval);
  }, [cargarTickets]);

  /* ---- Catálogos dinámicos ---- */
  const categoriasDisponibles = useMemo(() => {
    const set = new Set<string>(tickets.map((t) => t.categoria).filter(Boolean));
    return Array.from(set).sort();
  }, [tickets]);

  const tecnicosDisponibles = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string }>();
    tickets.forEach((t) => {
      if (t.tecnicoId && t.tecnico) {
        map.set(t.tecnicoId, { id: t.tecnicoId, nombre: t.tecnico });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [tickets]);

  /* ---- Indicadores calculados desde los datos reales ---- */
  const kpi = useMemo(() => {
    const activos = tickets.filter((t) => t.estado !== "resuelto");
    const totalActivos = activos.length;
    const totalHistorico = tickets.length;
    const resueltosHoy = tickets.filter((t) => t.estado === "resuelto" && t.actualizadoHoy).length;
    const totalResueltos = tickets.filter((t) => t.estado === "resuelto").length;

    return {
      sinAsignar: activos.filter((t) => t.estado === "sin_asignar").length,
      riesgo: activos.filter((t) => t.riesgoSla).length,
      criticosRiesgo: activos.filter((t) => t.riesgoSla && t.prioridad === "Crítica").length,
      enCurso: activos.filter((t) => t.estado === "en_curso").length,
      totalActivos,
      totalHistorico,
      resueltosHoy,
      totalResueltos,
      capacidad: totalHistorico > 0 ? Math.min(100, Math.round((totalActivos / Math.max(totalHistorico, 1)) * 100)) : 0,
    };
  }, [tickets]);

  const carga = useMemo(() => {
    const CAPACIDAD_BASE = 8;
    return tecnicosDisponibles.map((tec) => {
      const activos = tickets.filter((t) => t.tecnicoId === tec.id && t.estado !== "resuelto").length;
      return {
        id: tec.id,
        nombre: tec.nombre,
        rol: "Técnico Asignado",
        activos,
        pct: Math.min(100, Math.round((activos / CAPACIDAD_BASE) * 100)),
        saturado: activos >= CAPACIDAD_BASE,
      };
    });
  }, [tickets, tecnicosDisponibles]);

  /* ---- Filtrado ---- */
  const rangoMax = RANGOS.find((r) => r.id === fRango)?.max ?? Infinity;
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return tickets.filter((t) => {
      if (
        q &&
        !`${t.id} ${t.displayId} ${t.asunto} ${t.solicitante.nombre} ${t.categoria} ${t.tecnico || ""}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      if (fPrioridad !== "todas" && t.prioridad !== fPrioridad) return false;
      if (fCategoria !== "todas" && t.categoria !== fCategoria) return false;
      if (fEstado !== "todos" && t.estado !== fEstado) return false;
      if (fTecnico === "sin" && t.tecnicoId) return false;
      if (fTecnico !== "todos" && fTecnico !== "sin" && t.tecnicoId !== fTecnico) return false;
      return t.minutos <= rangoMax;
    });
  }, [tickets, busqueda, fPrioridad, fCategoria, fEstado, fTecnico, rangoMax]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const visibles = filtrados.slice(inicio, inicio + porPagina);

  const chips: { clave: string; texto: string; quitar: () => void }[] = [];
  if (fPrioridad !== "todas") chips.push({ clave: "p", texto: `Prioridad: ${fPrioridad}`, quitar: () => setFPrioridad("todas") });
  if (fCategoria !== "todas") chips.push({ clave: "c", texto: `Categoría: ${fCategoria}`, quitar: () => setFCategoria("todas") });
  if (fEstado !== "todos") {
    const labelEstado = fEstado === "sin_asignar" ? "Sin asignar" : fEstado === "en_curso" ? "En curso" : "Resuelto";
    chips.push({ clave: "e", texto: `Estado: ${labelEstado}`, quitar: () => setFEstado("todos") });
  }
  if (fTecnico !== "todos") {
    const nombreTec = fTecnico === "sin" ? "Sin asignar" : tecnicosDisponibles.find((x) => x.id === fTecnico)?.nombre || fTecnico;
    chips.push({ clave: "t", texto: `Técnico: ${nombreTec}`, quitar: () => setFTecnico("todos") });
  }
  if (fRango !== "all") {
    chips.push({ clave: "r", texto: `Rango: ${RANGOS.find((r) => r.id === fRango)?.label}`, quitar: () => setFRango("all") });
  }

  const limpiarFiltros = () => {
    setBusqueda("");
    setFPrioridad("todas");
    setFCategoria("todas");
    setFEstado("todos");
    setFTecnico("todos");
    setFRango("all");
    setPagina(1);
  };

  /* ---- Selección y acciones por lote contra PATCH /api/tickets ---- */
  const todosVisiblesMarcados = visibles.length > 0 && visibles.every((t) => seleccion.includes(t.id));
  const alternarTodos = () =>
    setSeleccion((prev) =>
      todosVisiblesMarcados
        ? prev.filter((id) => !visibles.some((t) => t.id === id))
        : Array.from(new Set([...prev, ...visibles.map((t) => t.id)])),
    );
  const alternarUno = (id: string) =>
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const subirPrioridad = async () => {
    if (seleccion.length === 0 || procesandoLote) return;
    setProcesandoLote(true);
    try {
      const res = await fetch(API_TICKETS, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ticketIds: seleccion,
          priority: "HIGH",
          reason: "Actualización por lote desde panel de administración",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al actualizar prioridad");

      mostrarToast(`${seleccion.length} ticket(s) marcados con prioridad Alta`);
      setSeleccion([]);
      await cargarTickets(true);
    } catch (err: unknown) {
      mostrarToast(err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      setProcesandoLote(false);
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
              placeholder="Buscar tickets, usuarios, incidentes..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Admin Activo
          </span>
          <button type="button" aria-label="Notificaciones" className="relative rounded-full p-2 text-slate-600 hover:bg-white">
            <Bell className="h-4 w-4" />
            {kpi.sinAsignar > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />}
          </button>
        </div>
      </div>

      {/* Encabezado */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold leading-tight text-slate-800">
            Cola Global de Solicitudes y Tickets
          </h1>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> En vivo • Auto-refresh cada 30s
          </span>
          <p className="mt-2 text-sm text-slate-500">
            Vista global de administrador con todos los tickets registrados y métricas en tiempo real.
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
            onClick={() => cargarTickets()}
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
          <button
            type="button"
            onClick={() => router.push("/soporte/nuevo")}
            className="flex items-center gap-2 rounded-xl bg-[#262a40] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#1c2033]"
          >
            <Plus className="h-4 w-4" />
            Nuevo Ticket Interno
          </button>
        </div>
      </div>

      {/* Error de API */}
      {errorCarga && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <span>{errorCarga}</span>
          <button type="button" onClick={() => cargarTickets()} className="font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      {/* Indicadores */}
      {cargando ? (
        <KpiSkeleton />
      ) : (
        <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              Sin Asignar
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><Inbox className="h-4 w-4" /></span>
            </div>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-800">{kpi.sinAsignar}</span>
              <span className="mb-1 text-[10px] text-slate-400">Pendientes</span>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Requiere asignación
            </p>
          </div>

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
              En Curso
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><UserCheck className="h-4 w-4" /></span>
            </div>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-800">{kpi.enCurso}</span>
              <span className="mb-1 text-[10px] text-slate-400">Asignados</span>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Atención técnica activa
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              Cola Total Activa
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Activity className="h-4 w-4" /></span>
            </div>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-800">{kpi.totalActivos}</span>
              <span className="mb-1 text-[10px] text-slate-400">de {kpi.totalHistorico} totales</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#313652]" style={{ width: `${kpi.capacidad}%` }} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              Resueltos
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><CheckCircle2 className="h-4 w-4" /></span>
            </div>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-800">{kpi.totalResueltos}</span>
              <span className="mb-1 text-[10px] text-slate-400">{kpi.resueltosHoy} hoy</span>
            </div>
            <p className="mt-2 text-[10px] font-medium text-slate-600">Histórico cerrado en sistema</p>
          </div>
        </div>
      )}

      {/* Banner de guardia */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#313652] text-white"><Shield className="h-5 w-5" /></span>
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
              Supervisión Global de Mesa de Servicio
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">Acceso Completo</span>
            </p>
            {cargando ? (
              <div className="mt-1 h-3 w-72 animate-pulse rounded bg-slate-200" />
            ) : (
              <p className="text-[11px] text-slate-500">
                Mostrando {kpi.totalHistorico} tickets registrados en la base de datos ({kpi.totalActivos} activos / {kpi.totalResueltos} resueltos)
              </p>
            )}
          </div>
        </div>
        <ul className="space-y-1 text-[10px] text-slate-500">
          <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /><strong className="text-slate-700">Crítico:</strong> 15 min resp / 4h resol.</li>
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
              placeholder="Buscar por ID, solicitante, técnico o asunto..."
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
          <Select value={fEstado} onChange={(v) => { setFEstado(v); setPagina(1); }} label="Estado" className="w-36">
            <option value="todos">Estado: Todos</option>
            <option value="sin_asignar">Sin asignar</option>
            <option value="en_curso">En curso</option>
            <option value="resuelto">Resuelto</option>
          </Select>
          <Select value={fTecnico} onChange={(v) => { setFTecnico(v); setPagina(1); }} label="Técnico" className="w-44">
            <option value="todos">Técnico: Todos</option>
            <option value="sin">Sin asignar</option>
            {tecnicosDisponibles.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="font-bold uppercase tracking-wide text-slate-400">Filtros activos:</span>
            {chips.length === 0 && <span className="text-slate-400">Ninguno (mostrando todos)</span>}
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
              disabled={procesandoLote}
              onClick={subirPrioridad}
              className="rounded-lg bg-white/15 px-3 py-1.5 font-medium hover:bg-white/25 disabled:opacity-50"
            >
              {procesandoLote ? "Actualizando..." : "Marcar prioridad Alta"}
            </button>
            <button type="button" onClick={() => setSeleccion([])} className="rounded-lg px-3 py-1.5 font-medium text-white/80 hover:text-white">
              Limpiar selección
            </button>
          </div>
        </div>
      )}

      {/* Tabla / Kanban con Skeleton */}
      {cargando ? (
        vista === "tabla" ? <TablaSkeleton filas={5} /> : <KanbanSkeleton />
      ) : vista === "tabla" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-205 text-left text-xs">
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
                  <th className="px-3 py-3">Técnico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                      No hay tickets que coincidan con los filtros.
                    </td>
                  </tr>
                )}
                {visibles.map((t, i) => (
                  <tr
                    key={t.id}
                    onClick={() => router.push(`/web/tickets/${t.id}`)}
                    className={`cursor-pointer hover:bg-slate-50 ${seleccion.includes(t.id) ? "bg-indigo-50/50" : ""}`}
                  >
                    <td className="px-4 py-3 align-top">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${t.displayId}`}
                        checked={seleccion.includes(t.id)}
                        onChange={() => alternarUno(t.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-1 h-3.5 w-3.5 rounded border-slate-300 accent-[#313652]"
                      />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-800">
                        {t.riesgoSla && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                        #{t.displayId}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{t.hace}</p>
                    </td>
                    <td className="px-3 py-3 align-top"><ChipPrioridad p={t.prioridad} /></td>
                    <td className="px-3 py-3 align-top">
                      <p className="max-w-md text-xs font-bold leading-snug text-slate-800">{t.asunto}</p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">{t.categoria}</span>
                        <span>• {t.contexto}</span>
                        {t.estado === "sin_asignar" && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700">Sin asignar</span>
                        )}
                        {t.estado === "resuelto" && (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">Resuelto</span>
                        )}
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Avatar nombre={t.solicitante.nombre} i={inicio + i} tam="h-8 w-8" />
                        <div className="leading-tight">
                          <p className="text-xs font-bold text-slate-800">{t.solicitante.nombre}</p>
                          <p className="flex items-center gap-1 text-[10px] text-slate-500">
                            {t.solicitante.area} •{" "}
                            {t.solicitante.equipo.toLowerCase().includes("móvil") ? <Smartphone className="h-3 w-3" /> : <Laptop className="h-3 w-3" />}
                            {t.solicitante.equipo}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      {t.tecnico ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                          {t.tecnico}
                        </span>
                      ) : (
                        <span className="text-[11px] italic text-slate-400">Sin asignar</span>
                      )}
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
                <strong className="text-slate-800">{filtrados.length}</strong> tickets
              </span>
              <label className="flex items-center gap-2">
                Filas por página:
                <select
                  value={porPagina}
                  onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1); }}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none"
                >
                  {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PRIORIDADES.map((p) => {
            const col = filtrados.filter((t) => t.prioridad === p);
            return (
              <section key={p} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <ChipPrioridad p={p} />
                  <span className="text-[11px] font-semibold text-slate-500">{col.length}</span>
                </div>
                <div className="flex max-h-130 flex-col gap-2 overflow-y-auto">
                  {col.length === 0 && <p className="py-6 text-center text-[11px] text-slate-400">Sin tickets</p>}
                  {col.map((t) => (
                    <article
                      key={t.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(`/soporte/assignment?id=${t.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/soporte/assignment?id=${t.id}`);
                        }
                      }}
                      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <p className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                          {t.riesgoSla && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}#{t.displayId}
                        </span>
                        <span className="font-sans">{t.hace}</span>
                      </p>
                      <p className="mt-1.5 text-xs font-bold leading-snug text-slate-800">{t.asunto}</p>
                      <p className="mt-1.5 text-[10px] text-slate-500">{t.categoria}</p>
                      <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[10px] text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Avatar nombre={t.solicitante.nombre} i={t.minutos} tam="h-6 w-6" />
                          {t.solicitante.nombre}
                        </span>
                        <span className="text-[10px] text-slate-400">{t.tecnico || "Sin asignar"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Inferior: balance de carga + protocolo */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Users className="h-4 w-4" /> Balance de Carga Técnica (En Vivo)
            </h2>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {carga.length} técnicos con tickets activos
            </span>
          </div>
          {cargando ? (
            <CargaSkeleton />
          ) : carga.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">Aún no hay tickets asignados a técnicos.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {carga.map((c, i) => (
                <div key={c.id} className="rounded-xl bg-indigo-50/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar nombre={c.nombre} i={i + 1} tam="h-8 w-8" />
                      <div className="leading-tight">
                        <p className="text-xs font-bold text-slate-800">{c.nombre}</p>
                        <p className="text-[10px] text-slate-500">{c.rol}</p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                        c.saturado ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {c.activos} activos{c.saturado && " (Saturado)"}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${c.saturado ? "bg-red-600" : "bg-[#313652]"}`}
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Zap className="h-4 w-4" /> Protocolo Rápido L2
          </h2>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Incidentes de VPN y autenticación tienen máxima prioridad de escalamiento automático si no hay
            primera respuesta en 20 minutos.
          </p>
          <div className="mt-3 rounded-xl bg-indigo-100/70 p-3">
            <p className="flex items-center gap-2 text-[11px] font-bold text-slate-800">
              <BookOpen className="h-3.5 w-3.5" /> KB-8041: Matriz de Desbloqueo MFA
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
              Verificar siempre telefónicamente la identidad del usuario antes de admitir restablecimiento de MFA.
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Mesa de Operaciones L2</span>
            <button type="button" className="flex items-center gap-1 font-semibold text-slate-800 hover:text-[#313652]">
              Abrir Runbook <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}