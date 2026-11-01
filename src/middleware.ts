import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decryptRole, encryptRole } from "./app/lib/session";

function normalizeRole(val: any): string {
  if (!val) return "";
  return String(val)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isTecnicoOrAdminRole(roleStr: string): boolean {
  const norm = normalizeRole(roleStr);
  return (
    norm === "tecnico" ||
    norm === "admin" ||
    norm === "administrador" ||
    norm.includes("tecnic") ||
    norm.includes("admin")
  );
}

async function fetchDbRole(token: string): Promise<string> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const authClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error,
    } = await authClient.auth.getUser(token);
    if (error || !user) return "user";

    const metaRole =
      user.user_metadata?.role ||
      user.user_metadata?.rol ||
      user.user_metadata?.tipo ||
      user.app_metadata?.role ||
      user.app_metadata?.rol ||
      user.app_metadata?.tipo;

    if (metaRole && isTecnicoOrAdminRole(metaRole)) {
      return normalizeRole(metaRole).includes("admin") ? "admin" : "tecnico";
    }

    const { data: dbUser } = await authClient
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (dbUser) {
      const r = dbUser.role || dbUser.rol || dbUser.tipo;
      if (r)
        return isTecnicoOrAdminRole(r)
          ? normalizeRole(r).includes("admin")
            ? "admin"
            : "tecnico"
          : "usuario";
    }

    if (user.email) {
      const { data: dbUserEmail } = await authClient
        .from("users")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (dbUserEmail) {
        const r = dbUserEmail.role || dbUserEmail.rol || dbUserEmail.tipo;
        if (r)
          return isTecnicoOrAdminRole(r)
            ? normalizeRole(r).includes("admin")
              ? "admin"
              : "tecnico"
            : "usuario";
      }
    }

    if (metaRole) {
      return normalizeRole(metaRole);
    }
  } catch (e) {
    console.error("Error fetching db role in middleware:", e);
  }
  return "usuario";
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const token = request.cookies.get("sb-access-token")?.value;
  const encryptedRoleCookie = request.cookies.get("ur-token")?.value;

  /*
  // ---------------------------------------------------------------------------------------------------------------------------------------------------------
  // TESTING COOKIES
  console.log("=== TODAS MIS COOKIES ===");
  const todasLasCookies = request.cookies.getAll();

  todasLasCookies.forEach((cookie) => {
    console.log(`\nNombre: ${cookie.name}`);
    console.log(`Valor: ${cookie.value}`);

    // Decodifica automáticamente cualquier cookie que sea un JWT (empiezan con eyJ)
    if (cookie.value.startsWith("eyJ")) {
      try {
        // Extrae la sección intermedia del token (el payload) y la pasa a texto plano
        const base64Payload = cookie.value.split(".")[1];
        const payload = JSON.parse(
          Buffer.from(base64Payload, "base64").toString(),
        );
        console.log("\nContenido interno (Texto plano):", payload);
      } catch (e) {
        console.log("Contenido interno: (No es un JWT válido o legible)");
      }
    }
    console.log("---------------------------------------------------");
  });

  // ---------------------------------------------------------------------------------------------------------------------------------------------------------
*/
  if (!token && (path.startsWith("/portal") || path.startsWith("/soporte"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let role = encryptedRoleCookie
    ? await decryptRole(encryptedRoleCookie)
    : null;
  let shouldUpdateCookie = false;

  if (token) {
    if (!role || (!isTecnicoOrAdminRole(role) && path.startsWith("/portal"))) {
      const freshRole = await fetchDbRole(token);
      if (freshRole !== role) {
        role = freshRole;
        shouldUpdateCookie = true;
      }
    }
  }

  if (token && role) {
    const isTecnicoOrAdmin = isTecnicoOrAdminRole(role);
    const allowedHome = isTecnicoOrAdmin
      ? "/portal/dashboard"
      : "/soporte/dashboard";

    let profileRedirect: string | null = null;
    if (path === "/portal/profile" || path === "/portal/profile/") {
      profileRedirect = isTecnicoOrAdmin
        ? "/portal/profile/tecnico"
        : "/portal/profile/usuario";
    } else if (path === "/portal/profile/usuario" && isTecnicoOrAdmin) {
      profileRedirect = "/portal/profile/tecnico";
    } else if (path === "/portal/profile/tecnico" && !isTecnicoOrAdmin) {
      profileRedirect = "/portal/profile/usuario";
    }

    if (profileRedirect) {
      const redirectProfile = NextResponse.redirect(
        new URL(profileRedirect, request.url),
      );
      if (shouldUpdateCookie) {
        const newEncryptedRole = await encryptRole(role);
        redirectProfile.cookies.set("ur-token", newEncryptedRole, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
      return redirectProfile;
    }

    if (path === "/soporte" || path === "/soporte/") {
      return NextResponse.redirect(new URL(allowedHome, request.url));
    }
    if (path === "/portal" || path === "/portal/") {
      return NextResponse.redirect(new URL(allowedHome, request.url));
    }

    if (path === "/login" || path === "/register") {
      const redirectHome = NextResponse.redirect(
        new URL(allowedHome, request.url),
      );
      if (shouldUpdateCookie) {
        const newEncryptedRole = await encryptRole(role);
        redirectHome.cookies.set("ur-token", newEncryptedRole, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
      return redirectHome;
    }

    const isProfileRoute =
      path === "/portal/profile/usuario" || path === "/portal/profile/tecnico";
    if (!isTecnicoOrAdmin && path.startsWith("/portal") && !isProfileRoute) {
      const redirectSoporte = NextResponse.redirect(
        new URL("/soporte/dashboard", request.url),
      );
      if (shouldUpdateCookie) {
        const newEncryptedRole = await encryptRole(role);
        redirectSoporte.cookies.set("ur-token", newEncryptedRole, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
      return redirectSoporte;
    }

    if (isTecnicoOrAdmin && path.startsWith("/soporte")) {
      const redirectPortal = NextResponse.redirect(
        new URL("/portal/dashboard", request.url),
      );
      if (shouldUpdateCookie) {
        const newEncryptedRole = await encryptRole(role);
        redirectPortal.cookies.set("ur-token", newEncryptedRole, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
      return redirectPortal;
    }
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (shouldUpdateCookie && role) {
    const newEncryptedRole = await encryptRole(role);
    response.cookies.set("ur-token", newEncryptedRole, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/soporte/:path*", "/login", "/register"],
};
