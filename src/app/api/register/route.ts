import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encryptRole } from "../../lib/session";

function normalizeRole(val: any): string {
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

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await request.json();
    const { email, password, name, username } = body;

    if (!email || !password || !name || !username) {
      return NextResponse.json(
        { estado: "Error", mensaje: "Todos los campos son obligatorios" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name,
          username: username,
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
          : supabase;

        await clientForInsert.from("users").upsert({
          id: data.user.id,
          email: email,
          username: username,
          name: name,
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

      // 1. Token de acceso
      cookieStore.set({
        name: "sb-access-token",
        value: data.session.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      // 2. Token de renovación
      cookieStore.set({
        name: "sb-refresh-token",
        value: data.session.refresh_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      // 3. Rol encriptado
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

    if (data.session) {
      return NextResponse.json(
        {
          estado: "Error",
          mensaje: "No se pudo identificar al usuario registrado.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      estado: "Registro Exitoso",
      mensaje: "Usuario registrado. Por favor verifica tu correo electrónico.",
      data: data.user,
      redirectTo: "/login",
    });

  } catch (err: any) {
    return NextResponse.json(
      { estado: "Error de Conexión 🔴", mensaje: err.message },
      { status: 500 },
    );
  }
}