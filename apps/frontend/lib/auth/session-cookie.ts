/**
 * Non-sensitive session hint for Next.js middleware route guards.
 * Real auth is enforced by backend JWT; this cookie only avoids serving protected shells to guests.
 */
export const SPLITON_SESSION_COOKIE = "spliton_session";

const MAX_AGE_SEC = 7 * 24 * 60 * 60;

export function setSessionHintCookie(): void {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SPLITON_SESSION_COOKIE}=1; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

export function clearSessionHintCookie(): void {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SPLITON_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
