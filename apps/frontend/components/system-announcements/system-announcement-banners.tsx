"use client";

import Link from "next/link";
import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, Wrench, X } from "@/lib/lucide";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import {
  dismissAnnouncement,
  fetchActiveAnnouncements,
  type ActiveAnnouncement,
} from "@/services/system-announcements.service";

const DISMISSED_KEY = "spliton_dismissed_announcements";

function readGuestDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function persistGuestDismissed(ids: Set<string>) {
  window.localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
}

function severityStyles(severity: string, type: string) {
  if (type === "maintenance" || type === "incident" || severity === "critical") {
    return "border-amber-300 bg-amber-50 text-amber-950 [&_a]:text-amber-900 [&_a:hover]:text-amber-950";
  }
  if (type === "error" || severity === "high") {
    return "border-rose-300 bg-rose-50 text-rose-950 [&_a]:text-rose-900 [&_a:hover]:text-rose-950";
  }
  if (type === "success") {
    return "border-emerald-300 bg-emerald-50 text-emerald-950 [&_a]:text-emerald-900 [&_a:hover]:text-emerald-950";
  }
  return "border-sky-300 bg-sky-50 text-sky-950 [&_a]:text-sky-900 [&_a:hover]:text-sky-950";
}

function BannerIcon({ type }: { type: string }) {
  if (type === "maintenance") return <Wrench className="size-4 shrink-0" aria-hidden />;
  if (type === "success") return <CheckCircle2 className="size-4 shrink-0" aria-hidden />;
  if (type === "error" || type === "incident") {
    return <AlertTriangle className="size-4 shrink-0" aria-hidden />;
  }
  return <Info className="size-4 shrink-0" aria-hidden />;
}

function AnnouncementBannerItem({
  item,
  onDismiss,
}: {
  item: ActiveAnnouncement;
  onDismiss: (id: string) => void;
}) {
  const { t } = useI18n();
  const text = item.shortMessage?.trim() || item.message;

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 border px-4 py-3 text-sm sm:px-5",
        severityStyles(item.severity, item.type),
      )}
    >
      <BannerIcon type={item.type} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{item.title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed opacity-80">{text}</p>
        {item.actionUrl ? (
          <Link
            href={item.actionUrl}
            className="mt-2 inline-flex text-xs font-semibold underline underline-offset-2"
          >
            {item.actionLabel || t("actions.learnMore")}
          </Link>
        ) : null}
      </div>
      {item.dismissible ? (
        <button
          type="button"
          className="rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
          aria-label={t("actions.dismiss")}
          onClick={() => onDismiss(item.id)}
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

type SystemAnnouncementBannersProps = {
  surface?: "public" | "app" | "admin";
  className?: string;
};

export function SystemAnnouncementBanners({
  surface = "app",
  className,
}: SystemAnnouncementBannersProps) {
  const { locale } = useI18n();
  const { accessToken, isAuthenticated } = useAuth();
  const [items, setItems] = React.useState<ActiveAnnouncement[]>([]);
  const guestDismissedRef = React.useRef<Set<string>>(readGuestDismissed());

  React.useEffect(() => {
    let cancelled = false;
    void fetchActiveAnnouncements({ locale, surface, accessToken })
      .then((rows) => {
        if (cancelled) return;
        const filtered = rows.filter((row) => !guestDismissedRef.current.has(row.id));
        setItems(filtered);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, surface, accessToken, isAuthenticated]);

  const dismiss = React.useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (accessToken) {
        void dismissAnnouncement(id, accessToken);
        return;
      }
      guestDismissedRef.current.add(id);
      persistGuestDismissed(guestDismissedRef.current);
    },
    [accessToken],
  );

  if (!items.length) return null;

  return (
    <div className={cn("relative z-30 flex flex-col gap-2", className)}>
      {items.map((item) => (
        <AnnouncementBannerItem key={item.id} item={item} onDismiss={dismiss} />
      ))}
    </div>
  );
}
