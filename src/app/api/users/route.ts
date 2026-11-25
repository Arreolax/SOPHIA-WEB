import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptRole } from "../../lib/session";

async function getAuthenticatedContext() {
  const cookieStore = await cookies();
  let token = cookieStore.get("sb-access-token")?.value;
  let refreshToken = cookieStore.get("sb-refresh-token")?.value;

  if (!token && !refreshToken) {
    return { error: "No hay sesión", status: 401 };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  let user = null;

  if (token && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken,
    });

    if (!error && data.user && data.session) {
      user = data.user;
      if (data.session.access_token !== token) {
        token = data.session.access_token;
        refreshToken = data.session.refresh_token;

        cookieStore.set({
          name: "sb-access-token",
          value: token,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

        cookieStore.set({
          name: "sb-refresh-token",
          value: refreshToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }
  } else if (token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      user = data.user;
    }
  }

  if (!user && refreshToken) {
    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (!refreshError && refreshed.session && refreshed.user) {
      user = refreshed.user;
      token = refreshed.session.access_token;

      cookieStore.set({
        name: "sb-access-token",
        value: refreshed.session.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      cookieStore.set({
        name: "sb-refresh-token",
        value: refreshed.session.refresh_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  }

  if (!user) {
    return { error: "Sesión expirada o usuario no encontrado", status: 401 };
  }

  return { supabase, user, cookieStore };
}

function normalizarRol(
  rawRole?: string | null,
): "Administrador" | "Técnico" | "Usuario" {
  const clean = (rawRole || "usuario").toLowerCase().trim();
  if (clean.includes("admin")) return "Administrador";
  if (clean.includes("tecnic") || clean.includes("técnic")) return "Técnico";
  return "Usuario";
}

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 0 || !partes[0]) return "US";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

function formatearFecha(fechaIso?: string | null): string {
  if (!fechaIso) return "Sin acceso";
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "Sin acceso";

  const hoy = new Date();
  const esHoy =
    fecha.getDate() === hoy.getDate() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear();

  const hora = fecha.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (esHoy) return `Hoy, ${hora}`;

  const diaMes = fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${diaMes}, ${hora}`;
}

interface UserRpcRow {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string | null;
  status: boolean | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

export async function GET() {
  const ctx = await getAuthenticatedContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { supabase, user, cookieStore } = ctx;

  const encryptedRoleToken = cookieStore.get("ur-token")?.value;
  const currentRole = encryptedRoleToken
    ? await decryptRole(encryptedRoleToken)
    : null;

  try {
    // Llamada directa a la función RPC creada en Supabase
    const { data: dbUsers, error: rpcError } = await supabase.rpc(
      "get_users_with_auth",
    );

    if (rpcError) {
      console.error("Error ejecutando RPC get_users_with_auth:", rpcError);
      return NextResponse.json(
        { error: "No se pudieron obtener los usuarios." },
        { status: 500 },
      );
    }

    const usuarios = ((dbUsers as UserRpcRow[]) || []).map((row) => {
      const estaActivo = row.status !== false;
      const esInvitado =
        estaActivo && !row.email_confirmed_at && !row.last_sign_in_at;

      let estado: "Activo" | "Invitado" | "Inactivo";
      if (!estaActivo) {
        estado = "Inactivo";
      } else if (esInvitado) {
        estado = "Invitado";
      } else {
        estado = "Activo";
      }

      return {
        id: row.id,
        iniciales: obtenerIniciales(row.name),
        nombre: row.name,
        username: row.username ? `@${row.username}` : "",
        correo: row.email,
        rol: normalizarRol(row.role),
        statusBoolean: estaActivo,
        estado,
        acceso: row.last_sign_in_at
          ? formatearFecha(row.last_sign_in_at)
          : "Sin acceso",
      };
    });

    return NextResponse.json({
      usuarios,
      currentUserId: user.id,
      currentRole: currentRole || "Administrador",
    });
  } catch (err) {
    console.error("Error procesando GET /api/users:", err);
    return NextResponse.json(
      { error: "Error interno al obtener la lista de usuarios." },
      { status: 500 },
    );
  }
}