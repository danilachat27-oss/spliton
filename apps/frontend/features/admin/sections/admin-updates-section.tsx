"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, ScrollText } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { AdminUpdateDetailPanel } from "@/features/admin/components/admin-update-detail-panel";
import { AdminSectionGuard } from "@/features/admin/components/admin-section-guard";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { canMatrixAction } from "@/features/admin/config/admin-role-matrix";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_NOTICE, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { adminUpdateTypeBadgeClassName, ADMIN_UPDATE_TYPES } from "@/features/admin/lib/admin-update-ui";
import { adminBtnOutline } from "@/features/admin/lib/admin-ui";
import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/constants/routes";
import {
  AdminFilterPills,
  AdminFilterResultCount,
  AdminLocalizedStatusBadge,
} from "@/features/admin/ui";
import {
  fetchAdminUpdatesHistory,
  markAdminUpdateRead,
  type AdminUpdateRow,
  type AdminUpdateType,
} from "@/services/admin/adminUpdates.service";
import { cn } from "@/lib/utils";

function UpdateHistoryCard({
  item,
  typeLabel,
  detailsLabel,
  readLabel,
  unreadLabel,
  onOpen,
}: {
  item: AdminUpdateRow;
  typeLabel: string;
  detailsLabel: string;
  readLabel: string;
  unreadLabel: string;
  onOpen: () => void;
}) {
  const unread = !item.isRead;

  return (
    <article
      className={cn(
        ADMIN_SECTION_TILE,
        "relative transition-colors",
        unread && "bg-zinc-900/55",
      )}
    >
      {unread ? (
        <span
          className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-[#B7F500]"
          aria-hidden
        />
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={adminUpdateTypeBadgeClassName(item.type)}>{typeLabel}</span>
            <AdminLocalizedStatusBadge status={item.status} domain="generic" />
            <span className="text-xs text-zinc-500">
              {item.publishedAt ? formatAdminDate(item.publishedAt) : "—"}
            </span>
            <span className="text-xs text-zinc-600">{unread ? unreadLabel : readLabel}</span>
          </div>
          <h2 className={cn("text-sm font-semibold text-zinc-100", unread && "text-zinc-50")}>
            {item.title}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">{item.summary}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-800/60 pt-3">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B7F500] transition-colors hover:text-[#c8ff33]"
          onClick={onOpen}
        >
          {detailsLabel}
          <ArrowRight className="size-3.5" aria-hidden />
        </button>
      </div>
    </article>
  );
}

export function AdminUpdatesSection() {
  const client = useAdminApi();
  const a = useAdminI18n();
  const { user } = useAuth();
  const canManage = canMatrixAction(user?.roles, "updates", "mutate");
  const [items, setItems] = React.useState<AdminUpdateRow[]>([]);
  const [typeFilter, setTypeFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<AdminUpdateRow | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const typeOptions = React.useMemo(
    () => [
      { value: "", label: a.t("admin.updates.filterAll") },
      ...ADMIN_UPDATE_TYPES.map((type) => ({
        value: type,
        label: a.t(`admin.updates.type.${type}`),
      })),
    ],
    [a],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminUpdatesHistory(
        client,
        (typeFilter as AdminUpdateType) || undefined,
      );
      setItems(data.filter((row) => row.status !== "DRAFT"));
    } catch (e) {
      setError(localizedAdminError(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [client, typeFilter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openDetails = async (item: AdminUpdateRow) => {
    setSelected(item);
    setDetailOpen(true);
    try {
      await markAdminUpdateRead(client, item.id);
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, isRead: true, readAt: new Date().toISOString() } : row,
        ),
      );
    } catch {
      /* non-blocking */
    }
  };

  return (
    <AdminSectionShell
      sectionId="updates"
      title={a.t("admin.updates.title")}
      actions={
        <>
          {canManage ? (
            <Link href={ROUTES.adminUpdatesManage}>
              <Button type="button" variant="outline" className={adminBtnOutline}>
                {a.t("admin.updates.manage")}
              </Button>
            </Link>
          ) : null}
          <AdminSectionRefreshButton onClick={() => void load()} loading={loading} />
        </>
      }
      banner={
        <p className="text-sm leading-relaxed text-zinc-500">{a.t("admin.updates.subtitle")}</p>
      }
    >
      <AdminSectionPanel>
        <div className="mb-5 space-y-3">
          <AdminFilterPills
            label={a.t("admin.updates.filterType")}
            value={typeFilter}
            options={typeOptions}
            onChange={setTypeFilter}
          />
          <AdminFilterResultCount label={a.t("admin.table.total")} value={items.length} />
        </div>

        <AdminSectionDataArea
          loading={loading}
          error={error}
          onRetry={() => void load()}
          loadingLabel={a.t("admin.updates.loading")}
        >
          {items.length === 0 ? (
            <div className={cn(ADMIN_SECTION_NOTICE, "items-center text-sm text-zinc-400")}>
              <ScrollText className="size-5 shrink-0 text-zinc-600" aria-hidden />
              <p>{a.t("admin.updates.empty")}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id}>
                  <UpdateHistoryCard
                    item={item}
                    typeLabel={a.t(`admin.updates.type.${item.type}`)}
                    detailsLabel={a.t("admin.updates.details")}
                    readLabel={a.t("admin.updates.read")}
                    unreadLabel={a.t("admin.updates.unread")}
                    onOpen={() => void openDetails(item)}
                  />
                </li>
              ))}
            </ul>
          )}
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminUpdateDetailPanel
        item={selected}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelected(null);
        }}
      />
    </AdminSectionShell>
  );
}

export default function AdminUpdatesPage() {
  return (
    <AdminSectionGuard sectionId="updates">
      <AdminUpdatesSection />
    </AdminSectionGuard>
  );
}
