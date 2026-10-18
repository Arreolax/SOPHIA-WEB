"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock,
  Columns2,
  CornerUpLeft,
  Download,
  FileImage,
  Home,
  Laptop,
  MessagesSquare,
  Paperclip,
  Plus,
  Printer,
  Radio,
  RefreshCw,
  Rows3,
  Search,
  Send,
  SlidersHorizontal,
} from "lucide-react";

/* ---------- Tipos y datos de ejemplo (luego los reemplazas por Supabase) ---------- */
type Estado = "esperando" | "abierto" | "resuelto";
type Prioridad = "Alta" | "Media" | "Baja";

type Mensaje = {
  id: string;
  autor: string;
  rol: string; // "Tú (Solicitante)" o "Técnico de Soporte TI"
  esMio: boolean;
  hace: string;
  hora: string;
  parrafos: { t: string; b?: boolean }[];
  adjunto?: { nombre: string; detalle: string };
};

type Ticket = {
  id: string;
  titulo: string;
  resumen: string;
  prioridad: Prioridad;
  estado: Estado;
  confirmado: boolean;
  categoria: string;
  enviado: string;
  hace: string;
  minutos: number; // antigüedad, para ordenar
  tecnico: { iniciales: string; nombre: string; rol: string };
  respuestaEstimada: string;
  turno: string;
  dispositivo: { nombre: string; so: string };
  mensajes: Mensaje[];
};

const YO = { iniciales: "EM", nombre: "Elena Morales" };
const DISPOSITIVO = { nombre: "Mi MacBook", so: "macOS Sonoma" };

const mensajeInicial = (id: string, texto: string, hora: string, hace: string): Mensaje => ({
  id: `${id}-m1`,
  autor: YO.nombre,
  rol: "Tú (Solicitante)",
  esMio: true,
  hace,
  hora,
  parrafos: [{ t: texto }],
});

