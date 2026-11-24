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

  if (!user && refreshToken) {
    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (!refreshError && refreshed.session && refreshed.user) {
      user = refreshed.user;
      token = refreshed.session.access_token;

      supabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      });
    }
  }

  if (!user) return null;

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

// GET /api/knowledge -> Listar y buscar artículos de la Base de Conocimientos
export async function GET(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q")?.trim();

    let query = auth.supabase
      .from("KnowledgeArticle")
      .select("*")
      .order("match_score", { ascending: false })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,symptom_pattern.ilike.%${search}%,category.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Error al consultar la base de conocimientos", detalle: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ articles: data || [] });
  } catch (err: unknown) {
    const detalle = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error interno del servidor", detalle },
      { status: 500 }
    );
  }
}

// POST /api/knowledge -> Guardar un nuevo artículo / borrador de KB (técnicos y admin)
export async function POST(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (auth.role !== "tecnico" && auth.role !== "admin") {
      return NextResponse.json(
        { error: "Solo personal técnico o administrador puede publicar en la Base de Conocimientos" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      ticket_ref = "INC-MANUAL",
      title,
      category = "General",
      symptom_pattern,
      solution_script,
      resolution_time = "15 min",
      match_score = 95,
    } = body;

    if (!title?.trim() || !symptom_pattern?.trim() || !solution_script?.trim()) {
      return NextResponse.json(
        { error: "Título, síntoma y solución son obligatorios" },
        { status: 400 }
      );
    }

    const { data: newArticle, error } = await auth.supabase
      .from("KnowledgeArticle")
      .insert({
        ticket_ref: String(ticket_ref).trim(),
        title: title.trim(),
        category: String(category).trim(),
        symptom_pattern: symptom_pattern.trim(),
        solution_script: solution_script.trim(),
        resolution_time: String(resolution_time).trim(),
        match_score: Number(match_score) || 95,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Error al guardar el artículo en la base de conocimientos", detalle: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        mensaje: "Artículo guardado en la Base de Conocimientos",
        article: newArticle,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const detalle = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error interno del servidor", detalle },
      { status: 500 }
    );
  }
}