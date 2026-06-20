import { Suspense } from "react";

import { AdminSectionGuard } from "@/features/admin/components/admin-section-guard";
import { UserDetailProfileLoading, UserDetailSection } from "@/features/admin/sections/user-detail/user-detail-section";

export default function AdminUserDetailPage() {
  return (
    <AdminSectionGuard sectionId="users">
      <Suspense fallback={<UserDetailProfileLoading />}>
        <UserDetailSection />
      </Suspense>
    </AdminSectionGuard>
  );
}
