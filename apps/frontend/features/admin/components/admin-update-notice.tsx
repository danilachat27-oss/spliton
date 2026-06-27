"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, ScrollText, X } from "@/lib/lucide";

import { AdminUpdateDetailPanel } from "@/features/admin/components/admin-update-detail-panel";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { adminUpdateTypeBadgeClassName } from "@/features/admin/lib/admin-update-ui";
import { ROUTES } from "@/constants/routes";
import {
  dismissAdminUpdate,
  fetchAdminUpdatesActive,
  markAdminUpdateRead,
  type AdminUpdateRow,
} from "@/services/admin/adminUpdates.service";
import { cn } from "@/lib/utils";

export function AdminUpdateNotice() {
  const client = useAdminApi();
  const a = useAdminI18n();
  const [update, setUpdate] = React.useState<AdminUpdateRow | null>(null);
  const [remaining, setRemaining] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [hidden, setHidden] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUpdatesActive(client);
      setUpdate(data.primary);
      setRemaining(data.remainingCount);
      setHidden(!data.primary);
    } catch {
      setUpdate(null);
      setHidden(true);
    } finally {
      setLoading(false);
    }
  }, [client]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onDismiss = async () => {
    if (!update) return;
    setHidden(true);
    setDetailOpen(false);
    try {
      await dismissAdminUpdate(client, update.id);
    } catch {
      setHidden(false);
    }
  };

  const onDetails = async () => {
    if (!update) return;
    setDetailOpen(true);
    try {
      await markAdminUpdateRead(client, update.id);
    } catch {
      /* non-blocking */
    }
  };

  if (loading || hidden || !update) return null;

  return (
    <>
      <div
        className="border-0 bg-zinc-900/30 px-4 py-3.5 sm:px-6"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-zinc-800/50 text-[#B7F500]"
              aria-hidden
            >
              <ScrollText className="size-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  {a.t("admin.updates.badge")}
                </span>
                <span className={adminUpdateTypeBadgeClassName(update.type)}>
                  {a.t(`admin.updates.type.${update.type}`)}
                </span>
                {update.publishedAt ? (
                  <span className="text-xs text-zinc-600">
                    {formatAdminDate(update.publishedAt)}
                  </span>
                ) : null}
              </div>
              <h2 className="text-sm font-semibold text-zinc-100">{update.title}</h2>
              <p className="text-sm leading-relaxed text-zinc-400">{update.summary}</p>
              {remaining > 0 ? (
                <Link
                  href={ROUTES.adminUpdates}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#B7F500] hover:text-[#c8ff33]"
                >
                  {a.t("admin.updates.moreCount").replace("{count}", String(remaining))}
                  <ArrowRight className="size-3" aria-hidden />
                </Link>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-4 sm:pl-2">
            <button
              type="button"
              className="text-sm font-medium text-[#B7F500] transition-colors hover:text-[#c8ff33]"
              onClick={() => void onDetails()}
            >
              {a.t("admin.updates.details")}
            </button>
            <button
              type="button"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-200"
              onClick={() => void onDismiss()}
            >
              {a.t("admin.updates.dismiss")}
            </button>
            <button
              type="button"
              className={cn(
                "rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200",
              )}
              aria-label={a.t("admin.updates.dismiss")}
              onClick={() => void onDismiss()}
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      <AdminUpdateDetailPanel
        item={update}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
