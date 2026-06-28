"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { PayoutBalanceScaleMock, PayoutComparisonWindowId } from "@/components/dashboard/assets/payouts-mock-data";
import { getPayoutBalanceScaleMock, payoutComparisonWindowOptions } from "@/components/dashboard/assets/payouts-mock-data";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

/** Положите свой файл в `public/images/payouts/` и смените путь через проп `illustrationSrc` или замените этот SVG. */
const DEFAULT_COMPARISON_ILLUSTRATION = "/images/payouts/comparison.svg";

function fmtUsdt(n: number) {
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

type PayoutsBalanceScaleProps = {
  /** Статичные данные (например для сторибука); иначе — мок по выбранному окну. */
  data?: PayoutBalanceScaleMock;
  /** Путь из `public/`, например `/images/payouts/comparison.png` */
  illustrationSrc?: string;
  illustrationAlt?: string;
};

export function PayoutsBalanceScale({
  data: staticData,
  illustrationSrc = DEFAULT_COMPARISON_ILLUSTRATION,
  illustrationAlt,
}: PayoutsBalanceScaleProps) {
  const { t } = useI18n();
  const seriesLocked = Boolean(staticData);
  const [windowId, setWindowId] = useState<PayoutComparisonWindowId>("30d");

  const data = useMemo(
    () => (seriesLocked ? staticData! : getPayoutBalanceScaleMock(windowId)),
    [seriesLocked, staticData, windowId],
  );

  const { left, right, asset } = data;
  const l = left.accrualsUSDT;
  const r = right.accrualsUSDT;
  const max = Math.max(l, r, 1);

  const netLeft = left.accrualsUSDT - left.withdrawalsUSDT;
  const netRight = right.accrualsUSDT - right.withdrawalsUSDT;
  const deltaAccrualPct = l > 0 ? ((r - l) / l) * 100 : 0;
  const heavier: "left" | "right" | "even" =
    Math.abs(r - l) < 0.05 * max ? "even" : r > l ? "right" : "left";

  const panTitle = (titleKey: string) => t(`assets.overview.pan.${titleKey}`);
  const panHint = (hintKey: string) =>
    hintKey === "by_releases" ? t("assets.overview.walletEarnedHint") : hintKey;

  return (
    <section
      className="space-y-10 rounded-3xl bg-white px-5 py-8 sm:space-y-12 sm:px-8 sm:py-10"
      aria-label={t("payouts.balanceCompareAria")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">{asset}</p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
            {t("assets.overview.windowMetricsTitle")}
          </h2>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
          <div
            className="flex rounded-xl bg-neutral-100 p-1"
            role="tablist"
            aria-label={t("payouts.balanceWindowAria")}
          >
            {payoutComparisonWindowOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={!seriesLocked && windowId === opt.id}
                disabled={seriesLocked}
                onClick={() => setWindowId(opt.id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors",
                  !seriesLocked && windowId === opt.id
                    ? "bg-white text-neutral-900 ring-1 ring-neutral-200/80"
                    : "text-neutral-500 hover:text-neutral-800",
                  seriesLocked && "cursor-default opacity-60",
                )}
              >
                {t(`chart.${opt.labelKey}`)}
              </button>
            ))}
          </div>
          <p className="font-mono text-[11px] tracking-wide text-neutral-400 sm:text-right">
            {heavier === "even" && t("assets.overview.parityEven")}
            {heavier === "right" && t("assets.overview.parityRight")}
            {heavier === "left" && t("assets.overview.parityLeft")}
          </p>
        </div>
      </div>

      <figure className="mx-auto w-full max-w-3xl">
        <div className="relative aspect-21/9 w-full overflow-hidden rounded-3xl bg-neutral-50">
          <Image
            src={illustrationSrc}
            alt={illustrationAlt ?? t("payouts.balanceCompareAria")}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, min(1200px, 96vw)"
            priority={false}
          />
        </div>
      </figure>

      <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:gap-10">
        <div className="rounded-3xl bg-neutral-50/90 px-6 py-6 sm:px-7 sm:py-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{panTitle(left.titleKey)}</p>
          <p className="mt-2 font-mono text-xs text-neutral-500">{left.period}</p>
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{t("assets.overview.accruals")}</p>
          <p className="mt-1.5 font-mono text-[1.65rem] font-semibold leading-none tracking-tight text-neutral-900 sm:text-[1.85rem]">
            +{fmtUsdt(left.accrualsUSDT)}
          </p>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{t("assets.overview.withdrawals")}</p>
          <p className="mt-1.5 font-mono text-lg font-semibold tracking-tight text-neutral-700">−{fmtUsdt(left.withdrawalsUSDT)}</p>
          <p className="mt-6 text-sm text-neutral-500">
            {t("assets.overview.netFlow")}{" "}
            <span className="font-mono font-semibold text-neutral-900">
              {netLeft >= 0 ? "+" : "−"}
              {fmtUsdt(Math.abs(netLeft))}
            </span>{" "}
            <span className="text-neutral-400">USDT</span>
          </p>
          <p className="mt-2 text-[11px] text-neutral-400">{panHint(left.hintKey)}</p>
        </div>

        <div className="rounded-3xl bg-neutral-50/90 px-6 py-6 sm:px-7 sm:py-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{panTitle(right.titleKey)}</p>
          <p className="mt-2 font-mono text-xs text-neutral-500">{right.period}</p>
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{t("assets.overview.accruals")}</p>
          <p className="mt-1.5 font-mono text-[1.65rem] font-semibold leading-none tracking-tight text-blue-900 sm:text-[1.85rem]">
            +{fmtUsdt(right.accrualsUSDT)}
          </p>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{t("assets.overview.withdrawals")}</p>
          <p className="mt-1.5 font-mono text-lg font-semibold tracking-tight text-neutral-700">−{fmtUsdt(right.withdrawalsUSDT)}</p>
          <p className="mt-6 text-sm text-neutral-500">
            {t("assets.overview.netFlow")}{" "}
            <span className="font-mono font-semibold text-neutral-900">
              {netRight >= 0 ? "+" : "−"}
              {fmtUsdt(Math.abs(netRight))}
            </span>{" "}
            <span className="text-neutral-400">USDT</span>
          </p>
          <p className="mt-2 text-[11px] text-neutral-400">{panHint(right.hintKey)}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 border-t border-neutral-100 pt-8 text-center">
        <p className="font-mono text-sm text-neutral-600">
          {t("assets.overview.deltaAccruals")}{" "}
          <span className={deltaAccrualPct >= 0 ? "font-semibold text-blue-700" : "font-semibold text-neutral-600"}>
            {deltaAccrualPct >= 0 ? "+" : ""}
            {deltaAccrualPct.toFixed(2).replace(".", ",")}%
          </span>{" "}
          <span className="font-sans font-normal text-neutral-400">{t("payouts.deltaPrev")}</span>
        </p>
      </div>
    </section>
  );
}
