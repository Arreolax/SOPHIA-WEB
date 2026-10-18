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
} from "lucide-react";

/* ---------- Datos de ejemplo (luego los reemplazas por Supabase / tu API) ---------- */
const TICKET = {
  id: "INC-8921",
  prioridad: "P1 • CRÍTICA",
  categoria: "Red & Conectividad",
  creado: "Hoy 09:14",
  titulo: "Fallo de Conexión VPN Cisco AnyConnect - Error 403-AUTH-TIMEOUT",
  solicitante: "Elena Morales",
  contexto: "Dirección de Finanzas • MacBook Pro Sonoma 14.4",
  slaSegundos: 1 * 3600 + 43 * 60 + 11,
  slaTotal: 4 * 3600,
};

const ESTADOS = ["Abierto", "En Diagnóstico", "En Remediación", "Esperando Usuario", "Resuelto"];

type LineaLog = { hora: string; nivel: string; texto: string; tipo: "normal" | "error" | "fatal" };

const LOG_INICIAL: LineaLog[] = [
  { hora: "09:12:03.102", nivel: "INFO", texto: "Contacting headend gateway https://vpn-gw01.empresa.net/CORP-REMOTE", tipo: "normal" },
  { hora: "09:12:04.450", nivel: "INFO", texto: "TLS 1.3 negotiated with cipher TLS_AES_256_GCM_SHA384", tipo: "normal" },
  { hora: "09:12:04.810", nivel: "DEBUG", texto: "Requesting Client Certificate for EAP-TLS verification...", tipo: "normal" },
  { hora: "09:12:05.110", nivel: "SEC", texto: "Local Keychain queried: 'com.cisco.anyconnect' identity found (Serial: 4F:3A:00:21)", tipo: "normal" },
  { hora: "09:12:05.340", nivel: "ERROR", texto: "CERTIFICATE_VERIFY_FAILED: Certificate validity window expired on 2024-05-15 00:00:00 UTC", tipo: "error" },
  { hora: "09:12:05.342", nivel: "ERROR", texto: "SCEP profile machine token mismatch (Hash: 9a3d8e... != remote headend thumbprint)", tipo: "error" },
  { hora: "09:12:07.001", nivel: "WARN", texto: "Retrying via fallback profile 'EMPLOYEE_SCEP_FALLBACK'...", tipo: "normal" },
  { hora: "09:12:09.552", nivel: "FATAL", texto: "[403-AUTH-TIMEOUT] Gateway refused authentication handshake. Terminating session.", tipo: "fatal" },
];

const SCRIPT_SUGERIDO = `# 1. Purgar credenciales obsoletas en Keychain vía Jamf Agent
sudo security delete-certificate -c "Elena Morales - VPN SCEP" /Library/Keychains/System.keychain
# 2. Forzar renovación de perfil de máquina SCEP
sudo jamf manage && sudo jamf policy -event renew-vpn-cert
# 3. Reiniciar el servicio de AnyConnect
sudo launchctl kickstart -k system/com.cisco.anyconnect.vpnagentd`;

const PASOS = [
  { titulo: "Purgar credenciales obsoletas en Keychain", detalle: "Remover llave 'com.cisco.anyconnect' expirada vía script de agente Jamf silencioso." },
  { titulo: "Forzar Gateway de Respaldo para re-token", detalle: "Redirigir hacia vpn-backup.empresa.net para aprovisionamiento inicial." },
  { titulo: "Revalidación Duo Push & Retorno a Nodo Primario", detalle: "Solicitar al usuario confirmar notificación push en smartphone corporativo registrado." },
];

const PATRONES = [
  { id: "INC-7042", coincidencia: "98% coincidencia", fuerte: true, tiempo: "Resuelto en 12 min", titulo: "Error 403 AnyConnect macOS Sonoma tras update de seguridad", solucion: "Solución: Script Keychain + Jamf Sync", accion: "Copiar Solución" },
  { id: "INC-6831", coincidencia: "82% coincidencia", fuerte: false, tiempo: "Resuelto en 50 min", titulo: "Re-enrolamiento Jamf por certificado CA intermedia revocado", solucion: "Solución: Parcheo de SCEP Profile", accion: "Ver Registro" },
];

