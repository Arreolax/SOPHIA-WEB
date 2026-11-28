"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleCheck,
  Clock,
  Copy,
  Download,
  Globe,
  History,
  Laptop,
  MessageSquareText,
  Network,
  NotebookPen,
  Paperclip,
  Play,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
  X,
  FileText,
  Terminal,
  Circle,
  BookOpen,
  Plus,
  Ticket as TicketIcon,
} from "lucide-react";

/* ---------- Tipos de datos reales ---------- */
type RealTicket = {
  id: string;
  title: string;
  description: string;
  modality?: string;
  type?: string;
  subcategory?: string | null;
  priority: string;
  status: string;
  created_at?: string;
  category?: { id: string; name: string } | null;
  creator?: { id: string; name?: string; username?: string; email?: string } | null;
  assignee?: { id: string; name?: string; username?: string; email?: string } | null;
};

type KnowledgeArticle = {
  id: string;
  ticket_ref: string;
  title: string;
  category: string;
  symptom_pattern: string;
  solution_script: string;
  resolution_time: string;
  match_score: number;
  created_at?: string;
};

type LineaLog = { hora: string; nivel: string; texto: string; tipo: "normal" | "error" | "fatal" };

/* ---------- Ticket de respaldo (Demo) ---------- */
const TICKET_DEMO: RealTicket = {
  id: "INC-8921",
  title: "Fallo de Conexión VPN Cisco AnyConnect - Error 403-AUTH-TIMEOUT",
  description:
    "El cliente AnyConnect presenta un serial revocado tras la actualización macOS 14.4, impidiendo el apretón de manos TLS con el concentrador Cisco ASA central.",
  modality: "Remoto",
  type: "INCIDENTE",
  subcategory: "VPN / Certificados",
  priority: "CRITICAL",
  status: "IN_PROGRESS",
  created_at: new Date().toISOString(),
  category: { id: "demo-cat", name: "Red & Conectividad" },
  creator: {
    id: "demo-user",
    name: "Elena Morales",
    username: "emorales",
    email: "elena.morales@empresa.net",
  },
  assignee: {
    id: "demo-tech",
    name: "Carlos Mendoza",
    username: "cmendoza",
    email: "carlos.mendoza@empresa.net",
  },
};

const ESTADOS_UI = ["Abierto", "En Diagnóstico", "En Remediación", "Esperando Usuario", "Resuelto"];

const mapStatusToUI = (status?: string) => {
  const s = String(status || "").toUpperCase();
  if (s === "OPEN") return "Abierto";
  if (s === "IN_PROGRESS") return "En Diagnóstico";
  if (s === "PENDING" || s === "WAITING") return "Esperando Usuario";
  if (s === "RESOLVED" || s === "CLOSED") return "Resuelto";
  return "En Diagnóstico";
};

const mapPriorityBadge = (priority?: string) => {
  const p = String(priority || "").toUpperCase();
  if (p === "CRITICAL") return "P1 • CRÍTICA";
  if (p === "HIGH") return "P2 • ALTA";
  if (p === "MEDIUM") return "P3 • MEDIA";
  return "P4 • BAJA";
};

const formatTicketCode = (id: string) => {
  if (id.startsWith("INC-")) return id;
  return `TCK-${id.slice(0, 6).toUpperCase()}`;
};

const formatFecha = (iso?: string) => {
  if (!iso) return "Reciente";
  try {
    return new Date(iso).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Reciente";
  }
};

