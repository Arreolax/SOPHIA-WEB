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

export async function GET() {
  const cookieStore = await cookies();
  let token = cookieStore.get("sb-access-token")?.value;
  const refreshToken = cookieStore.get("sb-refresh-token")?.value;

  if (!token && !refreshToken) {
    return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  let user = null;

  if (token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      user = data.user;
    }
  }

  // Si el access_token expiró o no estaba presente, intentar renovar con sb-refresh-token
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

      supabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
    }
  }

  if (!user) {
    return NextResponse.json(
      { error: "Sesión expirada o usuario no encontrado" },
      { status: 401 },
    );
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

  const position = getProfileValue(
    dbUser?.position,
    dbUser?.puesto,
    user.user_metadata?.position,
    user.user_metadata?.puesto,
  );
  const department = getProfileValue(
    dbUser?.department,
    dbUser?.departamento,
    user.user_metadata?.department,
    user.user_metadata?.departamento,
  );
  const area = getProfileValue(
    dbUser?.area,
    user.user_metadata?.area,
  );
  const site = getProfileValue(
    dbUser?.site,
    dbUser?.sede,
    user.user_metadata?.site,
    user.user_metadata?.sede,
  );
  const phone = getProfileValue(
    dbUser?.phone,
    dbUser?.telefono,
    user.phone,
    user.user_metadata?.phone,
    user.user_metadata?.telefono,
  );

  const encryptedRoleToken = cookieStore.get("ur-token")?.value;
  let role = encryptedRoleToken ? await decryptRole(encryptedRoleToken) : null;

  if (!role) {
    role =
      dbUser?.role ||
      dbUser?.rol ||
      dbUser?.tipo ||
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
    email: user.email,
    position,
    department,
    area,
    site,
    phone,
    emailVerified: Boolean(user.email_confirmed_at || user.confirmed_at),
  });
}