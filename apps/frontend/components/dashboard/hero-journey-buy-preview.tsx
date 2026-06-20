"use client";

import type { ReactNode } from "react";

import { UntMark, UsdtMark } from "@/components/shared/asset-marks";
import { useI18n } from "@/components/providers/i18n-provider";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";

import { HERO_JOURNEY_RELEASE } from "./hero-journey-data";

const FIELD_BOX = cn(
  "rounded-2xl bg-[#f5f5f6] px-4 py-3.5 transition-[background-color,box-shadow]",
  "focus-within:bg-white focus-within:shadow-[0_6px_28px_-12px_rgba(0,0,0,0.08)]",
);

const VALUE_CLASS =
  "text-[28px] font-semibold tabular-nums tracking-tight text-zinc-950 md:text-[32px]";

function AssetSelectorPill({ icon, symbol }: { icon: ReactNode; symbol: string }) {
  return (
    <div
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#ebebeb] px-2.5 font-semibold text-zinc-950"
      role="presentation"
    >
      {icon}
      <span className="text-[13px] tracking-tight">{symbol}</span>
    </div>
  );
}

export function HeroJourneyBuyPreview() {
  const { t } = useI18n();
  const release = HERO_JOURNEY_RELEASE;
  const unitPrice = release.unitPrice;
  const targetUnits = release.units;

  return (
    <div className="hero-journey-buy-panel relative rounded-3xl bg-white p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] md:p-7">
      <div className={FIELD_BOX}>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[12px] font-medium text-zinc-500">{t("catalog.buy.panel.youPay")}</p>
            <div className={cn("relative mt-1 min-h-[38px] md:min-h-[42px]", VALUE_CLASS)}>
              <span className="hero-journey-buy-pay-step hero-journey-buy-pay-step--1 absolute inset-0 font-mono">
                22,00
              </span>
              <span className="hero-journey-buy-pay-step hero-journey-buy-pay-step--2 absolute inset-0 font-mono">
                264,00
              </span>
              <span className="hero-journey-buy-pay-step hero-journey-buy-pay-step--3 absolute inset-0 font-mono">
                2 640,00
              </span>
            </div>
          </div>
          <AssetSelectorPill icon={<UsdtMark />} symbol="USDT" />
        </div>
        <p className="mt-2 text-left text-[11px] leading-snug text-zinc-400">
          {unitPrice} — 26 400,00 USDT
        </p>
      </div>

      <p className="mt-3 text-center text-[11px] leading-snug text-zinc-500">
        {tf(t("catalog.buy.panel.unitPriceFee"), { price: unitPrice, fee: "2,6" })}
      </p>

      <p className="mt-4 rounded-xl bg-zinc-50 px-3 py-2 text-left text-[11px] leading-relaxed text-zinc-500">
        {t("catalog.buy.panel.disclaimer")}
      </p>

      <div className="mt-3">
        <div
          className={cn(FIELD_BOX, "hero-journey-buy-units-field text-left")}
        >
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-zinc-500">{t("catalog.buy.panel.youReceive")}</p>
              <div
                className={cn("mt-1 flex min-h-[38px] items-end md:min-h-[42px]", VALUE_CLASS)}
                data-journey-target="buy-units"
              >
                <div className="inline-flex max-w-full items-end">
                  <div className="hero-journey-buy-qty-typed overflow-hidden font-mono">
                    <span className="whitespace-nowrap">{targetUnits}</span>
                  </div>
                  <span className="hero-journey-buy-caret mb-[0.08em] ml-px inline-block w-px shrink-0 bg-zinc-950" aria-hidden />
                </div>
              </div>
            </div>
            <AssetSelectorPill icon={<UntMark />} symbol="UNT" />
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            {tf(t("catalog.buy.panel.availableToBuy"), { units: "1 200" })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-medium text-zinc-700">
              25%
            </span>
            <span className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-medium text-zinc-700">
              50%
            </span>
            <span className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-medium text-zinc-700">
              {t("catalog.buy.panel.quickMax")}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        data-journey-target="buy"
        className="hero-journey-buy-btn mt-5 h-12 w-full rounded-2xl bg-zinc-950 text-[14px] font-semibold text-white"
      >
        {t("catalog.buy.submitDemo")}
      </button>
    </div>
  );
}
