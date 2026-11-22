import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encryptRole } from "../../lib/session";

function normalizeRole(val: unknown): string {
  if (!val) return "";
  return String(val)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isTecnicoOrAdmin(roleStr: string): boolean {
  const norm = normalizeRole(roleStr);
  return (
    norm === "tecnico" ||
    norm === "admin" ||
    norm === "administrador" ||
    norm.includes("tecnico") ||
    norm.includes("admin")
  );
}

function formatPhoneE164(rawPhone: string): string {
  const cleaned = rawPhone.replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+52${cleaned}`;
  return `+${cleaned}`;
}

function getLookupClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, key);
}

/* ---------- GET: Verificar disponibilidad de username en tiempo real ---------- */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUsername = searchParams.get("username") || "";
  const cleanUsername = rawUsername.replace(/^@/, "").trim();

  if (!/^[a-zA-Z0-9._]{3,20}$/.test(cleanUsername)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  try {
    const supabaseLookup = getLookupClient();
    const { data, error } = await supabaseLookup
      .from("users")
      .select("id")
      .ilike("username", cleanUsername)
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

/* ---------- POST: Registro de usuario ---------- */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await request.json();
    const { email, password, name, username, phone } = body;

    if (!email || !password || !name || !username || !phone) {
      return NextResponse.json(
        { estado: "Error", mensaje: "Todos los campos son obligatorios" },
        { status: 400 },
      );
    }

    const cleanName = String(name).trim();
    const cleanUsername = String(username).replace(/^@/, "").trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = String(phone).trim();
    const phoneDigits = cleanPhone.replace(/\D/g, "");
    const e164Phone = formatPhoneE164(cleanPhone);

    if (!/^[a-zA-ZÁÉÍÓÚáéíóúÑñÜü\s]{2,50}$/.test(cleanName)) {
      return NextResponse.json(
        { estado: "Error", mensaje: "El nombre ingresado no es válido." },
        { status: 400 },
      );
    }

    if (!/^[a-zA-Z0-9._]{3,20}$/.test(cleanUsername)) {
      return NextResponse.json(
        {
          estado: "Error",
          mensaje:
            "El nombre de usuario debe tener entre 3 y 20 caracteres válidos.",
        },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
      return NextResponse.json(
        {
          estado: "Error",
          mensaje: "El formato del correo electrónico no es válido.",
        },
        { status: 400 },
      );
    }

    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return NextResponse.json(
        {
          estado: "Error",
          mensaje: "El teléfono debe contener entre 10 y 15 dígitos.",
        },
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
          estado: "Error",
          mensaje:
            "La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.",
        },
        { status: 400 },
      );
    }

    // 1. Verificar que el username no exista ya en la base de datos
    const supabaseLookup = getLookupClient();
    const { data: existingUsername } = await supabaseLookup
      .from("users")
      .select("id")
      .ilike("username", cleanUsername)
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json(
        {
          estado: "Error",
          mensaje: "Este nombre de usuario ya está en uso. Elige otro.",
          campo: "username",
        },
        { status: 409 },
      );
    }

    // 2. Registrar usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          name: cleanName,
          username: cleanUsername,
          phone: cleanPhone,
          telefono: cleanPhone,
          role: "usuario",
        },
      },
    });

    if (error) {
      let mensajeUsuario = "Error al registrar el usuario";
      let statusCode = 400;

      switch (error.code) {
        case "user_already_exists":
        case "email_exists":
          mensajeUsuario = "El correo electrónico ya está registrado.";
          statusCode = 409;
          break;
        case "weak_password":
          mensajeUsuario =
            "La contraseña es demasiado débil (mínimo 6 caracteres).";
          statusCode = 400;
          break;
        case "email_address_invalid":
          mensajeUsuario = "El formato del correo electrónico no es válido.";
          statusCode = 400;
          break;
        case "over_email_send_rate_limit":
        case "over_request_rate_limit":
          mensajeUsuario =
            "Demasiados intentos. Por favor, espera unos minutos e intenta de nuevo.";
          statusCode = 429;
          break;
        default:
          mensajeUsuario = "Ocurrió un error inesperado al crear la cuenta.";
          statusCode = 400;
          break;
      }

      return NextResponse.json(
        {
          estado: "Error 🔴",
          mensaje: mensajeUsuario,
          detalle: error.message,
          codigoError: error.code,
        },
        { status: statusCode },
      );
    }

    if (data.session && data.user && e164Phone) {
      try {
        const authSessionClient = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        await authSessionClient.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        await authSessionClient.auth.updateUser({ phone: e164Phone });
      } catch (phoneErr) {
        console.error("No se pudo actualizar auth.users.phone:", phoneErr);
      }
    }

    if (data.user) {
      try {
        const clientForInsert = data.session?.access_token
          ? createClient(supabaseUrl, supabaseKey, {
              global: {
                headers: {
                  Authorization: `Bearer ${data.session.access_token}`,
                },
              },
            })
          : supabaseLookup;

        await clientForInsert.from("users").upsert({
          id: data.user.id,
          email: cleanEmail,
          username: cleanUsername,
          name: cleanName,
          role: "usuario",
        });
      } catch (err) {
        console.error("Error al registrar en tabla users:", err);
      }
    }

    if (data.session && data.user) {
      let rawRole = "usuario";

      const authClient = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        },
      });

      try {
        const { data: dbUserAuth } = await authClient
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        if (dbUserAuth) {
          rawRole = dbUserAuth.role || dbUserAuth.rol || dbUserAuth.tipo || rawRole;
        }
      } catch (e) {
        console.error("Error consultando rol:", e);
      }

      const cleanRole = normalizeRole(rawRole);
      const hasTecnicoOrAdmin = isTecnicoOrAdmin(rawRole);

      let finalRole = "usuario";
      if (hasTecnicoOrAdmin) {
        finalRole = cleanRole.includes("admin") ? "admin" : "tecnico";
      }

      const redirectTo =
        finalRole === "admin"
          ? "/web"
          : finalRole === "tecnico"
            ? "/soporte/dashboard"
            : "/portal/dashboard";

      const encryptedRole = await encryptRole(finalRole);
      const cookieStore = await cookies();

      cookieStore.set({
        name: "sb-access-token",
        value: data.session.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      cookieStore.set({
        name: "sb-refresh-token",
        value: data.session.refresh_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      cookieStore.set({
        name: "ur-token",
        value: encryptedRole,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return NextResponse.json({
        estado: "Conexión Exitosa",
        mensaje: "Registro y login correctos",
        data: data.user,
        role: finalRole,
        redirectTo: redirectTo,
      });
    }

    return NextResponse.json({
      estado: "Registro Exitoso",
      mensaje: "Usuario registrado. Por favor verifica tu correo electrónico.",
      data: data.user,
      redirectTo: "/login",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { estado: "Error de Conexión 🔴", mensaje: message },
      { status: 500 },
    );
  }
}