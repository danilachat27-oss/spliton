"use client";



import * as React from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { Bell } from "@/lib/lucide";



import { useAuth } from "@/components/providers/auth-provider";

import { useI18n } from "@/components/providers/i18n-provider";

import { formatDateTime } from "@/lib/i18n/formatters";

import { cn } from "@/lib/utils";

import {

  fetchNotifications,

  fetchUnreadCount,

  markAllNotificationsRead,

  markNotificationRead,

  type NotificationItem,

} from "@/services/notifications.service";

import { useNotificationsUnread } from "@/components/notifications/notifications-unread-context";



type NotificationBellProps = {

  apiBasePath: string;

  allHref: string;

  className?: string;

  iconClassName?: string;

};



function severityDot(severity: string) {

  if (severity === "error" || severity === "critical") return "bg-red-500";

  if (severity === "warning") return "bg-amber-500";

  if (severity === "success") return "bg-emerald-500";

  return "bg-sky-500";

}



export function NotificationBell({

  apiBasePath,

  allHref,

  className,

  iconClassName,

}: NotificationBellProps) {

  const { authorizedFetch, isAuthenticated } = useAuth();

  const { t, locale } = useI18n();

  const router = useRouter();

  const rootRef = React.useRef<HTMLDetailsElement | null>(null);

  const unreadCtx = useNotificationsUnread();

  const [open, setOpen] = React.useState(false);

  const [localUnread, setLocalUnread] = React.useState(0);

  const unread = unreadCtx?.unread ?? localUnread;

  const patchUnread = React.useCallback(

    (next: number | ((current: number) => number)) => {

      if (unreadCtx) {

        unreadCtx.setUnread(next);

      } else {

        setLocalUnread(next);

      }

    },

    [unreadCtx],

  );

  const [items, setItems] = React.useState<NotificationItem[]>([]);

  const [loading, setLoading] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);



  const refreshCount = React.useCallback(async () => {

    if (!isAuthenticated) return;

    try {

      const count = await fetchUnreadCount(authorizedFetch, apiBasePath);

      patchUnread(count);

    } catch {

      patchUnread(0);

    }

  }, [apiBasePath, authorizedFetch, isAuthenticated, patchUnread]);



  const loadLatest = React.useCallback(async () => {

    if (!isAuthenticated) return;

    setLoading(true);

    setError(null);

    try {

      const data = await fetchNotifications(authorizedFetch, apiBasePath, {

        page: 1,

        pageSize: 8,

      });

      setItems(data.items);

    } catch {

      setError(t("errors.notifications.loadFailed"));

      setItems([]);

    } finally {

      setLoading(false);

    }

  }, [apiBasePath, authorizedFetch, isAuthenticated, t]);



  React.useEffect(() => {

    if (unreadCtx) return;

    void refreshCount();

    const timer = setInterval(() => void refreshCount(), 60_000);

    return () => clearInterval(timer);

  }, [refreshCount, unreadCtx]);



  React.useEffect(() => {

    if (open) void loadLatest();

  }, [open, loadLatest]);

  React.useEffect(() => {

    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const root = rootRef.current;
      const target = event.target as Node | null;
      if (!root || !target) return;
      if (!root.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };

  }, [open]);



  const onOpenItem = async (item: NotificationItem) => {

    if (!item.isRead) {

      try {

        await markNotificationRead(authorizedFetch, apiBasePath, item.id);

        patchUnread((c) => Math.max(0, c - 1));

        void unreadCtx?.refresh();

      } catch {

        /* ignore */

      }

    }

    setOpen(false);

    if (item.actionUrl) router.push(item.actionUrl);

  };



  const onMarkAll = async () => {

    try {

      await markAllNotificationsRead(authorizedFetch, apiBasePath);

      patchUnread(0);

      void unreadCtx?.refresh();

      setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));

    } catch {

      /* ignore */

    }

  };



  if (!isAuthenticated) {

    return (

      <button type="button" className={className} aria-label={t("notifications.ariaLabel")} disabled>

        <Bell className={iconClassName ?? "size-[18px]"} strokeWidth={1.75} />

      </button>

    );

  }



  return (

    <details

      ref={rootRef}

      className="relative"

      open={open}

      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}

    >

      <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">

        <span className={cn("relative inline-flex", className)} aria-label={t("notifications.ariaLabel")}>

          <Bell className={iconClassName ?? "size-[18px]"} strokeWidth={1.75} aria-hidden />

          {unread > 0 ? (

            <span className="absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">

              {unread > 99 ? "99+" : unread}

            </span>

          ) : null}

        </span>

      </summary>

      <div className="absolute right-0 z-50 mt-2 w-[min(92vw,360px)] rounded-xl border border-zinc-200 bg-white py-2 text-zinc-900 shadow-xl">

        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 pb-2">

          <p className="text-sm font-semibold">{t("notifications.title")}</p>

          {unread > 0 ? (

            <button

              type="button"

              className="text-xs text-zinc-500 hover:text-zinc-800"

              onClick={() => void onMarkAll()}

            >

              {t("notifications.markAllRead")}

            </button>

          ) : null}

        </div>

        {loading ? (

          <p className="px-3 py-4 text-sm text-zinc-500">{t("common.states.loading")}</p>

        ) : error ? (

          <p className="px-3 py-4 text-sm text-red-600">{error}</p>

        ) : items.length === 0 ? (

          <p className="px-3 py-4 text-sm text-zinc-500">{t("notifications.empty")}</p>

        ) : (

          <ul className="max-h-80 overflow-y-auto">

            {items.map((item) => (

              <li key={item.id}>

                <button

                  type="button"

                  className={cn(

                    "flex w-full gap-2 px-3 py-2 text-left hover:bg-zinc-50",

                    !item.isRead && "bg-sky-50/60",

                  )}

                  onClick={() => void onOpenItem(item)}

                >

                  <span

                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", severityDot(item.severity))}

                    aria-hidden

                  />

                  <span className="min-w-0 flex-1">

                    <span className="block truncate text-sm font-medium">{item.title}</span>

                    <span className="line-clamp-2 text-xs text-zinc-500">{item.message}</span>

                    <span className="mt-0.5 block text-[10px] text-zinc-400">

                      {formatDateTime(item.createdAt, locale)}

                    </span>

                  </span>

                </button>

              </li>

            ))}

          </ul>

        )}

        <div className="border-t border-zinc-100 px-3 pt-2">

          <Link

            href={allHref}

            className="text-xs font-medium text-sky-700 hover:underline"

            onClick={() => setOpen(false)}

          >

            {t("notifications.viewAll")}

          </Link>

        </div>

      </div>

    </details>

  );

}