const buildLogsForTicket = (ticket: RealTicket): LineaLog[] => {
  if (ticket.id === "INC-8921") {
    return [
      { hora: "09:12:03.102", nivel: "INFO", texto: "Contacting headend gateway https://vpn-gw01.empresa.net/CORP-REMOTE", tipo: "normal" },
      { hora: "09:12:04.450", nivel: "INFO", texto: "TLS 1.3 negotiated with cipher TLS_AES_256_GCM_SHA384", tipo: "normal" },
      { hora: "09:12:04.810", nivel: "DEBUG", texto: "Requesting Client Certificate for EAP-TLS verification...", tipo: "normal" },
      { hora: "09:12:05.110", nivel: "SEC", texto: "Local Keychain queried: 'com.cisco.anyconnect' identity found (Serial: 4F:3A:00:21)", tipo: "normal" },
      { hora: "09:12:05.340", nivel: "ERROR", texto: "CERTIFICATE_VERIFY_FAILED: Certificate validity window expired on 2024-05-15 00:00:00 UTC", tipo: "error" },
      { hora: "09:12:05.342", nivel: "ERROR", texto: "SCEP profile machine token mismatch (Hash: 9a3d8e... != remote headend thumbprint)", tipo: "error" },
      { hora: "09:12:07.001", nivel: "WARN", texto: "Retrying via fallback profile 'EMPLOYEE_SCEP_FALLBACK'...", tipo: "normal" },
      { hora: "09:12:09.552", nivel: "FATAL", texto: "[403-AUTH-TIMEOUT] Gateway refused authentication handshake. Terminating session.", tipo: "fatal" },
    ];
  }

  const code = formatTicketCode(ticket.id);
  const solicitante = ticket.creator?.name || ticket.creator?.username || "Usuario";
  const cat = ticket.category?.name || "General";

  return [
    { hora: "09:00:01.100", nivel: "INFO", texto: `Cargando contexto de incidente ${code} desde Supabase...`, tipo: "normal" },
    { hora: "09:00:01.340", nivel: "INFO", texto: `Categoría: ${cat} | Tipo: ${ticket.type || "INCIDENTE"} | Prioridad: ${ticket.priority}`, tipo: "normal" },
    { hora: "09:00:02.015", nivel: "DEBUG", texto: `Solicitante: ${solicitante} (${ticket.creator?.email || "sin correo"})`, tipo: "normal" },
    { hora: "09:00:02.890", nivel: "WARN", texto: `Descripción reportada: ${ticket.description || "Sin descripción detallada"}`, tipo: "error" },
    { hora: "09:00:03.410", nivel: "INFO", texto: "Analizando coincidencias en tabla KnowledgeArticle...", tipo: "normal" },
  ];
};

const SCRIPT_SUGERIDO = `# 1. Purgar credenciales obsoletas en Keychain vía Jamf Agent
sudo security delete-certificate -c "VPN SCEP" /Library/Keychains/System.keychain
# 2. Forzar renovación de perfil de máquina SCEP
sudo jamf manage && sudo jamf policy -event renew-vpn-cert
# 3. Reiniciar el servicio de AnyConnect
sudo launchctl kickstart -k system/com.cisco.anyconnect.vpnagentd`;

const PASOS = [
  { titulo: "Validar contexto y categoría del incidente", detalle: "Confirmar alcance con el solicitante y revisar historial de cambios previos." },
  { titulo: "Aplicar procedimiento de Base de Conocimientos", detalle: "Ejecutar script o pasos documentados en KnowledgeArticle para la falla." },
  { titulo: "Confirmar operatividad con el usuario final", detalle: "Verificar restauración del servicio antes de marcar el ticket como resuelto." },
];

const formatoHMS = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  return [h, m, seg].map((n) => String(n).padStart(2, "0")).join(":");
};

type Pestana = "script" | "nota" | "respuesta";

