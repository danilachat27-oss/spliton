import {
  canMatrixAction,
  effectiveMatrixLevel,
} from "@/features/admin/config/admin-role-matrix";

const CATEGORY_MANAGERS = new Set(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);

const ARTICLE_PUBLISHERS = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "CONTENT_MANAGER",
  "SUPPORT_MANAGER",
]);

export function canViewHelpCenter(roles?: string[]): boolean {
  return effectiveMatrixLevel(roles ?? [], "helpCenter") !== "none";
}

export function canManageHelpCategories(roles?: string[]): boolean {
  return roles?.some((r) => CATEGORY_MANAGERS.has(r)) ?? false;
}

export function canMutateHelpArticles(roles?: string[]): boolean {
  return canMatrixAction(roles, "helpCenter", "mutate");
}

export function canPublishHelpArticles(roles?: string[]): boolean {
  return roles?.some((r) => ARTICLE_PUBLISHERS.has(r)) ?? false;
}

export function canDeleteHelpContent(roles?: string[]): boolean {
  return canManageHelpCategories(roles);
}
