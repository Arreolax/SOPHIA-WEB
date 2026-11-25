'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Bell,
  User,
  Upload,
  Plus,
  Users,
  UserCheck,
  Mail,
  UserX,
  SlidersHorizontal,
  Pencil,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';

interface Usuario {
  id: string;
  iniciales: string;
  nombre: string;
  username: string;
  correo: string;
  rol: 'Administrador' | 'Técnico' | 'Usuario';
  statusBoolean: boolean;
  estado: 'Activo' | 'Invitado' | 'Inactivo';
  acceso: string;
}

const ITEMS_POR_PAGINA = 10;

export default function UsuariosYRolesPage() {
  // Estados de datos desde la API
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Estados para filtros del directorio
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    let cancelado = false;

    async function cargarUsuarios() {
      try {
        setCargando(true);
        setErrorCarga(null);

        const res = await fetch('/api/users', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'No se pudieron cargar los usuarios.');
        }

        if (!cancelado) {
          setUsuarios(Array.isArray(data.usuarios) ? data.usuarios : []);
        }
      } catch (err) {
        if (!cancelado) {
          setErrorCarga(
            err instanceof Error ? err.message : 'Error al conectar con el servidor.',
          );
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargarUsuarios();
    return () => {
      cancelado = true;
    };
  }, []);

  // Reiniciar a página 1 cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroRol, filtroEstado]);

  // Métricas KPI dinámicas
  const kpis = useMemo(() => {
    const total = usuarios.length;
    const activos = usuarios.filter((u) => u.estado === 'Activo').length;
    const invitados = usuarios.filter((u) => u.estado === 'Invitado').length;
    const inactivos = usuarios.filter((u) => u.estado === 'Inactivo').length;
    return { total, activos, invitados, inactivos };
  }, [usuarios]);

  // Filtrado de usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const coincideTexto =
        u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.username.toLowerCase().includes(busqueda.toLowerCase());
      const coincideRol = filtroRol === 'Todos' || u.rol === filtroRol;
      const coincideEstado = filtroEstado === 'Todos' || u.estado === filtroEstado;
      return coincideTexto && coincideRol && coincideEstado;
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  // Cálculo de paginación real
  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / ITEMS_POR_PAGINA));
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const usuariosPaginados = usuariosFiltrados.slice(
    indiceInicio,
    indiceInicio + ITEMS_POR_PAGINA,
  );

  const mostrandoDesde = usuariosFiltrados.length === 0 ? 0 : indiceInicio + 1;
  const mostrandoHasta = Math.min(
    indiceInicio + ITEMS_POR_PAGINA,
    usuariosFiltrados.length,
  );

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
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-350 w-full mx-auto px-6 py-6 space-y-6">
        {/* Breadcrumb y Encabezado */}
        <div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                Usuarios y roles
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Administra el acceso a la plataforma y los permisos de cada perfil.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-[#161B33] hover:bg-[#1E2544] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors">
                <Plus className="w-4 h-4" />
                Crear usuario
              </button>
            </div>
          </div>
        </div>

        {/* Alerta de error si falla la API */}
        {errorCarga && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorCarga}</span>
          </div>
        )}

        {/* Tarjetas KPI (4 columnas) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Usuarios registrados</p>
              {cargando ? (
                <div className="h-8 w-14 bg-slate-200 animate-pulse rounded mt-2" />
              ) : (
                <p className="text-3xl font-bold text-[#0F172A] mt-2">{kpis.total}</p>
              )}
              <p className="text-xs text-slate-400 mt-2">3 perfiles de acceso</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Usuarios activos</p>
              {cargando ? (
                <div className="h-8 w-14 bg-slate-200 animate-pulse rounded mt-2" />
              ) : (
                <p className="text-3xl font-bold text-[#0F172A] mt-2">{kpis.activos}</p>
              )}
              <p className="text-xs text-slate-400 mt-2">Acceso habilitado al sistema</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Usuarios inactivos</p>
              {cargando ? (
                <div className="h-8 w-14 bg-slate-200 animate-pulse rounded mt-2" />
              ) : (
                <p className="text-3xl font-bold text-[#0F172A] mt-2">{kpis.inactivos}</p>
              )}
              <p className="text-xs text-slate-400 mt-2">Acceso suspendido</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
        </section>

        {/* Directorio de usuarios */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Directorio de usuarios</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gestiona cuentas, estados y roles asignados.
              </p>
            </div>
            <span className="bg-[#EEF2F6] text-slate-600 text-xs font-semibold px-3 py-1 rounded-full">
              {usuariosFiltrados.length}{' '}
              {usuariosFiltrados.length === 1 ? 'usuario' : 'usuarios'}
            </span>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, correo o equipo..."
                className="w-full bg-[#F1F5F9]/70 border border-transparent focus:border-indigo-300 focus:bg-white rounded-lg px-4 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                className="bg-[#F1F5F9]/70 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg border border-transparent focus:border-indigo-300 focus:outline-none cursor-pointer"
              >
                <option value="Todos">Rol: Todos</option>
                <option value="Administrador">Rol: Administrador</option>
                <option value="Técnico">Rol: Técnico</option>
                <option value="Usuario">Rol: Usuario</option>
              </select>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="bg-[#F1F5F9]/70 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg border border-transparent focus:border-indigo-300 focus:outline-none cursor-pointer"
              >
                <option value="Todos">Estado: Todos</option>
                <option value="Activo">Estado: Activo</option>
                <option value="Invitado">Estado: Invitado</option>
                <option value="Inactivo">Estado: Inactivo</option>
              </select>

              <button
                onClick={() => {
                  setBusqueda('');
                  setFiltroRol('Todos');
                  setFiltroEstado('Todos');
                }}
                className="flex items-center gap-2 bg-[#EEF2F6] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Limpiar filtros
              </button>
            </div>
          </div>

          {/* Tabla de usuarios */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-y border-slate-100">
                  <th className="py-3 px-4 rounded-l-lg">Usuario</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Acceso</th>
                  <th className="py-3 px-4 text-right rounded-r-lg">Editar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {cargando ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-32 bg-slate-200 animate-pulse rounded" />
                            <div className="h-2.5 w-44 bg-slate-100 animate-pulse rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-5 w-20 bg-slate-200 animate-pulse rounded-full" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-3.5 w-24 bg-slate-200 animate-pulse rounded" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-5 w-16 bg-slate-200 animate-pulse rounded-full" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-3.5 w-20 bg-slate-200 animate-pulse rounded" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="h-6 w-6 bg-slate-200 animate-pulse rounded-lg ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : usuariosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No se encontraron usuarios con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  usuariosPaginados.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E0E7FF] text-[#4338CA] font-bold text-[11px] flex items-center justify-center shrink-0">
                            {usuario.iniciales}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{usuario.nombre}</p>
                            <p className="text-[11px] text-slate-400">{usuario.correo}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${usuario.rol === 'Administrador'
                              ? 'bg-green-400/30 text-black'
                              : usuario.rol === 'Técnico'
                                ? 'bg-yellow-400/30 text-black'
                                : 'bg-blue-400/30 text-black'
                            }`}
                        >
                          {usuario.rol}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {usuario.username || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${usuario.estado === 'Activo'
                              ? 'bg-[#DCFCE7] text-[#15803D]'
                              : usuario.estado === 'Inactivo'
                                ? 'bg-[#FEE2E2] text-[#B91C1C]'
                                : 'bg-[#FEF3C7] text-[#B45309]'
                            }`}
                        >
                          {usuario.estado}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">{usuario.acceso}</td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          title={`Editar a ${usuario.nombre}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
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
              Mostrando {mostrandoDesde}–{mostrandoHasta} de {usuariosFiltrados.length}{' '}
              usuarios · {ITEMS_POR_PAGINA} por página
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="w-7 h-7 rounded-lg bg-[#F1F5F9] hover:bg-slate-200 disabled:opacity-40 text-slate-600 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPaginas }).map((_, idx) => {
                const numPagina = idx + 1;
                return (
                  <button
                    key={numPagina}
                    onClick={() => setPaginaActual(numPagina)}
                    className={`w-7 h-7 rounded-lg font-semibold flex items-center justify-center transition-colors ${paginaActual === numPagina
                        ? 'bg-[#161B33] text-white'
                        : 'bg-[#F1F5F9] text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {numPagina}
                  </button>
                );
              })}

              <button
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="w-7 h-7 rounded-lg bg-[#F1F5F9] hover:bg-slate-200 disabled:opacity-40 text-slate-600 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}