const TICKETS_INICIALES: Ticket[] = [
  {
    id: "INC-2024-8921",
    titulo: "No puedo acceder a la VPN corporativa desde casa",
    resumen:
      "Cisco AnyConnect reporta error de autenticación 403. Carlos te ha solicitado una confirmación.",
    prioridad: "Alta",
    estado: "esperando",
    confirmado: false,
    categoria: "Acceso Remoto y VPN",
    enviado: "Enviado hoy a las 10:14 AM",
    hace: "Hace 25 min",
    minutos: 25,
    tecnico: { iniciales: "CM", nombre: "Carlos Mendoza", rol: "Soporte TI Nivel 1" },
    respuestaEstimada: "Hoy 14:00",
    turno: "Turno de soporte prioritario",
    dispositivo: DISPOSITIVO,
    mensajes: [
      {
        id: "8921-m1",
        autor: YO.nombre,
        rol: "Tú (Solicitante)",
        esMio: true,
        hace: "Hoy",
        hora: "10:14 AM",
        parrafos: [
          {
            t: "Hola equipo. Desde esta mañana estoy intentando conectarme a la VPN de la compañía para acceder al servidor de archivos compartidos de Marketing. Al colocar mis credenciales en Cisco AnyConnect la autenticación se queda cargando y arroja el error `403-AUTH-TIMEOUT`. Ya intenté reiniciar el router y el portátil pero el fallo persiste.",
          },
        ],
        adjunto: { nombre: "captura_error_vpn.png", detalle: "1.2 MB • Captura de pantalla" },
      },
      {
        id: "8921-m2",
        autor: "Carlos Mendoza",
        rol: "Técnico de Soporte TI",
        esMio: false,
        hace: "Hace 25 min",
        hora: "11:05 AM",
        parrafos: [
          { t: "Hola Elena, gracias por detallar el caso y compartir la captura." },
          {
            t: "Hemos revisado los registros de acceso y parece que el certificado AnyConnect expiró el día de ayer. Hemos habilitado una excepción provisional en tu perfil para que puedas renovarlo directamente.",
          },
          {
            t: "¿Podrías confirmar si tras reiniciar el equipo e ingresar tu clave de red sigue saliendo el error 403 o si te aparece una ventana emergente para actualizar el certificado?",
            b: true,
          },
        ],
      },
    ],
  },
  {
    id: "INC-2024-8934",
    titulo: "Instalación de Adobe Creative Cloud para campañas",
    resumen: "Licencia en proceso de aprobación por el área de compras.",
    prioridad: "Media",
    estado: "abierto",
    confirmado: false,
    categoria: "Software y Aplicaciones",
    enviado: "Enviado hoy a las 08:40 AM",
    hace: "Hace 2 h",
    minutos: 120,
    tecnico: { iniciales: "LP", nombre: "Laura Pérez", rol: "Soporte TI Nivel 1" },
    respuestaEstimada: "Mañana 10:00",
    turno: "Turno estándar",
    dispositivo: DISPOSITIVO,
    mensajes: [
      mensajeInicial(
        "8934",
        "Necesito Adobe Creative Cloud (Photoshop e Illustrator) para preparar las piezas de la campaña de noviembre.",
        "08:40 AM",
        "Hoy",
      ),
      {
        id: "8934-m2",
        autor: "Laura Pérez",
        rol: "Técnico de Soporte TI",
        esMio: false,
        hace: "Hace 2 h",
        hora: "09:10 AM",
        parrafos: [
          {
            t: "Hola Elena, recibimos tu solicitud. La licencia está en aprobación; en cuanto se autorice te instalamos el paquete de forma remota.",
          },
        ],
      },
    ],
  },
  {
    id: "INC-2024-8902",
    titulo: "Acceso a la carpeta compartida de Campañas",
    resumen: "Se está validando el permiso con el responsable del área.",
    prioridad: "Media",
    estado: "abierto",
    confirmado: false,
    categoria: "Accesos y Seguridad",
    enviado: "Enviado ayer a las 16:20",
    hace: "Hace 1 día",
    minutos: 1440,
    tecnico: { iniciales: "AR", nombre: "Andrés Ruiz", rol: "Soporte TI Nivel 2" },
    respuestaEstimada: "Hoy 17:00",
    turno: "Turno estándar",
    dispositivo: DISPOSITIVO,
    mensajes: [
      mensajeInicial(
        "8902",
        "No me deja abrir la carpeta compartida de Campañas, me aparece 'acceso denegado'.",
        "16:20",
        "Ayer",
      ),
    ],
  },
  {
    id: "INC-2024-8712",
    titulo: "Monitor externo parpadea con cable HDMI",
    resumen: "Sustitución de cable realizada en oficina.",
    prioridad: "Baja",
    estado: "resuelto",
    confirmado: false,
    categoria: "Hardware y Equipos",
    enviado: "Enviado hace 3 días",
    hace: "Hace 3 días",
    minutos: 4320,
    tecnico: { iniciales: "HW", nombre: "Soporte Presencial", rol: "Hardware" },
    respuestaEstimada: "Completado",
    turno: "Atención presencial",
    dispositivo: { nombre: 'Monitor Dell 27" 4K', so: "Puesto de trabajo" },
    mensajes: [
      mensajeInicial("8712", "El monitor externo parpadea cada pocos segundos cuando está conectado por HDMI.", "09:30", "Hace 3 días"),
      {
        id: "8712-m2",
        autor: "Soporte Presencial",
        rol: "Técnico de Soporte TI",
        esMio: false,
        hace: "Hace 3 días",
        hora: "12:15 PM",
        parrafos: [
          {
            t: "Pasamos por tu puesto y sustituimos el cable HDMI por uno nuevo. Con eso el parpadeo desapareció. Por favor confirma si todo sigue bien.",
          },
        ],
      },
    ],
  },
  ...[
    ["INC-2024-8650", "Restablecer contraseña de correo corporativo", "Contraseña restablecida y verificada.", "Baja", "Hace 5 días", 7200, "Accesos y Seguridad"],
    ["INC-2024-8611", "Impresora de la planta 2 sin tóner", "Tóner repuesto por mantenimiento.", "Baja", "Hace 6 días", 8640, "Hardware y Equipos"],
    ["INC-2024-8590", "Actualización a macOS Sonoma", "Equipo actualizado fuera de horario.", "Media", "Hace 1 semana", 10080, "Software y Aplicaciones"],
    ["INC-2024-8544", "Alta de usuario en Slack", "Cuenta creada y asignada a canales de Marketing.", "Baja", "Hace 1 semana", 11520, "Software y Aplicaciones"],
    ["INC-2024-8503", "Teclado con teclas que no responden", "Teclado reemplazado.", "Baja", "Hace 2 semanas", 20160, "Hardware y Equipos"],
    ["INC-2024-8470", "Error al abrir hojas de cálculo compartidas", "Se reparó la caché de la aplicación.", "Media", "Hace 2 semanas", 21600, "Software y Aplicaciones"],
  ].map(([id, titulo, resumen, prioridad, hace, minutos, categoria]) => ({
    id: id as string,
    titulo: titulo as string,
    resumen: resumen as string,
    prioridad: prioridad as Prioridad,
    estado: "resuelto" as Estado,
    confirmado: true,
    categoria: categoria as string,
    enviado: `Enviado ${(hace as string).toLowerCase()}`,
    hace: hace as string,
    minutos: minutos as number,
    tecnico: { iniciales: "ST", nombre: "Soporte TI", rol: "Mesa de Ayuda" },
    respuestaEstimada: "Completado",
    turno: "Turno estándar",
    dispositivo: DISPOSITIVO,
    mensajes: [mensajeInicial(id as string, titulo as string, "09:00", hace as string)],
  })),
];

