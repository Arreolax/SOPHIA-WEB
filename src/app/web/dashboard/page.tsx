'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Bell,
  Download,
  Calendar,
  ChevronDown,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Users,
  Inbox,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

const API_TICKETS = '/api/tickets';

// --- Interfaces ---
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

type Prioridad = 'Crítica' | 'Alta' | 'Media' | 'Baja';
type Estado = 'sin_asignar' | 'en_curso' | 'resuelto';

interface TicketProcesado {
  id: string;
  displayId: string;
  asunto: string;
  equipo: string;
  prioridad: Prioridad;
  estado: Estado;
  tecnico: string | null;
  tecnicoId: string | null;
  createdAt: Date;
  updatedAt: Date;
  minutosTranscurridos: number;
  minutosSlaRestante: number;
  slaRestanteTexto: string;
  enRiesgoSla: boolean;
  esCriticoTiempo: boolean;
}

interface AlertaOperativa {
  id: string;
  titulo: string;
  detalle: string;
  severidad: 'Crítica' | 'Alta' | 'Media';
  tipoIcono: 'sla' | 'capacidad' | 'sin_responsable';
}

interface CargaEquipo {
  id: string;
  nombre: string;
  responsables: string;
  asignados: number;
  capacidad: number;
  porcentaje: number;
  saturado: boolean;
}

// --- Helpers de mapeo y fechas ---
const SLA_OBJETIVO_MIN: Record<Prioridad, number> = {
  Crítica: 240, // 4h
  Alta: 480,    // 8h
  Media: 1440,  // 24h
  Baja: 1440,   // 24h
};

function mapPrioridad(raw?: string): Prioridad {
  const p = String(raw || '').toUpperCase();
  if (p === 'CRITICAL' || p === 'CRITICA' || p === 'CRÍTICA') return 'Crítica';
  if (p === 'HIGH' || p === 'ALTA') return 'Alta';
  if (p === 'MEDIUM' || p === 'MEDIA') return 'Media';
  return 'Baja';
}

function mapEstado(statusRaw?: string, hasAssignee?: boolean): Estado {
  const s = String(statusRaw || '').toUpperCase();
  if (s === 'RESOLVED' || s === 'CLOSED' || s === 'RESUELTO' || s === 'CERRADO') {
    return 'resuelto';
  }
  return hasAssignee ? 'en_curso' : 'sin_asignar';
}

function nombreUsuario(u?: ApiUser | null, fallback = 'Sin asignar'): string {
  if (!u) return fallback;
  return u.name?.trim() || u.username?.trim() || u.email?.split('@')[0] || fallback;
}

function formatearMinutosRestantes(min: number): string {
  if (min <= 0) return 'Vencido';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function esMismoDia(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function procesarTicket(t: ApiTicket): TicketProcesado {
  const prioridad = mapPrioridad(t.priority);
  const hasAssignee = Boolean(t.assignee?.id);
  const estado = mapEstado(t.status, hasAssignee);
  const createdAt = new Date(t.created_at);
  const updatedAt = new Date(t.updated_at || t.created_at);
  const minutosTranscurridos = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60000));
  const objetivo = SLA_OBJETIVO_MIN[prioridad];
  const minutosSlaRestante = objetivo - minutosTranscurridos;
  const enRiesgoSla = estado !== 'resuelto' && minutosSlaRestante <= 60;

  return {
    id: t.id,
    displayId: `#${t.code || t.id.slice(0, 8).toUpperCase()}`,
    asunto: t.title,
    equipo: t.category?.name || 'General',
    prioridad,
    estado,
    tecnico: hasAssignee ? nombreUsuario(t.assignee) : null,
    tecnicoId: t.assignee?.id || null,
    createdAt,
    updatedAt,
    minutosTranscurridos,
    minutosSlaRestante,
    slaRestanteTexto: estado === 'resuelto' ? 'Cumplido' : formatearMinutosRestantes(minutosSlaRestante),
    enRiesgoSla,
    esCriticoTiempo: estado !== 'resuelto' && minutosSlaRestante <= 60,
  };
}

