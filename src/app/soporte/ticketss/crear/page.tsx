"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ArrowUpRight,
  Bold,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Code,
  FileImage,
  FileText,
  Home,
  Italic,
  Laptop,
  Lightbulb,
  Link2,
  List,
  ListOrdered,
  Mail,
  Network,
  Paperclip,
  PencilLine,
  Phone,
  Plane,
  Save,
  Send,
  Shield,
  Timer,
  Trash2,
  UploadCloud,
  HardDrive,
  AppWindow,
  KeyRound,
} from "lucide-react";

/* ---------- Configuración ---------- */
const MAX_TITULO = 100;
const MAX_ARCHIVOS = 5;
const MAX_MB = 10;
const TIPOS_OK = ["application/pdf", "image/jpeg", "image/png"];

const CATEGORIAS: Record<
  string,
  { icono: React.ReactNode; subcategorias: string[] }
> = {
  "Redes y Conectividad": {
    icono: <Network className="h-4 w-4" />,
    subcategorias: [
      "VPN y Conexión Remota (AnyConnect)",
      "Wi-Fi corporativo",
      "Internet / Red cableada",
      "Acceso a recursos compartidos",
    ],
  },
  "Hardware y Equipos": {
    icono: <HardDrive className="h-4 w-4" />,
    subcategorias: [
      "Laptop / Computadora",
      "Monitor y periféricos",
      "Impresoras",
      "Solicitud de equipo nuevo",
    ],
  },
  "Software y Aplicaciones": {
    icono: <AppWindow className="h-4 w-4" />,
    subcategorias: [
      "Instalación de software",
      "Error en aplicación",
      "Licencias",
      "Correo y calendario",
    ],
  },
  "Accesos y Seguridad": {
    icono: <KeyRound className="h-4 w-4" />,
    subcategorias: [
      "Restablecer contraseña",
      "Permisos y accesos",
      "Autenticación multifactor",
      "Incidente de seguridad",
    ],
  },
};

const UBICACIONES = [
  { id: "oficina", label: "Sede Central / Oficina", icono: <Building2 className="h-4 w-4" /> },
  { id: "remoto", label: "Teletrabajo / Remoto", icono: <Laptop className="h-4 w-4" /> },
  { id: "transito", label: "En Tránsito / Viaje", icono: <Plane className="h-4 w-4" /> },
];

const IMPACTO = [
  { id: "bajo", titulo: "Bajo", desc: "Solo afecta a una persona sin bloquear tareas", dot: "bg-slate-400", rojo: false },
  { id: "medio", titulo: "Medio", desc: "Dificulta tareas, pero hay workaround", dot: "bg-[#313652]", rojo: false },
  { id: "alto", titulo: "Alto", desc: "Afecta a todo el departamento o flujo crítico", dot: "bg-amber-500", rojo: false },
  { id: "critico", titulo: "Crítico", desc: "Parada de operación total de la empresa", dot: "bg-red-500", rojo: true },
];

const URGENCIA = [
  { id: "baja", titulo: "Baja", desc: "Atención requerida en más de 48 horas", dot: "bg-slate-400", rojo: false },
  { id: "media", titulo: "Media", desc: "Atención recomendada dentro de la jornada", dot: "bg-[#313652]", rojo: false },
  { id: "alta", titulo: "Alta", desc: "Atención inmediata, urgente en 4 horas", dot: "bg-amber-500", rojo: false },
  { id: "critica", titulo: "Crítica", desc: "Respuesta inmediata < 30 min (línea roja)", dot: "bg-red-500", rojo: true },
];

const SOLICITANTE = {
  nombre: "Elena Morales",
  area: "Marketing & Growth • Ext. 204",
  dispositivo: 'MacBook Pro 14" M',
  correo: "elena.morales@company.com",
  avatar: "/images/avatar.jpg",
};

const ARTICULOS = [
  { titulo: "Solución a fallos de conexión en Cisco AnyConnect VPN", meta: "3 min de lectura", extra: "94% de éxito" },
  { titulo: "Cómo restablecer certificados y credenciales de acceso remoto", meta: "5 min de lectura", extra: "Paso a paso macOS" },
];

type Adjunto = {
  id: string;
  file: File;
  progreso: number;
};

type Errores = Partial<Record<"titulo" | "categoria" | "subcategoria" | "descripcion", string>>;

