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

export async function POST(request: Request) {
  const ctx = await getAuthenticatedContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { supabase, user } = ctx;
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error verificando permisos para crear usuarios:", profileError);
    return NextResponse.json(
      { error: "No se pudieron verificar los permisos del administrador." },
      { status: 500 },
    );
  }

  if (normalizarRol(profile?.role) !== "Administrador") {
    return NextResponse.json(
      { error: "No tienes permisos para crear usuarios." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "La solicitud no contiene datos válidos." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "La solicitud no contiene datos válidos." },
      { status: 400 },
    );
  }

  const payload = body as Record<string, unknown>;
  const getText = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";
  const name = getText(payload.name);
  const username = getText(payload.username).replace(/^@/, "");
  const email = getText(payload.email).toLowerCase();
  const phone = getText(payload.phone);
  const password = typeof payload.password === "string" ? payload.password : "";
  const phoneDigits = phone.replace(/\D/g, "");

  if (!name || !username || !email || !phone || !password) {
    return NextResponse.json(
      { error: "Todos los campos son obligatorios." },
      { status: 400 },
    );
  }

  if (!/^[a-zA-ZÁÉÍÓÚáéíóúÑñÜü\s]{2,50}$/.test(name)) {
    return NextResponse.json(
      { error: "Ingresa un nombre válido (de 2 a 50 caracteres)." },
      { status: 400 },
    );
  }

  if (!/^[a-zA-Z0-9._]{3,20}$/.test(username)) {
    return NextResponse.json(
      { error: "El nombre de usuario debe tener de 3 a 20 caracteres válidos." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
    return NextResponse.json(
      { error: "Ingresa un correo electrónico válido." },
      { status: 400 },
    );
  }

  if (!/^\+?[\d\s\-()]{10,18}$/.test(phone) || phoneDigits.length < 10 || phoneDigits.length > 15) {
    return NextResponse.json(
      { error: "El teléfono debe contener entre 10 y 15 dígitos." },
      { status: 400 },
    );
  }

  const isStrongPassword =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[@#$%^&*(),.?":{}|<>]/.test(password);

  if (!isStrongPassword) {
    return NextResponse.json(
      {
        error:
          "La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.",
      },
      { status: 400 },
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error("Falta SUPABASE_SERVICE_ROLE_KEY para crear usuarios.");
    return NextResponse.json(
      { error: "La creación de usuarios no está disponible en este momento." },
      { status: 500 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: existingUsername, error: usernameError } = await adminClient
      .from("users")
      .select("id")
      .ilike("username", username)
      .maybeSingle();

    if (usernameError) {
      console.error("Error verificando nombre de usuario:", usernameError);
      return NextResponse.json(
        { error: "No se pudo verificar el nombre de usuario." },
        { status: 500 },
      );
    }

    if (existingUsername) {
      return NextResponse.json(
        { error: "Este nombre de usuario ya está en uso.", campo: "username" },
        { status: 409 },
      );
    }

    const phoneE164 = phone.startsWith("+")
      ? `+${phoneDigits}`
      : phoneDigits.length === 10
        ? `+52${phoneDigits}`
        : `+${phoneDigits}`;
    const { data, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        phone: phoneE164,
        email_confirm: true,
        user_metadata: {
          name,
          username,
          phone,
          telefono: phone,
          role: "usuario",
        },
      });

    if (createError) {
      if (
        createError.code === "email_exists" ||
        createError.code === "user_already_exists"
      ) {
        return NextResponse.json(
          { error: "Este correo electrónico ya está registrado.", campo: "email" },
          { status: 409 },
        );
      }

      console.error("Error creando usuario en Supabase Auth:", createError);
      return NextResponse.json(
        { error: "No se pudo crear el usuario." },
        { status: 500 },
      );
    }

    if (!data.user) {
      console.error("Supabase Auth no devolvió el usuario recién creado.");
      return NextResponse.json(
        { error: "No se pudo confirmar la creación del usuario." },
        { status: 500 },
      );
    }

    const { error: profileInsertError } = await adminClient
      .from("users")
      .upsert(
        {
          id: data.user.id,
          name,
          email,
          username,
          role: "usuario",
          status: true,
        },
        { onConflict: "id" },
      );

    if (profileInsertError) {
      console.error("Error creando el perfil del nuevo usuario:", profileInsertError);
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(
        data.user.id,
      );
      if (deleteError) {
        console.error("Error revirtiendo la creación de Auth:", deleteError);
      }
      return NextResponse.json(
        { error: "No se pudo guardar el perfil del usuario." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        usuario: {
          id: data.user.id,
          iniciales: obtenerIniciales(name),
          nombre: name,
          username: `@${username}`,
          correo: email,
          rol: "Usuario",
          statusBoolean: true,
          estado: "Activo",
          acceso: "Sin acceso",
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Error procesando POST /api/users:", err);
    return NextResponse.json(
      { error: "Error interno al crear el usuario." },
      { status: 500 },
    );
  }
}