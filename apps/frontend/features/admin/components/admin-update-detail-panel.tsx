"use client";

import Link from "next/link";

import { AdminRightWidePanel } from "@/features/admin/components/admin-right-wide-panel";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { adminUpdateTypeBadgeClassName } from "@/features/admin/lib/admin-update-ui";
import { ROUTES } from "@/constants/routes";
import type { AdminUpdateRow } from "@/services/admin/adminUpdates.service";
import { AdminLocalizedStatusBadge } from "@/features/admin/ui";

type AdminUpdateDetailPanelProps = {
  item: AdminUpdateRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminUpdateDetailPanel({
  item,
  open,
  onOpenChange,
}: AdminUpdateDetailPanelProps) {
  const a = useAdminI18n();
  if (!item) return null;

  return (
    <AdminRightWidePanel
      open={open}
      onOpenChange={onOpenChange}
      title={item.title}
      description={item.summary}
      widthClassName="w-[min(100vw-1rem,640px)]"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={adminUpdateTypeBadgeClassName(item.type)}>
            {a.t(`admin.updates.type.${item.type}`)}
          </span>
          <AdminLocalizedStatusBadge status={item.status} domain="generic" />
          {item.publishedAt ? (
            <span className="text-xs text-zinc-500">{formatAdminDate(item.publishedAt)}</span>
          ) : null}
          <span className="text-xs text-zinc-600">
            {item.isRead ? a.t("admin.updates.read") : a.t("admin.updates.unread")}
          </span>
        </div>

        <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
          {item.content}
        </div>

        <div className="flex flex-wrap gap-4 border-t border-zinc-800/60 pt-4">
          <Link
            href={ROUTES.adminUpdates}
            className="text-sm font-medium text-[#B7F500] transition-colors hover:text-[#c8ff33]"
          >
            {a.t("admin.updates.viewHistory")}
          </Link>
        </div>
      </div>
    </AdminRightWidePanel>
  );
}