/* ---------- Utilidades ---------- */
type Filtro = "todos" | "abiertos" | "esperando" | "resueltos";
type Orden = "recientes" | "antiguos" | "prioridad";

const PESO_PRIORIDAD: Record<Prioridad, number> = { Alta: 0, Media: 1, Baja: 2 };

const estiloPrioridad: Record<Prioridad, string> = {
  Alta: "bg-indigo-100 text-indigo-700",
  Media: "bg-amber-50 text-amber-700",
  Baja: "bg-slate-100 text-slate-600",
};

function Texto({ t }: { t: string }) {
  // Convierte `texto` en código en línea
  return (
    <>
      {t.split("`").map((parte, i) =>
        i % 2 === 1 ? (
          <code key={i} className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]">
            {parte}
          </code>
        ) : (
          <span key={i}>{parte}</span>
        ),
      )}
    </>
  );
}

function ChipEstado({ ticket, grande = false }: { ticket: Ticket; grande?: boolean }) {
  const base = `inline-flex items-center gap-1 rounded-full font-semibold ${
    grande ? "px-3 py-1 text-xs" : "px-2.5 py-1 text-[11px]"
  }`;
  if (ticket.estado === "esperando")
    return (
      <span className={`${base} bg-[#313652] text-white`}>
        <AlertCircle className="h-3 w-3" /> Esperando tu respuesta
      </span>
    );
  if (ticket.estado === "abierto")
    return (
      <span className={`${base} bg-sky-50 text-sky-700`}>
        <Clock className="h-3 w-3" /> En progreso
      </span>
    );
  return (
    <span className={`${base} border border-emerald-200 bg-emerald-50 text-emerald-700`}>
      <CheckCircle2 className="h-3 w-3" /> Resuelto
    </span>
  );
}

