"use client";

import { SplitonLoadingView } from "@/components/ui/spliton-loader";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";

export default function AdminPortalLoading() {
  const a = useAdminI18n();

  return (
    <SplitonLoadingView
      variant="dark"
      size="lg"
      minHeight="min-h-[50vh]"
      label={a.t("admin.loading.section")}
      className="bg-zinc-950"
    />
  );
}
