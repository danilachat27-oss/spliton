import type { PermissionArea, PermissionLevel } from "@/features/admin/config/admin-permissions";
import {
  canBlockUsers,
  canPatchPlatformFees,
} from "@/features/admin/config/admin-rbac";
import {
  canMatrixAction,
  effectiveMatrixLevel,
  isBusinessAnalystReadOnly,
  type AdminMatrixAction,
  type AdminMatrixSection,
} from "@/features/admin/config/admin-role-matrix";

export type AdminAction = "view" | "create" | "update" | "delete" | "approve" | "reject" | "export";

const AREA_TO_MATRIX: Record<PermissionArea, AdminMatrixSection> = {
  Users: "users",
  Roles: "roles",
  Tracks: "tracks",
  Rounds: "rounds",
  Holdings: "holdings",
  Wallets: "wallets",
  Deposits: "deposits",
  Withdrawals: "withdrawals",
  Revenue: "revenue",
  "Secondary Market": "secondaryMarket",
  "Platform Revenue": "platformRevenue",
  Reports: "reports",
  Support: "support",
  Compliance: "compliance",
  Settings: "settings",
  "Audit Log": "audit",
};

function toMatrixAction(action: AdminAction): AdminMatrixAction {
  switch (action) {
    case "view":
      return "view";
    case "export":
      return "export";
    case "approve":
      return "approve";
    case "create":
    case "update":
    case "delete":
    case "reject":
      return "mutate";
    default:
      return "view";
  }
}

export function getPermissionLevel(
  roles: string[] | undefined,
  area: PermissionArea,
): PermissionLevel {
  if (!roles?.length) return "none";
  const section = AREA_TO_MATRIX[area];
  const level = effectiveMatrixLevel(roles, section);
  return level === "none" ? "none" : level;
}

export function canPerformAdminAction(
  roles: string[] | undefined,
  area: PermissionArea,
  action: AdminAction,
): boolean {
  if (!roles?.length) return false;
  if (isBusinessAnalystReadOnly(roles) && action !== "view" && action !== "export") {
    return false;
  }
  if (area === "Users") {
    if (action === "view" || action === "export") {
      return canMatrixAction(roles, "users", toMatrixAction(action));
    }
    if (action === "update" || action === "delete") {
      return canBlockUsers(roles);
    }
    return false;
  }
  if (area === "Settings" && (action === "update" || action === "create" || action === "delete")) {
    return canPatchPlatformFees(roles);
  }
  const section = AREA_TO_MATRIX[area];
  return canMatrixAction(roles, section, toMatrixAction(action));
}

export {
  canAssignUserRoles,
  canRemoveUserRoles,
  canBlockUsers,
  canPatchPlatformFees,
} from "@/features/admin/config/admin-rbac";

export function isReadOnlyAdminArea(
  roles: string[] | undefined,
  area: PermissionArea,
): boolean {
  return getPermissionLevel(roles, area) === "read";
}

export type UserDetailTab =
  | "overview"
  | "account"
  | "security"
  | "roles"
  | "wallet"
  | "audit"
  | "risk"
  | "support";

export function canAccessUserDetailTab(
  roles: string[] | undefined,
  tab: UserDetailTab,
): boolean {
  if (!roles?.length) return false;
  const ok = (area: PermissionArea) => getPermissionLevel(roles, area) !== "none";
  switch (tab) {
    case "overview":
    case "account":
    case "roles":
      return ok("Users");
    case "security":
      return ok("Users");
    case "wallet":
      return ok("Wallets");
    case "audit":
      return ok("Audit Log");
    case "risk":
      return ok("Compliance");
    case "support":
      return ok("Support");
    default:
      return false;
  }
}

export function visibleUserDetailTabs(roles: string[] | undefined): UserDetailTab[] {
  const order: UserDetailTab[] = [
    "overview",
    "account",
    "security",
    "roles",
    "wallet",
    "audit",
    "risk",
    "support",
  ];
  return order.filter((t) => canAccessUserDetailTab(roles, t));
}
