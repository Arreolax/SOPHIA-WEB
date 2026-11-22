'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Bell,
  User,
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
} from 'lucide-react';

// --- Interfaces ---
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

interface TicketPrioritario {
  id: string;
  asunto: string;
  equipo: string;
  prioridad: 'Crítica' | 'Alta';
  slaRestante: string;
  esCriticoTiempo: boolean;
}

// --- Datos iniciales ---
const DATOS_GRAFICA = [
  { dia: '08 may', recibidos: 17, resueltos: 14 },
  { dia: '09 may', recibidos: 25, resueltos: 18 },
  { dia: '10 may', recibidos: 21, resueltos: 16 },
  { dia: '11 may', recibidos: 36, resueltos: 28 },
  { dia: '12 may', recibidos: 30, resueltos: 24 },
  { dia: '13 may', recibidos: 37, resueltos: 31 },
  { dia: '14 may', recibidos: 24, resueltos: 18 },
];

const ALERTAS_OPERATIVAS: AlertaOperativa[] = [
  {
    id: 'a1',
    titulo: 'SLA próximo a vencer',
    detalle: 'INC-8921 · Redes y VPN · 42 min',
    severidad: 'Crítica',
    tipoIcono: 'sla',
  },
  {
    id: 'a2',
    titulo: 'Capacidad al límite',
    detalle: 'David Ruiz · 8 de 8 tickets activos',
    severidad: 'Alta',
    tipoIcono: 'capacidad',
  },
  {
    id: 'a3',
    titulo: 'Tickets sin responsable',
    detalle: '6 solicitudes · espera media 8 min',
    severidad: 'Media',
    tipoIcono: 'sin_responsable',
  },
];

const CARGA_EQUIPOS: CargaEquipo[] = [
  {
    id: 'redes',
    nombre: 'Redes y VPN',
    responsables: 'Carlos Mendoza',
    asignados: 5,
    capacidad: 8,
    porcentaje: 63,
    saturado: false,
  },
  {
    id: 'sistemas',
    nombre: 'Sistemas y Licencias',
    responsables: 'Laura Gómez y Sofía Navarro',
    asignados: 5,
    capacidad: 12,
    porcentaje: 42,
    saturado: false,
  },
  {
    id: 'identidad',
    nombre: 'Identidad y SSO',
    responsables: 'David Ruiz',
    asignados: 8,
    capacidad: 8,
    porcentaje: 100,
    saturado: true,
  },
];

const TICKETS_PRIORITARIOS: TicketPrioritario[] = [
  {
    id: '#INC-8921',
    asunto: 'Falta de autenticación VPN AnyConnect',
    equipo: 'Redes y VPN',
    prioridad: 'Crítica',
    slaRestante: '42 min',
    esCriticoTiempo: true,
  },
  {
    id: '#INC-8918',
    asunto: 'Bloqueo de cuenta Okta y token MFA',
    equipo: 'Identidad y SSO',
    prioridad: 'Crítica',
    slaRestante: '55 min',
    esCriticoTiempo: true,
  },
  {
    id: '#INC-8920',
    asunto: 'Fallo de pantalla secundaria HDMI',
    equipo: 'Sistemas y Licencias',
    prioridad: 'Alta',
    slaRestante: '1 h 20 min',
    esCriticoTiempo: false,
  },
];

