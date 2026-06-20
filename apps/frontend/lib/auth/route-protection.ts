import { SPLITON_SESSION_COOKIE } from "@/lib/auth/session-cookie";

/** Paths that require a session hint cookie before rendering (see middleware/proxy). */
export function isProtectedPath(pathname: string): boolean {
  if (pathname === "/assets" || pathname.startsWith("/assets/")) return true;
  if (pathname === "/dashboard/profile" || pathname.startsWith("/dashboard/profile/")) return true;
  if (pathname === "/dashboard/support" || pathname.startsWith("/dashboard/support/")) return true;
  if (pathname === "/dashboard/notifications" || pathname.startsWith("/dashboard/notifications/")) {
    return true;
  }
  if (pathname === "/dashboard/secondary-market" || pathname.startsWith("/dashboard/secondary-market/")) {
    return true;
  }
  return false;
}

export function hasSessionHintCookie(cookieValue: string | undefined): boolean {
  return cookieValue === "1";
}

export function buildLoginRedirectPath(pathname: string, search: string): string {
  const next = `${pathname}${search}`;
  return `/login?next=${encodeURIComponent(next)}`;
}

export const ROUTE_GUARD_SESSION_COOKIE = SPLITON_SESSION_COOKIE;
