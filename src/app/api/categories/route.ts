import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptRole } from "../../lib/session";

type UserRole = "usuario" | "tecnico" | "admin";

function normalizeRole(val: unknown): UserRole {
  const norm = String(val || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (norm.includes("admin")) return "admin";
  if (norm.includes("tecnic")) return "tecnico";
  return "usuario";
}

async function getAuthContext() {
  const cookieStore = await cookies();
  let token = cookieStore.get("sb-access-token")?.value;
  const refreshToken = cookieStore.get("sb-refresh-token")?.value;

  if (!token && !refreshToken) {
    console.error("401: No se encontraron cookies de sesión");
    return null;
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

  // Si el access_token expiró o no está presente, renovar usando sb-refresh-token
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
    } else {
      console.error("401: No se pudo renovar la sesión:", refreshError?.message);
    }
  }

  if (!user) {
    return null;
  }

  const encryptedRole = cookieStore.get("ur-token")?.value;
  let roleStr = encryptedRole ? await decryptRole(encryptedRole) : null;

  if (!roleStr) {
    const { data: dbUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    roleStr = dbUser?.role || user.user_metadata?.role || "usuario";
  }

  return {
    supabase,
    user,
    role: normalizeRole(roleStr),
  };
}

// GET /api/categories -> Consultar categorías (cualquier usuario autenticado)
export async function GET(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { supabase, role } = auth;
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("all") === "true";

    let query = supabase
      .from("category")
      .select("id, name, description, active")
      .order("name", { ascending: true });

    // Si no es admin o no pidió ?all=true, devolver solo categorías activas
    if (!includeInactive || role !== "admin") {
      query = query.eq("active", true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Error al obtener las categorías", detalle: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ categories: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error interno del servidor", detalle: err.message },
      { status: 500 }
    );
  }
}

// POST /api/categories -> Crear una nueva categoría (solo admin)
export async function POST(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (auth.role !== "admin") {
      return NextResponse.json(
        { error: "Solo los administradores pueden crear categorías" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, active = true } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre (name) de la categoría es obligatorio" },
        { status: 400 }
      );
    }

    const { data: newCategory, error } = await auth.supabase
      .from("category")
      .insert({
        name: name.trim(),
        description: description ? String(description).trim() : null,
        active: Boolean(active),
      })
      .select("id, name, description, active")
      .single();

    if (error) {
      // Código 23505 en PostgreSQL corresponde a violación de restricción UNIQUE (category_name_key)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Ya existe una categoría con ese nombre" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Error al crear la categoría", detalle: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        mensaje: "Categoría creada correctamente",
        category: newCategory,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error interno del servidor", detalle: err.message },
      { status: 500 }
    );
  }
}