import { ROUTES } from "@/constants/routes";

import { ADMIN_PORTAL, adminSectionLabel } from "@/features/admin/lib/admin-i18n";

import type { AdminBreadcrumbItem } from "@/features/admin/ui/admin-breadcrumbs";

export function adminBreadcrumbs(sectionLabel: string): AdminBreadcrumbItem[] {
  return [
    { label: ADMIN_PORTAL.breadcrumbRoot, href: ROUTES.admin },
    { label: sectionLabel },
  ];
}

/** Breadcrumbs по id раздела из ADMIN_SECTION_LABELS. */
export function adminSectionBreadcrumbs(sectionId: string): AdminBreadcrumbItem[] {
  return adminBreadcrumbs(adminSectionLabel(sectionId));
}

