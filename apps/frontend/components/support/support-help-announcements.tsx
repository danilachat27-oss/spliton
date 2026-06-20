"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Info, Wrench } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { fetchActiveAnnouncements, type ActiveAnnouncement } from "@/services/system-announcements.service";
import { cn } from "@/lib/utils";

function AnnouncementIcon({ type }: { type: string }) {
  if (type === "maintenance" || type === "incident") return <Wrench className="size-4 shrink-0" aria-hidden />;
  if (type === "warning" || type === "error") return <AlertTriangle className="size-4 shrink-0" aria-hidden />;
  return <Info className="size-4 shrink-0" aria-hidden />;
}

function severityClass(type: string, severity: string) {
  if (type === "maintenance" || type === "incident" || severity === "critical" || severity === "high") {
    return "border-amber-500/20 bg-amber-500/[0.08] text-amber-100";
  }
  return "border-sky-500/20 bg-sky-500/[0.08] text-sky-100";
}

export function SupportHelpAnnouncements({ className }: { className?: string }) {
  const { locale } = useI18n();
  const [items, setItems] = React.useState<ActiveAnnouncement[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchActiveAnnouncements({ locale, surface: "public" })
      .then((res) => {
        if (!cancelled) setItems(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (loading) {
    return (
      <div className={cn("space-y-3", className)} aria-busy="true" aria-live="polite">
        {[0, 1].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-[#111111]" />
        ))}
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className={cn("space-y-3", className)} aria-live="polite">
      {items.map((item) => (
        <article
          key={item.id}
          className={cn("rounded-2xl border px-4 py-4 sm:px-5", severityClass(item.type, item.severity))}
        >
          <div className="flex gap-3">
            <AnnouncementIcon type={item.type} />
            <div className="min-w-0 flex-1">
              <h3 className="break-words text-sm font-semibold">{item.title}</h3>
              <p className="mt-1 break-words text-xs leading-relaxed opacity-90">
                {item.shortMessage || item.message}
              </p>
              {item.actionUrl && item.actionLabel ? (
                <Link
                  href={item.actionUrl}
                  className="mt-2 inline-flex items-center gap-1 rounded-sm text-xs font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  {item.actionLabel}
                  <ArrowUpRight className="size-3" aria-hidden />
                </Link>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
