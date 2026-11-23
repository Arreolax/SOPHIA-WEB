"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabaseClient";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock,
  Columns2,
  CornerUpLeft,
  Download,
  FileEdit,
  FileImage,
  Home,
  Laptop,
  Loader2,
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
  XCircle,
} from "lucide-react";

/* ---------- Tipos ---------- */
type Estado = "esperando" | "abierto" | "resuelto";
type Prioridad = "Alta" | "Media" | "Baja";

type ModalState = {
  open: boolean;
  status: "loading" | "success" | "error";
  title: string;
  description: string;
};

type Mensaje = {
  id: string;
  autor: string;
  rol: string;
  esMio: boolean;
  hace: string;
  hora: string;
  parrafos: { t: string; b?: boolean }[];
  adjunto?: { nombre: string; detalle: string };
};

type Ticket = {
  id: string;
  codigoCorto: string;
  titulo: string;
  resumen: string;
  prioridad: Prioridad;
  estado: Estado;
  estadoRaw: string;
  esBorrador: boolean;
  confirmado: boolean;
  categoria: string;
  subcategoria?: string | null;
  tipo: string;
  enviado: string;
  hace: string;
  minutos: number;
  tieneTecnicoAsignado: boolean;
  tecnico: { iniciales: string; nombre: string; rol: string };
  respuestaEstimada: string;
  turno: string;
  dispositivo: { nombre: string; so: string };
  mensajes: Mensaje[];
  detalleCargado?: boolean;
};

