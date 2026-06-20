import { Suspense } from "react";

import { createAdminSectionPage } from "@/features/admin/components/admin-section-page";
import { UsersSection } from "@/features/admin/sections/users-section";
import { AdminLoadingState } from "@/features/admin/ui";

function UsersSectionPage() {
  return (
    <Suspense fallback={<AdminLoadingState />}>
      <UsersSection />
    </Suspense>
  );
}

export default createAdminSectionPage("users", UsersSectionPage);
