'use client';

import React, { useState } from 'react';
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
  Shield,
  ChevronRight,
  ChevronLeft,
  Save,
} from 'lucide-react';

// --- Datos de ejemplo ---
interface Usuario {
  id: string;
  iniciales: string;
  nombre: string;
  correo: string;
  rol: 'Administrador' | 'Técnico' | 'Solicitante' | 'Supervisor';
  equipo: string;
  estado: 'Activo' | 'Invitado' | 'Inactivo';
  acceso: string;
}

interface RolConfig {
  id: string;
  nombre: string;
  subtitulo: string;
  esPersonalizado: boolean;
  ambito: string;
  permisos: {
    gestionarTickets: boolean;
    asignarTecnicos: boolean;
    consultarReportes: boolean;
    administrarUsuarios: boolean;
  };
}

const USUARIOS_INICIALES: Usuario[] = [
  {
    id: '1',
    iniciales: 'AM',
    nombre: 'Ana Martínez',
    correo: 'ana.martinez@empresa.test',
    rol: 'Administrador',
    equipo: 'Administración',
    estado: 'Activo',
    acceso: 'Hoy, 14:20',
  },
  {
    id: '2',
    iniciales: 'CM',
    nombre: 'Carlos Mendoza',
    correo: 'carlos.mendoza@empresa.test',
    rol: 'Técnico',
    equipo: 'Redes y VPN',
    estado: 'Activo',
    acceso: 'Hoy, 14:18',
  },
  {
    id: '3',
    iniciales: 'LG',
    nombre: 'Laura Gómez',
    correo: 'laura.gomez@empresa.test',
    rol: 'Técnico',
    equipo: 'Sistemas y Licencias',
    estado: 'Activo',
    acceso: 'Hoy, 13:55',
  },
  {
    id: '4',
    iniciales: 'DR',
    nombre: 'David Ruiz',
    correo: 'david.ruiz@empresa.test',
    rol: 'Técnico',
    equipo: 'Identidad y SSO',
    estado: 'Activo',
    acceso: 'Hoy, 12:42',
  },
  {
    id: '5',
    iniciales: 'EM',
    nombre: 'Elena Morales',
    correo: 'elena.morales@empresa.test',
    rol: 'Solicitante',
    equipo: 'Marketing',
    estado: 'Activo',
    acceso: 'Hoy, 09:14',
  },
  {
    id: '6',
    iniciales: 'MP',
    nombre: 'Marcos Peña',
    correo: 'marcos.pena@empresa.test',
    rol: 'Solicitante',
    equipo: 'Finanzas',
    estado: 'Invitado',
    acceso: 'Sin acceso',
  },
];

const ROLES_INICIALES: RolConfig[] = [
  {
    id: 'admin',
    nombre: 'Administrador',
    subtitulo: '2 usuarios · Acceso completo',
    esPersonalizado: false,
    ambito: 'Global (Todos los equipos)',
    permisos: {
      gestionarTickets: true,
      asignarTecnicos: true,
      consultarReportes: true,
      administrarUsuarios: true,
    },
  },
  {
    id: 'supervisor',
    nombre: 'Supervisor',
    subtitulo: '3 usuarios · Gestión de equipos',
    esPersonalizado: true,
    ambito: 'Equipos asignados',
    permisos: {
      gestionarTickets: true,
      asignarTecnicos: true,
      consultarReportes: true,
      administrarUsuarios: false,
    },
  },
  {
    id: 'tecnico',
    nombre: 'Técnico',
    subtitulo: '8 usuarios · Atención de tickets',
    esPersonalizado: false,
    ambito: 'Tickets asignados',
    permisos: {
      gestionarTickets: true,
      asignarTecnicos: false,
      consultarReportes: false,
      administrarUsuarios: false,
    },
  },
  {
    id: 'solicitante',
    nombre: 'Solicitante',
    subtitulo: '35 usuarios · Autoservicio',
    esPersonalizado: false,
    ambito: 'Solo tickets propios',
    permisos: {
      gestionarTickets: false,
      asignarTecnicos: false,
      consultarReportes: false,
      administrarUsuarios: false,
    },
  },
];

