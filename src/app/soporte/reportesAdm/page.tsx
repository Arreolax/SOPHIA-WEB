'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Bell,
  User,
  Calendar,
  Download,
  FileText,
  ShieldCheck,
  Clock,
  Star,
  History,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

// --- Interfaces ---
interface RendimientoEquipo {
  id: string;
  nombre: string;
  resueltos: number;
  slaPorcentaje: string;
  porcentajeBarra: number;
  enAlerta: boolean;
}

interface EventoAuditoria {
  id: string;
  fechaHora: string;
  responsable: string;
  modulo: 'Usuarios' | 'Equipos' | 'Tickets' | 'SLA' | 'Roles';
  tituloCambio: string;
  detalleCambio: string;
  resultado: 'Correcto';
}

// --- Datos iniciales ---
const DATOS_SLA_SEMANA = [
  { dia: '08 may', sla: 89.2, objetivo: 95 },
  { dia: '09 may', sla: 91.5, objetivo: 95 },
  { dia: '10 may', sla: 90.2, objetivo: 95 },
  { dia: '11 may', sla: 94.5, objetivo: 95 },
  { dia: '12 may', sla: 93.4, objetivo: 95 },
  { dia: '13 may', sla: 97.4, objetivo: 95 },
  { dia: '14 may', sla: 97.1, objetivo: 95 },
];

const RENDIMIENTO_EQUIPOS: RendimientoEquipo[] = [
  {
    id: 'redes',
    nombre: 'Redes y VPN',
    resueltos: 68,
    slaPorcentaje: '97,1 %',
    porcentajeBarra: 97,
    enAlerta: false,
  },
  {
    id: 'sistemas',
    nombre: 'Sistemas y Licencias',
    resueltos: 74,
    slaPorcentaje: '98,6 %',
    porcentajeBarra: 99,
    enAlerta: false,
  },
  {
    id: 'identidad',
    nombre: 'Identidad y SSO',
    resueltos: 44,
    slaPorcentaje: '93,2 %',
    porcentajeBarra: 93,
    enAlerta: true,
  },
];

const EVENTOS_AUDITORIA: EventoAuditoria[] = [
  {
    id: 'ev1',
    fechaHora: '14 may · 14:12',
    responsable: 'Ana Martínez',
    modulo: 'Usuarios',
    tituloCambio: 'Invitación enviada a Marcos Peña',
    detalleCambio: 'Rol: Solicitante · Área: Finanzas',
    resultado: 'Correcto',
  },
  {
    id: 'ev2',
    fechaHora: '14 may · 13:45',
    responsable: 'Ana Martínez',
    modulo: 'Equipos',
    tituloCambio: 'Sofía Navarro añadida al turno A',
    detalleCambio: 'Sistemas y Licencias · Capacidad: 4 tickets',
    resultado: 'Correcto',
  },
  {
    id: 'ev3',
    fechaHora: '14 may · 10:20',
    responsable: 'Carlos Mendoza',
    modulo: 'Tickets',
    tituloCambio: 'Prioridad de INC-8921 actualizada',
    detalleCambio: 'Alta → Crítica · Justificación registrada',
    resultado: 'Correcto',
  },
  {
    id: 'ev4',
    fechaHora: '13 may · 16:40',
    responsable: 'Ana Martínez',
    modulo: 'SLA',
    tituloCambio: 'Política de SLA v2.4 publicada',
    detalleCambio: 'P1: 1 h respuesta / 4 h resolución · 24 × 7',
    resultado: 'Correcto',
  },
  {
    id: 'ev5',
    fechaHora: '13 may · 15:08',
    responsable: 'Ana Martínez',
    modulo: 'Roles',
    tituloCambio: 'Permisos de Supervisor actualizados',
    detalleCambio: 'Se habilitó la exportación de reportes',
    resultado: 'Correcto',
  },
];

