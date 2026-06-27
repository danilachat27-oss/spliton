"use client";

import Link from "next/link";
import * as React from "react";
import { Sparkles } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
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
import { adminBtnOutline } from "@/features/admin/lib/admin-ui";
import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/constants/routes";
import {
  fetchAdminUpdatesHistory,
  markAdminUpdateRead,
  type AdminUpdateRow,
  type AdminUpdateType,
} from "@/services/admin/adminUpdates.service";
import { cn } from "@/lib/utils";

const UPDATE_TYPES: AdminUpdateType[] = [
  "FEATURE",
  "LEGAL",
  "BILLING",
  "SECURITY",
  "MAINTENANCE",
  "UX",
  "SYSTEM",
];

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
  return (
    <article className={cn(ADMIN_SECTION_TILE, "space-y-2")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-400">
          {typeLabel}
        </span>
        <span className="text-xs text-zinc-500">
          {item.publishedAt ? formatAdminDate(item.publishedAt) : "—"}
        </span>
        <span className="text-xs text-zinc-600">{item.status}</span>
        <span className="text-xs text-zinc-600">
          {item.isRead ? readLabel : unreadLabel}
        </span>
      </div>
      <h2 className="text-sm font-semibold text-zinc-100">{item.title}</h2>
      <p className="text-sm text-zinc-400">{item.summary}</p>
      <button
        type="button"
        className="text-xs font-medium text-[#B7F500] hover:text-[#c8ff33]"
        onClick={onOpen}
      >
        {detailsLabel}
      </button>
    </article>
  );
}

export function AdminUpdatesSection() {
  const client = useAdminApi();
  const a = useAdminI18n();
  const { user } = useAuth();
  const canManage = canMatrixAction(user?.roles, "updates", "mutate");
  const [items, setItems] = React.useState<AdminUpdateRow[]>([]);
  const [typeFilter, setTypeFilter] = React.useState<AdminUpdateType | "">("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<AdminUpdateRow | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminUpdatesHistory(
        client,
        typeFilter || undefined,
      );
      setItems(data);
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
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AdminUpdateType | "")}
            className="rounded-xl border-0 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200"
          >
            <option value="">{a.t("admin.updates.filterAll")}</option>
            {UPDATE_TYPES.map((type) => (
              <option key={type} value={type}>
                {a.t(`admin.updates.type.${type}`)}
              </option>
            ))}
          </select>
        </div>
        <AdminSectionDataArea
          loading={loading}
          error={error}
          onRetry={() => void load()}
          loadingLabel={a.t("admin.updates.loading")}
        >
          {items.length === 0 ? (
            <div className={cn(ADMIN_SECTION_NOTICE, "items-center text-sm text-zinc-400")}>
              <Sparkles className="size-5 shrink-0 text-zinc-600" aria-hidden />
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

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-zinc-50">{selected.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{selected.summary}</p>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm text-zinc-200">
              {selected.content}
            </pre>
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={() => setSelected(null)}>
                {a.t("admin.updates.close")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
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
