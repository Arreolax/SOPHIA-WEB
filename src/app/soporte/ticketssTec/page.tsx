"use client";

import { useEffect, useMemo, useState } from "react";
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

/* ---------- Tipos y datos de ejemplo (luego los reemplazas por Supabase) ---------- */
type Prioridad = "Crítica" | "Alta" | "Media" | "Baja";
type EstadoFlujo =
  | "Nuevo"
  | "En Investigación"
  | "En Triaje L2"
  | "Esperando Aprobación"
  | "Esperando Usuario";

type Ticket = {
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
  sla: { texto: string; restantePct: number; pausado: boolean };
};

type PerfilResponse = {
  name?: string;
  lastname?: string;
};

const normalizarNombre = (nombre: string) =>
  nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const CATEGORIAS = [
  "Redes & VPN",
  "Hardware & Periféricos",
  "Software & Licencias",
  "Cuentas & SSO",
  "Software & Apps",
];

const ESTADOS: EstadoFlujo[] = [
  "Nuevo",
  "En Investigación",
  "En Triaje L2",
  "Esperando Aprobación",
  "Esperando Usuario",
];

const PRIORIDADES: Prioridad[] = ["Crítica", "Alta", "Media", "Baja"];

// minutos totales de SLA de resolución por prioridad
const SLA_TOTAL: Record<Prioridad, number> = { Crítica: 240, Alta: 480, Media: 1440, Baja: 1440 };

const textoDuracion = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
};

// Ajustes exactos tomados del diseño para los primeros tickets
const SLA_FIJO: Record<string, { texto: string; restantePct: number; pausado: boolean }> = {
  "INC-8921": { texto: "28m restante", restantePct: 15, pausado: false },
  "INC-8920": { texto: "1h 45m restante", restantePct: 68, pausado: false },
  "REQ-8919": { texto: "6h 30m restante", restantePct: 85, pausado: false },
  "INC-8918": { texto: "13m restante", restantePct: 6, pausado: false },
  "REQ-8915": { texto: "En pausa: SLA Pausado", restantePct: 60, pausado: true },
  "INC-8901": { texto: "42m restante", restantePct: 18, pausado: false },
};

// [id, hace, minutos, prioridad, asunto, categoría, contexto, solicitante, área, equipo, técnico]
type Fila = [string, string, number, Prioridad, string, string, string, string, string, string, string | null];

