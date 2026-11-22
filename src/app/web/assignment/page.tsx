"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  History,
  Laptop,
  Mail,
  MessageSquare,
  Search,
  ShieldAlert,
  Smartphone,
  Tag,
  TriangleAlert,
  User,
  UserCheck,
} from "lucide-react";

type Prioridad = "Crítica" | "Alta" | "Media" | "Baja";
type Estado = "sin_asignar" | "en_curso";

interface Tecnico {
  id: string;
  nombre: string;
  rol: string;
  iniciales: string;
  activos: number;
  capacidad: number;
}

const TECNICOS_INICIALES: Tecnico[] = [
  {
    id: "t1",
    nombre: "Carlos Mendoza",
    rol: "Especialista L2 Redes",
    iniciales: "CM",
    activos: 4,
    capacidad: 8,
  },
  {
    id: "t2",
    nombre: "Laura Gómez",
    rol: "Sistemas & Licencias",
    iniciales: "LG",
    activos: 3,
    capacidad: 8,
  },
  {
    id: "t3",
    nombre: "David Ruiz",
    rol: "Identidad & SSO CA's",
    iniciales: "DR",
    activos: 5,
    capacidad: 5,
  },
  {
    id: "t4",
    nombre: "Sofía Navarro",
    rol: "Soporte Puesto de Trabajo",
    iniciales: "SN",
    activos: 1,
    capacidad: 8,
  },
  {
    id: "t5",
    nombre: "Andrés Villalobos",
    rol: "Soporte Técnico L1",
    iniciales: "AV",
    activos: 2,
    capacidad: 8,
  },
  {
    id: "t6",
    nombre: "Mariana Torres",
    rol: "Infraestructura & Cloud",
    iniciales: "MT",
    activos: 6,
    capacidad: 8,
  },
];

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

