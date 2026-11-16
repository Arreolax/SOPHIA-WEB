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

// Listar tickets según el rol
export async function GET(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { supabase, user, role } = auth;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const priorityFilter = searchParams.get("priority");

    let query = supabase
      .from("ticket")
      .select(`
        *,
        category:category_id ( id, name ),
        creator:created_by ( id, name, username, email ),
        assignee:assigned_to ( id, name, username, email )
      `)
      .order("created_at", { ascending: false });

    // Usuario normal: solo ve los tickets creados por él
    if (role === "usuario") {
      query = query.eq("created_by", user.id);
    }
    // Técnico y Admin: ven todos los tickets (no se aplica filtro de created_by)

    if (statusFilter) {
      query = query.eq("status", statusFilter.toUpperCase());
    }
    if (priorityFilter) {
      query = query.eq("priority", priorityFilter.toUpperCase());
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Error al obtener los tickets", detalle: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ tickets: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error interno del servidor", detalle: err.message },
      { status: 500 }
    );
  }
}

// Crear un nuevo ticket (usuario, tecnico y admin)
export async function POST(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { supabase, user } = auth;
    const body = await request.json();

    const {
      title,
      description,
      modality,
      type,
      subcategory,
      impact = "LOW",
      urgency = "LOW",
      priority = "LOW",
      category_id,
    } = body;

    if (!title || !description || !type || !category_id) {
      return NextResponse.json(
        {
          error:
            "Los campos title, description, type y category_id son obligatorios",
        },
        { status: 400 }
      );
    }

    const { data: newTicket, error } = await supabase
      .from("ticket")
      .insert({
        title: title.trim(),
        description: description.trim(),
        modality: modality.trim(),
        type: type.trim(),
        subcategory: subcategory ? subcategory.trim() : null,
        impact: String(impact).toUpperCase(),
        urgency: String(urgency).toUpperCase(),
        priority: String(priority).toUpperCase(),
        status: "OPEN",
        category_id,
        created_by: user.id,
      })
      .select(`
        *,
        category:category_id ( id, name ),
        creator:created_by ( id, name, username, email )
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Error al crear el ticket", detalle: error.message },
        { status: 400 }
      );
    }

    // Registrar estado inicial en status_history
    await supabase.from("status_history").insert({
      ticket_id: newTicket.id,
      old_status: null,
      new_status: "OPEN",
      changed_by: user.id,
    });

    return NextResponse.json(
      {
        mensaje: "Ticket creado correctamente",
        ticket: newTicket,
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