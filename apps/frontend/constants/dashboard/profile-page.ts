import { ROUTES } from "@/constants/routes";

export const PROFILE_PAGE_TABS = [
  { id: "overview" },
  { id: "verification" },
  { id: "legal" },
  { id: "security" },
  { id: "settings" },
] as const;

export type ProfilePageTabId = (typeof PROFILE_PAGE_TABS)[number]["id"];

export function profileDashboardHref(tab: ProfilePageTabId): string {
  const u = new URLSearchParams();
  u.set("tab", tab);
  return `${ROUTES.dashboardProfile}?${u.toString()}`;
}

export function parseProfilePageTabParam(raw: string | null): ProfilePageTabId {
  if (!raw) return "overview";
  return PROFILE_PAGE_TABS.some((t) => t.id === raw) ? (raw as ProfilePageTabId) : "overview";
}
