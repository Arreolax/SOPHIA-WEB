export interface UserProfile {
  id: string;
  name: string;
  username: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  emailVerified: boolean;
  status: boolean;
  notifications?: {
    cambiosEstado?: boolean;
    notifCorreo?: boolean;
    resumenSemanal?: boolean;
  };
}

export const USER_PROFILE_UPDATED_EVENT = "sophia:user-profile-updated";

function normalizeRole(role: unknown): string {
  return String(role || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getRoleHome(role: unknown): string {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole.includes("admin")) return "/web/dashboard";
  if (normalizedRole.includes("tecnic")) return "/soporte/dashboard";
  return "/portal/dashboard";
}

export function getRoleLabel(role: unknown): string {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole.includes("admin")) return "Administrador";
  if (normalizedRole.includes("tecnic")) return "Técnico";
  return "Usuario";
}
