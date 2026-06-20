import type { ComponentType } from "react";

import { AdminSectionGuard } from "./admin-section-guard";
import type { AdminSectionId } from "@/features/admin/config/admin-sections";

export function createAdminSectionPage(
  sectionId: AdminSectionId,
  Section: ComponentType,
) {
  return function AdminSectionPage() {
    return (
      <AdminSectionGuard sectionId={sectionId}>
        <Section />
      </AdminSectionGuard>
    );
  };
}
