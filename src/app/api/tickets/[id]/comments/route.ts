import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptRole } from "../../../../lib/session";

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

// POST /api/tickets/[id]/comments -> Agregar comentario y/o captura al ticket
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: ticketId } = await params;
    const { supabase, user, role } = auth;

    // Soportar tanto FormData (con imagen/archivo) como JSON tradicional
    const contentType = request.headers.get("content-type") || "";
    let content = "";
    let nextStatus: string | undefined;
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      content = String(formData.get("content") || "");
      const rawStatus = formData.get("status");
      if (rawStatus) nextStatus = String(rawStatus);
      const rawFile = formData.get("file");
      if (rawFile instanceof File && rawFile.size > 0) {
        file = rawFile;
      }
    } else {
      const body = await request.json();
      content = typeof body.content === "string" ? body.content : "";
      nextStatus = body.status;
    }

    if (!content.trim() && !file) {
      return NextResponse.json(
        { error: "Debes escribir un mensaje o adjuntar una captura de pantalla" },
        { status: 400 }
      );
    }

    // 1. Verificar que el ticket exista y validar permisos
    const { data: ticket, error: ticketError } = await supabase
      .from("ticket")
      .select("id, created_by, status")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      );
    }

    if (role === "usuario" && ticket.created_by !== user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para comentar en este ticket" },
        { status: 403 }
      );
    }

    // 2. Subir captura/archivo a Supabase Storage si viene adjunto
    let attachmentMeta: {
      url: string;
      nombre: string;
      detalle: string;
      esImagen: boolean;
    } | null = null;

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "El archivo supera el límite máximo de 5 MB" },
          { status: 400 }
        );
      }

      const ext = file.name.split(".").pop() || "png";
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${ticketId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("ticket-attachments")
        .upload(storagePath, buffer, {
          contentType: file.type || "image/png",
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          {
            error: "No se pudo subir la captura de pantalla",
            detalle: uploadError.message,
          },
          { status: 400 }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("ticket-attachments")
        .getPublicUrl(storagePath);

      attachmentMeta = {
        url: publicUrlData.publicUrl,
        nombre: safeName,
        detalle: `${formatBytes(file.size)} • ${file.type.split("/")[1]?.toUpperCase() || "ARCHIVO"}`,
        esImagen: file.type.startsWith("image/"),
      };
    }

    // Guardar en content incluyendo marcador estructurado para que GET /api/tickets/[id] lo recupere automáticamente
    const textoLimpio = content.trim();
    const contenidoFinal = attachmentMeta
      ? `${textoLimpio}${textoLimpio ? "\n" : ""}[ADJUNTO:${JSON.stringify(attachmentMeta)}]`
      : textoLimpio;

    // 3. Insertar el comentario en public.comment
    const { data: newComment, error: insertError } = await supabase
      .from("comment")
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        content: contenidoFinal,
      })
      .select(`
        id,
        ticket_id,
        content,
        created_at,
        user:user_id ( id, name, username, role )
      `)
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Error al guardar el comentario", detalle: insertError.message },
        { status: 400 }
      );
    }

    // 4. Actualizar updated_at del ticket (y el estado si corresponde)
    let updatedStatus = ticket.status;

    if (
      role === "usuario" &&
      ["WAITING_USER", "PENDING", "ON_HOLD"].includes(ticket.status)
    ) {
      updatedStatus = "OPEN";
    } else if (
      (role === "tecnico" || role === "admin") &&
      nextStatus &&
      typeof nextStatus === "string"
    ) {
      updatedStatus = nextStatus.toUpperCase();
    }

    await supabase
      .from("ticket")
      .update({
        status: updatedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId);

    if (updatedStatus !== ticket.status) {
      await supabase.from("status_history").insert({
        ticket_id: ticketId,
        old_status: ticket.status,
        new_status: updatedStatus,
        changed_by: user.id,
      });
    }

    return NextResponse.json(
      {
        mensaje: "Comentario agregado correctamente",
        comment: newComment,
        attachment: attachmentMeta,
        status: updatedStatus,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const detalle = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Error interno del servidor", detalle },
      { status: 500 }
    );
  }
}