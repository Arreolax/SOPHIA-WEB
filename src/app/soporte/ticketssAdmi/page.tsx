"use client";

import { useMemo, useState } from "react";
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

/* ---------- Tipos y datos de ejemplo (luego los reemplazas por Supabase) ---------- */
type Prioridad = "Crítica" | "Alta" | "Media" | "Baja";
type Estado = "sin_asignar" | "en_curso";

type Ticket = {
  id: string;
  hace: string;
  minutos: number;
  prioridad: Prioridad;
  asunto: string;
  categoria: string;
  contexto: string;
  solicitante: { nombre: string; area: string; equipo: string };
  estado: Estado;
  tecnico: string | null;
  riesgoSla: boolean;
};

const YO = "Carlos Mendoza";

const TECNICOS = [
  { nombre: "Carlos Mendoza", rol: "Especialista L2 Redes", iniciales: "CM", capacidad: 8 },
  { nombre: "Laura Gómez", rol: "Sistemas & Licencias", iniciales: "LG", capacidad: 8 },
  { nombre: "David Ruiz", rol: "Identidad & SSO CA's", iniciales: "DR", capacidad: 5 },
  { nombre: "Sofía Navarro", rol: "Soporte Puesto de Trabajo", iniciales: "SN", capacidad: 8 },
];

const CATEGORIAS = [
  "Redes & VPN",
  "Hardware & Periféricos",
  "Software & Licencias",
  "Cuentas & SSO",
  "Software & Apps",
];

// [id, hace, minutos, prioridad, asunto, categoría, contexto, solicitante, área, equipo, estado, técnico, riesgoSLA]
type Fila = [string, string, number, Prioridad, string, string, string, string, string, string, Estado, string | null, boolean];