function Iniciales({ texto, oscuro = true }: { texto: string; oscuro?: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
        oscuro ? "bg-[#313652] text-white" : "bg-slate-200 text-slate-700"
      }`}
    >
      {texto}
    </span>
  );
}

/* ---------- Página ---------- */
export default function MisSolicitudesPage() {
  const [tickets, setTickets] = useState<Ticket[]>(TICKETS_INICIALES);
  const [seleccionadoId, setSeleccionadoId] = useState<string>(TICKETS_INICIALES[0].id);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [orden, setOrden] = useState<Orden>("recientes");
  const [vista, setVista] = useState<"dividida" | "compacta">("dividida");
  const [respuesta, setRespuesta] = useState("");
  const [actualizando, setActualizando] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  const respuestaRef = useRef<HTMLTextAreaElement>(null);

  const mostrarToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const cuenta = {
    todos: tickets.length,
    abiertos: tickets.filter((t) => t.estado === "abierto").length,
    esperando: tickets.filter((t) => t.estado === "esperando").length,
    resueltos: tickets.filter((t) => t.estado === "resuelto").length,
  };

  const lista = tickets
    .filter((t) => {
      if (filtro === "abiertos") return t.estado === "abierto";
      if (filtro === "esperando") return t.estado === "esperando";
      if (filtro === "resueltos") return t.estado === "resuelto";
      return true;
    })
    .sort((a, b) => {
      if (orden === "antiguos") return b.minutos - a.minutos;
      if (orden === "prioridad")
        return PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad] || a.minutos - b.minutos;
      return a.minutos - b.minutos;
    });

  const seleccionado = tickets.find((t) => t.id === seleccionadoId) ?? lista[0];

  const actualizarTicket = (id: string, cambios: Partial<Ticket>) =>
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...cambios } : t)));

  const refrescar = () => {
    setActualizando(true);
    setTimeout(() => {
      setActualizando(false);
      mostrarToast("Lista actualizada");
    }, 700);
  };

  const enviarRespuesta = () => {
    if (!seleccionado || respuesta.trim().length === 0) {
      mostrarToast("Escribe una respuesta antes de enviar");
      return;
    }
    // TODO: aquí llamas a tu API (POST /api/tickets/:id/messages)
    const nuevo: Mensaje = {
      id: `${seleccionado.id}-m${seleccionado.mensajes.length + 1}`,
      autor: YO.nombre,
      rol: "Tú (Solicitante)",
      esMio: true,
      hace: "Ahora",
      hora: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      parrafos: [{ t: respuesta.trim() }],
    };
    actualizarTicket(seleccionado.id, {
      mensajes: [...seleccionado.mensajes, nuevo],
      estado: seleccionado.estado === "esperando" ? "abierto" : seleccionado.estado,
      hace: "Hace un momento",
      minutos: 0,
    });
    setRespuesta("");
    mostrarToast("Respuesta enviada al técnico");
  };

  const irAResponder = () => {
    respuestaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    respuestaRef.current?.focus();
  };

  const tabs: { id: Filtro; label: string; n: number; alerta?: boolean; punto?: boolean }[] = [
    { id: "todos", label: "Todos", n: cuenta.todos },
    { id: "abiertos", label: "Abiertos", n: cuenta.abiertos, punto: true },
    { id: "esperando", label: "Esperando mi respuesta", n: cuenta.esperando, alerta: true },
    { id: "resueltos", label: "Resueltos", n: cuenta.resueltos },
  ];

  const tituloLista =
    filtro === "resueltos"
      ? "solicitudes resueltas"
      : filtro === "todos"
        ? "solicitudes"
        : "solicitudes activas";

  /* ---------- Tarjeta de lista ---------- */
  const TarjetaTicket = ({ t }: { t: Ticket }) => {
    const activa = seleccionado?.id === t.id;
    return (
      <button
        type="button"
        onClick={() => {
          setSeleccionadoId(t.id);
          if (vista === "compacta") setVista("dividida");
        }}
        className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md ${
          activa ? "border-slate-300 border-l-4 border-l-[#313652]" : "border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-600">#{t.id}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${estiloPrioridad[t.prioridad]}`}>
              {t.prioridad === "Baja" ? "Baja" : `Prioridad ${t.prioridad}`}
            </span>
          </div>
          <span className="shrink-0 text-[11px] text-slate-500">{t.hace}</span>
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-800">{t.titulo}</p>
        <p className="mt-1 line-clamp-2 text-xs text-indigo-700/80">{t.resumen}</p>

        <div className="mt-3 flex items-center gap-2">
          <ChipEstado ticket={t} />
          {t.estado === "resuelto" && !t.confirmado && (
            <span className="text-[11px] text-slate-500">Pendiente de tu conformidad</span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-700">
            <Iniciales texto={t.tecnico.iniciales} oscuro={t.estado !== "resuelto"} />
            {t.tecnico.nombre}
          </span>
          {t.estado === "resuelto" ? (
            <span className="font-semibold text-emerald-600">Solucionado</span>
          ) : (
            <span className="flex items-center gap-1 text-slate-600">
              <Clock className="h-3 w-3" /> Resp. estimada:{" "}
              <strong className="text-slate-800">{t.respuestaEstimada}</strong>
            </span>
          )}
        </div>
      </button>
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Home className="h-3.5 w-3.5" />
          <span>Inicio</span>
          <ChevronRight className="h-3 w-3" />
          <span className="rounded-md bg-slate-200 px-2 py-0.5 font-semibold text-slate-700">
            Mis Solicitudes
          </span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-400 md:flex md:w-72">
            <Search className="h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Buscar tickets, artículos, soluciones..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </div>
          <button type="button" aria-label="Notificaciones" className="relative rounded-full p-2 text-slate-600 hover:bg-white">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <button type="button" aria-label="Ayuda" className="rounded-full p-2 text-slate-600 hover:bg-white">
            <CircleHelp className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Encabezado */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-lg">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
            <span className="rounded bg-indigo-100 px-2 py-1 text-indigo-700">Atención al empleado</span>
            <span className="flex items-center gap-1.5 font-medium normal-case text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Canal de Soporte TI Activo
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Seguimiento de Mis Solicitudes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Revisa el estado de tus consultas técnicas, responde a las dudas del equipo de soporte y
            confirma cuando tu problema esté solucionado.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-medium">
            {[
              { id: "dividida", label: "Dividida", icono: <Columns2 className="h-3.5 w-3.5" /> },
              { id: "compacta", label: "Compacta", icono: <Rows3 className="h-3.5 w-3.5" /> },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={vista === v.id}
                onClick={() => setVista(v.id as "dividida" | "compacta")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                  vista === v.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {v.icono}
                {v.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-[#313652] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#262a40]"
          >
            <Plus className="h-4 w-4" />
            Nueva Solicitud
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1">
          {tabs.map((t) => {
            const activo = filtro === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFiltro(t.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  activo ? "bg-indigo-50 text-slate-900" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {t.punto && <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />}
                {t.alerta && <AlertCircle className="h-3.5 w-3.5" />}
                {t.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    t.alerta ? "bg-[#313652] text-white" : activo ? "bg-indigo-100 text-indigo-700" : "text-slate-400"
                  }`}
                >
                  {t.n}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as Orden)}
              aria-label="Ordenar solicitudes"
              className="appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-xs font-medium text-slate-700 outline-none focus:border-[#313652]"
            >
              <option value="recientes">Más recientes primero</option>
              <option value="antiguos">Más antiguos primero</option>
              <option value="prioridad">Mayor prioridad primero</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>
          <button
            type="button"
            aria-label="Actualizar"
            onClick={refrescar}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${actualizando ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className={vista === "dividida" ? "grid gap-6 lg:grid-cols-[340px_1fr]" : ""}>
        {/* ============ Lista ============ */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
              {lista.length} {tituloLista}
            </h2>
            <span className="text-[11px] text-slate-400">
              {actualizando ? "Actualizando..." : "Actualizado hace un momento"}
            </span>
          </div>

          {lista.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No hay solicitudes en esta categoría.
            </div>
          ) : (
            <div className={vista === "compacta" ? "grid gap-3 md:grid-cols-2" : "flex flex-col gap-3"}>
              {lista.map((t) => (
                <TarjetaTicket key={t.id} t={t} />
              ))}
            </div>
          )}
        </div>

        {/* ============ Detalle ============ */}
        {vista === "dividida" && seleccionado && (
          <div className="flex flex-col gap-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600">
                    #{seleccionado.id}
                  </span>
                  <ChipEstado ticket={seleccionado} grande />
                </div>
                <button
                  type="button"
                  aria-label="Imprimir"
                  onClick={() => window.print()}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <Printer className="h-4 w-4" />
                </button>
              </div>

              <span
                className={`mt-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${estiloPrioridad[seleccionado.prioridad]}`}
              >
                Prioridad {seleccionado.prioridad}
              </span>
              <h2 className="mt-3 text-lg font-bold text-slate-800">{seleccionado.titulo}</h2>
              <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Radio className="h-3.5 w-3.5 text-indigo-500" />
                {seleccionado.categoria} • {seleccionado.enviado}
              </p>

              <div className="mt-5 grid gap-4 rounded-xl bg-indigo-50/70 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] text-slate-500">Técnico Asignado</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Iniciales texto={seleccionado.tecnico.iniciales} />
                    <div className="leading-tight">
                      <p className="text-xs font-bold text-slate-800">{seleccionado.tecnico.nombre}</p>
                      <p className="text-[11px] text-slate-500">{seleccionado.tecnico.rol}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Tiempo Estimado de Respuesta</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Clock className="h-3.5 w-3.5" />
                    {seleccionado.estado === "resuelto"
                      ? seleccionado.respuestaEstimada
                      : `Hoy antes de ${seleccionado.respuestaEstimada.replace("Hoy ", "")}`}
                  </p>
                  <p className="text-[11px] text-slate-500">{seleccionado.turno}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Mi Dispositivo</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Laptop className="h-3.5 w-3.5" />
                    {seleccionado.dispositivo.nombre}
                  </p>
                  <p className="text-[11px] text-slate-500">{seleccionado.dispositivo.so}</p>
                </div>
              </div>

              {seleccionado.estado === "esperando" && (
                <div className="mt-4 flex flex-wrap items-start gap-3 rounded-xl bg-slate-200/70 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#313652] text-white">
                    <MessagesSquare className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800">
                      {seleccionado.tecnico.nombre.split(" ")[0]} te ha dejado una consulta sobre tu caso
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Por favor responde abajo si reiniciando el equipo te vuelve a solicitar el
                      certificado o continúa el error, para que el técnico pueda reanudar la asistencia.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={irAResponder}
                    className="rounded-lg bg-[#313652] px-3 py-2 text-xs font-semibold text-white hover:bg-[#262a40]"
                  >
                    Ir a responder
                  </button>
                </div>
              )}
            </section>

            {/* Conversación */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <MessagesSquare className="h-4 w-4" />
                  Conversación con Soporte TI
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                  {seleccionado.mensajes.length} {seleccionado.mensajes.length === 1 ? "Mensaje" : "Mensajes"}
                </span>
              </div>

              <ol className="relative space-y-6 border-l border-slate-200 pl-6">
                {seleccionado.mensajes.map((m) => (
                  <li key={m.id} className="relative">
                    <span className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full bg-[#313652] ring-4 ring-white" />
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{m.autor}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            m.esMio ? "bg-slate-100 text-slate-600" : "bg-[#313652] text-white"
                          }`}
                        >
                          {m.rol}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {m.hace}
                        {m.hace !== "Hoy" && m.hace !== "Ayer" ? ` (${m.hora})` : `, ${m.hora}`}
                      </span>
                    </div>
                    <div className="space-y-3 rounded-xl bg-indigo-50/70 p-4 text-xs leading-relaxed text-slate-700">
                      {m.parrafos.map((p, i) => (
                        <p key={i} className={p.b ? "font-bold text-slate-900" : ""}>
                          <Texto t={p.t} />
                        </p>
                      ))}
                      {m.adjunto && (
                        <div className="inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <FileImage className="h-4 w-4 text-slate-500" />
                          <div className="leading-tight">
                            <p className="text-[11px] font-semibold text-slate-800">{m.adjunto.nombre}</p>
                            <p className="text-[10px] text-slate-500">{m.adjunto.detalle}</p>
                          </div>
                          <Download className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              {/* Responder */}
              {seleccionado.estado !== "resuelto" && (
                <div className="mt-8 border-t border-slate-100 pt-5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <CornerUpLeft className="h-3.5 w-3.5" />
                      Responder al técnico ({seleccionado.tecnico.nombre})
                    </p>
                    <span className="text-[11px] text-indigo-600">Puedes adjuntar capturas de pantalla</span>
                  </div>
                  <textarea
                    ref={respuestaRef}
                    rows={4}
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Escribe tu respuesta o aclaración para el técnico... (Ej. Ya reinicié el equipo e ingresé mi clave, ahora muestra el botón de renovar certificado)"
                    className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#313652]"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      <Paperclip className="h-4 w-4" />
                      Adjuntar nueva captura/archivo
                    </button>
                    <button
                      type="button"
                      onClick={enviarRespuesta}
                      className="flex items-center gap-2 rounded-lg bg-[#313652] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#262a40]"
                    >
                      <Send className="h-4 w-4" />
                      Enviar respuesta al técnico
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Confirmación de cierre */}
            {(seleccionado.estado !== "resuelto" || !seleccionado.confirmado) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[#313652]">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-800">¿Tu problema quedó resuelto?</h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      Si ya conseguiste solucionar el inconveniente y trabajar normalmente, confirma el
                      cierre para calificar la atención.
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Si aún necesitas ayuda, puedes seguir respondiendo al técnico.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          actualizarTicket(seleccionado.id, { estado: "resuelto", confirmado: true });
                          mostrarToast("¡Gracias! El caso se marcó como resuelto");
                        }}
                        className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-emerald-600"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Confirmar que se ha resuelto mi problema
                      </button>
                      {seleccionado.estado === "resuelto" && (
                        <button
                          type="button"
                          onClick={() => {
                            actualizarTicket(seleccionado.id, { estado: "abierto", confirmado: false });
                            mostrarToast("Caso reabierto");
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Reabrir caso
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {seleccionado.estado === "resuelto" && seleccionado.confirmado && (
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Caso cerrado: confirmaste que el problema quedó resuelto.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    actualizarTicket(seleccionado.id, { estado: "abierto", confirmado: false });
                    mostrarToast("Caso reabierto");
                  }}
                  className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  Reabrir caso
                </button>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}