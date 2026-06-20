"use client";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  depositStatusTone,
  withdrawalStatusTone,
  genericStatusTone,
} from "@/features/admin/lib/admin-status-maps";
import { AdminStatusBadge, type AdminStatusTone } from "./admin-status-badge";

type AdminLocalizedStatusBadgeProps = {
  status: string;
  tone?: AdminStatusTone;
  /** Автовыбор tone для типовых финансовых статусов */
  domain?: "deposit" | "withdrawal" | "generic";
};

export function AdminLocalizedStatusBadge({
  status,
  tone,
  domain = "generic",
}: AdminLocalizedStatusBadgeProps) {
  const a = useAdminI18n();
  const resolvedTone =
    tone ??
    (domain === "deposit"
      ? depositStatusTone(status)
      : domain === "withdrawal"
        ? withdrawalStatusTone(status)
        : genericStatusTone(status));
  return <AdminStatusBadge label={a.formatAdminStatus(status)} tone={resolvedTone} />;
}
