import { Suspense } from "react";

import { AdminLegacyRedirect } from "@/features/admin/components/admin-legacy-redirect";
import { AdminSectionGuard } from "@/features/admin/components/admin-section-guard";
import { DashboardSection } from "@/features/admin/sections/dashboard-section";

export default function AdminDashboardPage() {
  return (
    <AdminSectionGuard sectionId="dashboard">
      <Suspense fallback={null}>
        <AdminLegacyRedirect />
      </Suspense>
      <DashboardSection />
    </AdminSectionGuard>
  );
}