export default function ReportesYAuditoriaPage() {
  // Filtros globales superiores
  const [rangoFechas, setRangoFechas] = useState('08–14 may 2025');
  const [filtroEquipoGlobal, setFiltroEquipoGlobal] = useState('Todos los equipos');
  const [filtroPrioridadGlobal, setFiltroPrioridadGlobal] = useState('Todas las prioridades');

  // Filtros de tabla de auditoría
  const [busquedaAuditoria, setBusquedaAuditoria] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('Todos');
  const [filtroUsuario, setFiltroUsuario] = useState('Todos');
  const [paginaActual, setPaginaActual] = useState(1);

  // Filtrado de eventos
  const eventosFiltrados = EVENTOS_AUDITORIA.filter((ev) => {
    const coincideTexto =
      ev.tituloCambio.toLowerCase().includes(busquedaAuditoria.toLowerCase()) ||
      ev.detalleCambio.toLowerCase().includes(busquedaAuditoria.toLowerCase()) ||
      ev.responsable.toLowerCase().includes(busquedaAuditoria.toLowerCase());
    const coincideModulo = filtroModulo === 'Todos' || ev.modulo === filtroModulo;
    const coincideUsuario = filtroUsuario === 'Todos' || ev.responsable === filtroUsuario;
    return coincideTexto && coincideModulo && coincideUsuario;
  });

  // Coordenadas SVG para la gráfica de Cumplimiento de SLA (rango 85% a 102%)
  const anchoSvg = 560;
  const altoSvg = 150;
  const maxValor = 102;
  const minValor = 85;

  const calcularY = (valor: number) =>
    altoSvg - ((valor - minValor) / (maxValor - minValor)) * (altoSvg - 20) - 10;

  const puntosSla = DATOS_SLA_SEMANA.map((d, i) => {
    const x = (i / (DATOS_SLA_SEMANA.length - 1)) * (anchoSvg - 20) + 10;
    return `${x},${calcularY(d.sla)}`;
  }).join(' ');

  const yObjetivo95 = calcularY(95);

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-800 flex flex-col">
      {/* Barra Superior (Topbar) */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar tickets, usuarios, incidentes o IPs..."
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-lg pl-10 pr-12 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5">
              ⌘K
            </span>
          </div>

          <button className="flex items-center gap-2 bg-[#F1F5F9] hover:bg-slate-200/70 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            Cola General
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-3 py-1 rounded-full">
            Administrador
          </span>
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 bg-rose-500 rounded-full absolute top-1.5 right-1.5 ring-2 ring-white" />
          </button>
          <button className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center">
            <User className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6 space-y-6">
        {/* Breadcrumb, Título y Botones */}
        <div>
          <nav className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
            <span>Administración</span>
            <span>›</span>
            <span className="text-slate-600 font-medium">Reportes y auditoría</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                Reportes y auditoría
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Evalúa la calidad del servicio y consulta la trazabilidad de las acciones administrativas.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-[#EEF2F6] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors">
                <Calendar className="w-4 h-4 text-slate-600" />
                Programar envío
              </button>
              <button className="flex items-center gap-2 bg-[#161B33] hover:bg-[#1E2544] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors">
                <Download className="w-4 h-4" />
                Exportar reporte
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Filtros Globales */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <select
            value={rangoFechas}
            onChange={(e) => setRangoFechas(e.target.value)}
            className="flex-1 bg-[#F1F5F9]/80 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg border border-transparent focus:border-indigo-300 focus:outline-none cursor-pointer"
          >
            <option value="08–14 may 2025">08–14 may 2025</option>
            <option value="01–07 may 2025">01–07 may 2025</option>
            <option value="Últimos 30 días">Últimos 30 días</option>
          </select>

          <select
            value={filtroEquipoGlobal}
            onChange={(e) => setFiltroEquipoGlobal(e.target.value)}
            className="flex-1 bg-[#F1F5F9]/80 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg border border-transparent focus:border-indigo-300 focus:outline-none cursor-pointer"
          >
            <option value="Todos los equipos">Todos los equipos</option>
            <option value="Redes y VPN">Redes y VPN</option>
            <option value="Sistemas y Licencias">Sistemas y Licencias</option>
            <option value="Identidad y SSO">Identidad y SSO</option>
          </select>

          <select
            value={filtroPrioridadGlobal}
            onChange={(e) => setFiltroPrioridadGlobal(e.target.value)}
            className="flex-1 bg-[#F1F5F9]/80 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg border border-transparent focus:border-indigo-300 focus:outline-none cursor-pointer"
          >
            <option value="Todas las prioridades">Todas las prioridades</option>
            <option value="P1 · Crítica">P1 · Crítica</option>
            <option value="P2 · Alta">P2 · Alta</option>
            <option value="P3 · Media">P3 · Media</option>
          </select>

          <button className="flex items-center justify-center gap-2 bg-[#EEF2F6] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-600" />
            Aplicar
          </button>
        </section>

        {/* Tarjetas KPI (4 columnas) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Tickets resueltos</p>
              <p className="text-3xl font-bold text-[#0F172A] mt-2">186</p>
              <p className="text-xs text-slate-400 mt-2">+14 % vs. periodo anterior</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Cumplimiento SLA</p>
              <p className="text-3xl font-bold text-[#0F172A] mt-2">96,8 %</p>
              <p className="text-xs font-medium text-[#16A34A] mt-2">
                180 de 186 dentro del objetivo
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Primera respuesta</p>
              <p className="text-3xl font-bold text-[#0F172A] mt-2">42 min</p>
              <p className="text-xs text-slate-400 mt-2">−8 min vs. periodo anterior</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Satisfacción CSAT</p>
              <p className="text-3xl font-bold text-[#0F172A] mt-2">4,8 / 5</p>
              <p className="text-xs text-slate-400 mt-2">112 encuestas recibidas</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
          </div>
        </section>

        {/* Sección Central: Gráfica Cumplimiento de SLA + Rendimiento por equipo */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Cumplimiento de SLA */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Cumplimiento de SLA</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Últimos 7 días · Objetivo global: 95 %
                </p>
              </div>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[11px] font-semibold px-3 py-1 rounded-full shrink-0">
                Objetivo superado
              </span>
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-5 text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#3B426E]" />
                <span>Cumplimiento SLA</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-[#A5B4FC]" />
                <span>Objetivo 95 %</span>
              </div>
            </div>

            {/* Gráfica SVG */}
            <div className="w-full pt-2">
              <div className="flex gap-3">
                {/* Eje Y */}
                <div className="flex flex-col justify-between text-[11px] text-slate-400 py-1 select-none">
                  <span>100 %</span>
                  <span>95 %</span>
                  <span>90 %</span>
                  <span>85 %</span>
                </div>

                {/* Área de trazado */}
                <div className="flex-1">
                  <svg
                    viewBox={`0 0 ${anchoSvg} ${altoSvg}`}
                    className="w-full h-40 overflow-visible"
                  >
                    {/* Líneas guía horizontales */}
                    {[20, 62, 104, 142].map((yPos, idx) => (
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

                    {/* Línea horizontal de Objetivo 95 % */}
                    <line
                      x1="10"
                      y1={yObjetivo95}
                      x2={anchoSvg - 10}
                      y2={yObjetivo95}
                      stroke="#A5B4FC"
                      strokeWidth="1.5"
                    />

                    {/* Línea Cumplimiento SLA */}
                    <polyline
                      fill="none"
                      stroke="#3B426E"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={puntosSla}
                    />
                  </svg>

                  {/* Eje X */}
                  <div className="flex justify-between text-[11px] text-slate-400 mt-2 px-1">
                    {DATOS_SLA_SEMANA.map((d) => (
                      <span key={d.dia}>{d.dia}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Rendimiento por equipo */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Rendimiento por equipo</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Resoluciones y cumplimiento del periodo
              </p>

              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-5 pb-2">
                <span>Equipo</span>
                <span>Resueltos | SLA</span>
              </div>

              <div className="divide-y divide-slate-100">
                {RENDIMIENTO_EQUIPOS.map((eq) => (
                  <div key={eq.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{eq.nombre}</span>
                      <span
                        className={`font-bold ${
                          eq.enAlerta ? 'text-[#DC2626]' : 'text-slate-700'
                        }`}
                      >
                        {eq.resueltos} / {eq.slaPorcentaje}
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          eq.enAlerta ? 'bg-[#DC2626]' : 'bg-[#6366F1]'
                        }`}
                        style={{ width: `${eq.porcentajeBarra}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-3">
              6 incumplimientos en el periodo · Revisar Identidad y SSO.
            </p>
          </div>
        </section>

        {/* Sección Inferior: Historial de cambios y auditoría */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                Historial de cambios y auditoría
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Registro de acciones sobre usuarios, equipos, políticas y tickets.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#4F46E5]" />
              <span className="bg-[#EEF2F6] text-slate-600 text-[11px] font-semibold px-3 py-1 rounded-full">
                Solo lectura
              </span>
            </div>
          </div>

          {/* Barra de filtros de auditoría */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={busquedaAuditoria}
                onChange={(e) => setBusquedaAuditoria(e.target.value)}
                placeholder="Buscar acción, usuario o recurso..."
                className="w-full bg-[#F1F5F9]/70 border border-transparent focus:border-indigo-300 focus:bg-white rounded-lg px-4 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={filtroModulo}
                onChange={(e) => setFiltroModulo(e.target.value)}
                className="bg-[#F1F5F9]/70 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg border border-transparent focus:border-indigo-300 focus:outline-none cursor-pointer"
              >
                <option value="Todos">Módulo: Todos</option>
                <option value="Usuarios">Módulo: Usuarios</option>
                <option value="Equipos">Módulo: Equipos</option>
                <option value="Tickets">Módulo: Tickets</option>
                <option value="SLA">Módulo: SLA</option>
                <option value="Roles">Módulo: Roles</option>
              </select>

              <select
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
                className="bg-[#F1F5F9]/70 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg border border-transparent focus:border-indigo-300 focus:outline-none cursor-pointer"
              >
                <option value="Todos">Usuario: Todos</option>
                <option value="Ana Martínez">Usuario: Ana Martínez</option>
                <option value="Carlos Mendoza">Usuario: Carlos Mendoza</option>
              </select>

              <button className="flex items-center gap-2 bg-[#EEF2F6] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors">
                <Download className="w-3.5 h-3.5 text-slate-600" />
                Exportar CSV
              </button>
            </div>
          </div>

          {/* Tabla de Auditoría */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-y border-slate-100">
                  <th className="py-3 px-4 rounded-l-lg">Fecha / Hora</th>
                  <th className="py-3 px-4">Responsable</th>
                  <th className="py-3 px-4">Módulo</th>
                  <th className="py-3 px-4">Cambio registrado</th>
                  <th className="py-3 px-4">Resultado</th>
                  <th className="py-3 px-4 text-right rounded-r-lg">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {eventosFiltrados.map((evento) => (
                  <tr key={evento.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {evento.fechaHora}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {evento.responsable}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          evento.modulo === 'SLA'
                            ? 'bg-[#E0E7FF] text-[#4338CA]'
                            : 'bg-[#F1F5F9] text-slate-600'
                        }`}
                      >
                        {evento.modulo}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{evento.tituloCambio}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {evento.detalleCambio}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#15803D]">
                        {evento.resultado}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        title="Ver detalle del evento"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-400">
            <p>Mostrando 1–5 de 128 eventos · Hora de Madrid</p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg bg-[#F1F5F9] hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPaginaActual(1)}
                className={`w-7 h-7 rounded-lg font-semibold flex items-center justify-center transition-colors ${
                  paginaActual === 1
                    ? 'bg-[#161B33] text-white'
                    : 'bg-[#F1F5F9] text-slate-600 hover:bg-slate-200'
                }`}
              >
                1
              </button>
              <button
                onClick={() => setPaginaActual(2)}
                className={`w-7 h-7 rounded-lg font-semibold flex items-center justify-center transition-colors ${
                  paginaActual === 2
                    ? 'bg-[#161B33] text-white'
                    : 'bg-[#F1F5F9] text-slate-600 hover:bg-slate-200'
                }`}
              >
                2
              </button>
              <button
                onClick={() => setPaginaActual((p) => Math.min(2, p + 1))}
                className="w-7 h-7 rounded-lg bg-[#F1F5F9] hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Banner Inferior: Trazabilidad protegida */}
        <section className="bg-[#EEF2F8] border border-indigo-100/80 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-white text-[#4338CA] flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#0F172A]">Trazabilidad protegida</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Los registros de auditoría no se pueden editar ni eliminar. Conservación: 365 días. Exportaciones restringidas al administrador.
              </p>
            </div>
          </div>

          <button className="flex items-center gap-1.5 bg-[#E2E8F0]/80 hover:bg-slate-300/70 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors shrink-0 self-end sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            Ver política
          </button>
        </section>
      </main>

      {/* Pie de página inferior */}
      <footer className="max-w-[1400px] w-full mx-auto px-6 py-4 flex items-center justify-between text-[11px] text-slate-400">
        <span>Entorno de demostración · Datos de ejemplo</span>
        <span>14 may 2025 · 14:28 CEST</span>
      </footer>
    </div>
  );
}