"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";

import { HERO_JOURNEY_RELEASE } from "./hero-journey-data";

const FIELD_BOX =
  "rounded-2xl bg-neutral-50 px-4 py-3.5 ring-1 ring-neutral-100/80";

export function HeroJourneySellPreview() {
  const { t } = useI18n();
  const release = HERO_JOURNEY_RELEASE;
  const qty = 12;
  const price = release.askPrice;
  const fee = "0,13";
  const net = "12,18";

  return (
    <div className="relative rounded-3xl bg-white p-5 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.12)] ring-1 ring-neutral-100 md:p-6">
      <div className="mb-4 rounded-2xl bg-neutral-50 px-3.5 py-3 ring-1 ring-neutral-100/80">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          {t("sell.orderTitle")}
        </p>
        <p className="mt-1 truncate text-[15px] font-semibold text-neutral-950">{release.title}</p>
        <p className="mt-0.5 truncate text-[12px] text-neutral-600">{release.artist}</p>
        <p className="mt-2 font-mono text-[13px] tabular-nums text-neutral-800">
          <span className="text-neutral-500">{t("sell.symbol")}</span> {release.symbol}
          <span className="mx-2 text-neutral-300" aria-hidden>
            ·
          </span>
          <span className="text-neutral-500">{t("sell.available")}</span> {release.units} UNT
        </p>
      </div>

      <div className={FIELD_BOX}>
        <p className="text-[12px] font-medium text-neutral-500">{t("sell.priceLabel")}</p>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <span className="text-[26px] font-semibold tabular-nums tracking-tight text-neutral-950">{price}</span>
          <span className="shrink-0 rounded-xl bg-neutral-100/90 px-2.5 py-1.5 text-[12px] font-semibold text-neutral-800">
            USDT
          </span>
        </div>
      </div>

      <div className="my-3 flex justify-center" aria-hidden>
        <div className="h-px w-12 rounded-full bg-neutral-200" />
      </div>

      <div className={FIELD_BOX}>
        <p className="text-[12px] font-medium text-neutral-500">{t("sell.qtyLabel")}</p>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <span className="text-[26px] font-semibold tabular-nums tracking-tight text-neutral-950">{qty}</span>
          <span className="shrink-0 rounded-xl bg-neutral-100/90 px-2.5 py-1.5 text-[12px] font-semibold text-neutral-800">
            UNT
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 ring-1 ring-neutral-100">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{t("sell.summary")}</p>
        <dl className="mt-2.5 space-y-2 font-mono text-[13px] tabular-nums">
          <div className="flex items-baseline justify-between gap-3 border-b border-neutral-100 pb-2">
            <dt className="text-[12px] font-sans font-medium text-neutral-600">{t("sell.gross")}</dt>
            <dd className="font-semibold text-neutral-950">12,31 USDT</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-b border-neutral-100 pb-2">
            <dt className="text-[12px] font-sans font-medium text-neutral-600">
              {tf(t("sell.fee"), { pct: "1" })}
            </dt>
            <dd className="text-neutral-800">−{fee} USDT</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-[12px] font-sans font-semibold text-neutral-800">{t("sell.net")}</dt>
            <dd className="text-lg font-semibold text-neutral-950">{net} USDT</dd>
          </div>
        </dl>
      </div>

      <button
        type="button"
        data-journey-target="sell"
        className={cn(
          "hero-journey-sell-btn mt-5 h-11 w-full rounded-2xl bg-neutral-900 text-[14px] font-semibold text-white",
        )}
      >
        {tf(t("sell.submit"), { symbol: release.symbol })}
      </button>
    </div>
  );
}