const FILAS: Fila[] = [
  ["INC-8921", "Hace 18 min", 18, "Crítica", "No puedo acceder a la VPN corporativa desde casa (Error 403 AnyConnect)", "Redes & VPN", "Impacto: Bloquea total de trabajo", "Elena Morales", "Marketing", "MacBook Pro M3", "en_curso", "Carlos Mendoza", true],
  ["INC-8920", "Hace 45 min", 45, "Alta", "Falla de pantalla secundaria HDMI tras actualización de firmware Dell Thunderbolt", "Hardware & Periféricos", "Puesto: PC-14 Presencial", "Marcos Peña", "Finanzas", "ThinkPad X1", "en_curso", "Laura Gómez", false],
  ["REQ-8919", "Hace 1h 30m", 90, "Media", "Aprobación y provisión de licencia Figma Enterprise para equipo de producto", "Software & Licencias", "Requiere visto bueno de Dirección", "Lucía Nance", "Operaciones", 'iMac 24"', "sin_asignar", null, false],
  ["INC-8918", "Hace 2h 05m", 125, "Crítica", "Bloqueo de cuenta Okta SSO tras 5 intentos fallidos y reseteo de tokens MFA", "Cuentas & SSO", "VIP: Director Jurídico", "Roberto Gil", "Legal & Corp", "iPhone 15", "en_curso", "David Ruiz", true],
  ["REQ-8915", "Hace 2h 10m", 130, "Baja", "Reinstalación de cliente local de Microsoft Teams tras error de caché de perfiles", "Software & Apps", "Instrucciones enviadas", "Clara Soto", "RRHH / People", "MacBook Air", "en_curso", "Sofía Navarro", false],
  ["INC-8914", "Hace 2h 40m", 160, "Media", "Impresora de planta 3 no aparece en la red", "Hardware & Periféricos", "Puesto: Planta 3", "Diego Salas", "Compras", 'iMac 24"', "en_curso", "Laura Gómez", false],
  ["REQ-8912", "Hace 3h", 180, "Baja", "Alta de nuevo colaborador: equipo y accesos básicos", "Cuentas & SSO", "Ingreso el lunes", "Paula Rivas", "RRHH / People", "MacBook Air", "sin_asignar", null, false],
  ["INC-8910", "Hace 3h 30m", 210, "Alta", "Lentitud extrema en Salesforce desde la oficina", "Software & Apps", "Impacto: Equipo comercial", "Hugo Marín", "Ventas", "ThinkPad T14", "en_curso", "Carlos Mendoza", false],
  ["INC-8907", "Hace 4h", 240, "Media", "Correo no sincroniza en iPhone corporativo", "Software & Apps", "Instrucciones enviadas", "Ana Beltrán", "Finanzas", "iPhone 15", "en_curso", "Sofía Navarro", false],
  ["REQ-8905", "Hace 4h 20m", 260, "Baja", 'Solicitud de segundo monitor 27"', "Hardware & Periféricos", "Requiere visto bueno de jefatura", "Iván Cortés", "Operaciones", 'iMac 24"', "sin_asignar", null, false],
  ["INC-8903", "Hace 5h", 300, "Alta", "Caída intermitente de Wi-Fi en sala de juntas B", "Redes & VPN", "Impacto: Reuniones de dirección", "Mónica Ferrer", "Dirección", "MacBook Pro M3", "en_curso", "Carlos Mendoza", false],
  ["INC-8901", "Hace 5h 30m", 330, "Alta", "Servidor de archivos de Marketing inaccesible", "Redes & VPN", "Impacto: Bloquea a 12 usuarios", "Rafael Ortiz", "Marketing", "MacBook Pro M3", "en_curso", "Carlos Mendoza", true],
  ["REQ-8899", "Hace 6h", 360, "Media", "Instalación de Adobe Creative Cloud para campañas", "Software & Licencias", "Licencia pendiente de aprobación", "Daniela Quiroz", "Marketing", "MacBook Air", "en_curso", "Laura Gómez", false],
  ["INC-8897", "Hace 6h 40m", 400, "Baja", "Teclado con teclas que no responden", "Hardware & Periféricos", "Puesto: PC-22 Presencial", "Silvia Roldán", "Legal & Corp", "ThinkPad X1", "sin_asignar", null, false],
  ["INC-8894", "Hace 7h", 420, "Media", "Error de certificado al abrir el portal de nómina", "Cuentas & SSO", "Instrucciones enviadas", "Tomás Aguirre", "RRHH / People", "MacBook Air", "en_curso", "David Ruiz", false],
  ["INC-8892", "Hace 7h 30m", 450, "Alta", "Bloqueo de cuenta tras cambio de contraseña", "Cuentas & SSO", "Impacto: Sin acceso a correo", "Valeria Núñez", "Finanzas", "ThinkPad X1", "en_curso", "David Ruiz", false],
  ["REQ-8889", "Hace 8h", 480, "Baja", "Acceso de lectura al repositorio de contratos", "Cuentas & SSO", "Requiere visto bueno de Legal", "Jorge Pineda", "Operaciones", "ThinkPad T14", "sin_asignar", null, false],
  ["INC-8886", "Hace 8h 20m", 500, "Media", "Videollamadas con audio entrecortado en Teams", "Software & Apps", "Instrucciones enviadas", "Carmen Ibarra", "Producto", "MacBook Pro M3", "en_curso", "Sofía Navarro", false],
  ["INC-8883", "Hace 9h", 540, "Alta", "Laptop no enciende tras actualización de BIOS", "Hardware & Periféricos", "Impacto: Sin equipo de trabajo", "Esteban Lara", "Producto", "ThinkPad X1", "en_curso", "Carlos Mendoza", false],
  ["REQ-8880", "Hace 9h 30m", 570, "Baja", "Reemplazo de auriculares Jabra", "Hardware & Periféricos", "Puesto: Remoto", "Daniela Reyes", "Marketing", "MacBook Air", "sin_asignar", null, false],
  ["INC-8877", "Hace 10h", 600, "Media", "VPN se desconecta cada 30 minutos", "Redes & VPN", "Impacto: Trabajo remoto", "Pablo Serrano", "Ventas", "MacBook Pro M3", "en_curso", "David Ruiz", false],
  ["INC-8874", "Hace 10h 30m", 630, "Alta", "Acceso MFA fallido en dispositivo nuevo", "Cuentas & SSO", "VIP: Director Financiero", "Héctor Lugo", "Dirección", "iPhone 15", "en_curso", "David Ruiz", false],
  ["INC-8870", "Hace 11h", 660, "Baja", "Actualización de Microsoft Office pendiente", "Software & Apps", "Instrucciones enviadas", "Irene Campos", "Compras", 'iMac 24"', "en_curso", "Laura Gómez", false],
  ["REQ-8868", "Hace 11h 30m", 690, "Media", "Solicitud de licencia Figma para diseño", "Software & Licencias", "Requiere visto bueno de Dirección", "Nora Villar", "Producto", "MacBook Pro M3", "en_curso", "Sofía Navarro", false],
];

