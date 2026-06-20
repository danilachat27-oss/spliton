"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import type { ReleaseDetailPageData } from "@/types/analytics/release-detail";

function lifecycleBadgeClass(tone: ReleaseDetailPageData["pageState"]["badgeTone"]): string {
  switch (tone) {
    case "success":
      return "bg-emerald-500/12 text-emerald-300 ring-emerald-500/25";
    case "warning":
      return "bg-amber-500/12 text-amber-200 ring-amber-500/20";
    case "muted":
      return "bg-white/6 text-zinc-400 ring-white/10";
    default:
      return "bg-white/6 text-zinc-300 ring-white/10";
  }
}

export function ReleaseDetailHeroCta({ data }: { data: ReleaseDetailPageData }) {
  const { t } = useI18n();
  const { primaryCta, secondaryCta } = data.pageState;

  if (!primaryCta && !secondaryCta) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
      {primaryCta ? (
        primaryCta.disabled ? (
          <span
            className="inline-flex cursor-not-allowed items-center rounded-full bg-white/8 px-5 py-2.5 text-sm font-semibold text-zinc-500"
            title={primaryCta.reasonKey ? t(primaryCta.reasonKey) : undefined}
          >
            {t(primaryCta.labelKey)}
          </span>
        ) : (
          <Link
            href={primaryCta.href}
            className="inline-flex items-center rounded-full bg-[#B7F500] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#c9ff52]"
          >
            {t(primaryCta.labelKey)}
          </Link>
        )
      ) : null}
      {secondaryCta && !secondaryCta.disabled ? (
        <Link
          href={secondaryCta.href}
          className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          {t(secondaryCta.labelKey)}
        </Link>
      ) : null}
    </div>
  );
}

export function ReleaseDetailLifecycleBadge({ data }: { data: ReleaseDetailPageData }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 sm:text-[11px]",
        lifecycleBadgeClass(data.pageState.badgeTone),
      )}
    >
      {data.lifecycleLabel}
    </span>
  );
}
