'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  Bell,
  User,
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
  AtSign,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Phone,
  RotateCcw,
  Shield,
  Power,
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

type FormularioUsuario = {
  nombre: string;
  username: string;
  correo: string;
  telefono: string;
  rol: Usuario['rol'];
  password: string;
  confirmarPassword: string;
};

type ErroresFormulario = Partial<Record<keyof FormularioUsuario, string>>;

type ErroresEdicion = {
  nombre?: string;
  username?: string;
};

const FORMULARIO_INICIAL: FormularioUsuario = {
  nombre: '',
  username: '',
  correo: '',
  telefono: '',
  rol: 'Usuario',
  password: '',
  confirmarPassword: '',
};

const ITEMS_POR_PAGINA = 10;

export default function UsuariosYRolesPage() {
  // Estados de datos desde la API
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Estados para filtros del directorio
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [paginaActual, setPaginaActual] = useState(1);

  // Estados para modal de creación
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [formularioUsuario, setFormularioUsuario] =
    useState<FormularioUsuario>(FORMULARIO_INICIAL);
  const [erroresFormulario, setErroresFormulario] = useState<ErroresFormulario>({});
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [errorCreacion, setErrorCreacion] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estados para modal de edición
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<Usuario | null>(null);
  const [nombreEdicion, setNombreEdicion] = useState('');
  const [usernameEdicion, setUsernameEdicion] = useState('');
  const [rolSeleccionado, setRolSeleccionado] =
    useState<Usuario['rol']>('Usuario');
  const [usuarioActivo, setUsuarioActivo] = useState(false);
  const [erroresEdicion, setErroresEdicion] = useState<ErroresEdicion>({});
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

  const cerrarModalCrear = useCallback(() => {
    if (creandoUsuario) return;
    setModalCrearAbierto(false);
    setFormularioUsuario(FORMULARIO_INICIAL);
    setErroresFormulario({});
    setErrorCreacion(null);
    setMostrarPassword(false);
    setMostrarConfirmacion(false);
  }, [creandoUsuario]);

  useEffect(() => {
    if (!modalCrearAbierto) return;

    const manejarEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cerrarModalCrear();
    };

    window.addEventListener('keydown', manejarEscape);
    return () => window.removeEventListener('keydown', manejarEscape);
  }, [modalCrearAbierto, cerrarModalCrear]);

  const cambiarCampo = <K extends keyof FormularioUsuario>(
    campo: K,
    valor: FormularioUsuario[K],
  ) => {
    setFormularioUsuario((actual) => ({ ...actual, [campo]: valor }));
    setErroresFormulario((actual) => ({
      ...actual,
      [campo]: undefined,
      ...(campo === 'password' ? { confirmarPassword: undefined } : {}),
    }));
    setErrorCreacion(null);
  };

  const abrirModalEdicion = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setNombreEdicion(usuario.nombre);
    setUsernameEdicion(usuario.username.replace(/^@/, ''));
    setRolSeleccionado(usuario.rol);
    setUsuarioActivo(usuario.statusBoolean);
    setErroresEdicion({});
    setErrorEdicion(null);
    setMensajeExito(null);
  };

  const cerrarModalEdicion = useCallback(() => {
    if (guardandoEdicion) return;
    setUsuarioSeleccionado(null);
    setErroresEdicion({});
    setErrorEdicion(null);
  }, [guardandoEdicion]);

  useEffect(() => {
    if (!usuarioSeleccionado) return;

    const manejarEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cerrarModalEdicion();
    };

    window.addEventListener('keydown', manejarEscape);
    return () => window.removeEventListener('keydown', manejarEscape);
  }, [usuarioSeleccionado, cerrarModalEdicion]);

  const guardarEdicionUsuario = async () => {
    if (!usuarioSeleccionado || guardandoEdicion) return;

    setErrorEdicion(null);

    const nombreLimpio = nombreEdicion.trim();
    const usernameLimpio = usernameEdicion.replace(/^@/, '').trim();
    const errores: ErroresEdicion = {};

    if (!/^[a-zA-ZÁÉÍÓÚáéíóúÑñÜü\s]{2,50}$/.test(nombreLimpio)) {
      errores.nombre = 'Ingresa un nombre válido (de 2 a 50 caracteres).';
    }
    if (!/^[a-zA-Z0-9._]{3,20}$/.test(usernameLimpio)) {
      errores.username = 'Usa de 3 a 20 caracteres: letras, números, punto o _.';
    }

    setErroresEdicion(errores);
    if (Object.keys(errores).length > 0) return;

    setGuardandoEdicion(true);

    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: usuarioSeleccionado.id,
          name: nombreLimpio,
          username: usernameLimpio,
          role: rolSeleccionado,
          status: usuarioActivo,
        }),
      });

      const data: { error?: string; campo?: string; usuario?: Usuario } =
        await response.json();

      if (!response.ok) {
        if (data.campo === 'username' && data.error) {
          setErroresEdicion((actual) => ({ ...actual, username: data.error }));
        }
        if (data.campo === 'name' && data.error) {
          setErroresEdicion((actual) => ({ ...actual, nombre: data.error }));
        }
        throw new Error(data.error || 'No se pudieron guardar los cambios.');
      }

      const usuarioActualizado = data.usuario;
      if (!usuarioActualizado) {
        throw new Error('El servidor no devolvió los datos actualizados.');
      }

      setUsuarios((actuales) =>
        actuales.map((u) =>
          u.id === usuarioActualizado.id ? usuarioActualizado : u,
        ),
      );
      setUsuarioSeleccionado(null);
      setErroresEdicion({});
      setErrorEdicion(null);
      setMensajeExito(
        `Usuario ${usuarioActualizado.nombre} actualizado correctamente.`,
      );
    } catch (err) {
      setErrorEdicion(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al actualizar el usuario.',
      );
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const enviarFormularioUsuario = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setErrorCreacion(null);

    const nombre = formularioUsuario.nombre.trim();
    const username = formularioUsuario.username.replace(/^@/, '').trim();
    const correo = formularioUsuario.correo.trim();
    const telefono = formularioUsuario.telefono.trim();
    const digitosTelefono = telefono.replace(/\D/g, '');
    const password = formularioUsuario.password;
    const rol = formularioUsuario.rol;
    const errores: ErroresFormulario = {};

    if (!/^[a-zA-ZÁÉÍÓÚáéíóúÑñÜü\s]{2,50}$/.test(nombre)) {
      errores.nombre = 'Ingresa un nombre válido (de 2 a 50 caracteres).';
    }
    if (!/^[a-zA-Z0-9._]{3,20}$/.test(username)) {
      errores.username = 'Usa de 3 a 20 caracteres: letras, números, punto o _.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(correo)) {
      errores.correo = 'Ingresa un correo electrónico válido.';
    }
    if (
      !/^\+?[\d\s\-()]{10,18}$/.test(telefono) ||
      digitosTelefono.length < 10 ||
      digitosTelefono.length > 15
    ) {
      errores.telefono = 'Ingresa un teléfono válido (10 a 15 dígitos).';
    }
    if (!['Administrador', 'Técnico', 'Usuario'].includes(rol)) {
      errores.rol = 'Selecciona un rol válido.';
    }
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      errores.password = 'La contraseña debe cumplir todos los requisitos.';
    }
    if (password !== formularioUsuario.confirmarPassword) {
      errores.confirmarPassword = 'Las contraseñas no coinciden.';
    }

    setErroresFormulario(errores);
    if (Object.keys(errores).length > 0) return;

    setCreandoUsuario(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nombre,
          username,
          email: correo,
          phone: telefono,
          role: rol,
          password,
        }),
      });
      const data: { error?: string; campo?: string; usuario?: Usuario } =
        await response.json();

      if (!response.ok) {
        if (
          (data.campo === 'username' || data.campo === 'email') &&
          data.error
        ) {
          setErroresFormulario((actual) => ({
            ...actual,
            [data.campo === 'username' ? 'username' : 'correo']: data.error,
          }));
        }
        throw new Error(data.error || 'No se pudo crear el usuario.');
      }

      const usuarioCreado = data.usuario;
      if (!usuarioCreado) {
        throw new Error('El servidor no devolvió los datos del usuario creado.');
      }

      setUsuarios((actuales) => [usuarioCreado, ...actuales]);
      setPaginaActual(1);
      setBusqueda('');
      setFiltroRol('Todos');
      setFiltroEstado('Todos');
      setFormularioUsuario(FORMULARIO_INICIAL);
      setErroresFormulario({});
      setMostrarPassword(false);
      setMostrarConfirmacion(false);
      setModalCrearAbierto(false);
      setMensajeExito('Usuario creado correctamente.');
    } catch (err) {
      setErrorCreacion(
        err instanceof Error ? err.message : 'Ocurrió un error al crear el usuario.',
      );
    } finally {
      setCreandoUsuario(false);
    }
  };

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
          setCurrentUserId(
            typeof data.currentUserId === 'string' ? data.currentUserId : null,
          );
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

  const esMismoUsuarioEdicion =
    Boolean(usuarioSeleccionado) && usuarioSeleccionado?.id === currentUserId;
  const hayCambiosEdicion =
    Boolean(usuarioSeleccionado) &&
    (nombreEdicion.trim() !== usuarioSeleccionado?.nombre ||
      usernameEdicion.replace(/^@/, '').trim() !==
        (usuarioSeleccionado?.username || '').replace(/^@/, '') ||
      rolSeleccionado !== usuarioSeleccionado?.rol ||
      usuarioActivo !== usuarioSeleccionado?.statusBoolean);

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-800 flex flex-col">
      {/* Barra Superior (Topbar) */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
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
        {/* Encabezado */}
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
              <button
                type="button"
                onClick={() => {
                  setFormularioUsuario(FORMULARIO_INICIAL);
                  setErroresFormulario({});
                  setErrorCreacion(null);
                  setMensajeExito(null);
                  setMostrarPassword(false);
                  setMostrarConfirmacion(false);
                  setModalCrearAbierto(true);
                }}
                className="flex items-center gap-2 bg-[#161B33] hover:bg-[#1E2544] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Crear usuario
              </button>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {errorCarga && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorCarga}</span>
          </div>
        )}
        {mensajeExito && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Tarjetas KPI */}
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
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            usuario.rol === 'Administrador'
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
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            usuario.estado === 'Activo'
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
                          type="button"
                          title={`Editar a ${usuario.nombre}`}
                          aria-label={`Editar a ${usuario.nombre}`}
                          onClick={() => abrirModalEdicion(usuario)}
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
                    className={`w-7 h-7 rounded-lg font-semibold flex items-center justify-center transition-colors ${
                      paginaActual === numPagina
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

      {/* Modal Crear Usuario */}
      {modalCrearAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={cerrarModalCrear}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="crear-usuario-titulo"
            aria-describedby="crear-usuario-descripcion"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="sticky top-0 z-10 border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h2
                  id="crear-usuario-titulo"
                  className="text-lg font-bold text-[#0F172A]"
                >
                  Crear usuario
                </h2>
                <p
                  id="crear-usuario-descripcion"
                  className="mt-1 text-xs text-slate-500"
                >
                  Completa los datos para registrar una nueva cuenta.
                </p>
              </div>
            </header>

            <form onSubmit={enviarFormularioUsuario} className="space-y-5 px-6 py-5">
              {errorCreacion && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorCreacion}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="nuevo-nombre"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Nombre
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="nuevo-nombre"
                      autoComplete="name"
                      autoFocus
                      value={formularioUsuario.nombre}
                      onChange={(event) => cambiarCampo('nombre', event.target.value)}
                      aria-invalid={Boolean(erroresFormulario.nombre)}
                      className={`w-full rounded-xl border bg-slate-50/60 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 ${
                        erroresFormulario.nombre
                          ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                          : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
                      }`}
                      placeholder="Ej. Alejandro"
                    />
                  </div>
                  {erroresFormulario.nombre && (
                    <p className="mt-1 text-[11px] text-rose-600">
                      {erroresFormulario.nombre}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="nuevo-username"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Nombre de usuario
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="nuevo-username"
                      autoComplete="username"
                      value={formularioUsuario.username}
                      onChange={(event) => cambiarCampo('username', event.target.value)}
                      aria-invalid={Boolean(erroresFormulario.username)}
                      className={`w-full rounded-xl border bg-slate-50/60 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 ${
                        erroresFormulario.username
                          ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                          : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
                      }`}
                      placeholder="ej. alejandro.dev"
                    />
                  </div>
                  {erroresFormulario.username && (
                    <p className="mt-1 text-[11px] text-rose-600">
                      {erroresFormulario.username}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="nuevo-correo"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="nuevo-correo"
                      type="email"
                      autoComplete="email"
                      value={formularioUsuario.correo}
                      onChange={(event) => cambiarCampo('correo', event.target.value)}
                      aria-invalid={Boolean(erroresFormulario.correo)}
                      className={`w-full rounded-xl border bg-slate-50/60 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 ${
                        erroresFormulario.correo
                          ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                          : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
                      }`}
                      placeholder="usuario@empresa.com"
                    />
                  </div>
                  {erroresFormulario.correo && (
                    <p className="mt-1 text-[11px] text-rose-600">
                      {erroresFormulario.correo}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="nuevo-telefono"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="nuevo-telefono"
                      type="tel"
                      autoComplete="tel"
                      value={formularioUsuario.telefono}
                      onChange={(event) =>
                        cambiarCampo(
                          'telefono',
                          event.target.value.replace(/[^\d\s\-()+]/g, ''),
                        )
                      }
                      aria-invalid={Boolean(erroresFormulario.telefono)}
                      className={`w-full rounded-xl border bg-slate-50/60 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 ${
                        erroresFormulario.telefono
                          ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                          : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
                      }`}
                      placeholder="618 123 4567"
                    />
                  </div>
                  {erroresFormulario.telefono && (
                    <p className="mt-1 text-[11px] text-rose-600">
                      {erroresFormulario.telefono}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="nuevo-rol"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Rol del usuario
                </label>
                <div className="relative">
                  <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    id="nuevo-rol"
                    value={formularioUsuario.rol}
                    onChange={(event) => {
                      const valor = event.target.value;
                      if (
                        valor === 'Administrador' ||
                        valor === 'Técnico' ||
                        valor === 'Usuario'
                      ) {
                        cambiarCampo('rol', valor);
                      }
                    }}
                    aria-invalid={Boolean(erroresFormulario.rol)}
                    className={`w-full rounded-xl border bg-slate-50/60 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 ${
                      erroresFormulario.rol
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                        : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
                    }`}
                  >
                    <option value="Usuario">Usuario</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
                {erroresFormulario.rol && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    {erroresFormulario.rol}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label
                    htmlFor="nuevo-password"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Contraseña
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Mínimo 8 caracteres
                  </span>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="nuevo-password"
                    type={mostrarPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formularioUsuario.password}
                    onChange={(event) => cambiarCampo('password', event.target.value)}
                    aria-invalid={Boolean(erroresFormulario.password)}
                    className={`w-full rounded-xl border bg-slate-50/60 py-2.5 pl-10 pr-11 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 ${
                      erroresFormulario.password
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                        : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
                    }`}
                    placeholder="Escribe una contraseña segura"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((visible) => !visible)}
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {mostrarPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="mt-2 grid gap-1.5 text-[11px] sm:grid-cols-2">
                  {[
                    {
                      label: 'Mínimo 8 caracteres',
                      valido: formularioUsuario.password.length >= 8,
                    },
                    {
                      label: 'Una letra mayúscula',
                      valido: /[A-Z]/.test(formularioUsuario.password),
                    },
                    {
                      label: 'Al menos un número',
                      valido: /[0-9]/.test(formularioUsuario.password),
                    },
                    {
                      label: 'Un carácter especial (@#$%)',
                      valido: /[@#$%^&*(),.?":{}|<>]/.test(formularioUsuario.password),
                    },
                  ].map((regla) => (
                    <span
                      key={regla.label}
                      className={`flex items-center gap-1.5 ${
                        regla.valido ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {regla.valido ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Circle className="h-3.5 w-3.5" />
                      )}
                      {regla.label}
                    </span>
                  ))}
                </div>
                {erroresFormulario.password && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    {erroresFormulario.password}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="nuevo-confirmar-password"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <RotateCcw className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="nuevo-confirmar-password"
                    type={mostrarConfirmacion ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formularioUsuario.confirmarPassword}
                    onChange={(event) =>
                      cambiarCampo('confirmarPassword', event.target.value)
                    }
                    aria-invalid={Boolean(erroresFormulario.confirmarPassword)}
                    className={`w-full rounded-xl border bg-slate-50/60 py-2.5 pl-10 pr-11 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 ${
                      erroresFormulario.confirmarPassword
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                        : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
                    }`}
                    placeholder="Vuelve a escribir la contraseña"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMostrarConfirmacion((visible) => !visible)
                    }
                    aria-label={
                      mostrarConfirmacion
                        ? 'Ocultar confirmación'
                        : 'Mostrar confirmación'
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {mostrarConfirmacion ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {erroresFormulario.confirmarPassword && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    {erroresFormulario.confirmarPassword}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarModalCrear}
                  disabled={creandoUsuario}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoUsuario}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#161B33] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#1E2544] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creandoUsuario && (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  )}
                  {creandoUsuario ? 'Creando usuario...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {usuarioSeleccionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={cerrarModalEdicion}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="editar-usuario-titulo"
            aria-describedby="editar-usuario-descripcion"
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="border-b border-slate-100 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4338CA]">
                  <Pencil className="h-4 w-4" />
                </span>
                <div>
                  <h2
                    id="editar-usuario-titulo"
                    className="text-lg font-bold text-[#0F172A]"
                  >
                    Editar usuario
                  </h2>
                  <p
                    id="editar-usuario-descripcion"
                    className="mt-1 text-xs text-slate-500"
                  >
                    Modifica los datos de perfil, rol y estado de la cuenta.
                  </p>
                </div>
              </div>
            </header>

            <div className="space-y-4 px-6 py-4">
              {errorEdicion && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorEdicion}</span>
                </div>
              )}

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#F8FAFC] p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E0E7FF] text-sm font-bold text-[#4338CA]">
                  {usuarioSeleccionado.iniciales}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {usuarioSeleccionado.nombre}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {usuarioSeleccionado.correo}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="editar-usuario-nombre"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Nombre
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="editar-usuario-nombre"
                      type="text"
                      disabled={guardandoEdicion}
                      value={nombreEdicion}
                      onChange={(event) => {
                        setNombreEdicion(event.target.value);
                        setErroresEdicion((actual) => ({
                          ...actual,
                          nombre: undefined,
                        }));
                        setErrorEdicion(null);
                      }}
                      aria-invalid={Boolean(erroresEdicion.nombre)}
                      className={`w-full rounded-xl border bg-slate-50/60 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                        erroresEdicion.nombre
                          ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                          : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
                      }`}
                      placeholder="Nombre completo"
                    />
                  </div>
                  {erroresEdicion.nombre && (
                    <p className="mt-1 text-[11px] text-rose-600">
                      {erroresEdicion.nombre}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="editar-usuario-username"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Nombre de usuario
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="editar-usuario-username"
                      type="text"
                      disabled={guardandoEdicion}
                      value={usernameEdicion}
                      onChange={(event) => {
                        setUsernameEdicion(event.target.value);
                        setErroresEdicion((actual) => ({
                          ...actual,
                          username: undefined,
                        }));
                        setErrorEdicion(null);
                      }}
                      aria-invalid={Boolean(erroresEdicion.username)}
                      className={`w-full rounded-xl border bg-slate-50/60 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                        erroresEdicion.username
                          ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                          : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
                      }`}
                      placeholder="nombre.usuario"
                    />
                  </div>
                  {erroresEdicion.username && (
                    <p className="mt-1 text-[11px] text-rose-600">
                      {erroresEdicion.username}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid items-end gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="editar-usuario-rol"
                    className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-700"
                  >
                    <Shield className="h-4 w-4 text-slate-400" />
                    Rol
                  </label>
                  <select
                    id="editar-usuario-rol"
                    value={rolSeleccionado}
                    disabled={guardandoEdicion || esMismoUsuarioEdicion}
                    onChange={(event) => {
                      const rol = event.target.value;
                      if (
                        rol === 'Administrador' ||
                        rol === 'Técnico' ||
                        rol === 'Usuario'
                      ) {
                        setRolSeleccionado(rol);
                        setErrorEdicion(null);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Usuario">Usuario</option>
                  </select>
                </div>

                <div className="flex min-h-[66px] items-center justify-between gap-3 rounded-xl border border-slate-100 px-3.5 py-2.5">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Power className="h-4 w-4 text-slate-400" />
                      Estado de la cuenta
                    </p>
                    <p className="mt-1 pl-6 text-[11px] text-slate-500">
                      {usuarioActivo ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    disabled={guardandoEdicion || esMismoUsuarioEdicion}
                    aria-checked={usuarioActivo}
                    aria-label={
                      usuarioActivo ? 'Desactivar usuario' : 'Activar usuario'
                    }
                    onClick={() => {
                      setUsuarioActivo((activo) => !activo);
                      setErrorEdicion(null);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      usuarioActivo ? 'bg-[#161B33]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        usuarioActivo ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {esMismoUsuarioEdicion && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2">
                  Por seguridad, no puedes modificar el rol ni desactivar tu propia cuenta en sesión.
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarModalEdicion}
                  disabled={guardandoEdicion}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarEdicionUsuario}
                  disabled={guardandoEdicion || !hayCambiosEdicion}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#161B33] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1E2544] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardandoEdicion && (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}