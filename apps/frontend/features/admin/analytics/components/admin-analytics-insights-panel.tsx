"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "@/lib/lucide";

import { adminListRow } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";

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
  const urgent = items.filter((i) => i.priority === "high" || (i.count ?? 0) > 0);

  return (
    <div className={cn(ADMIN_SECTION_TILE, "relative isolate p-5", className)}>
      <h3 className="text-sm font-semibold text-zinc-100">Что требует внимания</h3>
      {urgent.length === 0 ? (
        <div className="mt-4 flex gap-3 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm ring-1 ring-emerald-500/25">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
          <div>
            <p className="font-medium text-emerald-100">Критических задач нет</p>
            <p className="mt-0.5 text-emerald-200/80">
              Все основные зоны находятся в нормальном состоянии.
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {urgent.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  adminListRow(),
                  "flex items-center justify-between gap-3 text-sm text-zinc-200 hover:text-zinc-100",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <AlertTriangle
                    className={cn(
                      "size-4 shrink-0",
                      item.priority === "high" ? "text-amber-400" : "text-zinc-500",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.count != null && item.count > 0 ? (
                  <span className="shrink-0 rounded-full bg-zinc-800/90 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-100">
                    {item.count}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