export default function UsuariosYRolesPage() {
  // Estados para filtros del directorio
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [paginaActual, setPaginaActual] = useState(1);

  // Estados para la sección de edición de roles
  const [roles, setRoles] = useState<RolConfig[]>(ROLES_INICIALES);
  const [rolSeleccionadoId, setRolSeleccionadoId] = useState<string>('supervisor');

  const rolActivo = roles.find((r) => r.id === rolSeleccionadoId) || roles[1];

  // Filtrado de usuarios
  const usuariosFiltrados = USUARIOS_INICIALES.filter((u) => {
    const coincideTexto =
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideRol = filtroRol === 'Todos' || u.rol === filtroRol;
    const coincideEstado = filtroEstado === 'Todos' || u.estado === filtroEstado;
    return coincideTexto && coincideRol && coincideEstado;
  });

  // Manejadores para editar el rol activo
  const actualizarNombreRol = (nuevoNombre: string) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === rolActivo.id ? { ...r, nombre: nuevoNombre } : r))
    );
  };

  const actualizarAmbitoRol = (nuevoAmbito: string) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === rolActivo.id ? { ...r, ambito: nuevoAmbito } : r))
    );
  };

  const togglePermiso = (clave: keyof RolConfig['permisos']) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === rolActivo.id
          ? {
              ...r,
              permisos: {
                ...r.permisos,
                [clave]: !r.permisos[clave],
              },
            }
          : r
      )
    );
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
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6 space-y-6">
        {/* Breadcrumb y Encabezado */}
        <div>
          <nav className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
            <span>Administración</span>
            <span>›</span>
            <span className="text-slate-600 font-medium">Usuarios y roles</span>
          </nav>

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
              <button className="flex items-center gap-2 bg-[#EEF2F6] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors">
                <Upload className="w-4 h-4 text-slate-600" />
                Importar
              </button>
              <button className="flex items-center gap-2 bg-[#161B33] hover:bg-[#1E2544] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors">
                <Plus className="w-4 h-4" />
                Invitar usuario
              </button>
            </div>
          </div>
        </div>

        {/* Tarjetas KPI (4 columnas) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Usuarios registrados</p>
              <p className="text-3xl font-bold text-[#0F172A] mt-2">48</p>
              <p className="text-xs text-slate-400 mt-2">4 perfiles de acceso</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Usuarios activos</p>
              <p className="text-3xl font-bold text-[#0F172A] mt-2">44</p>
              <p className="text-xs text-slate-400 mt-2">Acceso habilitado al sistema</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Invitaciones pendientes</p>
              <p className="text-3xl font-bold text-[#0F172A] mt-2">3</p>
              <p className="text-xs text-slate-400 mt-2">Caducan a los 7 días</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Usuarios inactivos</p>
              <p className="text-3xl font-bold text-[#0F172A] mt-2">1</p>
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
              48 usuarios
            </span>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o correo..."
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
                <option value="Supervisor">Rol: Supervisor</option>
                <option value="Técnico">Rol: Técnico</option>
                <option value="Solicitante">Rol: Solicitante</option>
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

              <button className="flex items-center gap-2 bg-[#EEF2F6] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Más filtros
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
                  <th className="py-3 px-4">Equipo / Área</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Acceso</th>
                  <th className="py-3 px-4 text-right rounded-r-lg">Editar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {usuariosFiltrados.map((usuario) => (
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
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          usuario.rol === 'Administrador'
                            ? 'bg-[#E0E7FF] text-[#4338CA]'
                            : 'bg-[#F1F5F9] text-slate-600'
                        }`}
                      >
                        {usuario.rol}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">{usuario.equipo}</td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          usuario.estado === 'Activo'
                            ? 'bg-[#DCFCE7] text-[#15803D]'
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-400">
            <p>Mostrando 1–6 de 48 usuarios · 10 por página</p>

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

        {/* Sección Inferior: Roles de acceso + Editar rol */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Lista de Roles */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A]">Roles de acceso</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Selecciona un rol para revisar sus permisos.
                  </p>
                </div>
                <Shield className="w-4 h-4 text-[#4F46E5] mt-1" />
              </div>

              <div className="space-y-2.5">
                {roles.map((rol) => {
                  const seleccionado = rol.id === rolActivo.id;
                  return (
                    <button
                      key={rol.id}
                      onClick={() => setRolSeleccionadoId(rol.id)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center justify-between transition-all ${
                        seleccionado
                          ? 'bg-[#E0E7FF]/80 ring-1 ring-indigo-300/60'
                          : 'bg-[#F8FAFC] hover:bg-slate-100/80'
                      }`}
                    >
                      <div>
                        <p
                          className={`text-xs font-bold ${
                            seleccionado ? 'text-[#3730A3]' : 'text-slate-800'
                          }`}
                        >
                          {rol.nombre}
                        </p>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            seleccionado ? 'text-indigo-600/80' : 'text-slate-400'
                          }`}
                        >
                          {rol.subtitulo}
                        </p>
                      </div>

                      {seleccionado ? (
                        <Pencil className="w-3.5 h-3.5 text-[#4338CA]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Formulario de Edición de Rol */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A]">
                    Editar rol: {rolActivo.nombre}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Permisos aplicados a los usuarios de este perfil.
                  </p>
                </div>
                {rolActivo.esPersonalizado && (
                  <span className="bg-[#E0E7FF] text-[#4338CA] text-[11px] font-semibold px-3 py-1 rounded-full">
                    Personalizado
                  </span>
                )}
              </div>

              {/* Inputs Nombre y Ámbito */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nombre del rol
                  </label>
                  <input
                    type="text"
                    value={rolActivo.nombre}
                    onChange={(e) => actualizarNombreRol(e.target.value)}
                    className="w-full bg-[#F1F5F9]/80 border border-transparent focus:border-indigo-300 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ámbito de acceso
                  </label>
                  <select
                    value={rolActivo.ambito}
                    onChange={(e) => actualizarAmbitoRol(e.target.value)}
                    className="w-full bg-[#F1F5F9]/80 border border-transparent focus:border-indigo-300 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none cursor-pointer transition-colors"
                  >
                    <option value="Equipos asignados">Equipos asignados</option>
                    <option value="Global (Todos los equipos)">Global (Todos los equipos)</option>
                    <option value="Tickets asignados">Tickets asignados</option>
                    <option value="Solo tickets propios">Solo tickets propios</option>
                  </select>
                </div>
              </div>

              {/* Lista de Switches de Permisos */}
              <div className="divide-y divide-slate-100 mt-5">
                {[
                  {
                    key: 'gestionarTickets' as const,
                    label: 'Gestionar tickets de sus equipos',
                  },
                  {
                    key: 'asignarTecnicos' as const,
                    label: 'Asignar técnicos y balancear carga',
                  },
                  {
                    key: 'consultarReportes' as const,
                    label: 'Consultar y exportar reportes',
                  },
                  {
                    key: 'administrarUsuarios' as const,
                    label: 'Administrar usuarios y políticas de SLA',
                  },
                ].map((item) => {
                  const activo = rolActivo.permisos[item.key];
                  return (
                    <div
                      key={item.key}
                      className="py-3.5 flex items-center justify-between gap-4"
                    >
                      <span className="text-xs font-medium text-slate-700">
                        {item.label}
                      </span>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={activo}
                        onClick={() => togglePermiso(item.key)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          activo ? 'bg-[#3B426E]' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            activo ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer de la tarjeta de edición */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[11px] text-slate-400">
                Los cambios se registran en auditoría.
              </p>

              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setRoles(ROLES_INICIALES)}
                  className="bg-[#EEF2F6] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => alert(`Rol "${rolActivo.nombre}" guardado correctamente.`)}
                  className="flex items-center gap-1.5 bg-[#161B33] hover:bg-[#1E2544] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar rol
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Pie de página inferior */}
      <footer className="max-w-[1400px] w-full mx-auto px-6 py-4 flex items-center justify-between text-[11px] text-slate-400">
        <span>Entorno de demostración · Datos de ejemplo</span>
        <span>14 may 2026 · 14:28 CEST</span>
      </footer>
    </div>
  );
}