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
  const token = cookieStore.get("sb-access-token")?.value;

  if (!token) {
    return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 },
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

  const lastname =
    dbUser?.lastname ||
    dbUser?.last_name ||
    dbUser?.apellido ||
    user.user_metadata?.lastname ||
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
      "user";
  }

  return NextResponse.json({
    id: getProfileValue(dbUser?.employee_id, dbUser?.id_empleado) || user.id,
    name,
    lastname,
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
