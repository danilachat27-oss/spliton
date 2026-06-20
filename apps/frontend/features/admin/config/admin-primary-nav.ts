import { ROUTES } from "@/constants/routes";

export type AdminPrimarySectionId = "crm" | "settings";

/** Верхний контекст (хедер / вторая колонка): CRM или настройки. */
export function getAdminPrimarySectionId(pathname: string, sectionParam: string | null): AdminPrimarySectionId {
  if (sectionParam === "settings") {
    return "settings";
  }
  if (pathname === ROUTES.admin || pathname.startsWith(`${ROUTES.admin}/`)) {
    return "crm";
  }
  return "crm";
}
