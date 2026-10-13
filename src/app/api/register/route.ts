import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await request.json();
    const { email, password, name, lastname } = body;

    if (!email || !password || !name || !lastname) {
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
          lastname: lastname,
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

    if (data.session) {
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
    }

    return NextResponse.json({
      estado: "Conexión Exitosa",
      mensaje: "Registro y login correctos",
      data: data.user,
    });
  } catch (err: any) {
    return NextResponse.json(
      { estado: "Error de Conexión 🔴", mensaje: err.message },
      { status: 500 },
    );
  }
}
