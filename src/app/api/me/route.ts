import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptRole } from "../../lib/session";

function getProfileValue(...values: unknown[]): string {
  const value = values.find(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
  return typeof value === "string" ? value.trim() : "";
}

function getLookupClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, key);
}

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

export async function GET(request: Request) {
  const ctx = await getAuthenticatedContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { supabase, user, cookieStore } = ctx;

  // Verificación de disponibilidad de username excluyendo al usuario actual
  const { searchParams } = new URL(request.url);
  const checkUsername = searchParams.get("checkUsername");
  if (checkUsername !== null) {
    const cleanUsername = checkUsername.replace(/^@/, "").trim();
    if (!/^[a-zA-Z0-9._]{3,20}$/.test(cleanUsername)) {
      return NextResponse.json({ available: false, reason: "invalid" });
    }

    try {
      const supabaseLookup = getLookupClient();
      const { data, error } = await supabaseLookup
        .from("users")
        .select("id")
        .ilike("username", cleanUsername)
        .neq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error verificando username:", error);
        return NextResponse.json({ available: true });
      }

      return NextResponse.json({ available: !data });
    } catch {
      return NextResponse.json({ available: true });
    }
  }

  let dbUser = null;
  try {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    dbUser = data;
  } catch (err) {
    console.error("Error consultando tabla users:", err);
  }

  const name =
    dbUser?.name ||
    dbUser?.nombre ||
    user.user_metadata?.name ||
    user.user_metadata?.nombre ||
    user.email?.split("@")[0] ||
    "Usuario";

  const username =
    dbUser?.username ||
    dbUser?.last_name ||
    dbUser?.apellido ||
    user.user_metadata?.username ||
    user.user_metadata?.last_name ||
    user.user_metadata?.apellido ||
    "";

  const phone = getProfileValue(
    dbUser?.phone,
    dbUser?.telefono,
    user.phone,
    user.user_metadata?.phone,
    user.user_metadata?.telefono,
  );

  const encryptedRoleToken = cookieStore.get("ur-token")?.value;
  let role =
    dbUser?.role ||
    dbUser?.rol ||
    dbUser?.tipo ||
    (encryptedRoleToken ? await decryptRole(encryptedRoleToken) : null);

  if (!role) {
    role =
      user.user_metadata?.role ||
      user.user_metadata?.rol ||
      user.app_metadata?.role ||
      "usuario";
  }

  return NextResponse.json({
    id:
      getProfileValue(
        dbUser?.id,
        dbUser?.employee_id,
        dbUser?.id_empleado,
      ) || user.id,
    name,
    username,
    role,
    email: dbUser?.email || user.email,
    phone,
    status: dbUser?.status !== false,
    avatar:
      getProfileValue(
        dbUser?.avatar_url,
        dbUser?.avatar,
        user.user_metadata?.avatar_url,
      ) || "/images/avatar.jpg",
    emailVerified: Boolean(user.email_confirmed_at || user.confirmed_at),
    notifications: {
      cambiosEstado:
        dbUser?.notif_status ?? user.user_metadata?.notif_status ?? true,
      notifCorreo:
        dbUser?.notif_email ?? user.user_metadata?.notif_email ?? true,
      resumenSemanal:
        dbUser?.notif_weekly ?? user.user_metadata?.notif_weekly ?? false,
    },
  });
}

export async function PATCH(request: Request) {
  const ctx = await getAuthenticatedContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { supabase, user } = ctx;

  try {
    const body = await request.json();
    const {
      nombre,
      username,
      telefono,
      cambiosEstado,
      notifCorreo,
      resumenSemanal,
    } = body;

    const cleanNombre = typeof nombre === "string" ? nombre.trim() : "";
    const cleanUsername =
      typeof username === "string" ? username.replace(/^@/, "").trim() : "";
    const cleanPhone = typeof telefono === "string" ? telefono.trim() : "";

    if (!cleanNombre) {
      return NextResponse.json(
        { error: "El nombre completo es obligatorio.", campo: "nombre" },
        { status: 400 },
      );
    }

    if (!/^[a-zA-Z0-9._]{3,20}$/.test(cleanUsername)) {
      return NextResponse.json(
        {
          error:
            "El nombre de usuario debe tener entre 3 y 20 caracteres (letras, números, punto o _).",
          campo: "username",
        },
        { status: 400 },
      );
    }

    // Verificar que otro usuario no tenga el mismo username
    const supabaseLookup = getLookupClient();
    const { data: existingUsername } = await supabaseLookup
      .from("users")
      .select("id")
      .ilike("username", cleanUsername)
      .neq("id", user.id)
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json(
        {
          error: "Este nombre de usuario ya está en uso por otro usuario.",
          campo: "username",
        },
        { status: 409 },
      );
    }

    // 1. Actualizar tabla public.users (nombre y username)
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const updatePayload: Record<string, unknown> = {};

    if (existingUser) {
      if ("name" in existingUser) updatePayload.name = cleanNombre;
      if ("nombre" in existingUser) updatePayload.nombre = cleanNombre;
      if ("username" in existingUser) updatePayload.username = cleanUsername;
    } else {
      updatePayload.name = cleanNombre;
      updatePayload.username = cleanUsername;
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: dbError } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", user.id);

      if (dbError) {
        console.error("Error actualizando tabla users:", dbError);
        return NextResponse.json(
          { error: "No se pudo actualizar el perfil en la base de datos." },
          { status: 400 },
        );
      }
    }

    // 2. Actualizar teléfono y metadatos en auth.users
    const authPayload: {
      phone?: string;
      data: Record<string, unknown>;
    } = {
      data: {
        name: cleanNombre,
        nombre: cleanNombre,
        username: cleanUsername,
        phone: cleanPhone,
        telefono: cleanPhone,
        notif_status: cambiosEstado,
        notif_email: notifCorreo,
        notif_weekly: resumenSemanal,
      },
    };

    if (cleanPhone && cleanPhone !== (user.phone || "")) {
      authPayload.phone = cleanPhone;
    }

    const { error: authError } = await supabase.auth.updateUser(authPayload);

    if (authError) {
      console.error("Error actualizando auth.users:", authError);
      return NextResponse.json(
        {
          error:
            authError.message ||
            "No se pudo actualizar el teléfono en Supabase Auth.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error procesando PATCH /api/me:", err);
    return NextResponse.json(
      { error: "Error interno al guardar los cambios." },
      { status: 500 },
    );
  }
}