const FILAS: Fila[] = [
  ["INC-8921", "Hace 18 min", 18, "Crítica", "No puedo acceder a la VPN corporativa desde casa (Error 403 AnyConnect)", "Redes & VPN", "Impacto: Bloquea total de trabajo", "Elena Morales", "Marketing", "MacBook M2", null],
  ["INC-8920", "Hace 45 min", 45, "Alta", "Falla de pantalla secundaria HDMI tras actualización de firmware Dell Thunderbolt", "Hardware & Periféricos", "Puesto: PC-14 Presencial", "Marcos Peña", "Finanzas", "ThinkPad X1", "Carlos Mendoza"],
  ["REQ-8919", "Hace 1h 20m", 80, "Media", "Aprobación y provisión de licencia Figma Enterprise para equipo de producto", "Software & Licencias", "Requiere visto bueno de Dirección", "Lucía Vance", "Operaciones", 'iMac 24"', "Laura Gómez"],
  ["INC-8918", "Hace 2h 05m", 125, "Crítica", "Bloqueo de cuenta Okta SSO tras 5 intentos fallidos y reseteo de token MFA", "Cuentas & SSO", "VIP: Director Jurídico", "Roberto Gil", "Legal & Corp", "iPhone 15 Pro", "David Ruiz"],
  ["REQ-8915", "Hace 2h 10m", 130, "Baja", "Reinstalación de cliente local de Microsoft Teams tras error de caché de perfiles", "Software & Apps", "Instrucciones enviadas", "Clara Soto", "RRHH / People", "MacBook Air", "Sofía Navarro"],
  ["INC-8914", "Hace 2h 40m", 160, "Media", "Impresora de planta 3 no aparece en la red", "Hardware & Periféricos", "Puesto: Planta 3", "Diego Salas", "Compras", 'iMac 24"', "Laura Gómez"],
  ["REQ-8912", "Hace 3h", 180, "Baja", "Alta de nuevo colaborador: equipo y accesos básicos", "Cuentas & SSO", "Ingreso el lunes", "Paula Rivas", "RRHH / People", "MacBook Air", null],
  ["INC-8910", "Hace 3h 30m", 210, "Alta", "Lentitud extrema en Salesforce desde la oficina", "Software & Apps", "Impacto: Equipo comercial", "Hugo Marín", "Ventas", "ThinkPad T14", "Carlos Mendoza"],
  ["INC-8907", "Hace 4h", 240, "Media", "Correo no sincroniza en iPhone corporativo", "Software & Apps", "Instrucciones enviadas", "Ana Beltrán", "Finanzas", "iPhone 15", "Sofía Navarro"],
  ["REQ-8905", "Hace 4h 20m", 260, "Baja", 'Solicitud de segundo monitor 27"', "Hardware & Periféricos", "Requiere visto bueno de jefatura", "Iván Cortés", "Operaciones", 'iMac 24"', null],
  ["INC-8903", "Hace 5h", 300, "Alta", "Caída intermitente de Wi-Fi en sala de juntas B", "Redes & VPN", "Impacto: Reuniones de dirección", "Mónica Ferrer", "Dirección", "MacBook Pro M3", "Carlos Mendoza"],
  ["INC-8901", "Hace 5h 30m", 330, "Alta", "Servidor de archivos de Marketing inaccesible", "Redes & VPN", "Impacto: Bloquea a 12 usuarios", "Rafael Ortiz", "Marketing", "MacBook Pro M3", "Carlos Mendoza"],
  ["REQ-8899", "Hace 6h", 360, "Media", "Instalación de Adobe Creative Cloud para campañas", "Software & Licencias", "Licencia pendiente de aprobación", "Daniela Quiroz", "Marketing", "MacBook Air", "Laura Gómez"],
  ["INC-8897", "Hace 6h 40m", 400, "Baja", "Teclado con teclas que no responden", "Hardware & Periféricos", "Puesto: PC-22 Presencial", "Silvia Roldán", "Legal & Corp", "ThinkPad X1", null],
  ["INC-8894", "Hace 7h", 420, "Media", "Error de certificado al abrir el portal de nómina", "Cuentas & SSO", "Instrucciones enviadas", "Tomás Aguirre", "RRHH / People", "MacBook Air", "David Ruiz"],
  ["INC-8892", "Hace 7h 30m", 450, "Alta", "Bloqueo de cuenta tras cambio de contraseña", "Cuentas & SSO", "Impacto: Sin acceso a correo", "Valeria Núñez", "Finanzas", "ThinkPad X1", "David Ruiz"],
  ["REQ-8889", "Hace 8h", 480, "Baja", "Acceso de lectura al repositorio de contratos", "Cuentas & SSO", "Requiere visto bueno de Legal", "Jorge Pineda", "Operaciones", "ThinkPad T14", null],
  ["INC-8886", "Hace 8h 20m", 500, "Media", "Videollamadas con audio entrecortado en Teams", "Software & Apps", "Instrucciones enviadas", "Carmen Ibarra", "Producto", "MacBook Pro M3", "Sofía Navarro"],
  ["INC-8883", "Hace 9h", 540, "Alta", "Laptop no enciende tras actualización de BIOS", "Hardware & Periféricos", "Impacto: Sin equipo de trabajo", "Esteban Lara", "Producto", "ThinkPad X1", "Carlos Mendoza"],
  ["REQ-8880", "Hace 9h 30m", 570, "Baja", "Reemplazo de auriculares Jabra", "Hardware & Periféricos", "Puesto: Remoto", "Daniela Reyes", "Marketing", "MacBook Air", null],
  ["INC-8877", "Hace 10h", 600, "Media", "VPN se desconecta cada 30 minutos", "Redes & VPN", "Impacto: Trabajo remoto", "Pablo Serrano", "Ventas", "MacBook Pro M3", "David Ruiz"],
  ["INC-8874", "Hace 10h 30m", 630, "Alta", "Acceso MFA fallido en dispositivo nuevo", "Cuentas & SSO", "VIP: Director Financiero", "Héctor Lugo", "Dirección", "iPhone 15", "David Ruiz"],
  ["INC-8870", "Hace 11h", 660, "Baja", "Actualización de Microsoft Office pendiente", "Software & Apps", "Instrucciones enviadas", "Irene Campos", "Compras", 'iMac 24"', "Laura Gómez"],
  ["REQ-8868", "Hace 11h 30m", 690, "Media", "Solicitud de licencia Figma para diseño", "Software & Licencias", "Requiere visto bueno de Dirección", "Nora Villar", "Producto", "MacBook Pro M3", "Sofía Navarro"],
];

const estadoInicial = (prioridad: Prioridad, contexto: string, tecnico: string | null): EstadoFlujo => {
  if (!tecnico) return "Nuevo";
  if (/visto bueno|aprobación/i.test(contexto)) return "Esperando Aprobación";
  if (/Instrucciones enviadas/i.test(contexto)) return "Esperando Usuario";
  if (prioridad === "Crítica") return "En Triaje L2";
  return "En Investigación";
};

const TICKETS_INICIALES: Ticket[] = FILAS.map(
  ([id, hace, minutos, prioridad, asunto, categoria, contexto, nombre, area, equipo, tecnico]) => {
    const total = SLA_TOTAL[prioridad];
    const restante = Math.max(5, total - minutos);
    return {
      id,
      hace,
      minutos,
      prioridad,
      asunto,
      categoria,
      contexto,
      solicitante: { nombre, area, equipo },
      estado: estadoInicial(prioridad, contexto, tecnico),
      tecnico,
      sla: SLA_FIJO[id] ?? {
        texto: `${textoDuracion(restante)} restante`,
        restantePct: Math.round((restante / total) * 100),
        pausado: false,
      },
    };
  },
);

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
    .slice(0, 2)
    .join("");