export default function DetalleTicketAdminPage() {
  const router = useRouter();
  const ticket = {
    id: "INC-8924",
    hace: "Hace 12 min",
    prioridad: "Crítica" as Prioridad,
    asunto: "Error de certificado SSL en portal interno",
    categoria: "Redes & VPN",
    contexto: "Impacto: Bloquea acceso remoto al portal",
    solicitante: {
      nombre: "Elena Morales",
      area: "Marketing",
      equipo: "MacBook Pro M3",
      correo: "elena.morales@empresa.com",
      ip: "10.24.18.104",
    },
    estado: "sin_asignar" as Estado,
    tecnico: null as string | null,
    slaRestante: "38 min",
    descripcion:
      "Al intentar acceder al portal interno de recursos corporativos desde la red remota, el navegador bloquea la conexión indicando error NET::ERR_CERT_DATE_INVALID. Ningún miembro del área puede descargar los activos de campaña.",
  };

  const [tecnicos, setTecnicos] = useState<Tecnico[]>(TECNICOS_INICIALES);
  const [prioridadActual, setPrioridadActual] = useState<Prioridad>(ticket.prioridad);
  const [tecnicoAsignadoActual, setTecnicoAsignadoActual] = useState<string | null>(ticket.tecnico);
  const [estadoActual, setEstadoActual] = useState<Estado>(ticket.estado);
  const [notaInterna, setNotaInterna] = useState("");
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });
  const [historial, setHistorial] = useState([
    {
      hora: "Hace 12 min",
      autor: "Elena Morales",
      accion: "Ticket creado vía Portal Web con prioridad Crítica (#INC-8924).",
    },
    {
      hora: "Hace 11 min",
      autor: "Sistema SOPHIA",
      accion: "Clasificado en categoría Redes & VPN · SLA: 15 min resp / 4h resol.",
    },
  ]);

  // Ordenar automáticamente todos los técnicos de menor a mayor carga de trabajo
  const tecnicosOrdenados = useMemo(() => {
    return [...tecnicos].sort((a, b) => {
      const pctA = a.activos / a.capacidad;
      const pctB = b.activos / b.capacidad;
      if (pctA !== pctB) return pctA - pctB;
      return a.activos - b.activos;
    });
  }, [tecnicos]);

  // Preseleccionar por defecto al técnico con menor carga disponible
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<string>(
    () =>
      [...TECNICOS_INICIALES].sort(
        (a, b) => a.activos / a.capacidad - b.activos / b.capacidad
      )[0]?.nombre ?? ""
  );

  const mostrarToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const handleConfirmarAsignacion = () => {
    if (!tecnicoSeleccionado) return;

    setTecnicos((prev) =>
      prev.map((t) =>
        t.nombre === tecnicoSeleccionado && t.activos < t.capacidad
          ? { ...t, activos: t.activos + 1 }
          : t
      )
    );

    setTecnicoAsignadoActual(tecnicoSeleccionado);
    setEstadoActual("en_curso");
    setHistorial((prev) => [
      {
        hora: "Ahora",
        autor: "Administrador",
        accion: `Ticket asignado a ${tecnicoSeleccionado}${
          notaInterna.trim() ? ` — Nota: "${notaInterna.trim()}"` : ""
        }`,
      },
      ...prev,
    ]);

    mostrarToast(`Ticket #${ticket.id} asignado a ${tecnicoSeleccionado}`);
  };

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
              placeholder="Buscar tickets, usuarios, incidentes o IPs..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
            <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
              ⌘K
            </kbd>
          </div>
          <span className="rounded-lg border border-slate-200 bg-indigo-50/60 px-3 py-2 text-xs font-medium text-slate-700">
            Cola General
          </span>
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
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#313652] text-[10px] font-bold text-white">
            CM
          </span>
        </div>
      </div>

      {/* Breadcrumb directo desde Cola de Solicitudes */}
      <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-400">
        <span className="cursor-pointer hover:text-slate-600">Cola de Solicitudes</span>
        <span>›</span>
        <span className="font-semibold text-slate-600">#{ticket.id}</span>
      </nav>

      {/* Encabezado del Ticket */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            aria-label="Volver a la cola de solicitudes"
            onClick={() => router.push("/soporte/ticketssAdmi")}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-[#313652]">
                #{ticket.id}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${estiloPrioridad[prioridadActual].chip}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${estiloPrioridad[prioridadActual].dot}`} />
                {prioridadActual}
              </span>
              {estadoActual === "sin_asignar" ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  Sin asignar
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  En curso
                </span>
              )}
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
            onChange={(e) => setPrioridadActual(e.target.value as Prioridad)}
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

            {/* Métricas clave sin mención a equipos/grupos */}
            <div className="grid gap-3 text-xs sm:grid-cols-3">
              <div className="rounded-xl bg-indigo-50/50 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <Clock className="h-3 w-3" /> Tiempo SLA restante
                </p>
                <p
                  className={`mt-1 font-bold ${
                    prioridadActual === "Crítica" ? "text-red-600" : "text-slate-800"
                  }`}
                >
                  {ticket.slaRestante}
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
                  <Tag className="h-3 w-3" /> Contexto
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
                    EM
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{ticket.solicitante.nombre}</p>
                    <p className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Mail className="h-3 w-3 text-slate-400" />
                      {ticket.solicitante.correo}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span className="flex items-center gap-1 rounded-md border border-slate-200/80 bg-white px-2.5 py-1">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    {ticket.solicitante.area}
                  </span>
                  <span className="flex items-center gap-1 rounded-md border border-slate-200/80 bg-white px-2.5 py-1">
                    {ticket.solicitante.equipo.includes("iPhone") ? (
                      <Smartphone className="h-3 w-3 text-slate-400" />
                    ) : (
                      <Laptop className="h-3 w-3 text-slate-400" />
                    )}
                    {ticket.solicitante.equipo}
                  </span>
                </div>
              </div>
            </div>

            {/* Descripción del problema */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold text-slate-800">Descripción del incidente</h3>
              <p className="rounded-xl bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600">
                {ticket.descripcion}
              </p>
            </div>
          </section>

          {/* Bitácora / Actividad */}
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <History className="h-4 w-4 text-[#313652]" />
              Historial del ticket
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

        {/* COLUMNA DERECHA: Todos los Técnicos ordenados de menor a mayor carga (con scroll) */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <User className="h-4 w-4 text-[#313652]" />
                Asignar técnico responsable
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Todos los técnicos ordenados de menor a mayor carga actual.
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
              {tecnicosOrdenados.length} técnicos
            </span>
          </div>

          {/* Lista con Scroll de todos los técnicos */}
          <div className="max-h-85 space-y-2.5 overflow-y-auto pr-1">
            {tecnicosOrdenados.map((tec, i) => {
              const saturado = tec.activos >= tec.capacidad;
              const pct = Math.min(100, Math.round((tec.activos / tec.capacidad) * 100));
              const seleccionado = tecnicoSeleccionado === tec.nombre;

              return (
                <button
                  key={tec.id}
                  type="button"
                  disabled={saturado}
                  onClick={() => setTecnicoSeleccionado(tec.nombre)}
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
                        <p className="text-[10px] text-slate-500">{tec.rol}</p>
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

          {/* Nota interna opcional */}
          <div className="border-t border-slate-100 pt-3">
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
              <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
              Instrucciones o nota interna (opcional)
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
              onClick={handleConfirmarAsignacion}
              className="w-full rounded-xl bg-[#262a40] px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-[#1c2033]"
            >
              {tecnicoAsignadoActual ? "Reasignar Ticket" : "Confirmar Asignación"}
            </button>
            <button
              type="button"
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