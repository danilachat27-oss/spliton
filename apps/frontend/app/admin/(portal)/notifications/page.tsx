"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Bell, ListChecks } from "@/lib/lucide";

import { useAuth } from "@/components/providers/auth-provider";
import { useNotificationsUnread } from "@/components/notifications/notifications-unread-context";
import { Button } from "@/components/ui/button";
import { AdminSectionGuard } from "@/features/admin/components/admin-section-guard";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { formatDateTime } from "@/lib/i18n/formatters";
import type { AppLocale } from "@/lib/i18n/types";
import {
  ADMIN_SECTION_KPI_GRID,
  ADMIN_SECTION_NOTICE,
  ADMIN_SECTION_TILE,
} from "@/features/admin/lib/admin-section-styles";
import { adminBtnOutline } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/services/notifications.service";

function severityTone(severity: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (severity === "error" || severity === "critical") return "danger";
  if (severity === "warning") return "warning";
  if (severity === "success") return "success";
  if (severity === "info") return "info";
  return "neutral";
}

function severityDotClass(tone: ReturnType<typeof severityTone>): string {
  if (tone === "danger") return "bg-rose-400";
  if (tone === "warning") return "bg-amber-400";
  if (tone === "success") return "bg-emerald-400";
  if (tone === "info") return "bg-sky-400";
  return "bg-zinc-600";
}

function categoryBadgeClass(category: string, unread: boolean): string {
  const key = category.toLowerCase();
  if (unread) return "bg-[#B7F500]/15 text-[#B7F500]";
  if (key === "security" || key === "finance") return "bg-rose-500/10 text-rose-300";
  if (key === "support" || key === "system") return "bg-sky-500/10 text-sky-300";
  if (key === "reports") return "bg-amber-500/10 text-amber-300";
  return "bg-zinc-800 text-zinc-400";
}

function NotificationStatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "warning" | "info";
}) {
  const valueClass =
    tone === "success"
      ? "text-emerald-400"
      : tone === "warning"
        ? "text-amber-400"
        : tone === "info"
          ? "text-[#B7F500]"
          : "text-zinc-100";

  return (
    <div className={cn(ADMIN_SECTION_TILE, "flex min-h-[5.5rem] flex-col justify-between gap-2")}>
      <p className="text-[11px] font-semibold uppercase leading-snug tracking-wide text-zinc-500">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>{value}</p>
    </div>
  );
}

function AdminNotificationCard({
  item,
  locale,
  categoryLabel,
  openEntityLabel,
  markReadLabel,
  onMarkRead,
}: {
  item: NotificationItem;
  locale: AppLocale;
  categoryLabel: string;
  openEntityLabel: string;
  markReadLabel: string;
  onMarkRead: () => void;
}) {
  const tone = severityTone(item.severity);
  const unread = !item.isRead;

  return (
    <li>
      <article
        className={cn(
          ADMIN_SECTION_TILE,
          "relative transition-colors",
          unread && "ring-1 ring-[#B7F500]/20",
          tone === "warning" && unread && "bg-amber-500/[0.04]",
          tone === "danger" && unread && "bg-rose-500/[0.04]",
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
              className={cn("mt-1.5 size-2 shrink-0 rounded-full", severityDotClass(tone))}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={cn("text-sm font-semibold text-zinc-100", unread && "text-zinc-50")}>
                  {item.title}
                </h2>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{item.message}</p>
              <p className="mt-2 text-xs text-zinc-500">{formatDateTime(item.createdAt, locale)}</p>
            </div>
          </div>

          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
              categoryBadgeClass(item.category, unread),
            )}
          >
            {categoryLabel}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-800/80 pt-3">
          {item.actionUrl ? (
            <Link
              href={item.actionUrl}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B7F500] transition-colors hover:text-[#c8ff33]"
            >
              {openEntityLabel}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ) : null}
          {unread ? (
            <button
              type="button"
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-200"
              onClick={onMarkRead}
            >
              {markReadLabel}
            </button>
          ) : null}
        </div>
      </article>
    </li>
  );
}

export function AdminNotificationsContent() {
  const { authorizedFetch } = useAuth();
  const notificationsUnread = useNotificationsUnread();
  const { t, locale, notificationCategoryLabel } = useAdminI18n();
  const base = ADMIN_API_PATHS.notifications;
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const [markingAll, setMarkingAll] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications(authorizedFetch, base, {
        page: 1,
        pageSize: 50,
        unreadOnly,
      });
      setItems(data.items);
      void notificationsUnread?.refresh();
    } catch (e) {
      setError(localizedAdminError(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, base, unreadOnly, notificationsUnread]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const unreadCount = items.filter((item) => !item.isRead).length;

  const onMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(authorizedFetch, base);
      notificationsUnread?.setUnread(0);
      await load();
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setMarkingAll(false);
    }
  };

  const onMarkOne = async (id: string) => {
    try {
      await markNotificationRead(authorizedFetch, base, id);
      notificationsUnread?.setUnread((count) => Math.max(0, count - 1));
      await load();
    } catch (e) {
      setError(localizedAdminError(e));
    }
  };

  return (
    <AdminSectionShell
      sectionId="notifications"
      title={t("admin.notifications.title")}
      actions={
        <>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-900/50 px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900/70">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="size-4 rounded border-zinc-700 bg-zinc-900 text-[#B7F500] focus:ring-[#B7F500]/25"
            />
            {t("admin.notifications.unreadOnly")}
          </label>
          <Button
            type="button"
            variant="outline"
            className={adminBtnOutline}
            disabled={markingAll || loading || unreadCount === 0}
            onClick={() => void onMarkAll()}
          >
            <ListChecks className="size-4" aria-hidden />
            {t("admin.notifications.markAllRead")}
          </Button>
          <AdminSectionRefreshButton onClick={() => void load()} loading={loading} />
        </>
      }
      banner={
        <p className="text-sm leading-relaxed text-zinc-500">{t("admin.notifications.subtitle")}</p>
      }
    >
      <AdminSectionPanel>
        <div className={cn(ADMIN_SECTION_KPI_GRID, "lg:grid-cols-2")}>
          <NotificationStatTile
            label={t("admin.notifications.unreadOnly")}
            value={unreadCount}
            tone={unreadCount > 0 ? "info" : "neutral"}
          />
          <NotificationStatTile label={t("admin.table.total")} value={items.length} />
        </div>

        <AdminSectionDataArea loading={loading} error={error} onRetry={() => void load()} loadingLabel={t("admin.notifications.loading")}>
          {items.length === 0 ? (
            <div className={cn(ADMIN_SECTION_NOTICE, "items-center text-sm text-zinc-400")}>
              <Bell className="size-5 shrink-0 text-zinc-600" aria-hidden />
              <p>{t("admin.notifications.empty")}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <AdminNotificationCard
                  key={item.id}
                  item={item}
                  locale={locale as AppLocale}
                  categoryLabel={notificationCategoryLabel(item.category)}
                  openEntityLabel={t("admin.notifications.openEntity")}
                  markReadLabel={t("admin.notifications.markRead")}
                  onMarkRead={() => void onMarkOne(item.id)}
                />
              ))}
            </ul>
          )}
        </AdminSectionDataArea>
      </AdminSectionPanel>
    </AdminSectionShell>
  );
}

export default function AdminNotificationsPage() {
  return (
    <AdminSectionGuard sectionId="notifications">
      <AdminNotificationsContent />
    </AdminSectionGuard>
  );
}
