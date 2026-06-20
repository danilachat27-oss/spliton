"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "@/lib/lucide";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { ADMIN_SECTION_NOTICE, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { cn } from "@/lib/utils";

export type AnalyticsInsightItem = {
  id: string;
  label: string;
  count?: number;
  href: string;
  priority?: "high" | "medium" | "low";
};

type Props = {
  items: AnalyticsInsightItem[];
  className?: string;
};

export function AdminAnalyticsInsightsPanel({ items, className }: Props) {
  const a = useAdminI18n();
  const urgent = items.filter((i) => i.priority === "high" || (i.count ?? 0) > 0);

  return (
    <div className={cn(ADMIN_SECTION_TILE, "relative isolate min-w-0", className)}>
      <h3 className="text-sm font-semibold text-zinc-100">
        {a.t("admin.analytics.attention.title")}
      </h3>
      {urgent.length === 0 ? (
        <div className={cn(ADMIN_SECTION_NOTICE, "mt-4 text-sm text-emerald-300")}>
          <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
          <div>
            <p className="font-medium text-emerald-200">{a.t("admin.analytics.attention.allClearTitle")}</p>
            <p className="mt-0.5 text-xs text-emerald-300/80">{a.t("admin.analytics.attention.allClearDesc")}</p>
          </div>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {urgent.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  ADMIN_SECTION_TILE,
                  "flex items-center justify-between gap-3 px-3 py-3 text-sm transition-colors hover:bg-zinc-900/70",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <AlertTriangle
                    className={cn(
                      "size-4 shrink-0",
                      item.priority === "high" ? "text-amber-400" : "text-zinc-500",
                    )}
                  />
                  <span className="truncate text-zinc-200">{item.label}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {item.count != null && item.count > 0 ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                        item.priority === "high"
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-zinc-800 text-zinc-300",
                      )}
                    >
                      {item.count}
                    </span>
                  ) : null}
                  <ArrowRight className="size-3.5 text-zinc-600" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