const formatoTamano = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/* ---------- Pequeños componentes ---------- */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function StepHeader({
  icon,
  titulo,
  subtitulo,
  paso,
}: {
  icon: React.ReactNode;
  titulo: string;
  subtitulo: string;
  paso: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-[#313652]">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">{titulo}</h2>
          <p className="text-xs text-slate-500">{subtitulo}</p>
        </div>
      </div>
      <span className="shrink-0 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
        {paso}
      </span>
    </div>
  );
}

function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-slate-700">
      {children} <span className="text-red-500">*</span>
    </label>
  );
}

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600">
      <AlertCircle className="h-3 w-3" />
      {msg}
    </p>
  );
}

function OpcionNivel({
  item,
  activo,
  onClick,
}: {
  item: { titulo: string; desc: string; dot: string; rojo: boolean };
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-all ${
        activo
          ? "border-[#313652] bg-indigo-50/60 ring-1 ring-[#313652]"
          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${item.rojo ? "text-red-600" : "text-slate-800"}`}>
          {item.titulo}
        </span>
        <span className={`h-2 w-2 rounded-full ${item.dot}`} />
      </div>
      <p className="mt-1 text-[11px] leading-snug text-slate-500">{item.desc}</p>
    </button>
  );
}

/* ---------- Página ---------- */
export default function CrearSolicitudPage() {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [ubicacion, setUbicacion] = useState("remoto");
  const [descripcion, setDescripcion] = useState("");
  const [impacto, setImpacto] = useState("medio");
  const [urgencia, setUrgencia] = useState("media");
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" }>({
    show: false,
    msg: "",
    type: "success",
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const mostrarToast = (msg: string, type: "success" | "error") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  /* Progreso simulado de subida (reemplázalo por la subida real a Supabase Storage) */
  useEffect(() => {
    if (!adjuntos.some((a) => a.progreso < 100)) return;
    const timer = setInterval(() => {
      setAdjuntos((prev) =>
        prev.map((a) =>
          a.progreso < 100 ? { ...a, progreso: Math.min(100, a.progreso + 20) } : a,
        ),
      );
    }, 250);
    return () => clearInterval(timer);
  }, [adjuntos]);

  /* ---- Archivos ---- */
  const agregarArchivos = (lista: FileList | null) => {
    if (!lista) return;
    const nuevos: Adjunto[] = [];
    let espacio = MAX_ARCHIVOS - adjuntos.length;

    for (const file of Array.from(lista)) {
      if (!TIPOS_OK.includes(file.type)) {
        mostrarToast(`"${file.name}": solo se permiten PDF, JPG o PNG`, "error");
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        mostrarToast(`"${file.name}" supera los ${MAX_MB} MB`, "error");
        continue;
      }
      if (espacio <= 0) {
        mostrarToast(`Máximo ${MAX_ARCHIVOS} archivos por solicitud`, "error");
        break;
      }
      nuevos.push({ id: `${file.name}-${file.size}-${Date.now()}-${nuevos.length}`, file, progreso: 0 });
      espacio--;
    }
    if (nuevos.length) setAdjuntos((prev) => [...prev, ...nuevos]);
  };

  const quitarArchivo = (id: string) =>
    setAdjuntos((prev) => prev.filter((a) => a.id !== id));

  /* ---- Editor markdown sencillo ---- */
  const envolver = (antes: string, despues = antes, placeholder = "texto") => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const seleccion = descripcion.slice(s, e) || placeholder;
    const nuevo = descripcion.slice(0, s) + antes + seleccion + despues + descripcion.slice(e);
    setDescripcion(nuevo);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + antes.length, s + antes.length + seleccion.length);
    });
  };

  const prefijarLinea = (prefijo: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const inicioLinea = descripcion.lastIndexOf("\n", s - 1) + 1;
    setDescripcion(descripcion.slice(0, inicioLinea) + prefijo + descripcion.slice(inicioLinea));
    requestAnimationFrame(() => el.focus());
  };

  /* ---- Validación y acciones ---- */
  const validar = (): boolean => {
    const err: Errores = {};
    if (titulo.trim().length < 5) err.titulo = "Escribe un título de al menos 5 caracteres.";
    if (!categoria) err.categoria = "Selecciona una categoría.";
    if (!subcategoria) err.subcategoria = "Selecciona una subcategoría.";
    if (descripcion.trim().length < 20)
      err.descripcion = "Describe el problema con al menos 20 caracteres.";
    setErrores(err);
    return Object.keys(err).length === 0;
  };

  const limpiar = () => {
    setTitulo("");
    setCategoria("");
    setSubcategoria("");
    setUbicacion("remoto");
    setDescripcion("");
    setImpacto("medio");
    setUrgencia("media");
    setAdjuntos([]);
    setErrores({});
  };

  const enviar = async () => {
    if (!validar()) {
      mostrarToast("Revisa los campos marcados en rojo", "error");
      return;
    }
    if (adjuntos.some((a) => a.progreso < 100)) {
      mostrarToast("Espera a que terminen de subir los archivos", "error");
      return;
    }
    setEnviando(true);
    try {
      // TODO: conecta aquí tu API, por ejemplo:
      // const body = { titulo, categoria, subcategoria, ubicacion, descripcion, impacto, urgencia };
      // const res = await fetch("/api/tickets", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(body),
      // });
      // if (!res.ok) throw new Error();
      await new Promise((r) => setTimeout(r, 800)); // simulación
      mostrarToast("Solicitud enviada. Recibirás un acuse en tu correo.", "success");
      limpiar();
    } catch {
      mostrarToast("No se pudo enviar la solicitud", "error");
    } finally {
      setEnviando(false);
    }
  };

  const guardarBorrador = () => {
    try {
      localStorage.setItem(
        "ticket-borrador",
        JSON.stringify({ titulo, categoria, subcategoria, ubicacion, descripcion, impacto, urgencia }),
      );
      mostrarToast("Borrador guardado en este navegador", "success");
    } catch {
      mostrarToast("No se pudo guardar el borrador", "error");
    }
  };

  // Recupera el borrador al abrir la página
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ticket-borrador");
      if (!raw) return;
      const d = JSON.parse(raw);
      setTitulo(d.titulo ?? "");
      setCategoria(d.categoria ?? "");
      setSubcategoria(d.subcategoria ?? "");
      setUbicacion(d.ubicacion ?? "remoto");
      setDescripcion(d.descripcion ?? "");
      setImpacto(d.impacto ?? "medio");
      setUrgencia(d.urgencia ?? "media");
    } catch {
      /* sin borrador */
    }
  }, []);

  const subcategorias = categoria ? CATEGORIAS[categoria].subcategorias : [];
  const inputBase =
    "w-full rounded-lg border bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#313652] focus:bg-white";

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Toast */}
      <div
        className={`fixed left-1/2 top-6 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-lg px-6 py-3 text-white shadow-xl transition-all duration-500 ${
          toast.show ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"
        } ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
      >
        {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
        <span className="font-medium">{toast.msg}</span>
      </div>

      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-2 text-xs text-slate-500">
        <Home className="h-3.5 w-3.5" />
        <span>Inicio</span>
        <ChevronRight className="h-3 w-3" />
        <span>Mis Solicitudes</span>
        <ChevronRight className="h-3 w-3" />
        <span className="rounded-md bg-slate-200 px-2 py-0.5 font-semibold text-slate-700">
          Crear Solicitud
        </span>
      </nav>

      {/* Encabezado */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-indigo-700">IT Helpdesk</span>
            <span className="text-slate-500">Portal de autoservicio</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Crear Solicitud de Soporte (Ticket)</h1>
          <p className="mt-1 max-w-lg text-sm text-slate-500">
            Reporta un incidente técnico o solicita nuevo equipamiento, accesos o servicios
            informáticos de forma guiada.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <Timer className="h-4 w-4 text-slate-500" />
            <div className="leading-tight">
              <p className="text-[10px] text-slate-500">SLA de primera respuesta</p>
              <p className="text-xs font-bold text-slate-800">&lt; 2 horas hábiles</p>
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-indigo-100 px-3 py-2.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-200"
          >
            <BookOpen className="h-4 w-4" />
            ¿Duda recurrente? Consultar KB
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* ============ Formulario ============ */}
        <div className="flex flex-col gap-6">
          {/* Paso 1 */}
          <Card>
            <StepHeader
              icon={<PencilLine className="h-4 w-4" />}
              titulo="Paso 1: Información Básica del Incidente"
              subtitulo="Describe de forma concisa el motivo del ticket"
              paso="Paso 1 de 3"
            />

            <div className="space-y-5">
              <div>
                <div className="flex items-end justify-between">
                  <Label htmlFor="titulo">Título de la solicitud</Label>
                  <span className="mb-1.5 text-[11px] text-slate-400">
                    {titulo.length} / {MAX_TITULO} caracteres
                  </span>
                </div>
                <input
                  id="titulo"
                  type="text"
                  maxLength={MAX_TITULO}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. No puedo acceder a la VPN corporativa desde casa"
                  className={`${inputBase} ${errores.titulo ? "border-red-400" : "border-slate-200"}`}
                />
                <ErrorText msg={errores.titulo} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="categoria">Categoría del Servicio</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      {categoria ? CATEGORIAS[categoria].icono : <Network className="h-4 w-4" />}
                    </span>
                    <select
                      id="categoria"
                      value={categoria}
                      onChange={(e) => {
                        setCategoria(e.target.value);
                        setSubcategoria("");
                      }}
                      className={`${inputBase} appearance-none pl-9 pr-9 ${
                        errores.categoria ? "border-red-400" : "border-slate-200"
                      }`}
                    >
                      <option value="">Selecciona una categoría</option>
                      {Object.keys(CATEGORIAS).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <ErrorText msg={errores.categoria} />
                </div>

                <div>
                  <Label htmlFor="subcategoria">Subcategoría específica</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <Shield className="h-4 w-4" />
                    </span>
                    <select
                      id="subcategoria"
                      value={subcategoria}
                      disabled={!categoria}
                      onChange={(e) => setSubcategoria(e.target.value)}
                      className={`${inputBase} appearance-none pl-9 pr-9 disabled:cursor-not-allowed disabled:opacity-60 ${
                        errores.subcategoria ? "border-red-400" : "border-slate-200"
                      }`}
                    >
                      <option value="">
                        {categoria ? "Selecciona una subcategoría" : "Elige primero una categoría"}
                      </option>
                      {subcategorias.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <ErrorText msg={errores.subcategoria} />
                </div>
              </div>

              <div>
                <Label>Ubicación / Modalidad afectada</Label>
                <div className="flex flex-wrap gap-2">
                  {UBICACIONES.map((u) => {
                    const activo = ubicacion === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        aria-pressed={activo}
                        onClick={() => setUbicacion(u.id)}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${
                          activo
                            ? "border-[#313652] bg-[#313652] text-white shadow"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {u.icono}
                        {u.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Paso 2 */}
          <Card>
            <StepHeader
              icon={<FileText className="h-4 w-4" />}
              titulo="Paso 2: Detalle del Problema e Impacto"
              subtitulo="Explica qué ocurre y cómo repercute en tu operatividad"
              paso="Paso 2 de 3"
            />

            <div className="space-y-5">
              <div>
                <Label htmlFor="descripcion">Descripción detallada</Label>
                <div
                  className={`overflow-hidden rounded-lg border ${
                    errores.descripcion ? "border-red-400" : "border-slate-200"
                  } focus-within:border-[#313652]`}
                >
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-2 py-1.5">
                    <div className="flex items-center gap-0.5 text-slate-600">
                      {[
                        { l: "Negrita", i: <Bold className="h-3.5 w-3.5" />, f: () => envolver("**") },
                        { l: "Cursiva", i: <Italic className="h-3.5 w-3.5" />, f: () => envolver("_") },
                        { l: "Lista", i: <List className="h-3.5 w-3.5" />, f: () => prefijarLinea("- ") },
                        { l: "Lista numerada", i: <ListOrdered className="h-3.5 w-3.5" />, f: () => prefijarLinea("1. ") },
                        { l: "Código", i: <Code className="h-3.5 w-3.5" />, f: () => envolver("`") },
                        { l: "Enlace", i: <Link2 className="h-3.5 w-3.5" />, f: () => envolver("[", "](https://)", "texto") },
                      ].map((b) => (
                        <button
                          key={b.l}
                          type="button"
                          title={b.l}
                          aria-label={b.l}
                          onClick={b.f}
                          className="rounded p-1.5 hover:bg-white hover:text-slate-900"
                        >
                          {b.i}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500">Markdown soportado</span>
                  </div>
                  <textarea
                    id="descripcion"
                    ref={textareaRef}
                    rows={6}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describe los pasos que seguiste, el mensaje de error exacto y desde cuándo ocurre..."
                    className="w-full resize-y bg-white px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
                <ErrorText msg={errores.descripcion} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label>Impacto percibido</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {IMPACTO.map((i) => (
                      <OpcionNivel key={i.id} item={i} activo={impacto === i.id} onClick={() => setImpacto(i.id)} />
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Urgencia percibida</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {URGENCIA.map((u) => (
                      <OpcionNivel key={u.id} item={u} activo={urgencia === u.id} onClick={() => setUrgencia(u.id)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Paso 3 */}
          <Card>
            <StepHeader
              icon={<Paperclip className="h-4 w-4" />}
              titulo="Paso 3: Evidencias y Archivos Adjuntos"
              subtitulo="Añade capturas de pantalla, extractos de logs o fotos de diagnóstico"
              paso="Paso 3 de 3"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                agregarArchivos(e.dataTransfer.files);
              }}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                arrastrando ? "border-[#313652] bg-indigo-50" : "border-slate-300 bg-slate-50"
              }`}
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#313652] shadow-sm">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Arrastra capturas de pantalla o logs aquí, o{" "}
                <button
                  type="button"
                  onClick={() => inputFileRef.current?.click()}
                  className="underline hover:text-[#313652]"
                >
                  haz clic para explorar
                </button>
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Máximo {MAX_ARCHIVOS} archivos de hasta {MAX_MB} MB en PDF, JPG, PNG
              </p>
              <input
                ref={inputFileRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  agregarArchivos(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {adjuntos.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Archivos adjuntados ({adjuntos.length} de {MAX_ARCHIVOS})
                </h3>
                <ul className="space-y-2">
                  {adjuntos.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                        {a.file.type.startsWith("image/") ? (
                          <FileImage className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-slate-800">{a.file.name}</p>
                          <span className="shrink-0 text-[10px] text-slate-500">
                            {formatoTamano(a.file.size)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-[#313652] transition-all duration-200"
                              style={{ width: `${a.progreso}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-[10px] font-semibold text-slate-600">
                            {a.progreso}%
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Quitar ${a.file.name}`}
                        onClick={() => quitarArchivo(a.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        {/* ============ Columna lateral ============ */}
        <aside className="flex flex-col gap-6">
          <Card className="!p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Solicitante identificado
              </h3>
              <button type="button" className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800">
                Cambiar <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-300">
                <Image src={SOLICITANTE.avatar} alt={SOLICITANTE.nombre} fill sizes="36px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">{SOLICITANTE.nombre}</p>
                <p className="truncate text-[10px] text-slate-500">{SOLICITANTE.area}</p>
              </div>
            </div>
            <dl className="mt-2 space-y-2 text-[11px]">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <Laptop className="h-3.5 w-3.5" /> Dispositivo registrado
                </dt>
                <dd className="font-semibold text-slate-800">{SOLICITANTE.dispositivo}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <Mail className="h-3.5 w-3.5" /> Correo institucional
                </dt>
                <dd className="truncate font-semibold text-slate-800">{SOLICITANTE.correo}</dd>
              </div>
            </dl>
          </Card>

          <Card className="!p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <Lightbulb className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800">¿Podría resolverse ahora?</h3>
            </div>
            <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
              Detectamos artículos recomendados en la Base de Conocimiento para tu consulta sobre{" "}
              <strong className="text-slate-700">{subcategoria ? subcategoria.split(" (")[0] : "VPN"}</strong>.
            </p>
            <ul className="space-y-2">
              {ARTICULOS.map((a) => (
                <li key={a.titulo}>
                  <button
                    type="button"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-semibold leading-snug text-slate-800">{a.titulo}</p>
                      <ArrowUpRight className="h-3 w-3 shrink-0 text-slate-400" />
                    </div>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Clock className="h-3 w-3" /> {a.meta} • <span className="font-semibold text-slate-700">{a.extra}</span>
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="!p-5">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Tiempos y canales directos
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3">
                <Clock className="mt-0.5 h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-[11px] font-bold text-slate-800">Horario de Mesa de Ayuda</p>
                  <p className="text-[10px] text-slate-500">Lunes a Viernes de 08:00 a 18:00 hrs.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3">
                <Phone className="mt-0.5 h-4 w-4 text-red-500" />
                <div>
                  <p className="text-[11px] font-bold text-red-700">¿Caída total o emergencia crítica?</p>
                  <p className="text-[10px] text-red-600">
                    Línea directa: +1 (417) ext. <strong>3599</strong>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {/* Barra inferior de acciones */}
      <div className="sticky bottom-0 -mx-8 -mb-8 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-8 py-4">
        <p className="flex items-center gap-2 text-[11px] text-slate-500">
          <Mail className="h-4 w-4 text-indigo-500" />
          Se enviará un acuse de recibo con el identificador del ticket a tu correo corporativo.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={limpiar}
            disabled={enviando}
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardarBorrador}
            disabled={enviando}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Guardar Borrador
          </button>
          <button
            type="button"
            onClick={enviar}
            disabled={enviando}
            className="flex items-center gap-2 rounded-lg bg-[#313652] px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#262a40] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {enviando ? "Enviando..." : "Enviar Solicitud"}
          </button>
        </div>
      </div>
    </div>
  );
}