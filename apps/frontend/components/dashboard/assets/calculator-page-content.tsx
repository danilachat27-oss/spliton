"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { FeesPageTabs } from "@/components/fees/fees-page-tabs";
import { UntMark, UsdtMark } from "@/components/shared/asset-marks";
import { ProductDemoBanner } from "@/components/shared/product-demo-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/routes";
import { CALCULATOR_MOCK } from "@/constants/calculator-mock";
import { useCalculatorConfig } from "@/hooks/use-calculator-config";
import { usePublicPlatformFees } from "@/hooks/use-public-platform-fees";
import { formatDate, formatNumber, formatUsdtAmount } from "@/lib/i18n/formatters";
import { tf } from "@/lib/i18n/widget-messages";
import {
  computeEducationalPrimaryBuy,
  computeSecondaryTrade,
} from "@/lib/market/pricing-calculator";
import { isLiveServicesEnabled } from "@/lib/public-env";
import { pctToRate } from "@/services/platform-fees.service";
import type { CalculatorConfig } from "@/services/calculator.service";
import { cn } from "@/lib/utils";

type CalcTab = "buy" | "sell" | "withdraw";

function parsePositiveNumber(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".").trim();
  if (cleaned === "") return null;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

const inputClass =
  "h-12 rounded-xl border-0 bg-white text-lg font-mono font-medium tabular-nums text-neutral-900 shadow-none ring-1 ring-neutral-200/80 transition-[box-shadow,ring-color] placeholder:text-neutral-400 placeholder:font-sans placeholder:text-sm focus-visible:ring-2 focus-visible:ring-[#B7F500]/60 focus-visible:outline-none";

const CALC_TABS: { id: CalcTab; labelKey: string }[] = [
  { id: "buy", labelKey: "calculator.tab.buy" },
  { id: "sell", labelKey: "calculator.tab.sell" },
  { id: "withdraw", labelKey: "calculator.tab.withdraw" },
];

