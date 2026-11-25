import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decryptRole, encryptRole } from "./app/lib/session";

type UserRole = "usuario" | "tecnico" | "admin";

function normalizeRole(val: unknown): string {
  if (!val) return "";
  return String(val)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function canonicalRole(roleStr: unknown): UserRole {
  const norm = normalizeRole(roleStr);
  if (norm.includes("admin")) return "admin";
  if (norm.includes("tecnic")) return "tecnico";
  return "usuario";
}

function getAreaForRole(role: UserRole): "portal" | "soporte" | "web" {
  if (role === "admin") return "web";
  if (role === "tecnico") return "soporte";
  return "portal";
}

function getAreaFromPath(path: string): "portal" | "soporte" | "web" | null {
  if (path === "/portal" || path.startsWith("/portal/")) return "portal";
  if (path === "/soporte" || path.startsWith("/soporte/")) return "soporte";
  if (path === "/web" || path.startsWith("/web/")) return "web";
  return null;
}

function getHomeForRole(role: UserRole): string {
  if (role === "admin") return "/web/dashboard";
  if (role === "tecnico") return "/soporte/dashboard";
  return "/portal/dashboard";
}

function getRoleFromRecord(record: Record<string, unknown> | null): UserRole | null {
  if (!record) return null;
  const role = record.role || record.rol || record.tipo;
  return role ? canonicalRole(role) : null;
}

async function resolveSessionAndRole(
  token?: string,
  refreshToken?: string
): Promise<{
  role: UserRole;
  valid: boolean;
  newTokens?: { accessToken: string; refreshToken: string };
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    let activeToken = token;
    let newTokens: { accessToken: string; refreshToken: string } | undefined;

    let authClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
      },
    });

    let user = null;

    if (activeToken) {
      const { data, error } = await authClient.auth.getUser(activeToken);
      if (!error && data.user) {
        user = data.user;
      }
    }

    // Si el access_token expiró o no existe, intentar renovar con refresh_token
    if (!user && refreshToken) {
      const { data: refreshed, error: refreshError } =
        await authClient.auth.refreshSession({ refresh_token: refreshToken });

      if (!refreshError && refreshed.session && refreshed.user) {
        user = refreshed.user;
        activeToken = refreshed.session.access_token;
        newTokens = {
          accessToken: refreshed.session.access_token,
          refreshToken: refreshed.session.refresh_token,
        };

        authClient = createClient(supabaseUrl, supabaseKey, {
          global: {
            headers: {
              Authorization: `Bearer ${activeToken}`,
            },
          },
        });
      }
    }

    if (!user) {
      return { role: "usuario", valid: false };
    }

    const { data: dbUser, error: dbUserError } = await authClient
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (dbUserError) {
      console.error("Error consultando rol en users por id:", dbUserError);
    }

    const dbRole = getRoleFromRecord(dbUser);
    if (dbRole) return { role: dbRole, valid: true, newTokens };

    if (user.email) {
      const { data: dbUserEmail, error: dbUserEmailError } = await authClient
        .from("users")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (dbUserEmailError) {
        console.error("Error consultando rol en users por correo:", dbUserEmailError);
      }

      const dbEmailRole = getRoleFromRecord(dbUserEmail);
      if (dbEmailRole) return { role: dbEmailRole, valid: true, newTokens };
    }

    const metaRole =
      user.user_metadata?.role ||
      user.user_metadata?.rol ||
      user.user_metadata?.tipo ||
      user.app_metadata?.role ||
      user.app_metadata?.rol ||
      user.app_metadata?.tipo;

    return { role: canonicalRole(metaRole), valid: true, newTokens };
  } catch (e) {
    console.error("Error fetching db role in middleware:", e);
  }
  return { role: "usuario", valid: false };
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const token = request.cookies.get("sb-access-token")?.value;
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;
  const encryptedRoleCookie = request.cookies.get("ur-token")?.value;

  const requestedArea = getAreaFromPath(path);
  if (!token && !refreshToken && requestedArea) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const decryptedRole = encryptedRoleCookie
    ? await decryptRole(encryptedRoleCookie)
    : null;
  let role = decryptedRole ? canonicalRole(decryptedRole) : null;
  let shouldUpdateRoleCookie = false;
  let refreshedTokens: { accessToken: string; refreshToken: string } | undefined;

  if (token || refreshToken) {
    const isAuthPage = path === "/login" || path === "/register";
    const isWrongArea =
      requestedArea !== null &&
      role !== null &&
      requestedArea !== getAreaForRole(role);

    if (!token || !role || isAuthPage || isWrongArea) {
      const sessionResult = await resolveSessionAndRole(token, refreshToken);

      if (!sessionResult.valid) {
        const loginRedirect = NextResponse.redirect(new URL("/login", request.url));
        loginRedirect.cookies.delete("sb-access-token");
        loginRedirect.cookies.delete("sb-refresh-token");
        loginRedirect.cookies.delete("ur-token");
        return requestedArea ? loginRedirect : NextResponse.next();
      }

      if (sessionResult.newTokens) {
        refreshedTokens = sessionResult.newTokens;
      }

      if (sessionResult.role !== role) {
        role = sessionResult.role;
        shouldUpdateRoleCookie = true;
      }
    }
  }

  const applySessionCookies = async (res: NextResponse) => {
    if (refreshedTokens) {
      res.cookies.set("sb-access-token", refreshedTokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      res.cookies.set("sb-refresh-token", refreshedTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    if (shouldUpdateRoleCookie && role) {
      const newEncryptedRole = await encryptRole(role);
      res.cookies.set("ur-token", newEncryptedRole, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  };

  if ((token || refreshToken) && role) {
    const allowedHome = getHomeForRole(role);
    const isAuthPage = path === "/login" || path === "/register";
    const isWrongArea =
      requestedArea !== null &&
      requestedArea !== getAreaForRole(role);
    const isAreaRoot =
      requestedArea !== null &&
      (path === `/${requestedArea}` || path === `/${requestedArea}/`);

    let redirectTo: string | null = null;
    if (isAuthPage || isWrongArea || (isAreaRoot && path !== allowedHome)) {
      redirectTo = allowedHome;
    }

    if (redirectTo) {
      const redirect = NextResponse.redirect(new URL(redirectTo, request.url));
      await applySessionCookies(redirect);
      return redirect;
    }
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  await applySessionCookies(response);

  return response;
}

export const config = {
  matcher: [
    "/portal/:path*",
    "/soporte/:path*",
    "/web/:path*",
    "/login",
    "/register",
  ],
};