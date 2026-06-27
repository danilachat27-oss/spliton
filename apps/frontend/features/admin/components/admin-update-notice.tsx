"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, Sparkles, X } from "@/lib/lucide";

import { AdminUpdateDetailPanel } from "@/features/admin/components/admin-update-detail-panel";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import {
  adminUpdateTypeBadgeClassName,
  filterOperatorAdminUpdates,
} from "@/features/admin/lib/admin-update-ui";
import { ROUTES } from "@/constants/routes";
import {
  dismissAdminUpdate,
  fetchAdminUpdatesActive,
  markAdminUpdateRead,
  type AdminUpdateRow,
} from "@/services/admin/adminUpdates.service";

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
      const visible = filterOperatorAdminUpdates(data.items ?? []);
      const primary = visible[0] ?? null;
      setUpdate(primary);
      setRemaining(Math.max(0, visible.length - 1));
      setHidden(!primary);
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
        className="relative border-0 bg-zinc-900/20 px-4 py-3 sm:px-6"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto flex max-w-6xl items-start gap-3 pr-7 sm:items-center sm:gap-4 sm:pr-8">
          <Sparkles
            className="mt-0.5 size-4 shrink-0 text-[#B7F500]/90 sm:mt-0"
            strokeWidth={1.5}
            aria-hidden
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className={adminUpdateTypeBadgeClassName(update.type)}>
                {a.t(`admin.updates.type.${update.type}`)}
              </span>
              {update.publishedAt ? (
                <span className="text-xs text-zinc-600">
                  {formatAdminDate(update.publishedAt)}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm font-medium text-zinc-100">{update.title}</p>
            <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-zinc-500">
              {update.summary}
            </p>
            {remaining > 0 ? (
              <Link
                href={ROUTES.adminUpdates}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#B7F500] hover:text-[#c8ff33]"
              >
                {a.t("admin.updates.moreCount").replace("{count}", String(remaining))}
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            ) : null}
          </div>

          <button
            type="button"
            className="shrink-0 text-sm font-medium text-[#B7F500] transition-colors hover:text-[#c8ff33]"
            onClick={() => void onDetails()}
          >
            {a.t("admin.updates.details")}
          </button>
        </div>

        <button
          type="button"
          className="absolute right-3 top-3 text-zinc-500 transition-colors hover:text-zinc-300 sm:right-5 sm:top-1/2 sm:-translate-y-1/2"
          aria-label={a.t("admin.updates.dismiss")}
          onClick={() => void onDismiss()}
        >
          <X className="size-4" strokeWidth={1.5} />
        </button>
      </div>

      <AdminUpdateDetailPanel
        item={update}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