export function CalculatorPageContent() {
  const { t, locale } = useI18n();
  const fmtUsdt = (n: number) => formatUsdtAmount(n, locale).replace(" USDT", "");
  const fmtNum = (n: number) => formatNumber(n, locale);
  const pct = (rate: number) =>
    `${(rate * 100).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;

  const servicesLive = isLiveServicesEnabled();
  const { config, loading: configLoading, error: configError, reload: reloadConfig } = useCalculatorConfig();
  const { fees, loading: feesLoading, error: feesError, reload: reloadFees } = usePublicPlatformFees();

  const rates = useMemo(() => {
    const fromConfig = calculatorConfigFees(config);
    if (fromConfig) return { ...fromConfig, fromLive: true as const };
    if (servicesLive && fees) {
      return {
        buyPlatformFeeRate: pctToRate(fees.primaryPurchaseFeePct),
        secondaryMarketFeeRate: pctToRate(fees.secondaryMarketFeePct),
        withdrawFeeMinUsdt: Number(fees.withdrawalFeeFixedUsdt) || CALCULATOR_MOCK.withdrawFeeMinUsdt,
        withdrawFeeRate: pctToRate(fees.withdrawalFeePct),
        effectiveFrom: fees.effectiveFrom,
        fromLive: true as const,
      };
    }
    if (servicesLive) return null;
    return {
      buyPlatformFeeRate: CALCULATOR_MOCK.buyPlatformFeeRate,
      secondaryMarketFeeRate: CALCULATOR_MOCK.secondaryMarketFeeRate,
      withdrawFeeMinUsdt: CALCULATOR_MOCK.withdrawFeeMinUsdt,
      withdrawFeeRate: CALCULATOR_MOCK.withdrawFeeRate,
      effectiveFrom: null as string | null,
      fromLive: false as const,
    };
  }, [config, fees, servicesLive]);

  const [tab, setTab] = useState<CalcTab>("buy");
  const [buyMode, setBuyMode] = useState<"usdt" | "units">("usdt");
  const [buyUsdt, setBuyUsdt] = useState("1000");
  const [buyUnits, setBuyUnits] = useState("80");
  const [buyPrice, setBuyPrice] = useState(String(CALCULATOR_MOCK.defaultPricePerUnitUsdt));
  const [sellUnits, setSellUnits] = useState("50");
  const [sellPrice, setSellPrice] = useState(String(CALCULATOR_MOCK.defaultPricePerUnitUsdt));
  const [withdrawAmount, setWithdrawAmount] = useState("500");

  const defaultRelease = config?.releases[0];
  useEffect(() => {
    if (!servicesLive || !defaultRelease) return;
    const price = defaultRelease.pricePerUnitUsdt;
    setBuyPrice(price);
    setSellPrice(price);
  }, [defaultRelease, servicesLive]);

  const buyPriceN = parsePositiveNumber(buyPrice) ?? (servicesLive ? null : CALCULATOR_MOCK.defaultPricePerUnitUsdt);
  const sellPriceN = parsePositiveNumber(sellPrice) ?? (servicesLive ? null : CALCULATOR_MOCK.defaultPricePerUnitUsdt);
  const platformFeeRate = rates?.buyPlatformFeeRate ?? 0;
  const secondaryFeeRate = rates?.secondaryMarketFeeRate ?? 0;

  const buyCalc = useMemo(() => {
    if (buyPriceN == null || buyPriceN <= 0) return null;
    const feePct = platformFeeRate * 100;
    if (buyMode === "usdt") {
      const budget = parsePositiveNumber(buyUsdt);
      if (budget === null || budget === 0) return null;
      return computeEducationalPrimaryBuy({
        mode: "usdt",
        budgetUsdt: budget,
        unitPrice: buyPriceN,
        feePct,
      });
    }
    const units = parsePositiveNumber(buyUnits);
    if (units === null || units === 0) return null;
    return computeEducationalPrimaryBuy({
      mode: "units",
      unitsInput: units,
      unitPrice: buyPriceN,
      feePct,
    });
  }, [buyMode, buyUsdt, buyUnits, buyPriceN, platformFeeRate]);

  const sellCalc = useMemo(() => {
    const units = parsePositiveNumber(sellUnits);
    if (units === null || units === 0 || sellPriceN == null || sellPriceN <= 0) return null;
    const feePct = secondaryFeeRate * 100;
    const quote = computeSecondaryTrade({ unitPrice: sellPriceN, units, feePct });
    if (!quote) return null;
    return {
      units,
      gross: quote.grossAmount,
      fee: quote.feeAmount,
      net: quote.sellerNet,
      pricePerUnit: sellPriceN,
    };
  }, [sellUnits, sellPriceN, secondaryFeeRate]);

  const withdrawCalc = useMemo(() => {
    const amount = parsePositiveNumber(withdrawAmount);
    if (amount === null || amount === 0 || !rates) return null;
    const fee = Math.max(rates.withdrawFeeMinUsdt, amount * rates.withdrawFeeRate);
    const net = amount - fee;
    return { amount, fee, net };
  }, [withdrawAmount, rates]);

  const tabItems = useMemo(() => CALC_TABS.map((item) => ({ id: item.id, label: t(item.labelKey) })), [t]);

  const unavailable = servicesLive && !configLoading && (!config || Boolean(configError) || !rates);

  if (configLoading && servicesLive) {
    return (
      <div className="space-y-4">
        <div className="h-14 animate-pulse rounded-2xl bg-neutral-100" />
        <div className="h-72 animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-red-900">{t("calculator.unavailable.title")}</p>
        <p className="mt-2 text-sm text-red-800">{configError ?? feesError ?? t("calculator.unavailable.subtitle")}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => {
            void reloadConfig();
            void reloadFees();
          }}
        >
          {t("calculator.unavailable.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!servicesLive ? <ProductDemoBanner messageKey="calculator.demoBanner" /> : null}

      <section className="rounded-2xl bg-white px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FeesPageTabs items={tabItems} active={tab} onChange={setTab} size="sub" className="min-w-0 flex-1" />
          {rates ? (
            <p className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700">
              {tab === "buy"
                ? tf(t("calculator.summary.platformFee"), { rate: pct(platformFeeRate) })
                : tab === "sell"
                  ? tf(t("calculator.summary.secondaryFee"), { rate: pct(secondaryFeeRate) })
                  : tf(t("calculator.summary.withdrawFee"), {
                      min: String(rates.withdrawFeeMinUsdt),
                      rate: pct(rates.withdrawFeeRate),
                    })}
            </p>
          ) : null}
        </div>

        {servicesLive && feesLoading ? (
          <p className="mt-3 text-xs text-neutral-500">{t("calculator.feesLoading")}</p>
        ) : null}

        {tab === "buy" ? (
          <div className="mt-6">
            <div className="inline-flex rounded-full bg-neutral-100 p-1">
              {(
                [
                  { id: "usdt" as const, label: t("calculator.buy.modeUsdt") },
                  { id: "units" as const, label: t("calculator.buy.modeUnits") },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setBuyMode(o.id)}
                  className={cn(
                    "rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
                    buyMode === o.id ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                id="calc-buy-primary"
                label={buyMode === "usdt" ? t("calculator.buy.payAmount") : t("calculator.buy.unitsToBuy")}
                value={buyMode === "usdt" ? buyUsdt : buyUnits}
                onChange={buyMode === "usdt" ? setBuyUsdt : setBuyUnits}
                suffix={buyMode === "usdt" ? <UsdtMark /> : <UntMark />}
                suffixLabel={buyMode === "usdt" ? "USDT" : "UNT"}
              />
              <Field
                id="calc-buy-price"
                label={t("calculator.buy.priceLabel")}
                value={buyPrice}
                onChange={setBuyPrice}
                suffix={<UntMark />}
                suffixLabel="USDT / UNT"
              />
            </div>

            {buyCalc ? (
              <ResultPanel
                headline={`≈ ${fmtNum(buyCalc.units)} UNT`}
                subline={tf(t("calculator.summary.toPay"), { amount: fmtUsdt(buyCalc.totalPaid) })}
                rows={[
                  { label: t("calculator.buy.statPrice"), value: `${fmtUsdt(buyCalc.pricePerUnit)} USDT` },
                  { label: t("calculator.buy.feePlatform"), value: `${fmtUsdt(buyCalc.feeAmount)} USDT` },
                  { label: t("calculator.buy.feeTotal"), value: `${fmtUsdt(buyCalc.totalPaid)} USDT`, strong: true },
                ]}
                footnote={t("calculator.buy.primaryCheckoutNote")}
              />
            ) : (
              <EmptyState message={t("calculator.buy.empty")} />
            )}
          </div>
        ) : null}

        {tab === "sell" ? (
          <div className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="calc-sell-units"
                label={t("calculator.sell.unitsLabel")}
                value={sellUnits}
                onChange={setSellUnits}
                suffix={<UntMark />}
                suffixLabel="UNT"
              />
              <Field
                id="calc-sell-price"
                label={t("calculator.sell.priceLabel")}
                value={sellPrice}
                onChange={setSellPrice}
                suffix={<UntMark />}
                suffixLabel="USDT / UNT"
              />
            </div>

            {sellCalc ? (
              <ResultPanel
                headline={`${fmtUsdt(sellCalc.net)} USDT`}
                subline={t("calculator.sell.net")}
                rows={[
                  { label: t("calculator.sell.gross"), value: `${fmtUsdt(sellCalc.gross)} USDT` },
                  { label: t("calculator.sell.feeSecondary"), value: `− ${fmtUsdt(sellCalc.fee)} USDT` },
                  { label: t("calculator.sell.net"), value: `${fmtUsdt(sellCalc.net)} USDT`, strong: true },
                ]}
              />
            ) : (
              <EmptyState message={t("calculator.sell.empty")} />
            )}
          </div>
        ) : null}

        {tab === "withdraw" ? (
          <div className="mt-6">
            <div className="max-w-md">
              <Field
                id="calc-withdraw-amount"
                label={t("calculator.withdraw.amountLabel")}
                value={withdrawAmount}
                onChange={setWithdrawAmount}
                suffix={<UsdtMark />}
                suffixLabel="USDT"
              />
            </div>

            {withdrawCalc ? (
              <ResultPanel
                headline={`${fmtUsdt(withdrawCalc.net)} USDT`}
                subline={t("calculator.withdraw.toAddress")}
                rows={[
                  { label: t("calculator.withdraw.amountLabel"), value: `${fmtUsdt(withdrawCalc.amount)} USDT` },
                  { label: t("calculator.withdraw.fee"), value: `− ${fmtUsdt(withdrawCalc.fee)} USDT` },
                  { label: t("calculator.withdraw.toAddress"), value: `${fmtUsdt(withdrawCalc.net)} USDT`, strong: true },
                ]}
              />
            ) : (
              <EmptyState message={t("calculator.withdraw.empty")} />
            )}
            <p className="mt-3 text-xs text-neutral-500">{t("calculator.withdraw.networkNote")}</p>
          </div>
        ) : null}

        {rates?.fromLive && rates.effectiveFrom ? (
          <p className="mt-4 text-xs text-neutral-500">
            {tf(t("calculator.product.feesUpdated"), { date: formatDate(rates.effectiveFrom, locale) })}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:flex-wrap">
          <Link
            href={ROUTES.dashboardCatalog}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#B7F500] px-5 text-[13px] font-semibold text-black transition hover:bg-[#c8ff3d]"
          >
            {t("calculator.product.ctaCatalog")}
          </Link>
          <Link
            href={ROUTES.fees}
            className="inline-flex h-10 items-center justify-center rounded-full bg-neutral-100 px-5 text-[13px] font-semibold text-neutral-800 transition hover:bg-neutral-200/80"
          >
            {t("calculator.product.ctaFees")}
          </Link>
          {tab !== "sell" ? (
            <Link
              href={ROUTES.dashboardSecondaryMarket}
              className="inline-flex h-10 items-center justify-center rounded-full bg-neutral-100 px-5 text-[13px] font-semibold text-neutral-800 transition hover:bg-neutral-200/80"
            >
              {t("calculator.product.ctaSecondary")}
            </Link>
          ) : null}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-neutral-500">{t("calculator.disclaimer")}</p>
      </section>
    </div>
  );
}

function calculatorConfigFees(config: CalculatorConfig | null) {
  if (!config?.fees) return null;
  const f = config.fees;
  return {
    buyPlatformFeeRate: pctToRate(f.primaryPurchaseFeePct),
    secondaryMarketFeeRate: pctToRate(f.secondaryMarketFeePct),
    withdrawFeeMinUsdt: Number(f.withdrawalFeeFixedUsdt) || CALCULATOR_MOCK.withdrawFeeMinUsdt,
    withdrawFeeRate: pctToRate(f.withdrawalFeePct),
    effectiveFrom: f.effectiveFrom,
  };
}

function Field({
  id,
  label,
  value,
  onChange,
  suffix,
  suffixLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix: ReactNode;
  suffixLabel: string;
}) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4 sm:p-5">
      <Label htmlFor={id} className="text-xs font-medium text-neutral-600">
        {label}
      </Label>
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "mt-2 w-full")}
      />
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600">
        {suffix}
        <span>{suffixLabel}</span>
      </p>
    </div>
  );
}

function ResultPanel({
  headline,
  subline,
  rows,
  footnote,
}: {
  headline: string;
  subline: string;
  rows: { label: string; value: string; strong?: boolean }[];
  footnote?: string;
}) {
  return (
    <div className="mt-6 space-y-3">
      <div className="rounded-2xl bg-[#f6f7f9] px-4 py-5 sm:px-6">
        <p className="text-[1.75rem] font-semibold tracking-tight text-neutral-900 tabular-nums sm:text-3xl">{headline}</p>
        <p className="mt-1 text-sm text-neutral-600">{subline}</p>
      </div>
      <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100 bg-white px-4 sm:px-5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-3.5">
            <span className={cn("text-sm", row.strong ? "font-medium text-neutral-900" : "text-neutral-600")}>
              {row.label}
            </span>
            <span
              className={cn(
                "font-mono text-sm tabular-nums text-neutral-900",
                row.strong ? "font-semibold" : "font-medium",
              )}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
      {footnote ? <p className="text-xs leading-relaxed text-neutral-500">{footnote}</p> : null}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="mt-6 rounded-2xl bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">{message}</p>
  );
}