export default function DashboardAdministrativoPage() {
  const [filtroEquipo, setFiltroEquipo] = useState('Todos los equipos');
  const [paginaActual, setPaginaActual] = useState(1);

  const ticketsFiltrados =
    filtroEquipo === 'Todos los equipos'
      ? TICKETS_PRIORITARIOS
      : TICKETS_PRIORITARIOS.filter((t) => t.equipo === filtroEquipo);

  // Coordenadas SVG para la gráfica de líneas (7 puntos)
  const anchoSvg = 560;
  const altoSvg = 150;
  const maxValor = 45;
  const minValor = 10;

  const calcularPuntos = (clave: 'recibidos' | 'resueltos') => {
    return DATOS_GRAFICA.map((d, i) => {
      const x = (i / (DATOS_GRAFICA.length - 1)) * (anchoSvg - 20) + 10;
      const y =
        altoSvg -
        ((d[clave] - minValor) / (maxValor - minValor)) * (altoSvg - 20) -
        10;
      return `${x},${y}`;
    }).join(' ');
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
      <main className="flex-1 max-w-350 w-full mx-auto px-6 py-6 space-y-6">
        {/* Breadcrumb, Encabezado y Filtros de fecha/equipo */}
        <div className="space-y-4">
          <nav className="text-xs text-slate-400 flex items-center gap-1.5">
            <span>Administración</span>
            <span>›</span>
            <span className="text-slate-600 font-medium">Dashboard administrativo</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                Dashboard administrativo
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Supervisa la operación global, los acuerdos de servicio y la capacidad de soporte.
              </p>
            </div>

            <button className="flex items-center gap-2 bg-[#161B33] hover:bg-[#1E2544] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors self-start sm:self-auto">
              <Download className="w-4 h-4" />
              Exportar resumen
            </button>
          </div>

          {/* Barra de filtros rápidos y estado en vivo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <button className="flex items-center gap-2 bg-[#E8EEF5] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Hoy, 14 de mayo
              </button>

              <div className="relative">
                <select
                  value={filtroEquipo}
                  onChange={(e) => setFiltroEquipo(e.target.value)}
                  className="appearance-none bg-[#E8EEF5] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold pl-8 pr-4 py-2 rounded-lg focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="Todos los equipos">Todos los equipos</option>
                  <option value="Redes y VPN">Redes y VPN</option>
                  <option value="Sistemas y Licencias">Sistemas y Licencias</option>
                  <option value="Identidad y SSO">Identidad y SSO</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
              <span>En vivo · Última sinc.: 14:28:03</span>
            </div>
          </div>
        </div>

        {/* Tarjetas KPI (4 columnas) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Tickets activos</p>
              <p className="text-3xl font-bold text-[#0F172A] mt-2">24</p>
              <p className="text-xs text-slate-400 mt-2">6 sin asignar · 18 en gestión</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Cumplimiento SLA</p>
              <p className="text-3xl font-bold text-[#0F172A] mt-2">96,8 %</p>
              <p className="text-xs font-medium text-[#16A34A] mt-2">
                +2,1 pp vs. semana anterior
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
              <p className="text-3xl font-bold text-[#DC2626] mt-2">3</p>
              <p className="text-xs font-medium text-[#DC2626] mt-2">
                2 críticos · vencen en &lt; 1 h
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
              <p className="text-3xl font-bold text-[#0F172A] mt-2">18</p>
              <p className="text-xs font-medium text-[#16A34A] mt-2">
                +4 vs. promedio diario
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </section>

        {/* Banner de Alerta Crítica */}
        <section className="bg-[#FDF2F2] border border-[#FECACA] rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#B91C1C]">
                3 tickets requieren atención administrativa
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Hay 2 casos críticos en la operación. Identidad y SSO está al 100 % de capacidad.
              </p>
            </div>
          </div>

          <button className="flex items-center gap-1.5 bg-[#E2E8F0]/90 hover:bg-slate-300/80 text-slate-800 text-xs font-semibold px-4 py-2 rounded-lg transition-colors shrink-0 self-end sm:self-auto">
            <ArrowRight className="w-3.5 h-3.5" />
            Revisar asignaciones
          </button>
        </section>

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
                +12 % de demanda
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
                {/* Eje Y */}
                <div className="flex flex-col justify-between text-[11px] text-slate-400 py-1 select-none">
                  <span>40</span>
                  <span>30</span>
                  <span>20</span>
                  <span>10</span>
                </div>

                {/* Área de trazado */}
                <div className="flex-1">
                  <svg
                    viewBox={`0 0 ${anchoSvg} ${altoSvg}`}
                    className="w-full h-40 overflow-visible"
                  >
                    {/* Líneas guía horizontales */}
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

                    {/* Línea Tickets resueltos (Lavanda claro) */}
                    <polyline
                      fill="none"
                      stroke="#A5B4FC"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={calcularPuntos('resueltos')}
                    />

                    {/* Línea Tickets recibidos (Azul oscuro) */}
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
                    {DATOS_GRAFICA.map((d) => (
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
              <p className="text-xs text-slate-400 mt-0.5">3 pendientes de revisión</p>

              <div className="divide-y divide-slate-100 mt-5">
                {ALERTAS_OPERATIVAS.map((alerta) => {
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
                          {alerta.tipoIcono === 'capacidad' && (
                            <Users className="w-3.5 h-3.5" />
                          )}
                          {alerta.tipoIcono === 'sin_responsable' && (
                            <Inbox className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-800">{alerta.titulo}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {alerta.detalle}
                          </p>
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
                18 tickets asignados · 4 técnicos en turno · Capacidad máxima: 28
              </p>
            </div>

            <button className="flex items-center gap-2 bg-[#EEF2F6] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors self-start sm:self-auto">
              <Users className="w-3.5 h-3.5 text-slate-600" />
              Gestionar equipos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CARGA_EQUIPOS.map((eq) => (
              <div
                key={eq.id}
                className="bg-[#F4F7FB] rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">{eq.nombre}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{eq.responsables}</p>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
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
        </section>

        {/* Sección: Tickets prioritarios de la operación */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-bold text-[#0F172A]">
              Tickets prioritarios de la operación
            </h2>

            <button className="flex items-center gap-1.5 bg-[#EEF2F6] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors self-start sm:self-auto">
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
                {ticketsFiltrados.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#0F172A]">{ticket.id}</td>
                    <td className="py-3.5 px-4 text-slate-700">{ticket.asunto}</td>
                    <td className="py-3.5 px-4 text-slate-600">{ticket.equipo}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          ticket.prioridad === 'Crítica'
                            ? 'bg-[#FEE2E2] text-[#DC2626]'
                            : 'bg-[#E0E7FF] text-[#4338CA]'
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
                      {ticket.slaRestante}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-400">
            <p>Mostrando 3 de 24 tickets activos</p>

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
      </main>

      {/* Pie de página inferior */}
      <footer className="max-w-350 w-full mx-auto px-6 py-4 flex items-center justify-between text-[11px] text-slate-400">
        <span>Entorno de demostración · Datos de ejemplo</span>
        <span>14 may 2025 · 14:28 CEST</span>
      </footer>
    </div>
  );
}