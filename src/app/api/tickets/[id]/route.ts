import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptRole } from "../../../lib/session";

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

// GET /api/tickets/[id] -> Obtener detalle de un ticket
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { supabase, user, role } = auth;

    const { data: ticket, error } = await supabase
      .from("ticket")
      .select(`
        *,
        category:category_id ( id, name ),
        creator:created_by ( id, name, username, email ),
        assignee:assigned_to ( id, name, username, email ),
        comments:comment ( id, content, created_at, user:user_id ( id, name, username, role ) ),
        attachments:attachment ( id, file_name, file_type, file_size, file_path, uploaded_at )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !ticket) {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      );
    }

    // Validar que el usuario normal solo vea sus propios tickets
    if (role === "usuario" && ticket.created_by !== user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para ver este ticket" },
        { status: 403 }
      );
    }

    return NextResponse.json({ ticket });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error interno del servidor", detalle: err.message },
      { status: 500 }
    );
  }
}

// PATCH /api/tickets/[id] -> Asignar, cambiar estado y editar ticket
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { supabase, user, role } = auth;
    const body = await request.json();

    // Obtener estado actual del ticket
    const { data: currentTicket, error: fetchError } = await supabase
      .from("ticket")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !currentTicket) {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      );
    }

    // Permisos para rol "usuario":
    // Solo puede reabrir su propio ticket si está cerrado/resuelto
    if (role === "usuario") {
      if (currentTicket.created_by !== user.id) {
        return NextResponse.json(
          { error: "No tienes permiso para modificar este ticket" },
          { status: 403 }
        );
      }

      const targetStatus = String(body.status || "").toUpperCase();

      if (targetStatus === "CLOSED") {
        if (currentTicket.status === "CLOSED") {
          return NextResponse.json(
            { error: "Este ticket ya se encuentra cerrado" },
            { status: 400 }
          );
        }

        const { data: closedTicket, error: closeErr } = await supabase
          .from("ticket")
          .update({ status: "CLOSED", updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();

        if (closeErr) {
          return NextResponse.json({ error: closeErr.message }, { status: 400 });
        }

        await supabase.from("status_history").insert({
          ticket_id: id,
          old_status: currentTicket.status,
          new_status: "CLOSED",
          changed_by: user.id,
        });

        return NextResponse.json({
          mensaje: "Ticket cerrado correctamente",
          ticket: closedTicket,
        });
      }

      return NextResponse.json(
        {
          error:
            "Los usuarios solo pueden cerrar sus tickets. Si necesitas reabrir un caso, por favor crea un nuevo ticket.",
        },
        { status: 403 }
      );
    }

    // Permisos para "tecnico" y "admin"
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Campos que técnico y admin pueden modificar (asignación, estado, diagnóstico, resolución)
    if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
    if (body.status !== undefined) updates.status = String(body.status).toUpperCase();
    if (body.diagnosis !== undefined) updates.diagnosis = body.diagnosis;
    if (body.resolution !== undefined) updates.resolution = body.resolution;
    if (body.priority !== undefined) updates.priority = String(body.priority).toUpperCase();
    if (body.impact !== undefined) updates.impact = String(body.impact).toUpperCase();
    if (body.urgency !== undefined) updates.urgency = String(body.urgency).toUpperCase();

    // Campos adicionales que solo el admin puede editar directamente
    if (role === "admin") {
      if (body.title !== undefined) updates.title = body.title.trim();
      if (body.description !== undefined) updates.description = body.description.trim();
      if (body.type !== undefined) updates.type = body.type.trim();
      if (body.subcategory !== undefined) updates.subcategory = body.subcategory;
      if (body.category_id !== undefined) updates.category_id = body.category_id;
    }

    const { data: updatedTicket, error: updateError } = await supabase
      .from("ticket")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        category:category_id ( id, name ),
        creator:created_by ( id, name, username, email ),
        assignee:assigned_to ( id, name, username, email )
      `)
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Error al actualizar el ticket", detalle: updateError.message },
        { status: 400 }
      );
    }

    // 1. Guardar historial si cambió el estado
    if (updates.status && updates.status !== currentTicket.status) {
      await supabase.from("status_history").insert({
        ticket_id: id,
        old_status: currentTicket.status,
        new_status: updates.status,
        changed_by: user.id,
      });

      // Si se reabre desde cerrado/resuelto, registrar en ticket_reopen_log
      if (
        updates.status === "OPEN" &&
        (currentTicket.status === "CLOSED" || currentTicket.status === "RESOLVED")
      ) {
        await supabase.from("ticket_reopen_log").insert({
          ticket_id: id,
          reopened_by: user.id,
          reason: body.reason || "Reabierto por soporte/administrador",
        });
      }
    }

    // 2. Guardar historial si se asignó o reasignó a alguien
    if (
      updates.assigned_to &&
      updates.assigned_to !== currentTicket.assigned_to
    ) {
      await supabase.from("assignment_history").insert({
        ticket_id: id,
        assigned_to: updates.assigned_to,
        assigned_by: user.id,
      });
    }

    // 3. Guardar historial si cambió la prioridad
    if (updates.priority && updates.priority !== currentTicket.priority) {
      await supabase.from("priority_history").insert({
        ticket_id: id,
        old_priority: currentTicket.priority,
        new_priority: updates.priority,
        changed_by: user.id,
        reason: body.reason || null,
      });
    }

    return NextResponse.json({
      mensaje: "Ticket actualizado correctamente",
      ticket: updatedTicket,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error interno del servidor", detalle: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/tickets/[id] -> Eliminar ticket (solo admin)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (auth.role !== "admin") {
      return NextResponse.json(
        { error: "Solo los administradores pueden eliminar tickets" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { error } = await auth.supabase
      .from("ticket")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Error al eliminar el ticket", detalle: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      mensaje: "Ticket eliminado correctamente",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error interno del servidor", detalle: err.message },
      { status: 500 }
    );
  }
}