const TICKETS_INICIALES: Ticket[] = FILAS.map(
  ([id, hace, minutos, prioridad, asunto, categoria, contexto, nombre, area, equipo, estado, tecnico, riesgoSla]) => ({
    id,
    hace,
    minutos,
    prioridad,
    asunto,
    categoria,
    contexto,
    solicitante: { nombre, area, equipo },
    estado,
    tecnico,
    riesgoSla,
  }),
);

/* ---------- Utilidades de estilo ---------- */
const PRIORIDADES: Prioridad[] = ["Crítica", "Alta", "Media", "Baja"];

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
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

const RANGOS = [
  { id: "8h", label: "Últimas 8 h", max: 480 },
  { id: "24h", label: "Hoy (24h)", max: 1440 },
  { id: "7d", label: "Últimos 7 días", max: 10080 },
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

/* ---------- Página ---------- */
export default function ColaSolicitudesPage() {
  const [tickets, setTickets] = useState<Ticket[]>(TICKETS_INICIALES);
  const [busqueda, setBusqueda] = useState("");
  const [fPrioridad, setFPrioridad] = useState("todas");
  const [fCategoria, setFCategoria] = useState("todas");
  const [fEstado, setFEstado] = useState("todos");
  const [fTecnico, setFTecnico] = useState("todos");
  const [fRango, setFRango] = useState("24h");
  const [vista, setVista] = useState<"tabla" | "kanban">("tabla");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(5);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [sync, setSync] = useState("14:28:02");
  const [refrescando, setRefrescando] = useState(false);
  const [vistaGuardada, setVistaGuardada] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  const mostrarToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  /* ---- Indicadores calculados desde los datos ---- */
  const kpi = useMemo(() => {
    const total = tickets.length;
    return {
      sinAsignar: tickets.filter((t) => t.estado === "sin_asignar").length,
      riesgo: tickets.filter((t) => t.riesgoSla).length,
      criticosRiesgo: tickets.filter((t) => t.riesgoSla && t.prioridad === "Crítica").length,
      mios: tickets.filter((t) => t.tecnico === YO).length,
      total,
      capacidad: Math.round((total / 32) * 100),
    };
  }, [tickets]);

  const carga = useMemo(
    () =>
      TECNICOS.map((tec) => {
        const activos = tickets.filter((t) => t.tecnico === tec.nombre).length;
        return { ...tec, activos, pct: Math.min(100, Math.round((activos / tec.capacidad) * 100)), saturado: activos >= tec.capacidad };
      }),
    [tickets],
  );

  /* ---- Filtrado ---- */
  const rangoMax = RANGOS.find((r) => r.id === fRango)?.max ?? 1440;
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return tickets.filter((t) => {
      if (q && !`${t.id} ${t.asunto} ${t.solicitante.nombre} ${t.categoria}`.toLowerCase().includes(q)) return false;
      if (fPrioridad !== "todas" && t.prioridad !== fPrioridad) return false;
      if (fCategoria !== "todas" && t.categoria !== fCategoria) return false;
      if (fEstado !== "todos" && t.estado !== fEstado) return false;
      if (fTecnico === "sin" && t.tecnico) return false;
      if (fTecnico !== "todos" && fTecnico !== "sin" && t.tecnico !== fTecnico) return false;
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
  if (fEstado !== "todos")
    chips.push({ clave: "e", texto: `Estado: ${fEstado === "sin_asignar" ? "Sin asignar" : "En curso"}`, quitar: () => setFEstado("todos") });
  if (fTecnico !== "todos") chips.push({ clave: "t", texto: `Técnico: ${fTecnico === "sin" ? "Sin asignar" : fTecnico}`, quitar: () => setFTecnico("todos") });
  if (fRango !== "24h") chips.push({ clave: "r", texto: `Rango: ${RANGOS.find((r) => r.id === fRango)?.label}`, quitar: () => setFRango("24h") });

  const limpiarFiltros = () => {
    setBusqueda("");
    setFPrioridad("todas");
    setFCategoria("todas");
    setFEstado("todos");
    setFTecnico("todos");
    setFRango("24h");
    setPagina(1);
  };

  /* ---- Selección y acciones por lote ---- */
  const todosVisiblesMarcados = visibles.length > 0 && visibles.every((t) => seleccion.includes(t.id));
  const alternarTodos = () =>
    setSeleccion((prev) =>
      todosVisiblesMarcados
        ? prev.filter((id) => !visibles.some((t) => t.id === id))
        : Array.from(new Set([...prev, ...visibles.map((t) => t.id)])),
    );
  const alternarUno = (id: string) =>
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const asignarmeSeleccion = () => {
    setTickets((prev) =>
      prev.map((t) => (seleccion.includes(t.id) ? { ...t, tecnico: YO, estado: "en_curso" as Estado } : t)),
    );
    mostrarToast(`${seleccion.length} ticket(s) asignados a ti`);
    setSeleccion([]);
  };

  const subirPrioridad = () => {
    setTickets((prev) =>
      prev.map((t) => (seleccion.includes(t.id) ? { ...t, prioridad: "Alta" as Prioridad } : t)),
    );
    mostrarToast(`${seleccion.length} ticket(s) marcados con prioridad Alta`);
    setSeleccion([]);
  };

  const sincronizar = () => {
    setRefrescando(true);
    setTimeout(() => {
      setSync(new Date().toLocaleTimeString("es-MX", { hour12: false }));
      setRefrescando(false);
    }, 600);
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
        className={`fixed left-1/2 top-6 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-white shadow-xl transition-all duration-500 ${
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
          </span>
          <button type="button" aria-label="Notificaciones" className="relative rounded-full p-2 text-slate-600 hover:bg-white">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#313652] text-[10px] font-bold text-white">CM</span>
        </div>
      </div>

      {/* Encabezado */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold leading-tight text-slate-800">
            Cola de Solicitudes y Tickets de Soporte
          </h1>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> En vivo • Auto-refresco 30s
          </span>
          <p className="mt-2 text-sm text-slate-500">
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
            onClick={sincronizar}
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
            className="flex items-center gap-2 rounded-xl bg-[#262a40] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#1c2033]"
          >
            <Plus className="h-4 w-4" />
            Nuevo Ticket Interno
          </button>
        </div>
      </div>

      {/* Indicadores */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            Sin Asignar
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><Inbox className="h-4 w-4" /></span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-800">{kpi.sinAsignar}</span>
            <span className="mb-1 text-[10px] text-slate-400">Prom. 8 min</span>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Requiere triaje (L1)
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
            Mis Asignados
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><UserCheck className="h-4 w-4" /></span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-800">{kpi.mios}</span>
            <span className="mb-1 text-[10px] text-slate-400">En curso</span>
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
            <span className="text-3xl font-bold text-slate-800">18</span>
            <span className="mb-1 text-[10px] text-slate-400">Por SLA&apos;s</span>
          </div>
          <p className="mt-2 text-[10px] font-medium text-slate-600">↗ +4 vs. promedio diario</p>
        </div>
      </div>

      {/* Banner de guardia */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#313652] text-white"><Shield className="h-5 w-5" /></span>
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
              Guardia L2 Especializada: Redes, Conectividad y SSO
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">Turno B Activo</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Operador responsable: Carlos Mendoza | Próximo relevo: 18:00 CEST
            </p>
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
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-indigo-50/60 px-3 py-2 text-xs">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por ID (INC-), solicitante, asunto..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </div>
          <Select value={fPrioridad} onChange={(v) => { setFPrioridad(v); setPagina(1); }} label="Prioridad" className="w-36">
            <option value="todas">Prioridad: Todas</option>
            {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
          <Select value={fCategoria} onChange={(v) => { setFCategoria(v); setPagina(1); }} label="Categoría" className="w-44">
            <option value="todas">Todas las Categorías</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={fEstado} onChange={(v) => { setFEstado(v); setPagina(1); }} label="Estado" className="w-36">
            <option value="todos">Estado: Todos</option>
            <option value="sin_asignar">Sin asignar</option>
            <option value="en_curso">En curso</option>
          </Select>
          <Select value={fTecnico} onChange={(v) => { setFTecnico(v); setPagina(1); }} label="Técnico" className="w-40">
            <option value="todos">Técnico: Todos</option>
            <option value="sin">Sin asignar</option>
            {TECNICOS.map((t) => <option key={t.nombre} value={t.nombre}>{t.nombre}</option>)}
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
            <button type="button" onClick={asignarmeSeleccion} className="rounded-lg bg-white/15 px-3 py-1.5 font-medium hover:bg-white/25">
              Asignarme
            </button>
            <button type="button" onClick={subirPrioridad} className="rounded-lg bg-white/15 px-3 py-1.5 font-medium hover:bg-white/25">
              Marcar prioridad Alta
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
            <table className="w-full min-w-[820px] text-left text-xs">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                      No hay tickets que coincidan con los filtros.
                    </td>
                  </tr>
                )}
                {visibles.map((t, i) => (
                  <tr key={t.id} className={`hover:bg-slate-50 ${seleccion.includes(t.id) ? "bg-indigo-50/50" : ""}`}>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${t.id}`}
                        checked={seleccion.includes(t.id)}
                        onChange={() => alternarUno(t.id)}
                        className="mt-1 h-3.5 w-3.5 rounded border-slate-300 accent-[#313652]"
                      />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-800">
                        {t.riesgoSla && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                        #{t.id}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PRIORIDADES.map((p) => {
            const col = filtrados.filter((t) => t.prioridad === p);
            return (
              <section key={p} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <ChipPrioridad p={p} />
                  <span className="text-[11px] font-semibold text-slate-500">{col.length}</span>
                </div>
                <div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto">
                  {col.length === 0 && <p className="py-6 text-center text-[11px] text-slate-400">Sin tickets</p>}
                  {col.map((t) => (
                    <article key={t.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                          {t.riesgoSla && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}#{t.id}
                        </span>
                        <span className="font-sans">{t.hace}</span>
                      </p>
                      <p className="mt-1.5 text-xs font-bold leading-snug text-slate-800">{t.asunto}</p>
                      <p className="mt-1.5 text-[10px] text-slate-500">{t.categoria}</p>
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

      {/* Inferior: balance de carga + protocolo */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Users className="h-4 w-4" /> Balance de Carga Técnica (Turno en Vivo)
            </h2>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {TECNICOS.length} técnicos en línea
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {carga.map((c, i) => (
              <div key={c.nombre} className="rounded-xl bg-indigo-50/60 p-3">
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
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Zap className="h-4 w-4" /> Protocolo Rápido L2
          </h2>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Incidentes de VPN y autenticación Okta tienen máxima prioridad de escalamiento automático si no hay
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