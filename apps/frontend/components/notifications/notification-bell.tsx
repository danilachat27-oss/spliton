"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Bell } from "@/lib/lucide";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { formatDateTime } from "@/lib/i18n/formatters";
import type { AppLocale } from "@/lib/i18n/types";
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
  variant?: "light" | "dark";
};

function severityDotClass(severity: string, isDark: boolean, unread: boolean): string {
  if (isDark && unread) return "bg-[#B7F500]";
  if (severity === "error" || severity === "critical") return isDark ? "bg-rose-400" : "bg-red-500";
  if (severity === "warning") return isDark ? "bg-amber-400" : "bg-amber-500";
  if (severity === "success") return isDark ? "bg-emerald-400" : "bg-emerald-500";
  return isDark ? "bg-zinc-600" : "bg-sky-500";
}

function NotificationBellItem({
  item,
  isDark,
  locale,
  onOpen,
}: {
  item: NotificationItem;
  isDark: boolean;
  locale: AppLocale;
  onOpen: () => void;
}) {
  const unread = !item.isRead;

  if (isDark) {
    return (
      <li className="px-2 py-1">
        <button
          type="button"
          className={cn(
            ADMIN_SECTION_TILE,
            "relative flex w-full gap-3 px-3 py-2.5 text-left transition-colors hover:bg-zinc-900/70",
            unread && "ring-1 ring-[#B7F500]/20",
          )}
          onClick={onOpen}
        >
          {unread ? (
            <span className="absolute bottom-2.5 left-0 top-2.5 w-0.5 rounded-full bg-[#B7F500]" aria-hidden />
          ) : null}
          <span
            className={cn(
              "mt-1 size-2 shrink-0 rounded-full",
              severityDotClass(item.severity, true, unread),
            )}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate text-sm font-semibold", unread ? "text-zinc-50" : "text-zinc-200")}>
              {item.title}
            </span>
            <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-zinc-500">{item.message}</span>
            <span className="mt-1 block text-[10px] text-zinc-600">
              {formatDateTime(item.createdAt, locale)}
            </span>
          </span>
        </button>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        className={cn(
          "flex w-full gap-2 px-3 py-2 text-left transition-colors hover:bg-zinc-50",
          unread && "bg-sky-50/60",
        )}
        onClick={onOpen}
      >
        <span
          className={cn("mt-1.5 size-2 shrink-0 rounded-full", severityDotClass(item.severity, false, unread))}
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
  );
}

export function NotificationBell({
  apiBasePath,
  allHref,
  className,
  iconClassName,
  variant = "light",
}: NotificationBellProps) {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();
  const rootRef = React.useRef<HTMLDetailsElement | null>(null);
  const unreadCtx = useNotificationsUnread();
  const [open, setOpen] = React.useState(false);
  const [localUnread, setLocalUnread] = React.useState(0);
  const unread = unreadCtx?.unread ?? localUnread;
  const isDark = variant === "dark";

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
      <summary
        className={cn(
          "list-none cursor-pointer outline-none [&::-webkit-details-marker]:hidden",
          open && isDark && "[&>span]:bg-zinc-800/80 [&>span]:text-zinc-100",
        )}
      >
        <span
          className={cn("relative inline-flex", className)}
          aria-label={t("notifications.ariaLabel")}
        >
          <Bell className={iconClassName ?? "size-[18px]"} strokeWidth={1.75} aria-hidden />
          {unread > 0 ? (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold",
                isDark ? "bg-[#B7F500] text-zinc-950" : "bg-red-600 text-white",
              )}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </span>
      </summary>

      <div
        className={cn(
          "absolute right-0 z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl shadow-2xl shadow-black/40",
          isDark ? "bg-zinc-950/95 text-zinc-100 backdrop-blur-md" : "border border-zinc-200 bg-white text-zinc-900",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-4 py-3",
            isDark ? "bg-zinc-900/50" : "border-b border-zinc-100",
          )}
        >
          <p className="text-sm font-semibold text-zinc-100">{t("notifications.title")}</p>
          {unread > 0 ? (
            <button
              type="button"
              className={cn(
                "text-xs font-medium transition-colors",
                isDark ? "text-zinc-500 hover:text-[#B7F500]" : "text-zinc-500 hover:text-zinc-800",
              )}
              onClick={() => void onMarkAll()}
            >
              {t("notifications.markAllRead")}
            </button>
          ) : null}
        </div>

        {loading ? (
          <p className="px-4 py-6 text-sm text-zinc-500">{t("common.states.loading")}</p>
        ) : error ? (
          <p className="px-4 py-6 text-sm text-rose-400">{error}</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-zinc-500">{t("notifications.empty")}</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1 [scrollbar-color:rgb(63_63_70)_transparent] [scrollbar-width:thin]">
            {items.map((item) => (
              <NotificationBellItem
                key={item.id}
                item={item}
                isDark={isDark}
                locale={locale as AppLocale}
                onOpen={() => void onOpenItem(item)}
              />
            ))}
          </ul>
        )}

        <div className={cn("px-4 py-3", isDark ? "bg-zinc-900/50" : "border-t border-zinc-100")}>
          <Link
            href={allHref}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium transition-colors",
              isDark ? "text-[#B7F500] hover:text-[#c8ff33]" : "text-sky-700 hover:underline",
            )}
            onClick={() => setOpen(false)}
          >
            {t("notifications.viewAll")}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </details>
  );
}
