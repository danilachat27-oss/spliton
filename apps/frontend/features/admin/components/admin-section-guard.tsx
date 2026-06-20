"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  canAccessAdminSection,
  type AdminSectionId,
} from "@/features/admin/config/admin-sections";
import { AdminSectionForbidden } from "@/features/admin/components/admin-section-forbidden";

type AdminSectionGuardProps = {
  sectionId: AdminSectionId;
  children: React.ReactNode;
};

export function AdminSectionGuard({ sectionId, children }: AdminSectionGuardProps) {
  const a = useAdminI18n();
  const { user } = useAuth();
  const allowed = canAccessAdminSection(sectionId, user?.roles);

  if (!allowed) {
    return <AdminSectionForbidden sectionTitle={a.adminSectionLabel(sectionId)} />;
  }

  return <>{children}</>;
}
