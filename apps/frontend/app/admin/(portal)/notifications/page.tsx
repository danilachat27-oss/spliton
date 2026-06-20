"use client";

import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { AdminSectionGuard } from "@/features/admin/components/admin-section-guard";
import { getAdminApiBaseUrl } from "@/features/admin/api/admin-api.config";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { formatDateTime } from "@/lib/i18n/formatters";
import {
  AdminErrorState,
  AdminLoadingState,
} from "@/features/admin/ui";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/services/notifications.service";

export function AdminNotificationsContent() {
  const { authorizedFetch } = useAuth();
  const { t, locale, notificationCategoryLabel } = useAdminI18n();
  const base = `${getAdminApiBaseUrl()}/notifications`;
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = React.useState(false);

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
    } catch (e) {
      setError(localizedAdminError(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, base, unreadOnly]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4 p-4 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t("admin.notifications.title")}</h1>
          <p className="text-sm text-zinc-500">{t("admin.notifications.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-2 text-zinc-400">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            {t("admin.notifications.unreadOnly")}
          </label>
          <button
            type="button"
            className="rounded-lg border border-zinc-700 px-3 py-1.5 hover:bg-zinc-800"
            onClick={() =>
              void markAllNotificationsRead(authorizedFetch, base)
                .then(() => void load())
                .catch((e) => setError(localizedAdminError(e)))
            }
          >
            {t("admin.notifications.markAllRead")}
          </button>
        </div>
      </div>

      {loading ? <AdminLoadingState label={t("admin.notifications.loading")} /> : null}
      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}

      {!loading && !error && items.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-sm text-zinc-500">
          {t("admin.notifications.empty")}
        </p>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border px-4 py-3 ${
                item.severity === "error" || item.severity === "warning"
                  ? "border-amber-800/60 bg-amber-950/20"
                  : "border-zinc-800 bg-zinc-900/40"
              } ${!item.isRead ? "ring-1 ring-sky-800/40" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium">{item.title}</p>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-zinc-400">
                  {notificationCategoryLabel(item.category)}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{item.message}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {formatDateTime(item.createdAt, locale)}
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                {item.actionUrl ? (
                  <a href={item.actionUrl} className="text-xs text-sky-400 hover:underline">
                    {t("admin.notifications.openEntity")}
                  </a>
                ) : null}
                {!item.isRead ? (
                  <button
                    type="button"
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                    onClick={() =>
                      void markNotificationRead(authorizedFetch, base, item.id)
                        .then(() => void load())
                        .catch((e) => setError(localizedAdminError(e)))
                    }
                  >
                    {t("admin.notifications.markRead")}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function AdminNotificationsPage() {
  return (
    <AdminSectionGuard sectionId="notifications">
      <AdminNotificationsContent />
    </AdminSectionGuard>
  );
}
