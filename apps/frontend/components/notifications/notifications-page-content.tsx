"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "@/lib/lucide";
import { useRouter } from "next/navigation";

import { DashboardAppShell } from "@/components/layout/dashboard-app-shell";
import { PayoutsSubpageHero } from "@/components/dashboard/assets/payouts-subpage-hero";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { EmptyState } from "@/components/shared/data-states/empty-state";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { profileDashboardHref } from "@/constants/dashboard/profile-page";
import { formatDateTime } from "@/lib/i18n/formatters";
import { cn } from "@/lib/utils";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/services/notifications.service";

const API_BASE = "/api/v1/notifications";

function severityDot(severity: string) {
  if (severity === "error" || severity === "critical") return "bg-rose-500";
  if (severity === "warning") return "bg-amber-500";
  if (severity === "success") return "bg-emerald-500";
  return "bg-sky-500";
}

function NotificationsSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)]">
      <ul className="divide-y divide-neutral-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="flex gap-3 px-5 py-4">
            <div className="mt-1.5 size-2 shrink-0 animate-pulse rounded-full bg-neutral-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/5 animate-pulse rounded bg-neutral-200" />
              <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NotificationsPageContent() {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [markingAll, setMarkingAll] = React.useState(false);

  const unreadCount = items.filter((item) => !item.isRead).length;

  const load = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications(authorizedFetch, API_BASE, {
        page: 1,
        pageSize: 50,
      });
      setItems(data.items);
    } catch {
      setError(t("notifications.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, isAuthenticated, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(authorizedFetch, API_BASE);
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch {
      setError(t("notifications.loadFailed"));
    } finally {
      setMarkingAll(false);
    }
  };

  const onOpenItem = async (item: NotificationItem) => {
    if (!item.isRead) {
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, isRead: true } : row)),
      );
      try {
        await markNotificationRead(authorizedFetch, API_BASE, item.id);
      } catch {
        /* keep optimistic UI */
      }
    }
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  return (
    <DashboardAppShell contentClassName="max-w-[1320px] pb-8">
      <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <PayoutsSubpageHero
                eyebrow={t("notifications.pageEyebrow")}
                title={t("notifications.pageHeading")}
                description={t("notifications.pageSubtitle")}
              />
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    disabled={markingAll || loading}
                    className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-[13px] font-semibold text-neutral-800 shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/80 transition hover:bg-neutral-50 disabled:opacity-50"
                    onClick={() => void onMarkAll()}
                  >
                    {t("notifications.markAllRead")}
                  </button>
                ) : null}
                <Link
                  href={profileDashboardHref("settings")}
                  className="inline-flex h-10 items-center rounded-xl px-4 text-[13px] font-semibold text-neutral-600 transition hover:bg-white hover:text-neutral-900"
                >
                  {t("notifications.settings")}
                </Link>
              </div>
            </div>

            {loading ? <NotificationsSkeleton /> : null}

            {!loading && error ? (
              <ReadOnlySectionError
                sectionId="notifications"
                error={error}
                onRetry={() => void load()}
                retryLabel={t("common.retry")}
              />
            ) : null}

            {!loading && !error && items.length === 0 ? (
              <EmptyState message={t("notifications.emptyHint")} />
            ) : null}

            {!loading && !error && items.length > 0 ? (
              <section className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)]">
                <ul className="divide-y divide-neutral-100">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-neutral-50/90",
                          !item.isRead && "bg-sky-50/40",
                        )}
                        onClick={() => void onOpenItem(item)}
                      >
                        <span
                          className={cn("mt-2 size-2 shrink-0 rounded-full", severityDot(item.severity))}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <span className="text-[15px] font-semibold leading-snug text-neutral-900">
                              {item.title}
                            </span>
                            {!item.isRead ? (
                              <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
                                {t("notifications.unreadBadge")}
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-1 block text-sm leading-relaxed text-neutral-600">
                            {item.message}
                          </span>
                          <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-400">
                            <time dateTime={item.createdAt}>{formatDateTime(item.createdAt, locale)}</time>
                            <span aria-hidden>·</span>
                            <span className="font-medium uppercase tracking-wide text-neutral-500">
                              {item.category}
                            </span>
                          </span>
                        </span>
                        {item.actionUrl ? (
                          <ChevronRight className="mt-1 size-4 shrink-0 text-neutral-300" aria-hidden />
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
      </div>
    </DashboardAppShell>
  );
}
