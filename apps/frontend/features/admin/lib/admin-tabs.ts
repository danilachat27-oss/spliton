export const ADMIN_TAB_IDS = [
  "overview",
  "releases",
  "investors",
  "finances",
  "payouts",
  "market",
  "audit",
] as const;

export type AdminTabId = (typeof ADMIN_TAB_IDS)[number];

const LEGACY_TAB: Record<string, AdminTabId> = {
  dashboard: "overview",
  users: "investors",
  transactions: "finances",
};

export function parseAdminTabParam(value: string | null): AdminTabId {
  if (!value) {
    return "overview";
  }
  if ((ADMIN_TAB_IDS as readonly string[]).includes(value)) {
    return value as AdminTabId;
  }
  return LEGACY_TAB[value] ?? "overview";
}
