"use client";

import Link from "next/link";
import { ChevronRight } from "@/lib/lucide";

import { cn } from "@/lib/utils";
import { usersFilterHref } from "@/features/admin/lib/admin-user-analytics-i18n";

export type FunnelStep = {
  key: string;
  label: string;
  count: number;
  conversionFromPreviousPct?: number;
  conversionFromRegistrationPct?: number;
  dropOff?: number;
};

type Props = {
  steps: FunnelStep[];
  className?: string;
};

export function AdminUserActivationFunnel({ steps, className }: Props) {
  if (!steps.length) return null;

  const maxCount = Math.max(...steps.map((s) => s.count), 1);
  const maxDrop = steps.reduce(
    (best, s, idx) => (idx > 0 && (s.dropOff ?? 0) > (best?.dropOff ?? 0) ? s : best),
    steps[1],
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((step, idx) => {
          const widthPct = Math.max(12, Math.round((step.count / maxCount) * 100));
          const isDrop = maxDrop?.key === step.key && (step.dropOff ?? 0) > 0;
          return (
            <div key={step.key} className="flex min-w-[140px] shrink-0 items-stretch gap-1">
              <Link
                href={usersFilterHref({ segment: step.key })}
                className={cn(
                  "flex flex-1 flex-col rounded-2xl border px-3 py-3 transition-colors hover:shadow-md",
                  isDrop
                    ? "border-amber-300/90 bg-amber-50/80"
                    : "border-zinc-800/90 bg-zinc-900/80",
                )}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {idx + 1}. {step.label}
                </span>
                <span className="mt-2 text-xl font-semibold tabular-nums text-zinc-100">
                  {step.count.toLocaleString("ru-RU")}
                </span>
                <div
                  className="mt-2 h-1.5 rounded-full bg-zinc-100"
                  title={`${widthPct}% от максимума воронки`}
                >
                  <div
                    className={cn("h-full rounded-full", isDrop ? "bg-amber-500" : "bg-zinc-900")}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                {idx > 0 ? (
                  <p className="mt-2 text-[11px] text-zinc-500">
                    {step.conversionFromPreviousPct?.toLocaleString("ru-RU")}% от пред. · drop{" "}
                    {step.dropOff ?? 0}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-zinc-500">100% старт воронки</p>
                )}
              </Link>
              {idx < steps.length - 1 ? (
                <ChevronRight className="size-5 shrink-0 self-center text-zinc-300" aria-hidden />
              ) : null}
            </div>
          );
        })}
      </div>
      {maxDrop && (maxDrop.dropOff ?? 0) > 0 ? (
        <p className="text-xs text-amber-800">
          Наибольший отток на этапе «{maxDrop.label}» (−{maxDrop.dropOff} пользователей).
        </p>
      ) : null}
    </div>
  );
}
