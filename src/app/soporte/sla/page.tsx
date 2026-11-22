'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Bell,
  User,
  History,
  Tag,
  Pencil,
  ShieldCheck,
  Info,
  Save,
} from 'lucide-react';

// --- Interfaces ---
interface ObjetivoSLA {
  id: string;
  prioridad: string;
  varianteBadge: 'critica' | 'alta' | 'media' | 'baja';
  primeraRespuesta: string;
  resolucion: string;
  calendario: string;
  avisarAl: string;
}

interface PasoEscalamiento {
  numero: number;
  umbral: string;
  titulo: string;
  descripcion: string;
}

// --- Datos iniciales ---
const OBJETIVOS_INICIALES: ObjetivoSLA[] = [
  {
    id: 'p1',
    prioridad: 'P1 · Crítica',
    varianteBadge: 'critica',
    primeraRespuesta: '1 hora',
    resolucion: '4 horas',
    calendario: '24 × 7 · Continuo',
    avisarAl: '50 % del plazo',
  },
  {
    id: 'p2',
    prioridad: 'P2 · Alta',
    varianteBadge: 'alta',
    primeraRespuesta: '2 horas',
    resolucion: '8 horas',
    calendario: 'Horario laboral',
    avisarAl: '75 % del plazo',
  },
  {
    id: 'p3',
    prioridad: 'P3 · Media',
    varianteBadge: 'media',
    primeraRespuesta: '4 horas',
    resolucion: '24 horas',
    calendario: 'Horario laboral',
    avisarAl: '75 % del plazo',
  },
  {
    id: 'p4',
    prioridad: 'P4 · Baja',
    varianteBadge: 'baja',
    primeraRespuesta: '4 horas',
    resolucion: '24 horas',
    calendario: 'Horario laboral',
    avisarAl: '90 % del plazo',
  },
];

const PASOS_ESCALAMIENTO: PasoEscalamiento[] = [
  {
    numero: 1,
    umbral: 'Al alcanzar el umbral de aviso',
    titulo: 'Notificar al técnico asignado',
    descripcion: 'Correo y notificación interna · Según prioridad',
  },
  {
    numero: 2,
    umbral: 'Al consumir el 90 % del SLA',
    titulo: 'Escalar al supervisor del equipo',
    descripcion: 'Mantener responsable · Solicitar intervención',
  },
  {
    numero: 3,
    umbral: 'Al incumplir el SLA (100 %)',
    titulo: 'Alertar a la administración',
    descripcion: 'Marcar incumplimiento y registrar evento de auditoría',
  },
];