// --- Componentes Skeleton ---
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 4 Tarjetas KPI */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
            <div className="space-y-2.5 w-full">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-16 bg-slate-200 rounded-md" />
              <div className="h-3 w-36 bg-slate-100 rounded" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
          </div>
        ))}
      </section>

      {/* Banner de Alerta */}
      <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full">
          <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />
          <div className="space-y-2 flex-1 max-w-md">
            <div className="h-3.5 w-52 bg-slate-200 rounded" />
            <div className="h-3 w-full bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-8 w-36 bg-slate-200 rounded-lg shrink-0" />
      </div>

      {/* Gráfica + Alertas */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-60 bg-slate-100 rounded" />
            </div>
            <div className="h-6 w-28 bg-slate-100 rounded-full" />
          </div>
          <div className="flex gap-4">
            <div className="h-3 w-28 bg-slate-200 rounded" />
            <div className="h-3 w-28 bg-slate-100 rounded" />
          </div>
          <div className="h-44 w-full bg-slate-100/80 rounded-xl" />
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <div className="space-y-2">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="h-3 w-40 bg-slate-100 rounded" />
          </div>
          <div className="space-y-4 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-32 bg-slate-200 rounded" />
                    <div className="h-2.5 w-44 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-5 w-14 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carga de trabajo por equipo */}
      <section className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-slate-200 rounded" />
            <div className="h-3 w-64 bg-slate-100 rounded" />
          </div>
          <div className="h-8 w-36 bg-slate-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#F4F7FB] rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 bg-slate-200 rounded" />
                  <div className="h-2.5 w-36 bg-slate-200/70 rounded" />
                </div>
                <div className="h-5 w-12 bg-slate-200 rounded-md" />
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full" />
              <div className="h-2.5 w-32 bg-slate-200/70 rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* Tabla de tickets prioritarios */}
      <section className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-56 bg-slate-200 rounded" />
          <div className="h-8 w-32 bg-slate-200 rounded-lg" />
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 py-3 border-b border-slate-100">
              <div className="h-3.5 w-20 bg-slate-200 rounded" />
              <div className="h-3.5 w-48 bg-slate-200 rounded" />
              <div className="h-3.5 w-28 bg-slate-100 rounded" />
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
              <div className="h-3.5 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function DashboardAdministrativoPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketProcesado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [ultimaSinc, setUltimaSinc] = useState('--:--:--');

  const [busqueda, setBusqueda] = useState('');
  const [filtroEquipo, setFiltroEquipo] = useState('Todos los equipos');
  const [paginaActual, setPaginaActual] = useState(1);
  const POR_PAGINA = 5;

  const cargarDatos = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setRefrescando(true);
    setErrorCarga(null);

    try {
      const res = await fetch(API_TICKETS, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || 'No se pudieron obtener los datos del dashboard');
      }

      const lista: ApiTicket[] = Array.isArray(payload.tickets) ? payload.tickets : [];
      setTickets(lista.map(procesarTicket));
      setUltimaSinc(new Date().toLocaleTimeString('es-MX', { hour12: false }));
    } catch (err: unknown) {
      setErrorCarga(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(() => cargarDatos(true), 30000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  // --- Fecha formateada actual ---
  const fechaHoyTexto = useMemo(() => {
    return new Date().toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
    });
  }, []);

  // --- Lista de equipos/categorías reales ---
  const equiposDisponibles = useMemo(() => {
    const set = new Set<string>(tickets.map((t) => t.equipo));
    return Array.from(set).sort();
  }, [tickets]);

  // --- Cálculos KPI ---
  const metricas = useMemo(() => {
    const hoy = new Date();
    const activos = tickets.filter((t) => t.estado !== 'resuelto');
    const sinAsignar = activos.filter((t) => t.estado === 'sin_asignar');
    const enGestion = activos.filter((t) => t.estado === 'en_curso');
    const enRiesgo = activos.filter((t) => t.enRiesgoSla);
    const criticosRiesgo = enRiesgo.filter((t) => t.prioridad === 'Crítica');
    const resueltosHoy = tickets.filter((t) => t.estado === 'resuelto' && esMismoDia(t.updatedAt, hoy));
    const totalResueltos = tickets.filter((t) => t.estado === 'resuelto');

    // Cumplimiento SLA calculado sobre tickets totales
    const fueraDeSla = tickets.filter((t) => t.minutosSlaRestante < 0).length;
    const cumplimientoSla =
      tickets.length > 0
        ? (((tickets.length - fueraDeSla) / tickets.length) * 100).toFixed(1).replace('.', ',')
        : '100,0';

    // Tiempo promedio de espera de los sin asignar
    const esperaMediaSinAsignar =
      sinAsignar.length > 0
        ? Math.round(sinAsignar.reduce((acc, t) => acc + t.minutosTranscurridos, 0) / sinAsignar.length)
        : 0;

    return {
      totalActivos: activos.length,
      sinAsignarCount: sinAsignar.length,
      enGestionCount: enGestion.length,
      cumplimientoSla,
      enRiesgoCount: enRiesgo.length,
      criticosRiesgoCount: criticosRiesgo.length,
      resueltosHoyCount: resueltosHoy.length,
      totalResueltosCount: totalResueltos.length,
      esperaMediaSinAsignar,
    };
  }, [tickets]);

  // --- Datos para Gráfica SVG (Últimos 7 días reales) ---
  const datosGrafica = useMemo(() => {
    const dias: { dia: string; recibidos: number; resueltos: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const etiqueta = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });

      const recibidos = tickets.filter((t) => esMismoDia(t.createdAt, fecha)).length;
      const resueltos = tickets.filter(
        (t) => t.estado === 'resuelto' && esMismoDia(t.updatedAt, fecha),
      ).length;

      dias.push({ dia: etiqueta, recibidos, resueltos });
    }
    return dias;
  }, [tickets]);

  // --- Carga de trabajo por equipo/categoría ---
  const cargaEquipos: CargaEquipo[] = useMemo(() => {
    const CAPACIDAD_POR_TECNICO = 8;
    const grupos = new Map<string, { tickets: TicketProcesado[]; tecnicos: Set<string> }>();

    tickets.forEach((t) => {
      if (!grupos.has(t.equipo)) {
        grupos.set(t.equipo, { tickets: [], tecnicos: new Set() });
      }
      const g = grupos.get(t.equipo)!;
      if (t.estado !== 'resuelto') g.tickets.push(t);
      if (t.tecnico) g.tecnicos.add(t.tecnico);
    });

    return Array.from(grupos.entries())
      .map(([nombre, data]) => {
        const numTecnicos = Math.max(1, data.tecnicos.size);
        const capacidad = numTecnicos * CAPACIDAD_POR_TECNICO;
        const asignados = data.tickets.length;
        const porcentaje = Math.min(100, Math.round((asignados / capacidad) * 100));
        const listaTecnicos = Array.from(data.tecnicos);

        return {
          id: nombre,
          nombre,
          responsables: listaTecnicos.length > 0 ? listaTecnicos.join(', ') : 'Sin técnicos asignados',
          asignados,
          capacidad,
          porcentaje,
          saturado: porcentaje >= 90,
        };
      })
      .sort((a, b) => b.porcentaje - a.porcentaje)
      .slice(0, 6);
  }, [tickets]);

  const resumenCapacidadGlobal = useMemo(() => {
    const tecnicosUnicos = new Set(tickets.map((t) => t.tecnicoId).filter(Boolean));
    const totalAsignados = tickets.filter((t) => t.estado === 'en_curso').length;
    const capacidadMax = Math.max(8, tecnicosUnicos.size * 8);
    return {
      asignados: totalAsignados,
      tecnicos: tecnicosUnicos.size,
      capacidadMax,
    };
  }, [tickets]);

  // --- Alertas operativas dinámicas ---
  const alertasOperativas: AlertaOperativa[] = useMemo(() => {
    const lista: AlertaOperativa[] = [];

    const proximoVencer = tickets
      .filter((t) => t.estado !== 'resuelto' && t.enRiesgoSla)
      .sort((a, b) => a.minutosSlaRestante - b.minutosSlaRestante)[0];

    if (proximoVencer) {
      lista.push({
        id: 'sla-urgente',
        titulo: 'SLA próximo a vencer',
        detalle: `${proximoVencer.displayId} · ${proximoVencer.equipo} · ${proximoVencer.slaRestanteTexto}`,
        severidad: 'Crítica',
        tipoIcono: 'sla',
      });
    }

    const equipoSaturado = cargaEquipos.find((e) => e.saturado);
    if (equipoSaturado) {
      lista.push({
        id: 'cap-limite',
        titulo: 'Capacidad al límite',
        detalle: `${equipoSaturado.nombre} · ${equipoSaturado.asignados} de ${equipoSaturado.capacidad} tickets activos`,
        severidad: 'Alta',
        tipoIcono: 'capacidad',
      });
    }

    if (metricas.sinAsignarCount > 0) {
      lista.push({
        id: 'sin-resp',
        titulo: 'Tickets sin responsable',
        detalle: `${metricas.sinAsignarCount} solicitudes · espera media ${metricas.esperaMediaSinAsignar} min`,
        severidad: 'Media',
        tipoIcono: 'sin_responsable',
      });
    }

    return lista;
  }, [tickets, cargaEquipos, metricas]);

  // --- Tickets prioritarios filtrados y paginados ---
  const ticketsPrioritarios = useMemo(() => {
    const pesoPrioridad: Record<Prioridad, number> = {
      Crítica: 1,
      Alta: 2,
      Media: 3,
      Baja: 4,
    };
    const q = busqueda.trim().toLowerCase();

    return tickets
      .filter((t) => t.estado !== 'resuelto')
      .filter((t) => (filtroEquipo === 'Todos los equipos' ? true : t.equipo === filtroEquipo))
      .filter((t) =>
        q ? `${t.displayId} ${t.asunto} ${t.equipo} ${t.tecnico || ''}`.toLowerCase().includes(q) : true,
      )
      .sort((a, b) => {
        if (pesoPrioridad[a.prioridad] !== pesoPrioridad[b.prioridad]) {
          return pesoPrioridad[a.prioridad] - pesoPrioridad[b.prioridad];
        }
        return a.minutosSlaRestante - b.minutosSlaRestante;
      });
  }, [tickets, filtroEquipo, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(ticketsPrioritarios.length / POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const ticketsPaginados = ticketsPrioritarios.slice(
    (paginaSegura - 1) * POR_PAGINA,
    paginaSegura * POR_PAGINA,
  );

  // --- Coordenadas SVG dinámicas ---
  const anchoSvg = 560;
  const altoSvg = 150;
  const maxValorGrafica = useMemo(() => {
    const maxDato = Math.max(
      ...datosGrafica.map((d) => Math.max(d.recibidos, d.resueltos)),
      4,
    );
    return Math.ceil(maxDato / 4) * 4;
  }, [datosGrafica]);

  const calcularPuntos = (clave: 'recibidos' | 'resueltos') => {
    return datosGrafica
      .map((d, i) => {
        const x = (i / Math.max(1, datosGrafica.length - 1)) * (anchoSvg - 20) + 10;
        const y = altoSvg - (d[clave] / maxValorGrafica) * (altoSvg - 20) - 10;
        return `${x},${y}`;
      })
      .join(' ');
  };

  // --- Exportar resumen CSV ---
  const exportarCsv = () => {
    const encabezados = ['ID', 'Asunto', 'Equipo/Categoria', 'Prioridad', 'Estado', 'Tecnico', 'SLA Restante'];
    const filas = tickets.map((t) => [
      t.displayId,
      `"${t.asunto.replace(/"/g, '""')}"`,
      `"${t.equipo}"`,
      t.prioridad,
      t.estado,
      `"${t.tecnico || 'Sin asignar'}"`,
      t.slaRestanteTexto,
    ]);
    const csv = [encabezados.join(','), ...filas.map((f) => f.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumen-admin-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-800 flex flex-col">
      {/* Barra Superior (Topbar) */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar tickets, equipos, responsables..."
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-lg pl-10 pr-12 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-3 py-1 rounded-full">
            Administrador
          </span>
          <button
            type="button"
            aria-label="Notificaciones"
            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {metricas.enRiesgoCount > 0 && (
              <span className="w-2 h-2 bg-rose-500 rounded-full absolute top-1.5 right-1.5 ring-2 ring-white" />
            )}
          </button>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-350 w-full mx-auto px-6 py-6 space-y-6">
        {/* Breadcrumb, Encabezado y Filtros */}
        <div className="space-y-4">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                Dashboard administrativo
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Supervisa la operación global, los acuerdos de servicio y la capacidad de soporte.
              </p>
            </div>

            <button
              type="button"
              disabled={cargando || tickets.length === 0}
              onClick={exportarCsv}
              className="flex items-center gap-2 bg-[#161B33] hover:bg-[#1E2544] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              Exportar resumen
            </button>
          </div>

          {/* Barra de filtros rápidos y estado en vivo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-2 bg-[#E8EEF5] text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Hoy, {fechaHoyTexto}
              </span>

              <div className="relative">
                <select
                  value={filtroEquipo}
                  onChange={(e) => {
                    setFiltroEquipo(e.target.value);
                    setPaginaActual(1);
                  }}
                  className="appearance-none bg-[#E8EEF5] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold pl-8 pr-4 py-2 rounded-lg focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="Todos los equipos">Todos los equipos</option>
                  {equiposDisponibles.map((eq) => (
                    <option key={eq} value={eq}>
                      {eq}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => cargarDatos()}
              className="flex items-center gap-2 text-[11px] text-slate-500 hover:text-slate-700"
            >
              <RefreshCw className={`w-3 h-3 ${refrescando ? 'animate-spin text-[#4F46E5]' : ''}`} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
              <span>En vivo · Última sinc.: {ultimaSinc}</span>
            </button>
          </div>
        </div>

        {/* Error de API */}
        {errorCarga && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{errorCarga}</span>
            <button type="button" onClick={() => cargarDatos()} className="font-semibold underline">
              Reintentar
            </button>
          </div>
        )}

        {/* Contenido dinámico con Skeleton */}
        {cargando ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Tarjetas KPI (4 columnas) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1 */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-slate-500">Tickets activos</p>
                  <p className="text-3xl font-bold text-[#0F172A] mt-2">{metricas.totalActivos}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {metricas.sinAsignarCount} sin asignar · {metricas.enGestionCount} en gestión
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>

              {/* KPI 2 */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-slate-500">Cumplimiento SLA</p>
                  <p className="text-3xl font-bold text-[#0F172A] mt-2">{metricas.cumplimientoSla} %</p>
                  <p className="text-xs font-medium text-[#16A34A] mt-2">
                    Sobre {tickets.length} tickets registrados
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              {/* KPI 3 */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-slate-500">En riesgo SLA</p>
                  <p className="text-3xl font-bold text-[#DC2626] mt-2">{metricas.enRiesgoCount}</p>
                  <p className="text-xs font-medium text-[#DC2626] mt-2">
                    {metricas.criticosRiesgoCount} críticos · vencen en &lt; 1 h
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>

              {/* KPI 4 */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-slate-500">Resueltos hoy</p>
                  <p className="text-3xl font-bold text-[#0F172A] mt-2">{metricas.resueltosHoyCount}</p>
                  <p className="text-xs font-medium text-[#16A34A] mt-2">
                    {metricas.totalResueltosCount} cerrados en total
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            </section>

            {/* Banner de Alerta Crítica */}
            {(metricas.enRiesgoCount > 0 || alertasOperativas.some((a) => a.severidad === 'Alta')) && (
              <section className="bg-[#FDF2F2] border border-[#FECACA] rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#B91C1C]">
                      {metricas.enRiesgoCount} ticket(s) requieren atención administrativa
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Hay {metricas.criticosRiesgoCount} caso(s) críticos en riesgo SLA y {metricas.sinAsignarCount} solicitudes pendientes de asignación.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/web/tickets')}
                  className="flex items-center gap-1.5 bg-[#E2E8F0]/90 hover:bg-slate-300/80 text-slate-800 text-xs font-semibold px-4 py-2 rounded-lg transition-colors shrink-0 self-end sm:self-auto"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Revisar asignaciones
                </button>
              </section>
            )}

            {/* Sección Central: Evolución de tickets (Gráfica) + Alertas operativas */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna Izquierda: Evolución de tickets */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-[#0F172A]">Evolución de tickets</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Últimos 7 días · Volumen diario de toda la mesa de ayuda
                    </p>
                  </div>
                  <span className="bg-[#E0E7FF] text-[#4338CA] text-[11px] font-semibold px-3 py-1 rounded-full shrink-0">
                    {tickets.length} históricos
                  </span>
                </div>

                {/* Leyenda */}
                <div className="flex items-center gap-5 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#3B426E]" />
                    <span>Tickets recibidos</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-[#A5B4FC]" />
                    <span>Tickets resueltos</span>
                  </div>
                </div>

                {/* Gráfica SVG */}
                <div className="w-full pt-2">
                  <div className="flex gap-3">
                    {/* Eje Y dinámico */}
                    <div className="flex flex-col justify-between text-[11px] text-slate-400 py-1 select-none">
                      <span>{maxValorGrafica}</span>
                      <span>{Math.round(maxValorGrafica * 0.75)}</span>
                      <span>{Math.round(maxValorGrafica * 0.5)}</span>
                      <span>{Math.round(maxValorGrafica * 0.25)}</span>
                    </div>

                    {/* Área de trazado */}
                    <div className="flex-1">
                      <svg
                        viewBox={`0 0 ${anchoSvg} ${altoSvg}`}
                        className="w-full h-40 overflow-visible"
                      >
                        {[15, 55, 95, 135].map((yPos, idx) => (
                          <line
                            key={idx}
                            x1="0"
                            y1={yPos}
                            x2={anchoSvg}
                            y2={yPos}
                            stroke="#F1F5F9"
                            strokeWidth="1"
                          />
                        ))}

                        <polyline
                          fill="none"
                          stroke="#A5B4FC"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={calcularPuntos('resueltos')}
                        />

                        <polyline
                          fill="none"
                          stroke="#3B426E"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={calcularPuntos('recibidos')}
                        />
                      </svg>

                      {/* Eje X */}
                      <div className="flex justify-between text-[11px] text-slate-400 mt-2 px-1">
                        {datosGrafica.map((d) => (
                          <span key={d.dia}>{d.dia}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Alertas operativas */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A]">Alertas operativas</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {alertasOperativas.length} pendiente(s) de revisión
                  </p>

                  {alertasOperativas.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Operación estable · Sin alertas activas en este momento.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 mt-5">
                      {alertasOperativas.map((alerta) => {
                        const esCritica = alerta.severidad === 'Crítica';
                        const esAlta = alerta.severidad === 'Alta';

                        return (
                          <div
                            key={alerta.id}
                            className="py-4 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                  esCritica
                                    ? 'bg-[#FEE2E2] text-[#DC2626]'
                                    : 'bg-[#F1F5F9] text-slate-600'
                                }`}
                              >
                                {alerta.tipoIcono === 'sla' && <Clock className="w-3.5 h-3.5" />}
                                {alerta.tipoIcono === 'capacidad' && <Users className="w-3.5 h-3.5" />}
                                {alerta.tipoIcono === 'sin_responsable' && <Inbox className="w-3.5 h-3.5" />}
                              </div>

                              <div>
                                <p className="text-xs font-bold text-slate-800">{alerta.titulo}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">{alerta.detalle}</p>
                              </div>
                            </div>

                            <span
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                                esCritica
                                  ? 'bg-[#FEE2E2] text-[#DC2626]'
                                  : esAlta
                                  ? 'bg-[#E0E7FF] text-[#4338CA]'
                                  : 'bg-[#F1F5F9] text-slate-600'
                              }`}
                            >
                              {alerta.severidad}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Sección: Carga de trabajo por equipo */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A]">
                    Carga de trabajo por equipo
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {resumenCapacidadGlobal.asignados} tickets asignados · {resumenCapacidadGlobal.tecnicos} técnicos activos · Capacidad estimada: {resumenCapacidadGlobal.capacidadMax}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/web/tickets')}
                  className="flex items-center gap-2 bg-[#EEF2F6] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors self-start sm:self-auto"
                >
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  Gestionar equipos
                </button>
              </div>

              {cargaEquipos.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  No hay categorías con tickets registrados.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cargaEquipos.map((eq) => (
                    <div
                      key={eq.id}
                      className="bg-[#F4F7FB] rounded-xl p-4 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-[#0F172A]">{eq.nombre}</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{eq.responsables}</p>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                            eq.saturado
                              ? 'bg-[#FEE2E2] text-[#DC2626]'
                              : 'bg-[#E0E7FF] text-[#4338CA]'
                          }`}
                        >
                          {eq.asignados} / {eq.capacidad}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              eq.saturado ? 'bg-[#DC2626]' : 'bg-[#3B426E]'
                            }`}
                            style={{ width: `${eq.porcentaje}%` }}
                          />
                        </div>
                        <p
                          className={`text-[11px] font-medium ${
                            eq.saturado ? 'text-[#DC2626]' : 'text-slate-400'
                          }`}
                        >
                          {eq.porcentaje} % de capacidad utilizada
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Sección: Tickets prioritarios de la operación */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-base font-bold text-[#0F172A]">
                  Tickets prioritarios de la operación
                </h2>

                <button
                  type="button"
                  onClick={() => router.push('/web/tickets')}
                  className="flex items-center gap-1.5 bg-[#EEF2F6] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors self-start sm:self-auto"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                  Ver cola completa
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-y border-slate-100">
                      <th className="py-3 px-4 rounded-l-lg">Ticket</th>
                      <th className="py-3 px-4">Asunto</th>
                      <th className="py-3 px-4">Equipo</th>
                      <th className="py-3 px-4">Prioridad</th>
                      <th className="py-3 px-4 rounded-r-lg">SLA restante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {ticketsPaginados.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No hay tickets activos que coincidan con el filtro actual.
                        </td>
                      </tr>
                    ) : (
                      ticketsPaginados.map((ticket) => (
                        <tr
                          key={ticket.id}
                          onClick={() => router.push(`/web/tickets/${ticket.id}`)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4 font-bold text-[#0F172A]">{ticket.displayId}</td>
                          <td className="py-3.5 px-4 text-slate-700">{ticket.asunto}</td>
                          <td className="py-3.5 px-4 text-slate-600">{ticket.equipo}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                ticket.prioridad === 'Crítica'
                                  ? 'bg-[#FEE2E2] text-[#DC2626]'
                                  : ticket.prioridad === 'Alta'
                                  ? 'bg-[#E0E7FF] text-[#4338CA]'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {ticket.prioridad}
                            </span>
                          </td>
                          <td
                            className={`py-3.5 px-4 font-semibold ${
                              ticket.esCriticoTiempo ? 'text-[#DC2626]' : 'text-slate-600'
                            }`}
                          >
                            {ticket.slaRestanteTexto}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-400">
                <p>
                  Mostrando {ticketsPaginados.length} de {ticketsPrioritarios.length} tickets activos
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={paginaSegura <= 1}
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    className="w-7 h-7 rounded-lg bg-[#F1F5F9] hover:bg-slate-200 disabled:opacity-40 text-slate-600 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: totalPaginas }, (_, idx) => idx + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPaginaActual(num)}
                      className={`w-7 h-7 rounded-lg font-semibold flex items-center justify-center transition-colors ${
                        paginaSegura === num
                          ? 'bg-[#161B33] text-white'
                          : 'bg-[#F1F5F9] text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={paginaSegura >= totalPaginas}
                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    className="w-7 h-7 rounded-lg bg-[#F1F5F9] hover:bg-slate-200 disabled:opacity-40 text-slate-600 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Pie de página inferior */}
      <footer className="max-w-350 w-full mx-auto px-6 py-4 flex items-center justify-between text-[11px] text-slate-400">
        <span>SOPHIA · Mesa de Servicio Administrativa</span>
        <span>{fechaHoyTexto} · {ultimaSinc}</span>
      </footer>
    </div>
  );
}