const esRiesgo = (t: Ticket) => !t.sla.pausado && t.sla.restantePct <= 20;

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
export default function TicketsSoportePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [nombreTecnico, setNombreTecnico] = useState("");
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [errorPerfil, setErrorPerfil] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [fPrioridad, setFPrioridad] = useState("todas");
  const [fCategoria, setFCategoria] = useState("todas");
  const [fEstado, setFEstado] = useState("todos");
  const [fRango, setFRango] = useState("24h");
  const [vista, setVista] = useState<"tabla" | "kanban">("tabla");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(5);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [sync, setSync] = useState("14:28:02");
  const [refrescando, setRefrescando] = useState(false);
  const [vistaGuardada, setVistaGuardada] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  useEffect(() => {
    let active = true;

    const cargarTicketsAsignados = async () => {
      try {
        const response = await fetch("/api/me");
        if (!response.ok) {
          throw new Error("No se pudo cargar el perfil del técnico.");
        }

        const perfil = (await response.json()) as PerfilResponse;
        const nombre = [perfil.name, perfil.lastname]
          .filter((parte): parte is string => Boolean(parte?.trim()))
          .join(" ")
          .trim();

        if (active) {
          setNombreTecnico(nombre);
          setTickets(
            nombre
              ? TICKETS_INICIALES.filter(
                  (ticket) =>
                    ticket.tecnico !== null &&
                    normalizarNombre(ticket.tecnico) === normalizarNombre(nombre),
                )
              : [],
          );
        }
      } catch {
        if (active) {
          setErrorPerfil("No se pudieron cargar tus tickets asignados.");
        }
      } finally {
        if (active) {
          setCargandoPerfil(false);
        }
      }
    };

    void cargarTicketsAsignados();
    return () => {
      active = false;
    };
  }, []);

  const mostrarToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  /* ---- Indicadores calculados ---- */
  const kpi = useMemo(() => {
    const total = tickets.length;
    return {
      riesgo: tickets.filter(esRiesgo).length,
      criticosRiesgo: tickets.filter((t) => esRiesgo(t) && t.prioridad === "Crítica").length,
      mios: tickets.length,
      total,
      capacidad: Math.round((total / 32) * 100),
    };
  }, [tickets]);

  /* ---- Filtrado ---- */
  const rangoMax = RANGOS.find((r) => r.id === fRango)?.max ?? 1440;
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
  if (fRango !== "24h") chips.push({ clave: "r", texto: `Rango: ${RANGOS.find((r) => r.id === fRango)?.label}`, quitar: () => setFRango("24h") });

  const limpiarFiltros = () => {
    setBusqueda("");
    setFPrioridad("todas");
    setFCategoria("todas");
    setFEstado("todos");
    setFRango("24h");
    setPagina(1);
  };

  /* ---- Selección y acciones ---- */
  const todosVisiblesMarcados = visibles.length > 0 && visibles.every((t) => seleccion.includes(t.id));
  const alternarTodos = () =>
    setSeleccion((prev) =>
      todosVisiblesMarcados
        ? prev.filter((id) => !visibles.some((t) => t.id === id))
        : Array.from(new Set([...prev, ...visibles.map((t) => t.id)])),
    );
  const alternarUno = (id: string) =>
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const subirPrioridad = () => {
    setTickets((prev) => prev.map((t) => (seleccion.includes(t.id) ? { ...t, prioridad: "Alta" as Prioridad } : t)));
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
            <ChevronDown className="h-3 w-3 text-indigo-400" />
          </span>
          <button type="button" aria-label="Notificaciones" className="relative rounded-full p-2 text-slate-600 hover:bg-white">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#313652] text-[10px] font-bold text-white">
            {nombreTecnico
              .split(/\s+/)
              .map((parte) => parte[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
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
            <span className="text-3xl font-bold text-slate-800">18</span>
            <span className="mb-1 text-[10px] text-slate-400">SLA 92%</span>
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
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">Turno A Activo</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Operador responsable: {nombreTecnico}
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
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-indigo-50/60 px-3 py-2 text-xs">
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
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
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
            <table className="w-full min-w-[1100px] text-left text-xs">
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
                      {cargandoPerfil
                        ? "Cargando tus tickets asignados..."
                        : errorPerfil ||
                          (tickets.length === 0
                            ? "No tienes tickets asignados actualmente."
                            : "No hay tickets que coincidan con los filtros.")}
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
                        {esRiesgo(t) && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                        #{t.id}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{t.hace}</p>
                    </td>
                    <td className="px-3 py-3 align-top"><ChipPrioridad p={t.prioridad} /></td>
                    <td className="px-3 py-3 align-top">
                      <p className="max-w-sm text-xs font-bold leading-snug text-slate-800">{t.asunto}</p>
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
                <div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto">
                  {col.length === 0 && (
                    <p className="py-6 text-center text-[11px] text-slate-400">
                      {cargandoPerfil
                        ? "Cargando tus tickets asignados..."
                        : errorPerfil || "Sin tickets asignados"}
                    </p>
                  )}
                  {col.map((t) => (
                    <article key={t.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
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