"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "@/lib/lucide";

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
    <div className={cn(ADMIN_SECTION_TILE, "p-5", className)}>
      <h3 className="text-sm font-semibold text-zinc-100">Что требует внимания</h3>
      {urgent.length === 0 ? (
        <div className="mt-4 flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
          <div>
            <p className="font-medium text-emerald-100">Критических задач нет</p>
            <p className="mt-0.5 text-emerald-200/80">
              Все основные зоны находятся в нормальном состоянии.
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {urgent.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2.5 text-sm transition-colors hover:border-[#B7F500]/25 hover:bg-zinc-900/70"
              >
                <span className="flex items-center gap-2 text-zinc-200">
                  <AlertTriangle
                    className={cn(
                      "size-4 shrink-0",
                      item.priority === "high" ? "text-amber-600" : "text-zinc-400",
                    )}
                  />
                  {item.label}
                </span>
                {item.count != null && item.count > 0 ? (
                  <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">
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
