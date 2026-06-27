"use client";

import Link from "next/link";
import * as React from "react";
import { Sparkles, X } from "@/lib/lucide";

import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { ROUTES } from "@/constants/routes";
import {
  dismissAdminUpdate,
  fetchAdminUpdatesActive,
  markAdminUpdateRead,
  type AdminUpdateRow,
} from "@/services/admin/adminUpdates.service";
import { cn } from "@/lib/utils";
function typeBadgeClass(type: string): string {
  if (type === "LEGAL") return "bg-violet-500/15 text-violet-200";
  if (type === "SECURITY") return "bg-rose-500/15 text-rose-200";
  if (type === "BILLING") return "bg-amber-500/15 text-amber-200";
  if (type === "FEATURE") return "bg-[#B7F500]/15 text-[#B7F500]";
  return "bg-zinc-800 text-zinc-300";
}

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
        className="border-0 bg-zinc-900/35 px-4 py-4 sm:px-6"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                <Sparkles className="size-3 text-[#B7F500]" aria-hidden />
                {a.t("admin.updates.badge")}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  typeBadgeClass(update.type),
                )}
              >
                {a.t(`admin.updates.type.${update.type}`)}
              </span>
              {update.publishedAt ? (
                <span className="text-xs text-zinc-500">
                  {formatAdminDate(update.publishedAt)}
                </span>
              ) : null}
            </div>
            <h2 className="text-sm font-semibold text-zinc-100 sm:text-base">{update.title}</h2>
            <p className="text-sm leading-relaxed text-zinc-400">{update.summary}</p>
            {remaining > 0 ? (
              <Link
                href={ROUTES.adminUpdates}
                className="inline-block text-xs font-medium text-[#B7F500] hover:text-[#c8ff33]"
              >
                {a.t("admin.updates.moreCount").replace("{count}", String(remaining))}
              </Link>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3 sm:pt-1">
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
              className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200"
              aria-label={a.t("admin.updates.dismiss")}
              onClick={() => void onDismiss()}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {detailOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 sm:items-center sm:pt-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-update-detail-title"
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-zinc-900 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 id="admin-update-detail-title" className="text-lg font-semibold text-zinc-50">
                {update.title}
              </h2>
              <button
                type="button"
                className="rounded-md p-1 text-zinc-500 hover:text-zinc-200"
                onClick={() => setDetailOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{update.summary}</p>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-200">
              {update.content}
            </pre>
            <div className="mt-6 flex flex-wrap justify-end gap-4">
              <Link
                href={ROUTES.adminUpdates}
                className="text-sm font-medium text-[#B7F500] hover:text-[#c8ff33]"
              >
                {a.t("admin.updates.viewHistory")}
              </Link>
              <button
                type="button"
                className="text-sm text-zinc-400 hover:text-zinc-200"
                onClick={() => setDetailOpen(false)}
              >
                {a.t("admin.updates.close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}