export default function TicketTecnicoPage() {
  // Lista de tickets reales desde Supabase (/api/tickets)
  const [ticketsReales, setTicketsReales] = useState<RealTicket[]>([]);
  const [cargandoTickets, setCargandoTickets] = useState(true);
  const [ticketActivo, setTicketActivo] = useState<RealTicket>(TICKET_DEMO);

  const [estado, setEstado] = useState("En Diagnóstico");
  const [copilotActivo, setCopilotActivo] = useState(true);
  const [segundos, setSegundos] = useState(1 * 3600 + 43 * 60 + 11);
  const slaTotal = 4 * 3600;

  const [pestana, setPestana] = useState<Pestana>("script");
  const [script, setScript] = useState(SCRIPT_SUGERIDO);
  const [nota, setNota] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [pasos, setPasos] = useState<boolean[]>([true, false, false]);
  const [log, setLog] = useState<LineaLog[]>(buildLogsForTicket(TICKET_DEMO));
  const [voto, setVoto] = useState<"up" | "down" | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [historial, setHistorial] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  // Estados reales conectados a /api/knowledge
  const [articulos, setArticulos] = useState<KnowledgeArticle[]>([]);
  const [cargandoKb, setCargandoKb] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [articuloSeleccionado, setArticuloSeleccionado] = useState<KnowledgeArticle | null>(null);
  const [modalCrearKb, setModalCrearKb] = useState(false);
  const [guardandoKb, setGuardandoKb] = useState(false);

  // Formulario para nuevo artículo en la Base de Conocimientos
  const [nuevoKb, setNuevoKb] = useState({
    ticket_ref: formatTicketCode(TICKET_DEMO.id),
    title: TICKET_DEMO.title,
    category: TICKET_DEMO.category?.name || "General",
    symptom_pattern: TICKET_DEMO.description,
    solution_script: SCRIPT_SUGERIDO,
    resolution_time: "15 min",
  });

  const terminalRef = useRef<HTMLDivElement>(null);

  const mostrarToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3200);
  };

  // Cargar tickets reales desde Supabase (/api/tickets)
  const cargarTicketsReales = async () => {
    try {
      setCargandoTickets(true);
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        const lista: RealTicket[] = data.tickets || [];
        setTicketsReales(lista);
        if (lista.length > 0) {
          seleccionarTicket(lista[0]);
        }
      }
    } catch (error) {
      console.error("Error cargando tickets reales:", error);
    } finally {
      setCargandoTickets(false);
    }
  };

  const seleccionarTicket = (t: RealTicket) => {
    setTicketActivo(t);
    setEstado(mapStatusToUI(t.status));
    setLog(buildLogsForTicket(t));
    setSegundos(t.priority === "CRITICAL" ? 1 * 3600 + 43 * 60 + 11 : 3 * 3600 + 15 * 60);
  };

  // Cargar artículos reales desde Supabase (/api/knowledge)
  const cargarArticulos = async (filtro = "") => {
    try {
      setCargandoKb(true);
      const url = filtro.trim()
        ? `/api/knowledge?q=${encodeURIComponent(filtro.trim())}`
        : "/api/knowledge";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setArticulos(data.articles || []);
      }
    } catch (error) {
      console.error("Error cargando base de conocimientos:", error);
    } finally {
      setCargandoKb(false);
    }
  };

  useEffect(() => {
    cargarTicketsReales();
    cargarArticulos();
  }, []);

  // Búsqueda con pequeño debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarArticulos(busqueda);
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  /* Cuenta regresiva del SLA */
  useEffect(() => {
    if (estado === "Resuelto") return;
    const timer = setInterval(() => setSegundos((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [estado]);

  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight });
  }, [log]);

  const pctSla = Math.max(0, Math.min(100, (segundos / slaTotal) * 100));
  const slaUrgente = segundos < 3600 * 2;

  const codigoTicket = formatTicketCode(ticketActivo.id);
  const nombreSolicitante =
    ticketActivo.creator?.name || ticketActivo.creator?.username || "Solicitante Registrado";
  const correoSolicitante = ticketActivo.creator?.email || "sin-correo@sophia.local";
  const inicialesSolicitante = nombreSolicitante
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const nombreCategoria = ticketActivo.category?.name || "General";
  const nombreAsignado =
    ticketActivo.assignee?.name || ticketActivo.assignee?.username || "Sin asignar";

  const cambiosHistorial = [
    `${formatFecha(ticketActivo.created_at)} • Ticket ${codigoTicket} creado por ${nombreSolicitante}`,
    `Asignado a: ${nombreAsignado}`,
    `Estado actual: ${estado}`,
  ];

  const copiar = async (texto: string, aviso: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      mostrarToast(aviso);
    } catch {
      mostrarToast("No se pudo copiar al portapapeles");
    }
  };

  const reanalizar = async () => {
    setAnalizando(true);
    await Promise.all([cargarTicketsReales(), cargarArticulos(busqueda)]);
    setAnalizando(false);
    mostrarToast("Tickets y Base de Conocimientos sincronizados con Supabase");
  };

  const insertarSecuencia = () => {
    setScript(SCRIPT_SUGERIDO);
    setPestana("script");
    mostrarToast("Secuencia insertada en la consola técnica");
  };

  const abrirModalNuevoKb = () => {
    setNuevoKb({
      ticket_ref: codigoTicket,
      title: ticketActivo.title,
      category: nombreCategoria,
      symptom_pattern: ticketActivo.description || "Patrón de falla reportado en ticket",
      solution_script: script || SCRIPT_SUGERIDO,
      resolution_time: "15 min",
    });
    setModalCrearKb(true);
  };

  const guardarArticuloKb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoKb.title.trim() || !nuevoKb.symptom_pattern.trim() || !nuevoKb.solution_script.trim()) {
      mostrarToast("Completa título, síntoma y solución");
      return;
    }

    try {
      setGuardandoKb(true);
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevoKb,
          match_score: 96,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        mostrarToast(data.error || "Error al guardar en la Base de Conocimientos");
        return;
      }

      setModalCrearKb(false);
      mostrarToast("Artículo publicado en Supabase (Base de Conocimientos)");
      await cargarArticulos(busqueda);
    } catch {
      mostrarToast("Error de red al guardar el artículo");
    } finally {
      setGuardandoKb(false);
    }
  };

  const resumenSinTecnicismos = () => {
    const primerNombre = nombreSolicitante.split(" ")[0];
    setRespuesta(
      `Hola ${primerNombre}, ya estamos atendiendo tu reporte (${codigoTicket}: "${ticketActivo.title}"). ` +
        `Identificamos la causa del inconveniente en el área de ${nombreCategoria} y ya estamos aplicando la solución correspondiente. ` +
        `Te avisaremos por este medio en cuanto quede completamente restablecido.`,
    );
    setPestana("respuesta");
    mostrarToast(`Mensaje redactado para ${primerNombre}`);
  };

  const comprobarHandshake = () => {
    mostrarToast(`Verificando estado técnico de ${codigoTicket}...`);
    setTimeout(() => {
      setLog((l) => [
        ...l,
        {
          hora: new Date().toLocaleTimeString("es-MX", { hour12: false }) + ".000",
          nivel: "INFO",
          texto: `Diagnóstico de ${codigoTicket}: esperando aplicación de procedimiento de remediación.`,
          tipo: "normal",
        },
      ]);
    }, 800);
  };

  const ejecutarRemoto = () => {
    setConfirmar(false);
    const hora = () => new Date().toLocaleTimeString("es-MX", { hour12: false }) + ".000";
    setLog((l) => [
      ...l,
      { hora: hora(), nivel: "INFO", texto: `Procedimiento técnico enviado para ${codigoTicket} (simulación)`, tipo: "normal" },
    ]);
    setTimeout(
      () =>
        setLog((l) => [
          ...l,
          { hora: hora(), nivel: "INFO", texto: "Ejecución completada. Listo para documentar en Base de Conocimientos.", tipo: "normal" },
        ]),
      1000,
    );
    setEstado("En Remediación");
    mostrarToast("Acción ejecutada en entorno técnico");
  };

  const guardarBorrador = () => mostrarToast("Borrador guardado en este navegador");

  const textoPestana = pestana === "script" ? script : pestana === "nota" ? nota : respuesta;
  const cambiarTexto = (v: string) =>
    pestana === "script" ? setScript(v) : pestana === "nota" ? setNota(v) : setRespuesta(v);

  const pestanas: { id: Pestana; label: string }[] = [
    { id: "script", label: "Script / Procedimiento Técnico" },
    { id: "nota", label: "Nota Interna" },
    { id: "respuesta", label: "Respuesta al Usuario" },
  ];

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

      {/* Modal: Ver detalle de un artículo de la Base de Conocimientos */}
      {articuloSeleccionado && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-slate-800 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div>
                  <span className="font-mono text-[11px] font-bold text-indigo-600">{articuloSeleccionado.ticket_ref}</span>
                  <h3 className="text-sm font-bold text-slate-800">{articuloSeleccionado.title}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setArticuloSeleccionado(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                  {articuloSeleccionado.category}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  {articuloSeleccionado.match_score}% coincidencia
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                  Tiempo promedio: {articuloSeleccionado.resolution_time}
                </span>
              </div>

              <div>
                <p className="font-bold text-slate-700">Patrón / Síntoma detectado:</p>
                <p className="mt-1 rounded-lg bg-slate-50 p-2.5 text-slate-600">{articuloSeleccionado.symptom_pattern}</p>
              </div>

              <div>
                <p className="font-bold text-slate-700">Script / Procedimiento de solución:</p>
                <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-[#1a1f3c] p-3 font-mono text-[11px] text-slate-200">
                  {articuloSeleccionado.solution_script}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setArticuloSeleccionado(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setScript(articuloSeleccionado.solution_script);
                  setPestana("script");
                  setArticuloSeleccionado(null);
                  mostrarToast(`Solución de ${articuloSeleccionado.ticket_ref} cargada en consola`);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-[#262a40] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1c2033]"
              >
                <Terminal className="h-3.5 w-3.5" /> Usar en consola técnica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Guardar nuevo artículo en Base de Conocimientos (Supabase) */}
      {modalCrearKb && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/60 p-4">
          <form onSubmit={guardarArticuloKb} className="w-full max-w-lg rounded-2xl bg-white p-6 text-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <Plus className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nuevo Artículo en Base de Conocimientos</h3>
                  <p className="text-[11px] text-slate-500">Se guardará directamente en Supabase para futuros incidentes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCrearKb(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800">Referencia Ticket</label>
                  <input
                    type="text"
                    value={nuevoKb.ticket_ref}
                    onChange={(e) => setNuevoKb({ ...nuevoKb, ticket_ref: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800">Categoría</label>
                  <input
                    type="text"
                    value={nuevoKb.category}
                    onChange={(e) => setNuevoKb({ ...nuevoKb, category: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800">Título del Artículo *</label>
                <input
                  type="text"
                  required
                  value={nuevoKb.title}
                  onChange={(e) => setNuevoKb({ ...nuevoKb, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800">Síntoma o Patrón de Error *</label>
                <input
                  type="text"
                  required
                  value={nuevoKb.symptom_pattern}
                  onChange={(e) => setNuevoKb({ ...nuevoKb, symptom_pattern: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800">Script / Pasos de Solución *</label>
                <textarea
                  rows={5}
                  required
                  value={nuevoKb.solution_script}
                  onChange={(e) => setNuevoKb({ ...nuevoKb, solution_script: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 font-mono text-[11px] font-medium text-slate-900 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalCrearKb(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoKb}
                className="flex items-center gap-1.5 rounded-lg bg-[#262a40] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1c2033] disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" /> {guardandoKb ? "Guardando..." : "Guardar en Base de Conocimientos"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmación de ejecución remota */}
      {confirmar && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-800 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <TriangleAlert className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-800">¿Ejecutar procedimiento en {codigoTicket}?</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Se aplicará la secuencia técnica sobre el incidente reportado por{" "}
                  <strong>{nombreSolicitante}</strong>. Asegúrate de haber documentado la nota interna antes de continuar.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmar(false)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarRemoto}
                className="rounded-lg bg-[#262a40] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1c2033]"
              >
                Sí, ejecutar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra superior con buscador de KB y selector de tickets reales de Supabase */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar en Base de Conocimientos..."
              className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
            />
            {busqueda && (
              <button type="button" onClick={() => setBusqueda("")} className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Selector de Tickets Reales de Supabase */}
          <div className="relative min-w-[240px] max-w-xs flex-1">
            <TicketIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-600" />
            <select
              aria-label="Seleccionar ticket real"
              value={ticketActivo.id}
              onChange={(e) => {
                const val = e.target.value;
                if (val === TICKET_DEMO.id) {
                  seleccionarTicket(TICKET_DEMO);
                  mostrarToast("Cargado ticket de demostración (INC-8921)");
                  return;
                }
                const encontrado = ticketsReales.find((t) => t.id === val);
                if (encontrado) {
                  seleccionarTicket(encontrado);
                  mostrarToast(`Ticket real cargado: ${formatTicketCode(encontrado.id)}`);
                }
              }}
              className="w-full appearance-none rounded-xl border border-indigo-200 bg-white py-2 pl-8 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
            >
              {cargandoTickets ? (
                <option value={ticketActivo.id}>Cargando tickets reales...</option>
              ) : (
                <>
                  {ticketsReales.map((t) => (
                    <option key={t.id} value={t.id}>
                      {formatTicketCode(t.id)} • {t.title.slice(0, 34)}
                      {t.title.length > 34 ? "..." : ""}
                    </option>
                  ))}
                  <option value={TICKET_DEMO.id}>INC-8921 (Demo VPN Cisco)</option>
                </>
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {ticketsReales.length > 0 ? `${ticketsReales.length} Tickets Reales` : "Modo Demo"}
          </span>
          <button type="button" aria-label="Notificaciones" className="relative rounded-full p-2 text-slate-600 hover:bg-white">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#313652] text-[10px] font-bold text-white">ST</span>
        </div>
      </div>

      {/* Cabecera del ticket seleccionado */}
      <section className="mb-5 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <Globe className="h-6 w-6" />
          </span>
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 font-bold text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {mapPriorityBadge(ticketActivo.priority)}
              </span>
              <span className="font-mono font-semibold text-slate-600">#{codigoTicket}</span>
              <span className="text-slate-300">•</span>
              <span className="rounded bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">{nombreCategoria}</span>
              <span className="text-slate-500">• Creado: {formatFecha(ticketActivo.created_at)}</span>
            </div>
            <h1 className="mt-2 text-xl font-bold leading-snug text-slate-800">{ticketActivo.title}</h1>
            <p className="mt-2 text-[11px] text-slate-500">
              Solicitante: <strong className="text-slate-800">{nombreSolicitante}</strong> (
              {ticketActivo.subcategory || ticketActivo.type || "Soporte General"} • {ticketActivo.modality || "Remoto"})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-xl bg-indigo-50/70 px-4 py-2.5">
            <svg width="34" height="34" viewBox="0 0 36 36" className="-rotate-90" aria-hidden="true">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={slaUrgente ? "#dc2626" : "#313652"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(pctSla / 100) * 94.2} 94.2`}
              />
            </svg>
            <div className="leading-tight">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">SLA Resolución</p>
              <p className={`font-mono text-sm font-bold ${slaUrgente ? "text-red-600" : "text-slate-800"}`}>
                {formatoHMS(segundos)}
              </p>
            </div>
          </div>

          <div className="relative">
            <select
              value={estado}
              aria-label="Estado del ticket"
              onChange={(e) => {
                setEstado(e.target.value);
                mostrarToast(`Estado actualizado: ${e.target.value}`);
              }}
              className="appearance-none rounded-xl bg-indigo-50/70 py-3 pl-8 pr-9 text-xs font-semibold text-slate-800 outline-none"
            >
              {ESTADOS_UI.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-500" />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>

          <button
            type="button"
            aria-pressed={copilotActivo}
            onClick={() => setCopilotActivo((v) => !v)}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold shadow-md transition-colors ${
              copilotActivo ? "bg-[#262a40] text-white hover:bg-[#1c2033]" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
            }`}
          >
            <Bot className="h-4 w-4" />
            Copilot {copilotActivo ? "Activo" : "en pausa"}
          </button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* ============ Columna principal ============ */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* Solicitante y detalles reales del ticket */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-indigo-50/70 p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#313652] text-xs font-bold text-white">
                  {inicialesSolicitante}
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-bold text-slate-800">{nombreSolicitante}</p>
                  <p className="text-[11px] text-slate-500">
                    {correoSolicitante} • Técnico asignado: {nombreAsignado}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
                  {ticketActivo.id === TICKET_DEMO.id ? "Demo" : "Supabase Ticket"}
                </span>
                <button
                  type="button"
                  aria-label="Copiar correo"
                  onClick={() => copiar(correoSolicitante, "Correo copiado")}
                  className="rounded-lg bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-indigo-50/60 p-3">
                <p className="text-[10px] text-slate-500">Folio / ID</p>
                <p className="mt-1 font-mono text-xs font-bold text-slate-800">{codigoTicket}</p>
                <p className="text-[10px] text-slate-500">{ticketActivo.type || "INCIDENTE"}</p>
              </div>
              <div className="rounded-xl bg-indigo-50/60 p-3">
                <p className="text-[10px] text-slate-500">Categoría</p>
                <p className="mt-1 text-xs font-bold text-slate-800">{nombreCategoria}</p>
                <p className="text-[10px] text-slate-500">{ticketActivo.subcategory || "Sin subcategoría"}</p>
              </div>
              <div className="rounded-xl bg-indigo-50/60 p-3">
                <p className="text-[10px] text-slate-500">Modalidad</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-800">
                  {ticketActivo.modality || "Remoto"} <Check className="h-3 w-3 text-emerald-600" />
                </p>
                <p className="text-[10px] text-slate-500">Base de datos activa</p>
              </div>
              <div className="rounded-xl bg-indigo-50/60 p-3">
                <p className="text-[10px] text-slate-500">Estado en BD</p>
                <p className="mt-1 text-xs font-bold text-slate-800">{ticketActivo.status}</p>
                <p className="text-[10px] text-slate-500">Prioridad: {ticketActivo.priority}</p>
              </div>
            </div>

            {ticketActivo.description && (
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Descripción del problema reportado</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">{ticketActivo.description}</p>
              </div>
            )}
          </section>

          {/* Telemetría */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <SquareTerminal className="h-4 w-4" />
                Telemetría &amp; Trazabilidad del Incidente ({codigoTicket})
              </h2>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-slate-400">sophia-db.ticket</span>
                <button
                  type="button"
                  onClick={() =>
                    copiar(
                      log.map((l) => `${l.hora} [${l.nivel}] ${l.texto}`).join("\n"),
                      "Dump completo copiado al portapapeles",
                    )
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-indigo-100"
                >
                  <Download className="h-3.5 w-3.5" />
                  Dump Completo
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-[#1a1f3c] p-4 font-mono text-[11px] leading-relaxed text-slate-300">
              <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2 text-[10px] uppercase tracking-wide text-slate-500">
                <span>[Diagnostic Trace - SOPHIA Engine - {codigoTicket}]</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live buffer
                </span>
              </div>
              <div ref={terminalRef} className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {log.map((l, i) => (
                  <p
                    key={i}
                    className={
                      l.tipo === "fatal"
                        ? "rounded bg-red-500/15 px-2 py-1.5 font-bold text-red-400"
                        : l.tipo === "error"
                          ? "font-bold text-slate-100"
                          : ""
                    }
                  >
                    {l.hora} [{l.nivel}] {l.texto}
                  </p>
                ))}
              </div>
            </div>
          </section>

          {/* Bitácora técnica */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <NotebookPen className="h-4 w-4" />
                Bitácora Técnica &amp; Acciones de Resolución
              </h2>
              <button
                type="button"
                onClick={() => setHistorial((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-indigo-100"
              >
                <History className="h-3.5 w-3.5" />
                Historial de Cambios ({cambiosHistorial.length})
              </button>
              {historial && (
                <div className="absolute right-0 top-full z-10 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-800">Historial de cambios</p>
                    <button type="button" aria-label="Cerrar historial" onClick={() => setHistorial(false)}>
                      <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-700" />
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-600">
                    {cambiosHistorial.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-indigo-50/70 p-1" role="tablist">
              {pestanas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={pestana === p.id}
                  onClick={() => setPestana(p.id)}
                  className={`rounded-lg px-2 py-2.5 text-[11px] font-semibold transition-colors ${
                    pestana === p.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="rounded-xl bg-indigo-50/60 p-3">
              {pestana === "script" && (
                <div className="mb-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wide text-slate-500">
                  <span>Script o pasos técnicos de remediación</span>
                  <span className="rounded bg-white px-2 py-1 font-mono normal-case">Target: {codigoTicket}</span>
                </div>
              )}
              <textarea
                value={textoPestana}
                onChange={(e) => cambiarTexto(e.target.value)}
                rows={6}
                spellCheck={false}
                placeholder={
                  pestana === "nota"
                    ? "Escribe una nota visible solo para el equipo técnico..."
                    : pestana === "respuesta"
                      ? "Escribe el mensaje que recibirá el usuario..."
                      : "Escribe o pega el script o pasos a ejecutar..."
                }
                className={`w-full resize-y rounded-lg bg-white p-3 text-[11px] leading-relaxed text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-[#313652] ${
                  pestana === "script" ? "font-mono" : ""
                }`}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => mostrarToast("Selector de archivos (pendiente de conectar)")}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2.5 text-[11px] font-medium text-slate-600 hover:bg-indigo-100"
                >
                  <Paperclip className="h-3.5 w-3.5" /> Adjuntar Log
                </button>
                <button
                  type="button"
                  onClick={comprobarHandshake}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2.5 text-[11px] font-medium text-slate-600 hover:bg-indigo-100"
                >
                  <Network className="h-3.5 w-3.5" /> Comprobar Diagnóstico
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={guardarBorrador}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-200 px-3 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-300"
                >
                  <Save className="h-3.5 w-3.5" /> Guardar Borrador
                </button>
                <button
                  type="button"
                  onClick={() => (pestana === "script" ? setConfirmar(true) : mostrarToast("Mensaje enviado (simulado)"))}
                  className="flex items-center gap-1.5 rounded-lg bg-[#262a40] px-4 py-2.5 text-[11px] font-semibold text-white shadow-md hover:bg-[#1c2033]"
                >
                  <Play className="h-3.5 w-3.5" />
                  {pestana === "script" ? "Ejecutar Procedimiento" : pestana === "nota" ? "Guardar Nota" : "Enviar al Usuario"}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ============ IT Copilot & Base de Conocimientos (Conectado a Supabase) ============ */}
        <aside className="relative">
          <section
            className={`rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50/60 to-white p-5 shadow-sm transition-opacity ${
              copilotActivo ? "" : "pointer-events-none opacity-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#262a40] text-white">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
                    IT IA
                    <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700">v3.2 ITIL-trained</span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {analizando ? "Sincronizando..." : "Conectado a Supabase Live"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <button type="button" aria-label="Útil" onClick={() => setVoto(voto === "up" ? null : "up")} className={`rounded p-1 hover:text-slate-700 ${voto === "up" ? "text-emerald-600" : ""}`}>
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label="No útil" onClick={() => setVoto(voto === "down" ? null : "down")} className={`rounded p-1 hover:text-slate-700 ${voto === "down" ? "text-red-500" : ""}`}>
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label="Reanalizar" onClick={reanalizar} className="rounded p-1 hover:text-slate-700">
                  <RefreshCw className={`h-3.5 w-3.5 ${analizando ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-indigo-50/80 p-3">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-slate-500">
                <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Análisis del Ticket Activo</span>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 normal-case text-indigo-700">{nombreCategoria}</span>
              </div>
              <p className="mt-2 text-xs font-bold leading-snug text-slate-800">{ticketActivo.title}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                {ticketActivo.description || "Sin descripción adicional registrada en este ticket."}
              </p>
            </div>

            {/* Base de Conocimientos Real desde Supabase */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-slate-500">
                <span className="flex items-center gap-1"><History className="h-3 w-3" /> Base de Conocimientos ({articulos.length})</span>
                <button
                  type="button"
                  onClick={abrirModalNuevoKb}
                  className="rounded bg-indigo-100 px-2 py-0.5 normal-case font-bold text-indigo-700 hover:bg-indigo-200"
                >
                  + Nuevo
                </button>
              </div>

              {cargandoKb ? (
                <p className="rounded-xl bg-indigo-50/40 p-3 text-center text-[11px] text-slate-500">
                  Cargando artículos desde Supabase...
                </p>
              ) : articulos.length === 0 ? (
                <p className="rounded-xl bg-indigo-50/40 p-3 text-center text-[11px] text-slate-500">
                  No se encontraron artículos con &quot;{busqueda}&quot;.
                </p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {articulos.map((p) => (
                    <div key={p.id} className="rounded-xl bg-indigo-50/60 p-3">
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700">{p.ticket_ref}</span>
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${p.match_score >= 90 ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"}`}>
                            {p.match_score}% coincidencia
                          </span>
                        </span>
                        <span className="text-slate-400">Resuelto en {p.resolution_time}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] font-bold leading-snug text-slate-800">{p.title}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1 truncate text-[10px] text-slate-500">
                          <Clock className="h-3 w-3 shrink-0" /> {p.category}
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => copiar(p.solution_script, `Solución de ${p.ticket_ref} copiada`)}
                            className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            Copiar
                          </button>
                          <button
                            type="button"
                            onClick={() => setArticuloSeleccionado(p)}
                            className="rounded-md bg-[#262a40] px-2 py-1 text-[10px] font-semibold text-white shadow-sm hover:bg-[#1c2033]"
                          >
                            Ver Registro
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-slate-500">
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Checklist de atención</span>
                <span className="normal-case font-medium text-slate-400">
                  {pasos.filter(Boolean).length}/{PASOS.length} pasos completados
                </span>
              </div>
              <div className="space-y-2">
                {PASOS.map((p, i) => (
                  <button
                    key={p.titulo}
                    type="button"
                    aria-pressed={pasos[i]}
                    onClick={() => setPasos((prev) => prev.map((v, j) => (j === i ? !v : v)))}
                    className="flex w-full items-start gap-2.5 rounded-xl bg-indigo-50/60 p-3 text-left hover:bg-indigo-50"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#313652] text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold leading-snug text-slate-800">{p.titulo}</span>
                      <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">{p.detalle}</span>
                    </span>
                    {pasos[i] ? (
                      <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={insertarSecuencia}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-100/70 px-3 py-2.5 text-[11px] font-bold text-slate-800 hover:bg-indigo-100"
              >
                <Terminal className="h-3.5 w-3.5" /> Insertar plantilla en consola técnica
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={resumenSinTecnicismos}
                className="rounded-xl bg-slate-100 p-3 text-left hover:bg-slate-200"
              >
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-800">
                  <MessageSquareText className="h-3.5 w-3.5" /> Resumen sin tecnicismos
                </span>
                <span className="mt-1 block text-[10px] leading-snug text-slate-500">
                  Redacta mensaje amigable para {nombreSolicitante.split(" ")[0]}.
                </span>
              </button>
              <button
                type="button"
                onClick={abrirModalNuevoKb}
                className="rounded-xl bg-indigo-100/80 p-3 text-left hover:bg-indigo-200/80"
              >
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-900">
                  <FileText className="h-3.5 w-3.5" /> Generar borrador de KB
                </span>
                <span className="mt-1 block text-[10px] leading-snug text-indigo-700">
                  Guarda la solución de {codigoTicket} en Supabase.
                </span>
              </button>
            </div>
          </section>

          {!copilotActivo && (
            <div className="absolute inset-x-0 top-24 mx-auto w-fit rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white shadow-lg">
              IA en pausa
            </div>
          )}
        </aside>
      </div>

      <p className="mt-4 flex items-center gap-2 text-[10px] text-slate-400">
        <Laptop className="h-3 w-3" /> Módulo Base de Conocimientos conectado a `/api/tickets` y `/api/knowledge` en Supabase.
      </p>
    </div>
  );
}