export default function ConfiguracionSLAPage() {
  // Estados de Política de servicio
  const [nombrePolitica, setNombrePolitica] = useState('Soporte corporativo');
  const [aplicarA, setAplicarA] = useState('Todos los equipos');
  const [zonaHoraria, setZonaHoraria] = useState('Europa / Madrid (CEST)');
  const [politicaActiva, setPoliticaActiva] = useState(true);

  // Estados de Objetivos por prioridad
  const [objetivos, setObjetivos] = useState<ObjetivoSLA[]>(OBJETIVOS_INICIALES);

  // Estados de Escalamiento y Calendario
  const [escalamientoActivo, setEscalamientoActivo] = useState(true);
  const [horarioLaboral, setHorarioLaboral] = useState('Lun–Vie · 09:00–18:00');
  const [pausarEnEspera, setPausarEnEspera] = useState(true);

  // Actualizar tiempos de respuesta o resolución
  const actualizarTiempo = (
    id: string,
    campo: 'primeraRespuesta' | 'resolucion',
    valor: string
  ) => {
    setObjetivos((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, [campo]: valor } : obj))
    );
  };

  // Estilos de badge según prioridad
  const obtenerEstiloBadge = (variante: ObjetivoSLA['varianteBadge']) => {
    switch (variante) {
      case 'critica':
        return 'bg-[#FEE2E2] text-[#DC2626]';
      case 'alta':
        return 'bg-[#E0E7FF] text-[#4338CA]';
      default:
        return 'bg-[#F1F5F9] text-slate-600';
    }
  };

  // Restablecer valores por defecto
  const descartarCambios = () => {
    setNombrePolitica('Soporte corporativo');
    setAplicarA('Todos los equipos');
    setZonaHoraria('Europa / Madrid (CEST)');
    setPoliticaActiva(true);
    setObjetivos(OBJETIVOS_INICIALES);
    setEscalamientoActivo(true);
    setHorarioLaboral('Lun–Vie · 09:00–18:00');
    setPausarEnEspera(true);
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
        {/* Breadcrumb y Encabezado */}
        <div>
          <nav className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
            <span>Administración</span>
            <span>›</span>
            <span className="text-slate-600 font-medium">Configuración de SLA</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                Configuración de SLA
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Define los compromisos de atención, los calendarios y las acciones de escalamiento.
              </p>
            </div>

            <button className="flex items-center gap-2 bg-[#EEF2F6] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors self-start sm:self-auto">
              <History className="w-4 h-4 text-slate-600" />
              Historial de versiones
            </button>
          </div>
        </div>

        {/* Sección 1: Política de servicio */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Política de servicio</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Política predeterminada para incidentes y solicitudes de soporte.
              </p>
            </div>

            <span className="bg-[#E0E7FF] text-[#4338CA] text-[11px] font-semibold px-3 py-1 rounded-full shrink-0">
              Versión 2.4 · Publicada
            </span>
          </div>

          {/* Inputs en 3 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nombre de la política
              </label>
              <input
                type="text"
                value={nombrePolitica}
                onChange={(e) => setNombrePolitica(e.target.value)}
                className="w-full bg-[#F1F5F9]/80 border border-transparent focus:border-indigo-300 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Aplicar a
              </label>
              <select
                value={aplicarA}
                onChange={(e) => setAplicarA(e.target.value)}
                className="w-full bg-[#F1F5F9]/80 border border-transparent focus:border-indigo-300 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none cursor-pointer transition-colors"
              >
                <option value="Todos los equipos">Todos los equipos</option>
                <option value="Redes y VPN">Redes y VPN</option>
                <option value="Sistemas y Licencias">Sistemas y Licencias</option>
                <option value="Identidad y SSO">Identidad y SSO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Zona horaria
              </label>
              <select
                value={zonaHoraria}
                onChange={(e) => setZonaHoraria(e.target.value)}
                className="w-full bg-[#F1F5F9]/80 border border-transparent focus:border-indigo-300 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none cursor-pointer transition-colors"
              >
                <option value="Europa / Madrid (CEST)">Europa / Madrid (CEST)</option>
                <option value="América / México (CST)">América / México (CST)</option>
                <option value="UTC (Tiempo Universal)">UTC (Tiempo Universal)</option>
              </select>
            </div>
          </div>

          {/* Footer de Política */}
          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={politicaActiva}
                onClick={() => setPoliticaActiva(!politicaActiva)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  politicaActiva ? 'bg-[#3B426E]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    politicaActiva ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs font-semibold text-slate-700">Política activa</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Última publicación: 13 may 2025, 16:40 · Ana Martínez
            </p>
          </div>
        </section>

        {/* Sección 2: Objetivos por prioridad */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Objetivos por prioridad</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                El tiempo comienza al crear el ticket. Los plazos se calculan según el calendario indicado.
              </p>
            </div>
            <Tag className="w-4 h-4 text-[#4F46E5] mt-1" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-y border-slate-100">
                  <th className="py-3 px-4 rounded-l-lg">Prioridad</th>
                  <th className="py-3 px-4">Primera respuesta</th>
                  <th className="py-3 px-4">Resolución</th>
                  <th className="py-3 px-4">Calendario</th>
                  <th className="py-3 px-4">Avisar al</th>
                  <th className="py-3 px-4 text-right rounded-r-lg">Editar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {objetivos.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${obtenerEstiloBadge(
                          item.varianteBadge
                        )}`}
                      >
                        {item.prioridad}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <input
                        type="text"
                        value={item.primeraRespuesta}
                        onChange={(e) =>
                          actualizarTiempo(item.id, 'primeraRespuesta', e.target.value)
                        }
                        className="w-32 bg-[#F1F5F9]/80 border border-transparent focus:border-indigo-300 focus:bg-white rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none transition-colors"
                      />
                    </td>

                    <td className="py-3.5 px-4">
                      <input
                        type="text"
                        value={item.resolucion}
                        onChange={(e) =>
                          actualizarTiempo(item.id, 'resolucion', e.target.value)
                        }
                        className="w-32 bg-[#F1F5F9]/80 border border-transparent focus:border-indigo-300 focus:bg-white rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none transition-colors"
                      />
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">{item.calendario}</td>

                    <td className="py-3.5 px-4 text-slate-500">{item.avisarAl}</td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        title={`Editar ${item.prioridad}`}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sección 3: Escalamiento automático + Calendario y pausas */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Escalamiento automático */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">
                  Escalamiento automático
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Acciones sobre el objetivo de resolución.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={escalamientoActivo}
                onClick={() => setEscalamientoActivo(!escalamientoActivo)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-1 ${
                  escalamientoActivo ? 'bg-[#3B426E]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    escalamientoActivo ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div
              className={`divide-y divide-slate-100 transition-opacity ${
                escalamientoActivo ? 'opacity-100' : 'opacity-50 pointer-events-none'
              }`}
            >
              {PASOS_ESCALAMIENTO.map((paso) => (
                <div
                  key={paso.numero}
                  className="py-4 first:pt-1 last:pb-1 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-6 h-6 rounded-full bg-[#E0E7FF] text-[#4338CA] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {paso.numero}
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {paso.umbral}
                      </p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {paso.titulo}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {paso.descripcion}
                      </p>
                    </div>
                  </div>

                  <button
                    title={`Editar regla ${paso.numero}`}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Calendario y pausas */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Calendario y pausas</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reglas de cómputo del servicio.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Horario laboral
                </label>
                <select
                  value={horarioLaboral}
                  onChange={(e) => setHorarioLaboral(e.target.value)}
                  className="w-full bg-[#F1F5F9]/80 border border-transparent focus:border-indigo-300 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="Lun–Vie · 09:00–18:00">Lun–Vie · 09:00–18:00</option>
                  <option value="Lun–Vie · 08:00–17:00">Lun–Vie · 08:00–17:00</option>
                  <option value="24 × 7 · Soporte continuo">24 × 7 · Soporte continuo</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-slate-700">
                  Festivos de España
                </span>
                <button className="flex items-center gap-1.5 bg-[#EEF2F6] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  <Pencil className="w-3 h-3" />
                  Editar
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Pausar en espera del usuario
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    No aplica a incidentes críticos P1.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={pausarEnEspera}
                  onClick={() => setPausarEnEspera(!pausarEnEspera)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    pausarEnEspera ? 'bg-[#3B426E]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      pausarEnEspera ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#4F46E5] font-medium pt-2">
              P1 se atiende 24 × 7, incluidos fines de semana y festivos.
            </p>
          </div>
        </section>

        {/* Banner de Auditoría */}
        <section className="bg-[#EEF2F8] border border-indigo-100/80 rounded-2xl px-5 py-4 flex items-start sm:items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-white text-[#4338CA] flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#0F172A]">
              Los cambios se aplicarán a nuevos tickets
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Los tickets abiertos conservarán la versión de SLA con la que fueron creados. La publicación quedará auditada.
            </p>
          </div>
        </section>

        {/* Barra de acción inferior (Cambios pendientes) */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-xs px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Cambios pendientes de publicación</span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={descartarCambios}
              className="bg-[#EEF2F6] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={() => alert('Nueva versión de SLA publicada correctamente.')}
              className="flex items-center gap-1.5 bg-[#161B33] hover:bg-[#1E2544] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Publicar cambios
            </button>
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