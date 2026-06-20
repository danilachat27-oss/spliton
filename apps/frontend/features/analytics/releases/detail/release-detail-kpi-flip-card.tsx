"use client";

import { useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { detailPageText } from "@/lib/i18n/analytics-detail-page-messages";
import { cn } from "@/lib/utils";
import type { ReleaseDetailQuickStat } from "@/types/analytics/release-detail";

export function ReleaseDetailKpiFlipCard({ stat }: { stat: ReleaseDetailQuickStat }) {
  const { locale } = useI18n();
  const [flipped, setFlipped] = useState(false);
  const backText = stat.info?.trim() || stat.sub?.trim();
  const canFlip = Boolean(backText);

  const flipBack = detailPageText(locale, "analytics.detail.kpi.flipBack");
  const flipHint = detailPageText(locale, "analytics.detail.kpi.flipHint");

  return (
    <button
      type="button"
      disabled={!canFlip}
      onClick={() => canFlip && setFlipped((v) => !v)}
      aria-pressed={flipped}
      aria-label={
        canFlip
          ? flipped
            ? `${flipBack}: ${stat.label}`
            : `${stat.label}. ${flipHint}`
          : stat.label
      }
      className={cn(
        "w-full text-left [perspective:1000px]",
        canFlip && "cursor-pointer",
        !canFlip && "cursor-default",
      )}
    >
      <div
        className={cn(
          "relative min-h-[112px] w-full transition-transform duration-500 ease-in-out [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 flex min-h-[112px] flex-col gap-3 rounded-xl bg-[#111111] px-4 py-4 ring-1 ring-white/6 backface-hidden",
            canFlip && "transition-colors hover:bg-white/4 hover:ring-white/9",
          )}
        >
          <div className="flex min-w-0 items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-[10px] font-semibold uppercase tracking-[0.12em] leading-relaxed text-zinc-500">
              {stat.label}
            </p>
            {canFlip ? (
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border border-zinc-600/90",
                  "font-serif text-[11px] font-semibold italic leading-none text-zinc-500",
                )}
                aria-hidden
              >
                i
              </span>
            ) : null}
          </div>
          <p className="min-w-0 shrink-0 wrap-break-word font-mono text-[15px] font-semibold leading-normal tabular-nums text-white sm:text-base">
            {stat.value}
          </p>
          {stat.sub ? (
            <p className="shrink-0 text-[11px] leading-relaxed text-zinc-500">{stat.sub}</p>
          ) : null}
        </div>

        {canFlip ? (
          <div className="absolute inset-0 flex min-h-[112px] flex-col justify-between rounded-xl bg-[#141414] px-4 py-4 ring-1 ring-white/10 backface-hidden [transform:rotateY(180deg)]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {flipHint}
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-300">{backText}</p>
            </div>
            <p className="text-[10px] text-zinc-600">{flipBack}</p>
          </div>
        ) : null}
      </div>
    </button>
  );
}
