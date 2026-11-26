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
    const onlyMine = searchParams.get("mine") === "true";
    const onlyAssigned = searchParams.get("assigned") === "true";

    let query = supabase
      .from("ticket")
      .select(`
        *,
        category:category_id ( id, name ),
        creator:created_by ( id, name, username, email ),
        assignee:assigned_to ( id, name, username, email )
      `)
      .or("draft.is.null,draft.eq.false")
      .order("created_at", { ascending: false });

    // Usuario normal o consulta explícita de perfil (?mine=true): solo sus tickets creados
    if (role === "usuario" || onlyMine) {
      query = query.eq("created_by", user.id);
    } else if (onlyAssigned) {
      // Técnico: solo los tickets asignados a su UUID
      query = query.eq("assigned_to", user.id);
    }

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
  } catch (err: unknown) {
    const detalle = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error interno del servidor", detalle },
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

    const { supabase, user, role } = auth;
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
      draft = false,
      created_by,
      assigned_to,
    } = body;

    const isDraft = draft === true || Number(draft) === 1;

    // category_id es NOT NULL en public.ticket
    if (!category_id) {
      return NextResponse.json(
        { error: "El campo category_id es obligatorio" },
        { status: 400 }
      );
    }

    if (!isDraft && (!title || !description || !type)) {
      return NextResponse.json(
        {
          error:
            "Los campos title, description, type y category_id son obligatorios",
        },
        { status: 400 }
      );
    }

    if (isDraft && !title?.trim() && !description?.trim()) {
      return NextResponse.json(
        {
          error:
            "Ingresa al menos un título o una descripción para guardar el borrador",
        },
        { status: 400 }
      );
    }

    // Solo el admin puede crear tickets en nombre de otro usuario o pre-asignar técnico
    const creatorId = role === "admin" && created_by ? created_by : user.id;
    const assigneeId = role === "admin" && assigned_to ? assigned_to : null;

    const { data: newTicket, error } = await supabase
      .from("ticket")
      .insert({
        title: title?.trim() || "Borrador sin título",
        description: description?.trim() || "",
        modality: modality,
        type: type ? type.trim() : "INCIDENTE",
        subcategory: subcategory ? subcategory.trim() : null,
        impact: String(impact).toUpperCase(),
        urgency: String(urgency).toUpperCase(),
        priority: String(priority).toUpperCase(),
        status: "OPEN",
        category_id,
        created_by: creatorId,
        assigned_to: assigneeId,
        draft: isDraft,
      })
      .select(`
        *,
        category:category_id ( id, name ),
        creator:created_by ( id, name, username, email ),
        assignee:assigned_to ( id, name, username, email )
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Error al crear el ticket", detalle: error.message },
        { status: 400 }
      );
    }

    if (!isDraft) {
      await supabase.from("status_history").insert({
        ticket_id: newTicket.id,
        old_status: null,
        new_status: "OPEN",
        changed_by: user.id,
      });
    }

    return NextResponse.json(
      {
        mensaje: isDraft
          ? "Borrador guardado correctamente"
          : "Ticket creado correctamente",
        ticket: newTicket,
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

// Actualización por lote (ej. cambiar prioridad desde la vista del técnico)
export async function PATCH(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { supabase, user, role } = auth;
    if (role === "usuario") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { ticketIds, priority, reason } = body as {
      ticketIds?: string[];
      priority?: string;
      reason?: string;
    };

    if (!Array.isArray(ticketIds) || ticketIds.length === 0 || !priority) {
      return NextResponse.json(
        { error: "Se requieren ticketIds y priority" },
        { status: 400 }
      );
    }

    const newPriority = priority.toUpperCase();

    // Obtener prioridades actuales para registrar historial
    const { data: actuales } = await supabase
      .from("ticket")
      .select("id, priority")
      .in("id", ticketIds);

    const { error: updateError } = await supabase
      .from("ticket")
      .update({
        priority: newPriority,
        updated_at: new Date().toISOString(),
      })
      .in("id", ticketIds);

    if (updateError) {
      return NextResponse.json(
        { error: "Error al actualizar tickets", detalle: updateError.message },
        { status: 400 }
      );
    }

    if (actuales && actuales.length > 0) {
      const historial = actuales
        .filter((t) => t.priority !== newPriority)
        .map((t) => ({
          ticket_id: t.id,
          old_priority: t.priority,
          new_priority: newPriority,
          changed_by: user.id,
          reason: reason || "Actualización por lote desde panel técnico",
        }));

      if (historial.length > 0) {
        await supabase.from("priority_history").insert(historial);
      }
    }

    return NextResponse.json({ mensaje: "Tickets actualizados correctamente" });
  } catch (err: unknown) {
    const detalle = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error interno del servidor", detalle },
      { status: 500 }
    );
  }
}