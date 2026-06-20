import { Suspense } from "react";

import { AdminSectionGuard } from "@/features/admin/components/admin-section-guard";
import { UserDetailSection } from "@/features/admin/sections/user-detail/user-detail-section";
import { AdminLoadingState } from "@/features/admin/ui";

export default function AdminUserDetailPage() {
  return (
    <AdminSectionGuard sectionId="users">
      <Suspense fallback={<AdminLoadingState />}>
        <UserDetailSection />
      </Suspense>
    </AdminSectionGuard>
  );
}
