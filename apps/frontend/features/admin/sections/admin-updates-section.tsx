"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, RefreshCw } from "@/lib/lucide";

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
import {
  ADMIN_UPDATE_TYPES,
  adminUpdateTypeBadgeClassName,
  adminUpdateTypeDotClass,
  filterOperatorAdminUpdates,
} from "@/features/admin/lib/admin-update-ui";
import { adminBtnOutline } from "@/features/admin/lib/admin-ui";
import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/constants/routes";
import { AdminFilterResultCount, AdminLocalizedStatusBadge } from "@/features/admin/ui";
import {
  fetchAdminUpdatesHistory,
  markAdminUpdateRead,
  type AdminUpdateRow,
  type AdminUpdateType,
} from "@/services/admin/adminUpdates.service";
import { cn } from "@/lib/utils";

function UpdateTypeFilter({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value || "all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-[#B7F500]/15 text-[#B7F500]"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

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
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className={cn("mt-1.5 size-2 shrink-0 rounded-full", adminUpdateTypeDotClass(item.type))}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={cn("text-sm font-semibold text-zinc-100", unread && "text-zinc-50")}>
                {item.title}
              </h2>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">{item.summary}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {item.publishedAt ? formatAdminDate(item.publishedAt) : "—"}
              {" · "}
              {unread ? unreadLabel : readLabel}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className={adminUpdateTypeBadgeClassName(item.type)}>{typeLabel}</span>
          <AdminLocalizedStatusBadge status={item.status} domain="generic" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-800/80 pt-3">
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
      setItems(
        filterOperatorAdminUpdates(data.filter((row) => row.status !== "DRAFT")),
      );
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
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-zinc-600">
              {a.t("admin.updates.filterType")}
            </span>
            <UpdateTypeFilter
              value={typeFilter}
              options={typeOptions}
              onChange={setTypeFilter}
            />
          </div>
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
              <RefreshCw className="size-5 shrink-0 text-zinc-600" aria-hidden />
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