const CAMBIOS = [
  "09:14 • Ticket creado por Elena Morales (P1)",
  "09:20 • Asignado a Carlos Mendoza (L2 Redes)",
  "09:31 • Estado: En Diagnóstico",
];

const formatoHMS = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  return [h, m, seg].map((n) => String(n).padStart(2, "0")).join(":");
};

type Pestana = "script" | "nota" | "respuesta";

/* ---------- Página ---------- */
export default function TicketTecnicoPage() {
  const [estado, setEstado] = useState("En Diagnóstico");
  const [copilotActivo, setCopilotActivo] = useState(true);
  const [segundos, setSegundos] = useState(TICKET.slaSegundos);
  const [pestana, setPestana] = useState<Pestana>("script");
  const [script, setScript] = useState(SCRIPT_SUGERIDO);
  const [nota, setNota] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [pasos, setPasos] = useState<boolean[]>([true, false, false]);
  const [log, setLog] = useState<LineaLog[]>(LOG_INICIAL);
  const [voto, setVoto] = useState<"up" | "down" | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [historial, setHistorial] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  const terminalRef = useRef<HTMLDivElement>(null);

  const mostrarToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3200);
  };

  /* Cuenta regresiva del SLA (se detiene si el ticket está Resuelto) */
  useEffect(() => {
    if (estado === "Resuelto") return;
    const timer = setInterval(() => setSegundos((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [estado]);

  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight });
  }, [log]);

  const pctSla = Math.max(0, Math.min(100, (segundos / TICKET.slaTotal) * 100));
  const slaUrgente = segundos < 3600 * 2;

  const copiar = async (texto: string, aviso: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      mostrarToast(aviso);
    } catch {
      mostrarToast("No se pudo copiar al portapapeles");
    }
  };

  const reanalizar = () => {
    setAnalizando(true);
    setTimeout(() => {
      setAnalizando(false);
      mostrarToast("IA reanalizó la telemetría");
    }, 900);
  };

  const insertarSecuencia = () => {
    setScript(SCRIPT_SUGERIDO);
    setPestana("script");
    mostrarToast("Secuencia insertada en la consola técnica");
  };

  const resumenSinTecnicismos = () => {
    setRespuesta(
      "Hola Elena, ya identificamos la causa: el certificado de seguridad de tu equipo venció tras la última actualización de macOS. " +
        "Vamos a renovarlo de forma remota, pero antes necesitamos confirmar tu identidad. Cuando te llegue una notificación de Duo en tu celular corporativo, por favor apruébala. " +
        "Te avisamos en cuanto puedas volver a conectarte a la VPN.",
    );
    setPestana("respuesta");
    mostrarToast("Mensaje redactado para Elena");
  };

  const comprobarHandshake = () => {
    mostrarToast("Comprobando handshake con vpn-gw01.empresa.net...");
    setTimeout(() => {
      setLog((l) => [
        ...l,
        { hora: new Date().toLocaleTimeString("es-MX", { hour12: false }) + ".000", nivel: "INFO", texto: "Handshake de prueba: certificado aún inválido (403-AUTH-TIMEOUT)", tipo: "error" },
      ]);
    }, 900);
  };

  const ejecutarRemoto = () => {
    // TODO: aquí llamas a tu API real (por ejemplo POST /api/tickets/INC-8921/execute)
    setConfirmar(false);
    const hora = () => new Date().toLocaleTimeString("es-MX", { hour12: false }) + ".000";
    setLog((l) => [
      ...l,
      { hora: hora(), nivel: "INFO", texto: "Jamf policy 'renew-vpn-cert' enviada a MBP-FIN-0428 (simulación)", tipo: "normal" },
    ]);
    setTimeout(
      () =>
        setLog((l) => [
          ...l,
          { hora: hora(), nivel: "INFO", texto: "Script ejecutado correctamente. Esperando validación Duo Push del usuario.", tipo: "normal" },
        ]),
      1200,
    );
    setEstado("En Remediación");
    mostrarToast("Script enviado al host remoto (simulado)");
  };

  const guardarBorrador = () => mostrarToast("Borrador guardado en este navegador");

  const textoPestana = pestana === "script" ? script : pestana === "nota" ? nota : respuesta;
  const cambiarTexto = (v: string) =>
    pestana === "script" ? setScript(v) : pestana === "nota" ? setNota(v) : setRespuesta(v);

  const pestanas: { id: Pestana; label: string }[] = [
    { id: "script", label: "Script Remoto MDM / Jamf" },
    { id: "nota", label: "Nota Interna" },
    { id: "respuesta", label: "Respuesta al Usuario" },
  ];

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

      {/* Confirmación de ejecución remota */}
      {confirmar && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <TriangleAlert className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-800">¿Ejecutar script en el host remoto?</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Se aplicará la secuencia sobre <strong>MBP-FIN-0428</strong>. La regla de compliance Finanzas VIP
                  requiere haber validado la identidad de Elena Morales por chat antes de continuar.
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

      {/* Barra superior */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar tickets, usuarios, incidentes o IPs..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
            <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">⌘K</kbd>
          </div>
          <div className="relative w-36">
            <select
              aria-label="Cola"
              defaultValue="general"
              className="w-full appearance-none rounded-lg border border-slate-200 bg-indigo-50/60 py-2 pl-3 pr-8 text-xs font-medium text-slate-700 outline-none"
            >
              <option value="general">Cola General</option>
              <option value="redes">Cola Redes L2</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>
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

      {/* Cabecera del ticket */}
      <section className="mb-5 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <Globe className="h-6 w-6" />
          </span>
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 font-bold text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {TICKET.prioridad}
              </span>
              <span className="font-mono text-slate-500">#{TICKET.id}</span>
              <span className="text-slate-300">•</span>
              <span className="rounded bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">{TICKET.categoria}</span>
              <span className="text-slate-500">• Creado: {TICKET.creado}</span>
            </div>
            <h1 className="mt-2 text-xl font-bold leading-snug text-slate-800">{TICKET.titulo}</h1>
            <p className="mt-2 text-[11px] text-slate-500">
              Solicitante: <strong className="text-slate-800">{TICKET.solicitante}</strong> ({TICKET.contexto})
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
              {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
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
          {/* Solicitante */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-indigo-50/70 p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#313652] text-xs font-bold text-white">EM</span>
                <div className="leading-tight">
                  <p className="text-sm font-bold text-slate-800">Elena Morales</p>
                  <p className="text-[11px] text-slate-500">CFO Staff / Finanzas Corporativas • elena.morales@empresa.net</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600">VIP Tier 1</span>
                <button
                  type="button"
                  aria-label="Copiar correo"
                  onClick={() => copiar("elena.morales@empresa.net", "Correo copiado")}
                  className="rounded-lg bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-indigo-50/60 p-3">
                <p className="text-[10px] text-slate-500">Endpoint</p>
                <p className="mt-1 text-xs font-bold text-slate-800">MBP-FIN-0428</p>
                <p className="text-[10px] text-slate-500">macOS 14.4 (Sonoma)</p>
              </div>
              <div className="rounded-xl bg-indigo-50/60 p-3">
                <p className="text-[10px] text-slate-500">Cliente AnyConnect</p>
                <p className="mt-1 text-xs font-bold text-slate-800">v4.10.07061</p>
                <p className="text-[10px] font-semibold text-red-600">Gateway rechaza handshake</p>
              </div>
              <div className="rounded-xl bg-indigo-50/60 p-3">
                <p className="text-[10px] text-slate-500">MDM Status</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-800">
                  Jamf Pro <Check className="h-3 w-3 text-emerald-600" />
                </p>
                <p className="text-[10px] font-semibold text-red-600">Sync fallida hace 2h</p>
              </div>
              <div className="rounded-xl bg-indigo-50/60 p-3">
                <p className="text-[10px] text-slate-500">MFA / Identity</p>
                <p className="mt-1 text-xs font-bold text-slate-800">Duo Security</p>
                <p className="text-[10px] text-slate-500">Token pendiente</p>
              </div>
            </div>
          </section>

          {/* Telemetría */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <SquareTerminal className="h-4 w-4" />
                Telemetría de Conexión &amp; Logs de Autenticación
              </h2>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-slate-400">vpn.empresa.net:443</span>
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
                <span>[Diagnostic Trace - AnyConnect Core Engine - Session 440091]</span>
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
                Bitácora Técnica &amp; Acciones de Despliegue
              </h2>
              <button
                type="button"
                onClick={() => setHistorial((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-indigo-100"
              >
                <History className="h-3.5 w-3.5" />
                Historial de Cambios ({CAMBIOS.length})
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
                    {CAMBIOS.map((c) => <li key={c}>{c}</li>)}
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
                  <span>Script automatizado de remediación (generado por IA)</span>
                  <span className="rounded bg-white px-2 py-1 font-mono normal-case">Target: MBP-FIN-0428</span>
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
                      : "Escribe o pega el script a ejecutar..."
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
                  <Network className="h-3.5 w-3.5" /> Comprobar Handshake
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
                  {pestana === "script" ? "Ejecutar en Host Remoto" : pestana === "nota" ? "Guardar Nota" : "Enviar al Usuario"}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ============ IT Copilot ============ */}
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
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    {analizando ? "Reanalizando..." : "Analizando telemetría y logs en tiempo real"}
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
                <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Diagnóstico predictivo</span>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 normal-case text-indigo-700">86% Certeza</span>
              </div>
              <p className="mt-2 text-xs font-bold leading-snug text-slate-800">
                Expiración de certificado de máquina SCEP/Jamf alojado en el llavero corporativo local.
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                El cliente AnyConnect presenta un serial revocado ayer a las 23:59 UTC tras la actualización macOS
                14.4, impidiendo el apretón de manos TLS con el concentrador Cisco ASA central.
              </p>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-slate-500">
                <span className="flex items-center gap-1"><History className="h-3 w-3" /> Patrones en tickets históricos</span>
                <span className="normal-case font-medium text-slate-400">Cluster Red L2</span>
              </div>
              <div className="space-y-2">
                {PATRONES.map((p) => (
                  <div key={p.id} className="rounded-xl bg-indigo-50/60 p-3">
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700">{p.id}</span>
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${p.fuerte ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"}`}>
                          {p.coincidencia}
                        </span>
                      </span>
                      <span className="text-slate-400">{p.tiempo}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] font-bold leading-snug text-slate-800">{p.titulo}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="h-3 w-3" /> {p.solucion}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          p.accion === "Copiar Solución"
                            ? copiar(SCRIPT_SUGERIDO, "Solución copiada al portapapeles")
                            : mostrarToast(`Registro de ${p.id} (pendiente de conectar)`)
                        }
                        className="shrink-0 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                      >
                        {p.accion}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-slate-500">
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Solución aprobada sugerida</span>
                <span className="normal-case font-medium text-slate-400">
                  {pasos.filter(Boolean).length}/{PASOS.length} pasos de remediación
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
                <Terminal className="h-3.5 w-3.5" /> Insertar secuencia aprobada en consola técnica
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-red-700">
                <TriangleAlert className="h-3.5 w-3.5" /> Advertencia de Riesgo Operativo (Crítico)
              </p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-700">
                <strong>No eliminar</strong> el certificado raíz{" "}
                <code className="rounded bg-white/70 px-1 font-mono text-red-600">CA-CORP-2022</code> o el usuario
                perderá acceso integral a SSO de correo, Okta y red WiFi corporativa física. Aplicar purga únicamente
                sobre perfiles locales AnyConnect.
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-800">
                <ShieldCheck className="h-3 w-3" /> Regla de Compliance Finanzas VIP
              </p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-600">
                Requiere validación de identidad directa por chat con Elena Morales antes de reiniciar el demonio de
                seguridad MDM.
              </p>
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
                  Redacta mensaje amigable para Elena Morales listo para enviar.
                </span>
              </button>
              <button
                type="button"
                onClick={() => mostrarToast("Borrador de KB generado (simulado)")}
                className="rounded-xl bg-slate-100 p-3 text-left hover:bg-slate-200"
              >
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-800">
                  <FileText className="h-3.5 w-3.5" /> Generar borrador de KB
                </span>
                <span className="mt-1 block text-[10px] leading-snug text-slate-500">
                  Crea artículo en la Wiki: &quot;Fallo AnyConnect en macOS Sonoma&quot;.
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
        <Laptop className="h-3 w-3" /> Vista de demostración: logs, acciones remotas y respuestas del IA son simuladas.
      </p>
    </div>
  );
}