/* ---------- Helpers de mapeo DB -> UI ---------- */
function obtenerIniciales(nombre?: string | null): string {
  if (!nombre) return "ST";
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function tiempoRelativo(fechaIso?: string | null): {
  hace: string;
  minutos: number;
  enviado: string;
  hora: string;
} {
  if (!fechaIso) {
    return { hace: "Reciente", minutos: 0, enviado: "Enviado recientemente", hora: "" };
  }
  const fecha = new Date(fechaIso);
  const diffMs = Math.max(0, Date.now() - fecha.getTime());
  const mins = Math.floor(diffMs / 60000);
  const hora = fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const fechaTexto = fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  let hace = "";
  if (mins < 1) hace = "Hace un momento";
  else if (mins < 60) hace = `Hace ${mins} min`;
  else if (mins < 1440) hace = `Hace ${Math.floor(mins / 60)} h`;
  else hace = `Hace ${Math.floor(mins / 1440)} d`;

  return {
    hace,
    minutos: mins,
    enviado: `Enviado el ${fechaTexto} a las ${hora}`,
    hora,
  };
}

function mapPrioridad(priority?: string): Prioridad {
  const p = String(priority || "").toUpperCase();
  if (p === "CRITICAL" || p === "HIGH" || p === "ALTA") return "Alta";
  if (p === "MEDIUM" || p === "MEDIA") return "Media";
  return "Baja";
}

function mapEstado(status?: string): { estado: Estado; confirmado: boolean } {
  const s = String(status || "").toUpperCase();
  if (s === "CLOSED") return { estado: "resuelto", confirmado: true };
  if (s === "RESOLVED") return { estado: "resuelto", confirmado: false };
  if (s === "WAITING_USER" || s === "PENDING" || s === "ON_HOLD") {
    return { estado: "esperando", confirmado: false };
  }
  return { estado: "abierto", confirmado: false };
}

type RawTicket = {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: { id?: string; name?: string } | null;
  subcategory?: string | null;
  type?: string;
  created_at?: string;
  updated_at?: string;
  resolution?: string;
  assigned_to?: string | null;
  draft?: boolean | number | string;
  is_draft?: boolean | number | string;
  isDraft?: boolean | number | string;
  creator?: { id?: string; name?: string; username?: string; email?: string } | null;
  assignee?: { id?: string; name?: string; username?: string; email?: string } | null;
  comments?: Array<{
    id: string;
    content: string;
    created_at?: string;
    user?: { id?: string; name?: string; username?: string; role?: string } | null;
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

function detectarBorrador(raw: RawTicket): boolean {
  const val = raw?.draft ?? raw?.is_draft ?? raw?.isDraft;
  return (
    val === true ||
    Number(val) === 1 ||
    String(val).toLowerCase() === "true" ||
    String(raw?.status || "").toUpperCase() === "DRAFT"
  );
}

function mapTicketFromDB(raw: RawTicket, usuarioActualId?: string): Ticket {
  const tiempo = tiempoRelativo(raw.created_at);
  const { estado, confirmado } = mapEstado(raw.status);
  const esBorrador = detectarBorrador(raw);
  const creadorNombre = raw.creator?.name || raw.creator?.username || "Tú";
  const tieneTecnicoAsignado = Boolean(raw.assigned_to || raw.assignee?.id);
  const tecnicoNombre = raw.assignee?.name || raw.assignee?.username || "Sin asignar";

  const mensajesBase: Mensaje[] = [
    {
      id: `${raw.id}-desc`,
      autor: creadorNombre,
      rol: "Tú (Solicitante)",
      esMio: true,
      hace: tiempo.hace,
      hora: tiempo.hora,
      parrafos: [{ t: raw.description || "Sin descripción" }],
    },
  ];

  if (Array.isArray(raw.comments) && raw.comments.length > 0) {
    const comentariosOrdenados = [...raw.comments].sort(
      (a, b) =>
        new Date(a.created_at || 0).getTime() -
        new Date(b.created_at || 0).getTime(),
    );

    for (const c of comentariosOrdenados) {
      const tCom = tiempoRelativo(c.created_at);
      const esMio = usuarioActualId
        ? c.user?.id === usuarioActualId
        : c.user?.role === "usuario";
      mensajesBase.push({
        id: c.id,
        autor: c.user?.name || c.user?.username || "Soporte TI",
        rol: esMio ? "Tú (Solicitante)" : "Técnico de Soporte TI",
        esMio,
        hace: tCom.hace,
        hora: tCom.hora,
        parrafos: [{ t: c.content }],
      });
    }
  }

  if (raw.resolution) {
    mensajesBase.push({
      id: `${raw.id}-res`,
      autor: tecnicoNombre,
      rol: "Resolución Oficial",
      esMio: false,
      hace: "Resolución",
      hora: tiempoRelativo(raw.updated_at).hora,
      parrafos: [{ t: raw.resolution, b: true }],
    });
  }

  return {
    id: String(raw.id || ""),
    codigoCorto: String(raw.id).slice(0, 8).toUpperCase(),
    titulo: raw.title || "Borrador sin título",
    resumen:
      raw.description?.split("\n")[0] ||
      (esBorrador ? "Borrador sin descripción aún..." : "Solicitud registrada"),
    prioridad: mapPrioridad(raw.priority),
    estado,
    estadoRaw: String(raw.status || "OPEN").toUpperCase(),
    esBorrador,
    confirmado,
    categoria: raw.category?.name || "General",
    subcategoria: raw.subcategory,
    tipo: raw.type || "INCIDENTE",
    enviado: esBorrador ? "Guardado como borrador" : tiempo.enviado,
    hace: tiempo.hace,
    minutos: tiempo.minutos,
    tieneTecnicoAsignado,
    tecnico: {
      iniciales: tieneTecnicoAsignado ? obtenerIniciales(tecnicoNombre) : "TI",
      nombre: tecnicoNombre,
      rol: tieneTecnicoAsignado ? "Técnico de Soporte TI" : "En cola de asignación",
    },
    respuestaEstimada: estado === "resuelto" ? "Completado" : "< 2h hábiles",
    turno: tieneTecnicoAsignado ? "En atención" : "Pendiente de asignar",
    dispositivo: {
      nombre: raw.subcategory || raw.type || "Equipo corporativo",
      so: raw.category?.name || "Soporte TI",
    },
    mensajes: mensajesBase,
    detalleCargado: Array.isArray(raw.comments),
  };
}

/* ---------- Modal de Confirmación antes de Cerrar Ticket ---------- */
function ConfirmCloseModal({
  ticket,
  onCancel,
  onConfirm,
}: {
  ticket: Ticket | null;
  onCancel: () => void;
  onConfirm: (ticketId: string) => void;
}) {
  if (!ticket) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-close-title"
      className="fixed inset-0 z-[115] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs transition-opacity"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3
              id="confirm-close-title"
              className="text-base font-bold text-slate-800"
            >
              ¿Confirmas que deseas cerrar este ticket?
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              Estás a punto de cerrar la solicitud{" "}
              <span className="font-mono font-semibold text-slate-800">
                #{ticket.codigoCorto}
              </span>{" "}
              (<span className="font-medium text-slate-800">{ticket.titulo}</span>).
            </p>
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-[11px] leading-relaxed text-amber-800">
              <strong>Importante:</strong> Una vez cerrado, el ticket no podrá
              volver a abrirse. Si el problema persiste más adelante, deberás
              crear una nueva solicitud.
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(ticket.id)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
          >
            <CheckCircle2 className="h-4 w-4" />
            Sí, cerrar ticket
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Modal de Carga y Resultado (Success / Error) ---------- */
function ActionModal({
  modal,
  onClose,
}: {
  modal: ModalState;
  onClose: () => void;
}) {
  if (!modal.open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs transition-opacity"
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
          {modal.status === "loading" && (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-[#313652]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {modal.status === "success" && (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          )}
          {modal.status === "error" && (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <XCircle className="h-8 w-8" />
            </div>
          )}
        </div>

        <h3
          id="action-modal-title"
          className="text-base font-bold text-slate-800"
        >
          {modal.title}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          {modal.description}
        </p>

        {modal.status !== "loading" && (
          <button
            type="button"
            onClick={onClose}
            className={`mt-6 w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors ${
              modal.status === "success"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {modal.status === "success" ? "Aceptar" : "Entendido"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Componente Skeleton de Carga ---------- */
function SkeletonSolicitudes({ vista }: { vista: "dividida" | "compacta" }) {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando solicitudes"
      className={
        vista === "dividida" ? "grid gap-6 lg:grid-cols-[340px_1fr]" : ""
      }
    >
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
        </div>

        <div
          className={
            vista === "compacta"
              ? "grid gap-3 md:grid-cols-2"
              : "flex flex-col gap-3"
          }
        >
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 rounded bg-slate-200" />
                  <div className="h-4 w-20 rounded-full bg-indigo-100/70" />
                </div>
                <div className="h-3 w-12 rounded bg-slate-200" />
              </div>

              <div className="mt-3 h-4 w-4/5 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-full rounded bg-slate-100" />
              <div className="mt-1.5 h-3 w-2/3 rounded bg-slate-100" />

              <div className="mt-3 flex items-center gap-2">
                <div className="h-5 w-24 rounded-full bg-sky-100/70" />
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-slate-200" />
                  <div className="h-3 w-24 rounded bg-slate-200" />
                </div>
                <div className="h-3 w-24 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {vista === "dividida" && (
        <div className="flex flex-col gap-5">
          <section className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-20 rounded bg-slate-200" />
                <div className="h-6 w-28 rounded-full bg-sky-100/70" />
              </div>
              <div className="h-8 w-8 rounded-lg bg-slate-100" />
            </div>

            <div className="mt-4 h-5 w-28 rounded-full bg-indigo-100/70" />
            <div className="mt-3 h-6 w-3/4 rounded bg-slate-200" />
            <div className="mt-2.5 h-3.5 w-64 rounded bg-slate-100" />

            <div className="mt-5 grid gap-4 rounded-xl bg-indigo-50/50 p-4 sm:grid-cols-3">
              {[1, 2, 3].map((box) => (
                <div key={box} className="space-y-2">
                  <div className="h-3 w-24 rounded bg-slate-200/80" />
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-6 w-6 rounded-full bg-slate-300/70" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-24 rounded bg-slate-200" />
                      <div className="h-2.5 w-20 rounded bg-slate-200/70" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="h-4 w-44 rounded bg-slate-200" />
              <div className="h-5 w-20 rounded-full bg-slate-100" />
            </div>

            <div className="space-y-6 border-l border-slate-200 pl-6">
              {[1, 2].map((msg) => (
                <div key={msg} className="relative">
                  <span className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-28 rounded bg-slate-200" />
                      <div className="h-4 w-24 rounded-full bg-slate-100" />
                    </div>
                    <div className="h-3 w-20 rounded bg-slate-100" />
                  </div>
                  <div className="space-y-2 rounded-xl bg-indigo-50/50 p-4">
                    <div className="h-3 w-full rounded bg-slate-200/80" />
                    <div className="h-3 w-5/6 rounded bg-slate-200/80" />
                    <div className="h-3 w-1/2 rounded bg-slate-200/80" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

/* ---------- Utilidades UI ---------- */
type Filtro = "todos" | "abiertos" | "esperando" | "resueltos" | "borradores";
type Orden = "recientes" | "antiguos" | "prioridad";

const PESO_PRIORIDAD: Record<Prioridad, number> = {
  Alta: 0,
  Media: 1,
  Baja: 2,
};

const estiloPrioridad: Record<Prioridad, string> = {
  Alta: "bg-indigo-100 text-indigo-700",
  Media: "bg-amber-50 text-amber-700",
  Baja: "bg-slate-100 text-slate-600",
};

function Texto({ t }: { t: string }) {
  return (
    <>
      {t.split("`").map((parte, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]"
          >
            {parte}
          </code>
        ) : (
          <span key={i}>{parte}</span>
        ),
      )}
    </>
  );
}

function ChipEstado({
  ticket,
  grande = false,
}: {
  ticket: Ticket;
  grande?: boolean;
}) {
  const base = `inline-flex items-center gap-1 rounded-full font-semibold ${
    grande ? "px-3 py-1 text-xs" : "px-2.5 py-1 text-[11px]"
  }`;

  // Se evalúa primero esBorrador antes de estado === "abierto"
  if (ticket.esBorrador) {
    return (
      <span
        className={`${base} border border-amber-300 bg-amber-100/90 text-amber-800`}
      >
        <FileEdit className="h-3 w-3" /> Borrador
      </span>
    );
  }

  if (ticket.estado === "esperando")
    return (
      <span className={`${base} bg-[#313652] text-white`}>
        <AlertCircle className="h-3 w-3" /> Esperando tu respuesta
      </span>
    );
  if (ticket.estado === "abierto")
    return (
      <span className={`${base} bg-sky-50 text-sky-700`}>
        <Clock className="h-3 w-3" />{" "}
        {ticket.estadoRaw === "IN_PROGRESS" ? "En progreso" : "Abierto"}
      </span>
    );
  return (
    <span
      className={`${base} border border-emerald-200 bg-emerald-50 text-emerald-700`}
    >
      <CheckCircle2 className="h-3 w-3" /> Cerrado / Resuelto
    </span>
  );
}

function Iniciales({
  texto,
  oscuro = true,
}: {
  texto: string;
  oscuro?: boolean;
}) {
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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuarioActual, setUsuarioActual] = useState<{ id: string; nombre: string }>({
    id: "",
    nombre: "Tú",
  });
  const [seleccionadoId, setSeleccionadoId] = useState<string>("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [orden, setOrden] = useState<Orden>("recientes");
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState<"dividida" | "compacta">("dividida");
  const [respuesta, setRespuesta] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  // Estado del modal de confirmación antes de cerrar
  const [ticketACerrar, setTicketACerrar] = useState<Ticket | null>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    tipo?: "success" | "error";
  }>({
    show: false,
    msg: "",
    tipo: "success",
  });

  const [actionModal, setActionModal] = useState<ModalState>({
    open: false,
    status: "loading",
    title: "",
    description: "",
  });

  const respuestaRef = useRef<HTMLTextAreaElement>(null);

  const mostrarToast = (msg: string, tipo: "success" | "error" = "success") => {
    setToast({ show: true, msg, tipo });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const cerrarModal = () =>
    setActionModal((prev) => ({ ...prev, open: false }));

  /* Cargar tickets creados por el usuario desde /api/tickets */
  const cargarTickets = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setActualizando(true);
    try {
      const [resMe, resTickets] = await Promise.all([
        fetch("/api/me", { credentials: "include" }),
        fetch("/api/tickets", { credentials: "include" }),
      ]);

      let userId = "";
      if (resMe.ok) {
        const me = await resMe.json();
        userId = me.id || "";
        setUsuarioActual({
          id: userId,
          nombre: me.name || me.username || "Tú",
        });
      }

      if (resTickets.ok) {
        const data = await resTickets.json();
        const mapeados: Ticket[] = (data.tickets || []).map((t: RawTicket) =>
          mapTicketFromDB(t, userId),
        );
        setTickets(mapeados);
        if (mapeados.length > 0) {
          setSeleccionadoId((prev) =>
            prev && mapeados.some((t) => t.id === prev) ? prev : mapeados[0].id,
          );
        }
      }
    } catch (error) {
      console.error("Error cargando mis tickets:", error);
      setActionModal({
        open: true,
        status: "error",
        title: "Error al cargar solicitudes",
        description:
          "No se pudieron obtener tus tickets. Verifica tu conexión e inténtalo de nuevo.",
      });
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    cargarTickets();
  }, [cargarTickets]);

  /* Recargar detalle y comentarios de un ticket específico */
  const recargarTicketDetalle = useCallback(
    async (id: string, alertarNuevo = false) => {
      if (!id) return;
      try {
        const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.ticket) {
          const detallado = mapTicketFromDB(data.ticket, usuarioActual.id);
          setTickets((prev) => {
            const actual = prev.find((item) => item.id === id);
            if (!actual) return prev;

            const totalAntes = actual.mensajes.length;
            const totalDespues = detallado.mensajes.length;
            const ultimoIdAntes = actual.mensajes[totalAntes - 1]?.id;
            const ultimoIdDespues = detallado.mensajes[totalDespues - 1]?.id;
            const comentariosCambiaron =
              totalAntes !== totalDespues || ultimoIdAntes !== ultimoIdDespues;
            const estadoCambio = actual.estadoRaw !== detallado.estadoRaw;
            const tecnicoCambio =
              actual.tecnico.nombre !== detallado.tecnico.nombre ||
              actual.tieneTecnicoAsignado !== detallado.tieneTecnicoAsignado;

            // Si no cambió nada y ya estaba cargado, evitar re-renderizado
            if (
              !comentariosCambiaron &&
              !estadoCambio &&
              !tecnicoCambio &&
              actual.detalleCargado
            ) {
              return prev;
            }

            // Notificar al usuario si hay un nuevo mensaje de otra persona (ej. técnico)
            if (alertarNuevo && totalDespues > totalAntes) {
              const ultimoMensaje = detallado.mensajes[totalDespues - 1];
              if (ultimoMensaje && !ultimoMensaje.esMio) {
                mostrarToast(
                  `Nuevo mensaje de soporte (${ultimoMensaje.autor})`,
                );
              }
            }

            return prev.map((item) => (item.id === id ? detallado : item));
          });
        }
      } catch (e) {
        console.error("Error actualizando comentarios del ticket:", e);
      }
    },
    [usuarioActual.id],
  );

  /* Cargar detalle y escuchar nuevos comentarios en tiempo real del ticket que el usuario está viendo en preview */
  useEffect(() => {
    if (!seleccionadoId) return;
    const ticketActual = tickets.find((t) => t.id === seleccionadoId);
    if (ticketActual?.esBorrador) return;

    let activo = true;

    // Carga inicial o actualización si aún no tiene comentarios
    if (!ticketActual?.detalleCargado) {
      void recargarTicketDetalle(seleccionadoId, false);
    }

    // 1. Suscripción instantánea mediante canal Supabase Realtime para la tabla comment y ticket
    let canal: ReturnType<typeof supabase.channel> | null = null;
    try {
      canal = supabase
        .channel(`ticket-preview-${seleccionadoId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "comment",
            filter: `ticket_id=eq.${seleccionadoId}`,
          },
          () => {
            if (activo) {
              void recargarTicketDetalle(seleccionadoId, true);
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "ticket",
            filter: `id=eq.${seleccionadoId}`,
          },
          () => {
            if (activo) {
              void recargarTicketDetalle(seleccionadoId, true);
            }
          },
        )
        .subscribe();
    } catch (e) {
      console.warn("No se pudo iniciar canal Realtime de Supabase:", e);
    }

    // 2. Polling inteligente como respaldo cada 3 segundos mientras el usuario tenga el ticket en preview
    const timer = setInterval(() => {
      if (
        activo &&
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        void recargarTicketDetalle(seleccionadoId, true);
      }
    }, 3000);

    const onVisible = () => {
      if (
        activo &&
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        void recargarTicketDetalle(seleccionadoId, true);
      }
    };

    window.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      activo = false;
      clearInterval(timer);
      window.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      if (canal) {
        try {
          supabase.removeChannel(canal);
        } catch {}
      }
    };
  }, [seleccionadoId, recargarTicketDetalle]);

  const cuenta = {
    todos: tickets.filter((t) => !t.esBorrador).length,
    abiertos: tickets.filter((t) => !t.esBorrador && t.estado === "abierto").length,
    esperando: tickets.filter((t) => !t.esBorrador && t.estado === "esperando").length,
    resueltos: tickets.filter((t) => !t.esBorrador && t.estado === "resuelto").length,
    borradores: tickets.filter((t) => t.esBorrador).length,
  };

  const lista = tickets
    .filter((t) => {
      if (filtro === "borradores") return t.esBorrador;
      if (t.esBorrador) return false;

      if (filtro === "abiertos") return t.estado === "abierto";
      if (filtro === "esperando") return t.estado === "esperando";
      if (filtro === "resueltos") return t.estado === "resuelto";
      return true;
    })
    .filter((t) => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (
        t.titulo.toLowerCase().includes(q) ||
        t.resumen.toLowerCase().includes(q) ||
        t.codigoCorto.toLowerCase().includes(q) ||
        t.categoria.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (orden === "antiguos") return b.minutos - a.minutos;
      if (orden === "prioridad")
        return (
          PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad] ||
          a.minutos - b.minutos
        );
      return a.minutos - b.minutos;
    });

  const seleccionado = lista.find((t) => t.id === seleccionadoId) ?? lista[0];

  const actualizarTicket = (id: string, cambios: Partial<Ticket>) =>
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...cambios } : t)),
    );

  const refrescar = async () => {
    await cargarTickets(true);
    mostrarToast("Lista actualizada");
  };

  /* Acción ejecutada tras confirmar en el modal */
  const cerrarTicketUsuario = async (ticketId: string) => {
    setTicketACerrar(null);
    setActionModal({
      open: true,
      status: "loading",
      title: "Cerrando solicitud...",
      description: "Estamos cerrando tu ticket de forma definitiva.",
    });

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CLOSED",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionModal({
          open: true,
          status: "error",
          title: "No se pudo cerrar el ticket",
          description:
            data.error || "Ocurrió un problema al cerrar la solicitud.",
        });
        return;
      }

      actualizarTicket(ticketId, {
        estado: "resuelto",
        estadoRaw: "CLOSED",
        confirmado: true,
      });

      setActionModal({
        open: true,
        status: "success",
        title: "¡Ticket cerrado!",
        description:
          "Tu solicitud ha quedado cerrada. Si vuelves a necesitar asistencia sobre este u otro tema, por favor crea un nuevo ticket.",
      });
    } catch {
      setActionModal({
        open: true,
        status: "error",
        title: "Error de conexión",
        description:
          "No se pudo conectar con el servidor para cerrar el ticket. Inténtalo nuevamente.",
      });
    }
  };

  /* Enviar comentario al técnico */
  const enviarRespuesta = async () => {
    if (!seleccionado || seleccionado.esBorrador) {
      mostrarToast("No puedes comentar en un ticket que aún es borrador.", "error");
      return;
    }

    if (!seleccionado.tieneTecnicoAsignado) {
      mostrarToast(
        "No puedes comentar hasta que un técnico sea asignado.",
        "error",
      );
      return;
    }

    if (respuesta.trim().length === 0) {
      mostrarToast("Escribe una respuesta o aclaración antes de enviar.", "error");
      respuestaRef.current?.focus();
      return;
    }

    setEnviandoComentario(true);

    try {
      const res = await fetch(`/api/tickets/${seleccionado.id}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: respuesta.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarToast(
          data.error || "No se pudo enviar el comentario.",
          "error",
        );
        return;
      }

      const nuevo: Mensaje = {
        id: data.comment.id,
        autor: data.comment.user?.name || usuarioActual.nombre,
        rol: "Tú (Solicitante)",
        esMio: true,
        hace: "Ahora",
        hora: new Date(data.comment.created_at).toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        parrafos: [{ t: data.comment.content }],
      };

      actualizarTicket(seleccionado.id, {
        mensajes: [...seleccionado.mensajes, nuevo],
        estado:
          seleccionado.estado === "esperando" ? "abierto" : seleccionado.estado,
        estadoRaw: data.status || seleccionado.estadoRaw,
        hace: "Hace un momento",
        minutos: 0,
      });

      setRespuesta("");
      mostrarToast("Respuesta enviada correctamente", "success");
    } catch {
      mostrarToast(
        "Error de conexión al enviar tu respuesta. Inténtalo de nuevo.",
        "error",
      );
    } finally {
      setEnviandoComentario(false);
    }
  };

  const irAResponder = () => {
    respuestaRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    respuestaRef.current?.focus();
  };

  const tabs: {
    id: Filtro;
    label: string;
    n: number;
    alerta?: boolean;
    punto?: boolean;
  }[] = [
    { id: "todos", label: "Todos", n: cuenta.todos },
    { id: "abiertos", label: "Abiertos", n: cuenta.abiertos, punto: true },
    {
      id: "esperando",
      label: "Esperando mi respuesta",
      n: cuenta.esperando,
      alerta: true,
    },
    { id: "resueltos", label: "Cerrados", n: cuenta.resueltos },
    { id: "borradores", label: "Borradores", n: cuenta.borradores },
  ];

  const tituloLista =
    filtro === "borradores"
      ? "borradores guardados"
      : filtro === "resueltos"
        ? "solicitudes cerradas"
        : filtro === "todos"
          ? "solicitudes"
          : "solicitudes activas";

  /* ---------- Tarjeta de lista ---------- */
  const TarjetaTicket = ({ t }: { t: Ticket }) => {
    const activa = seleccionado?.id === t.id;

    if (t.esBorrador) {
      return (
        <button
          type="button"
          onClick={() => {
            setSeleccionadoId(t.id);
            if (vista === "compacta") setVista("dividida");
          }}
          className={`w-full rounded-xl border-2 border-dashed p-4 text-left transition-all hover:shadow-md ${
            activa
              ? "border-amber-500 border-2 border-l-amber-600 bg-amber-50/75"
              : "border-amber-300 bg-amber-50/35 hover:bg-amber-50/60"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-amber-800">
                BORRADOR
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${estiloPrioridad[t.prioridad]}`}
              >
                {t.prioridad === "Baja" ? "Baja" : `Prioridad ${t.prioridad}`}
              </span>
            </div>
            <span className="shrink-0 text-[11px] text-amber-700/80">
              {t.hace}
            </span>
          </div>

          <p className="mt-2 text-sm font-semibold italic text-slate-800">
            {t.titulo}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-600">
            {t.resumen}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <ChipEstado ticket={t} />
            <span className="text-[11px] text-slate-500">• {t.categoria}</span>
          </div>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => {
          setSeleccionadoId(t.id);
          if (vista === "compacta") setVista("dividida");
        }}
        className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md ${
          activa
            ? "border-slate-300 border-l-4 border-l-[#313652]"
            : "border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-600">
              #{t.codigoCorto}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${estiloPrioridad[t.prioridad]}`}
            >
              {t.prioridad === "Baja" ? "Baja" : `Prioridad ${t.prioridad}`}
            </span>
          </div>
          <span className="shrink-0 text-[11px] text-slate-500">{t.hace}</span>
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-800">{t.titulo}</p>
        <p className="mt-1 line-clamp-2 text-xs text-indigo-700/80">
          {t.resumen}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <ChipEstado ticket={t} />
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-700">
            <Iniciales
              texto={t.tecnico.iniciales}
              oscuro={t.estado !== "resuelto"}
            />
            {t.tecnico.nombre}
          </span>
          {t.estado === "resuelto" ? (
            <span className="font-semibold text-emerald-600">Cerrado</span>
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
      {/* Modal de Confirmación antes de cerrar */}
      <ConfirmCloseModal
        ticket={ticketACerrar}
        onCancel={() => setTicketACerrar(null)}
        onConfirm={(id) => cerrarTicketUsuario(id)}
      />

      {/* Modal de Carga y Resultado (Success / Error) */}
      <ActionModal modal={actionModal} onClose={cerrarModal} />

      {/* Toast ligero */}
      <div
        className={`fixed left-1/2 top-6 z-100 flex -translate-x-1/2 items-center gap-2 rounded-lg px-6 py-3 text-white shadow-xl transition-all duration-500 ${
          toast.tipo === "error" ? "bg-red-500" : "bg-emerald-500"
        } ${
          toast.show
            ? "translate-y-0 opacity-100"
            : "-translate-y-24 opacity-0 pointer-events-none"
        }`}
      >
        {toast.tipo === "error" ? (
          <XCircle className="h-5 w-5 shrink-0" />
        ) : (
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        )}
        <span className="text-sm font-medium">{toast.msg}</span>
      </div>

      {/* Barra superior */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/portal/dashboard"
            className="flex items-center gap-1.5 transition-colors hover:text-slate-800"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Inicio</span>
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 md:flex md:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar tickets por título, ID o categoría..."
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
        </div>
      </div>

      {/* Encabezado */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-lg">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
            <span className="rounded bg-indigo-100 px-2 py-1 text-indigo-700">
              Atención al empleado
            </span>
            <span className="flex items-center gap-1.5 font-medium normal-case text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Canal
              de Soporte TI Activo
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Seguimiento de Mis Solicitudes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Revisa el estado de tus consultas técnicas, responde a las dudas del
            equipo de soporte y cierra tu ticket cuando tu problema esté solucionado.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-medium">
            {[
              {
                id: "dividida",
                label: "Dividida",
                icono: <Columns2 className="h-3.5 w-3.5" />,
              },
              {
                id: "compacta",
                label: "Compacta",
                icono: <Rows3 className="h-3.5 w-3.5" />,
              },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={vista === v.id}
                onClick={() => setVista(v.id as "dividida" | "compacta")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                  vista === v.id
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {v.icono}
                {v.label}
              </button>
            ))}
          </div>
          <Link
            href="/portal/tickets/crear"
            className="flex items-center gap-2 rounded-xl bg-[#313652] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#262a40]"
          >
            <Plus className="h-4 w-4" />
            Nueva Solicitud
          </Link>
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
                  activo
                    ? "bg-indigo-50 text-slate-900"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {t.punto && (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                )}
                {t.alerta && <AlertCircle className="h-3.5 w-3.5" />}
                {t.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    t.alerta
                      ? "bg-[#313652] text-white"
                      : activo
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-slate-400"
                  }`}
                >
                  {cargando ? "—" : t.n}
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
            disabled={cargando}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${actualizando ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Skeleton mientras carga, contenido real al terminar */}
      {cargando ? (
        <SkeletonSolicitudes vista={vista} />
      ) : (
        <div
          className={
            vista === "dividida" ? "grid gap-6 lg:grid-cols-[340px_1fr]" : ""
          }
        >
          {/* ============ Lista ============ */}
          <div>
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                {lista.length} {tituloLista}
              </h2>
              <span className="text-[11px] text-slate-400">
                {actualizando ? "Actualizando..." : "Actualizado"}
              </span>
            </div>

            {lista.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                No tienes solicitudes en esta categoría.
              </div>
            ) : (
              <div
                className={`max-h-[75vh] overflow-y-auto pr-2 ${
                  vista === "compacta"
                    ? "grid gap-3 md:grid-cols-2"
                    : "flex flex-col gap-3"
                }`}
              >
                {lista.map((t) => (
                  <TarjetaTicket key={t.id} t={t} />
                ))}
              </div>
            )}
          </div>

          {/* ============ Detalle ============ */}
          {vista === "dividida" && seleccionado && (
            <div className="flex flex-col gap-5">
              {/* Advertencia superior y botón de edición solo cuando es borrador */}
              {seleccionado.esBorrador && (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-amber-900">
                        Este ticket es un borrador y aún no ha sido enviado
                      </p>
                      <p className="mt-0.5 text-xs text-amber-800/90">
                        El equipo de soporte técnico no podrá verlo ni asignarlo
                        hasta que completes y envíes la solicitud.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/portal/tickets/crear?draftId=${seleccionado.id}`}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
                  >
                    <FileEdit className="h-4 w-4" />
                    Editar borrador
                  </Link>
                </div>
              )}

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600">
                      {seleccionado.esBorrador
                        ? "SIN FOLIO"
                        : `#${seleccionado.codigoCorto}`}
                    </span>
                    <ChipEstado ticket={seleccionado} grande />
                  </div>
                  {!seleccionado.esBorrador && (
                    <button
                      type="button"
                      aria-label="Imprimir"
                      onClick={() => window.print()}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <span
                  className={`mt-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${estiloPrioridad[seleccionado.prioridad]}`}
                >
                  Prioridad {seleccionado.prioridad}
                </span>
                <h2 className="mt-3 text-lg font-bold text-slate-800">
                  {seleccionado.titulo}
                </h2>
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
                        <p className="text-xs font-bold text-slate-800">
                          {seleccionado.tecnico.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {seleccionado.esBorrador
                            ? "Pendiente de envío"
                            : seleccionado.tecnico.rol}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">
                      Tiempo Estimado de Respuesta
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Clock className="h-3.5 w-3.5" />
                      {seleccionado.respuestaEstimada}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {seleccionado.esBorrador
                        ? "Se calcula al enviar"
                        : seleccionado.turno}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Clasificación</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Laptop className="h-3.5 w-3.5" />
                      {seleccionado.dispositivo.nombre}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {seleccionado.dispositivo.so}
                    </p>
                  </div>
                </div>

                {!seleccionado.esBorrador && seleccionado.estado === "esperando" && (
                  <div className="mt-4 flex flex-wrap items-start gap-3 rounded-xl bg-slate-200/70 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#313652] text-white">
                      <MessagesSquare className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">
                        {seleccionado.tecnico.nombre.split(" ")[0]} te ha dejado
                        una consulta sobre tu caso
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        Por favor responde abajo para que el técnico pueda
                        reanudar la asistencia.
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

              {/* Conversación / Contenido inicial */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <MessagesSquare className="h-4 w-4" />
                    {seleccionado.esBorrador
                      ? "Descripción guardada en el borrador"
                      : "Conversación con Soporte TI"}
                  </h3>
                  {!seleccionado.esBorrador && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      {seleccionado.mensajes.length}{" "}
                      {seleccionado.mensajes.length === 1 ? "Mensaje" : "Mensajes"}
                    </span>
                  )}
                </div>

                <ol className="relative space-y-6 border-l border-slate-200 pl-6">
                  {seleccionado.mensajes.map((m) => (
                    <li key={m.id} className="relative">
                      <span className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full bg-[#313652] ring-4 ring-white" />
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {m.autor}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              m.esMio
                                ? "bg-slate-100 text-slate-600"
                                : "bg-[#313652] text-white"
                            }`}
                          >
                            {m.rol}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {m.hace}
                          {m.hora ? ` (${m.hora})` : ""}
                        </span>
                      </div>
                      <div className="space-y-3 rounded-xl bg-indigo-50/70 p-4 text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                        {m.parrafos.map((p, i) => (
                          <p
                            key={i}
                            className={p.b ? "font-bold text-slate-900" : ""}
                          >
                            <Texto t={p.t} />
                          </p>
                        ))}
                        {m.adjunto && (
                          <div className="inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <FileImage className="h-4 w-4 text-slate-500" />
                            <div className="leading-tight">
                              <p className="text-[11px] font-semibold text-slate-800">
                                {m.adjunto.nombre}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {m.adjunto.detalle}
                              </p>
                            </div>
                            <Download className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>

                {/* Responder y aviso de asignación (Oculto si es borrador o si ya está resuelto) */}
                {!seleccionado.esBorrador && seleccionado.estado !== "resuelto" && (
                  <div className="mt-8 border-t border-slate-100 pt-5">
                    {!seleccionado.tieneTecnicoAsignado ? (
                      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <div>
                          <p className="text-xs font-bold">
                            Esperando asignación de técnico
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-amber-700">
                            Tu ticket aún está en cola. Podrás enviar comentarios
                            y responder en cuanto un técnico de soporte sea
                            asignado a tu caso.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <CornerUpLeft className="h-3.5 w-3.5" />
                            Responder al técnico ({seleccionado.tecnico.nombre})
                          </p>
                          <span className="text-[11px] text-indigo-600">
                            Puedes adjuntar capturas de pantalla
                          </span>
                        </div>
                        <textarea
                          ref={respuestaRef}
                          rows={4}
                          value={respuesta}
                          disabled={enviandoComentario}
                          onChange={(e) => setRespuesta(e.target.value)}
                          placeholder="Escribe tu respuesta o aclaración para el técnico..."
                          className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#313652] disabled:bg-slate-50 disabled:opacity-70"
                        />
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            disabled={enviandoComentario}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          >
                            <Paperclip className="h-4 w-4" />
                            Adjuntar nueva captura/archivo
                          </button>
                          <button
                            type="button"
                            onClick={enviarRespuesta}
                            disabled={enviandoComentario}
                            className="flex items-center gap-2 rounded-lg bg-[#313652] px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-[#262a40] disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {enviandoComentario ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Enviar respuesta al técnico
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>

              {/* Opción para cerrar ticket (Oculta si es borrador) */}
              {!seleccionado.esBorrador && seleccionado.estado !== "resuelto" && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[#313652]">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-800">
                        ¿Tu problema quedó resuelto?
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        Si ya conseguiste solucionar el inconveniente y trabajar
                        normalmente, puedes cerrar esta solicitud. Ten en cuenta
                        que{" "}
                        <strong className="font-semibold text-slate-800">
                          una vez cerrado, el ticket no podrá reabrirse
                        </strong>
                        .
                      </p>
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setTicketACerrar(seleccionado)}
                          disabled={
                            actionModal.open && actionModal.status === "loading"
                          }
                          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-emerald-600 disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Cerrar ticket y confirmar solución
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Banner cuando el ticket ya está cerrado/resuelto */}
              {!seleccionado.esBorrador && seleccionado.estado === "resuelto" && (
                <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      Este ticket se encuentra cerrado y no puede ser reabierto.
                    </p>
                    <p className="text-xs text-emerald-700">
                      Si el inconveniente persiste o necesitas soporte adicional,
                      por favor genera una nueva solicitud.
                    </p>
                  </div>
                  <Link
                    href="/portal/tickets/crear"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#313652] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#262a40]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Crear nuevo ticket
                  </Link>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}