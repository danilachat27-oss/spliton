"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Clock, ExternalLink } from "@/lib/lucide";

import { FeesFaqList } from "@/components/fees/fees-faq-list";
import { FeesPageTabs } from "@/components/fees/fees-page-tabs";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  FEES_MAIN_SECTIONS,
  FEES_TRADING_TABS,
  FEES_WITHDRAWAL_LIMITS_BY_KYC,
  FEES_RATES,
  feesRuleSections,
  type FeesMainSection,
  type FeesRuleSection,
  type FeesTradingTab,
} from "@/constants/fees-mock-data";
import { ROUTES } from "@/constants/routes";
import { usePublicPlatformFees } from "@/hooks/use-public-platform-fees";
import { tf } from "@/lib/i18n/financial-messages";
import { intlLocaleFor } from "@/lib/i18n/formatters";
import { cn } from "@/lib/utils";

function FeeDisplay({
  value,
  suffix,
  tone,
  size = "lg",
}: {
  value: string;
  suffix?: string;
  tone: "primary" | "units" | "fee" | "neutral";
  size?: "lg" | "xl";
}) {
  const sizeCls = size === "xl" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";
  const toneCls =
    tone === "primary"
      ? "bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent"
      : tone === "units"
        ? "bg-gradient-to-br from-emerald-800 via-teal-700 to-cyan-700 bg-clip-text text-transparent"
        : tone === "fee"
          ? "text-neutral-600"
          : "text-neutral-900";

  return (
    <span
      className={cn(
        "font-mono font-semibold tabular-nums tracking-tight [font-feature-settings:'tnum','lnum']",
        sizeCls,
        toneCls,
      )}
    >
      {value}
      {suffix ? <span className="text-[0.65em] font-medium text-neutral-500">{suffix}</span> : null}
    </span>
  );
}

function ExampleCard({
  title,
  subtitle,
  rows,
  highlight,
}: {
  title: string;
  subtitle: string;
  rows: { label: string; value: string; dim?: boolean }[];
  highlight: { label: string; amount: string; tone?: "primary" | "units" };
}) {
  const tone = highlight.tone ?? "primary";
  return (
    <div className="flex flex-col rounded-2xl border border-neutral-200/80 bg-white px-5 py-6 sm:px-6 sm:py-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{subtitle}</p>
      <h3 className="mt-1 text-base font-semibold tracking-tight text-neutral-900">{title}</h3>
      <div className="mt-5 rounded-xl bg-neutral-50 px-4 py-3 sm:px-5">
        <div className="space-y-0">
          {rows.map((r, i) => (
            <div key={r.label}>
              {i > 0 ? <div className="border-t border-neutral-100/90" /> : null}
              <div className="flex items-center justify-between gap-3 py-3">
                <span className={cn("text-sm", r.dim ? "text-neutral-500" : "text-neutral-600")}>{r.label}</span>
                <span className="font-mono text-xs font-medium tabular-nums text-neutral-900 sm:text-sm">{r.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-4 sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">{highlight.label}</p>
        <div className="mt-1">
          <FeeDisplay value={highlight.amount} suffix=" USDT" tone={tone} size="lg" />
        </div>
      </div>
    </div>
  );
}

function FeesTableSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="text-lg font-semibold tracking-tight text-neutral-900">{title}</h3>
      {description ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-600">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FeesTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200/80">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-neutral-50 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-neutral-100 transition-colors hover:bg-neutral-50/60">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    "px-4 py-3.5 align-top",
                    j === 0 ? "font-medium text-neutral-900" : "text-neutral-700",
                    j >= 2 && j < row.length - 1 ? "font-mono text-xs sm:text-sm" : "",
                    j === row.length - 1 ? "text-xs leading-relaxed text-neutral-500" : "",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RulesBlock({ sections }: { sections: FeesRuleSection[] }) {
  return (
    <div className="space-y-8 border-t border-neutral-200/80 pt-8">
      {sections.map((section) => (
        <section key={section.id} id={`fees-rule-${section.id}`}>
          <h3 className="text-base font-semibold text-neutral-900">{section.title}</h3>
          <div className="mt-3 space-y-3">
            {section.paragraphs.map((p) => (
              <p key={p} className="text-sm leading-relaxed text-neutral-600">
                {p}
              </p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const RULE_SECTION_KEY: Record<string, string> = {
  definitions: "definitions",
  "primary-calc": "primaryCalc",
  "secondary-calc": "secondaryCalc",
  "withdraw-calc": "withdrawCalc",
  updates: "updates",
  "volume-calc": "volumeCalc",
  "buyer-seller": "buyerSeller",
  accounts: "accounts",
};

const MAIN_FEE_ROW_IDS = [
  "primaryPurchase",
  "secondarySale",
  "withdrawal",
  "deposit",
  "payoutSettlement",
] as const;

export function FeesPageContent() {
  const { t, locale } = useI18n();
  const [mainSection, setMainSection] = useState<FeesMainSection>("trading");
  const [tradingTab, setTradingTab] = useState<FeesTradingTab>("overview");
  const { live, fees: liveFees, loading, error, reload } = usePublicPlatformFees();

  const intlLocale = intlLocaleFor(locale);

  const usdt = useMemo(
    () =>
      new Intl.NumberFormat(intlLocale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [intlLocale],
  );

  const intFmt = useMemo(() => new Intl.NumberFormat(intlLocale), [intlLocale]);

  const mainSections = useMemo(
    () => FEES_MAIN_SECTIONS.map((item) => ({ ...item, label: t(`fees.section.${item.id}`) })),
    [t],
  );

  const tradingTabs = useMemo(
    () => FEES_TRADING_TABS.map((item) => ({ ...item, label: t(`fees.tab.${item.id}`) })),
    [t],
  );

  const rates = useMemo(() => {
    if (!live || !liveFees) return FEES_RATES;
    const primary = Number(liveFees.primaryPurchaseFeePct) / 100;
    const secondary = Number(liveFees.secondaryMarketFeePct) / 100;
    const withdrawMin = Number(liveFees.withdrawalFeeFixedUsdt);
    const withdrawRate = Number(liveFees.withdrawalFeePct) / 100;
    return {
      platformBuy: Number.isFinite(primary) ? primary : FEES_RATES.platformBuy,
      secondary: Number.isFinite(secondary) ? secondary : FEES_RATES.secondary,
      withdrawMin: Number.isFinite(withdrawMin) ? withdrawMin : FEES_RATES.withdrawMin,
      withdrawRate: Number.isFinite(withdrawRate) ? withdrawRate : FEES_RATES.withdrawRate,
      deposit: Number(liveFees.depositFeePct) / 100 || 0,
    };
  }, [live, liveFees]);

  const pct = (n: number) =>
    `${(n * 100).toLocaleString(intlLocale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} %`;

  const effectiveLabel = useMemo(() => {
    if (live && liveFees?.effectiveFrom) {
      return new Date(liveFees.effectiveFrom).toLocaleDateString(intlLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    return null;
  }, [live, liveFees, intlLocale]);

  const localizedRuleSections = useMemo(
    () =>
      feesRuleSections.map((section) => {
        const key = RULE_SECTION_KEY[section.id] ?? section.id;
        const paragraphKeys = section.paragraphs.map((_, index) => `fees.rules.${key}.p${index + 1}`);
        return {
          id: section.id,
          title: t(`fees.rules.${key}.title`),
          paragraphs: paragraphKeys.map((paragraphKey) => t(paragraphKey)),
        };
      }),
    [t],
  );

  const sectionBlocks = useMemo(
    () => [
      {
        id: "wallet",
        title: t("fees.block.wallet.title"),
        subtitle: t("fees.block.wallet.subtitle"),
        bullets: [t("fees.block.wallet.bullet1"), t("fees.block.wallet.bullet2"), t("fees.block.wallet.bullet3")],
      },
      {
        id: "market",
        title: t("fees.block.market.title"),
        subtitle: t("fees.block.market.subtitle"),
        bullets: [
          tf(t("fees.block.market.bullet1"), { rate: pct(rates.platformBuy) }),
          tf(t("fees.block.market.bullet2"), { rate: pct(rates.secondary) }),
          t("fees.block.market.bullet3"),
        ],
      },
      {
        id: "payouts",
        title: t("fees.block.payouts.title"),
        subtitle: t("fees.block.payouts.subtitle"),
        bullets: [
          tf(t("fees.block.payouts.bullet1"), { min: String(rates.withdrawMin), rate: pct(rates.withdrawRate) }),
          t("fees.block.payouts.bullet2"),
          t("fees.block.payouts.bullet3"),
        ],
      },
    ],
    [t, rates, intlLocale],
  );

  const faqItems = useMemo(
    () =>
      ["f1", "f2", "f3", "f4", "f5"].map((id) => ({
        id,
        question: t(`fees.faq.${id}.question`),
        answer: t(`fees.faq.${id}.answer`),
      })),
    [t],
  );

  const programRows = useMemo(
    () => [
      {
        program: t("fees.programRow.referral.program"),
        rewardModel: t("fees.programRow.referral.rewardModel"),
        platformShare: t("fees.programRow.referral.platformShare"),
        note: t("fees.programRow.referral.note"),
      },
      {
        program: t("fees.programRow.partner.program"),
        rewardModel: t("fees.programRow.partner.rewardModel"),
        platformShare: t("fees.programRow.partner.platformShare"),
        note: t("fees.programRow.partner.note"),
      },
    ],
    [t],
  );

  const examples = useMemo(() => {
    const buyAmount = 1000;
    const buyFee = buyAmount * rates.platformBuy;
    const buyNet = buyAmount - buyFee;

    const sellUnits = 50;
    const sellPrice = 14;
    const sellGross = sellUnits * sellPrice;
    const sellFee = sellGross * rates.secondary;
    const sellNet = sellGross - sellFee;

    const wd = 500;
    const wdFee = Math.max(rates.withdrawMin, wd * rates.withdrawRate);
    const wdNet = wd - wdFee;

    return { buy: { buyAmount, buyFee, buyNet }, sell: { sellGross, sellFee, sellNet, sellUnits, sellPrice }, withdraw: { wd, wdFee, wdNet } };
  }, [rates]);

  const withdrawFeeLabel = `max(${rates.withdrawMin} USDT; ${pct(rates.withdrawRate)})`;

  const mainOperationsRows = useMemo(
    () =>
      MAIN_FEE_ROW_IDS.map((id) => {
        const rateKey =
          id === "primaryPurchase"
            ? pct(rates.platformBuy)
            : id === "secondarySale"
              ? pct(rates.secondary)
              : id === "withdrawal"
                ? withdrawFeeLabel
                : id === "deposit"
                  ? pct(rates.deposit)
                  : t("fees.rateLabel.payoutSettlement");
        return [
          t(`fees.operation.${id}`),
          t(`fees.feeType.${id === "primaryPurchase" ? "platformFee" : id === "secondarySale" ? "secondaryMarketFee" : id === "withdrawal" ? "withdrawalFee" : id === "deposit" ? "depositFee" : "payoutSettlement"}`),
          rateKey,
          t(`fees.calculation.${id}`),
          t(`fees.note.${id}`),
        ];
      }),
    [t, rates, intlLocale, withdrawFeeLabel],
  );

  const primaryTierRows = useMemo(
    () => [
      [
        t("fees.tier.standard"),
        t("fees.tier.from0Usdt"),
        t("fees.tier.from0Usdt"),
        pct(rates.platformBuy),
        `${intFmt.format(FEES_WITHDRAWAL_LIMITS_BY_KYC[2].limitUsdt)} USDT`,
        t("fees.tier.primaryNote"),
      ],
    ],
    [t, rates.platformBuy, intFmt, intlLocale],
  );

  const secondaryTierRows = useMemo(
    () => [
      [
        t("fees.tier.standard"),
        t("fees.tier.from0Usdt"),
        t("fees.tier.from0Usdt"),
        pct(rates.secondary),
        `${intFmt.format(FEES_WITHDRAWAL_LIMITS_BY_KYC[2].limitUsdt)} USDT`,
        t("fees.tier.secondaryNote"),
      ],
    ],
    [t, rates.secondary, intFmt, intlLocale],
  );

  const withdrawalTierRows = useMemo(
    () => [
      [
        t("fees.tier.standard"),
        withdrawFeeLabel,
        `${intFmt.format(FEES_WITHDRAWAL_LIMITS_BY_KYC[2].limitUsdt)} USDT`,
        t("fees.tier.withdrawLimitNote"),
      ],
    ],
    [t, withdrawFeeLabel, intFmt, intlLocale],
  );

  const depositTierRows = useMemo(
    () => [[t("fees.tier.standard"), pct(rates.deposit), t("fees.note.deposit")]],
    [t, rates.deposit, intlLocale],
  );

  const kycLimitRows = useMemo(
    () =>
      FEES_WITHDRAWAL_LIMITS_BY_KYC.map((tier) => [
        t(`fees.tier.kyc.${tier.id}`),
        tier.limitUsdt > 0 ? `${intFmt.format(tier.limitUsdt)} USDT` : "—",
        withdrawFeeLabel,
        t(`fees.tier.kyc.${tier.id}Note`),
      ]),
    [t, intFmt, withdrawFeeLabel],
  );

  if (live && loading) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white px-6 py-16 text-center text-sm text-neutral-500">
        {t("fees.loading")}
      </div>
    );
  }

  if (live && error && !liveFees) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-red-900">{t("fees.error.title")}</p>
        <p className="mt-2 text-sm text-red-800">{error}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-50"
        >
          {t("fees.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
      <div className="px-5 py-5 sm:px-8 sm:py-6">
        <FeesPageTabs items={mainSections} active={mainSection} onChange={setMainSection} />

        {mainSection === "trading" ? (
          <div className="mt-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                  {t("fees.trading.title")}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-600">{t("fees.trading.description")}</p>
              </div>
              {effectiveLabel ? (
                <p className="inline-flex items-center gap-1.5 rounded-full bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600">
                  <Clock className="size-3.5" aria-hidden />
                  {tf(t("fees.trading.effectiveFrom"), { date: effectiveLabel })}
                </p>
              ) : null}
            </div>

            <div className="mt-8">
              <FeesPageTabs items={tradingTabs} active={tradingTab} onChange={setTradingTab} size="sub" />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-neutral-500">
                {tradingTab === "overview"
                  ? t("fees.trading.description")
                  : tradingTab === "primary"
                    ? t("fees.trading.primaryHint")
                    : t("fees.trading.secondaryHint")}
              </p>
              <a
                href="#fees-rule-updates"
                className="text-sm font-medium text-neutral-700 underline-offset-2 hover:text-neutral-900 hover:underline"
              >
                {t("fees.trading.updateHistory")}
              </a>
            </div>

            <div className="mt-4">
              {tradingTab === "overview" ? (
                <FeesTableSection title={t("fees.table.allOperations")}>
                  <FeesTable
                    headers={[
                      t("fees.table.col.operation"),
                      t("fees.table.col.feeType"),
                      t("fees.table.col.rate"),
                      t("fees.table.col.calculation"),
                      t("fees.table.col.note"),
                    ]}
                    rows={mainOperationsRows}
                  />
                </FeesTableSection>
              ) : null}

              {tradingTab === "primary" ? (
                <FeesTableSection title={t("fees.table.regularUsers")}>
                  <FeesTable
                    headers={[
                      t("fees.table.col.tier"),
                      t("fees.table.col.balanceUsdt"),
                      `${t("fees.table.col.or")} ${t("fees.table.col.volume30d")}`,
                      t("fees.table.col.platformFee"),
                      t("fees.table.col.withdrawLimit24h"),
                      t("fees.table.col.note"),
                    ]}
                    rows={primaryTierRows}
                  />
                </FeesTableSection>
              ) : null}

              {tradingTab === "secondary" ? (
                <FeesTableSection title={t("fees.table.regularUsers")}>
                  <FeesTable
                    headers={[
                      t("fees.table.col.tier"),
                      t("fees.table.col.balanceUsdt"),
                      `${t("fees.table.col.or")} ${t("fees.table.col.secondaryVolume30d")}`,
                      t("fees.table.col.secondaryFee"),
                      t("fees.table.col.withdrawLimit24h"),
                      t("fees.table.col.note"),
                    ]}
                    rows={secondaryTierRows}
                  />
                </FeesTableSection>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-xl bg-neutral-50 px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  {t("fees.stat.platformFee")}
                </p>
                <FeeDisplay value={pct(rates.platformBuy)} tone="primary" />
              </article>
              <article className="rounded-xl bg-neutral-50 px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  {t("fees.stat.secondaryFee")}
                </p>
                <FeeDisplay value={pct(rates.secondary)} tone="units" />
              </article>
              <article className="rounded-xl bg-neutral-50 px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  {t("fees.stat.depositFee")}
                </p>
                <FeeDisplay value={pct(rates.deposit)} tone="neutral" />
              </article>
              <article className="rounded-xl bg-neutral-50 px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  {t("fees.stat.calculator")}
                </p>
                <Link href={ROUTES.calculator} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">
                  {t("fees.stat.openCalculator")}
                  <ExternalLink className="size-3.5" aria-hidden />
                </Link>
              </article>
            </div>

            <RulesBlock sections={localizedRuleSections.filter((s) => s.id !== "withdraw-calc")} />

            <section className="mt-10" aria-labelledby="fees-examples-heading">
              <h2 id="fees-examples-heading" className="text-lg font-semibold tracking-tight text-neutral-900">
                {t("fees.examples.title")}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">{t("fees.examples.subtitle")}</p>
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <ExampleCard
                  subtitle={t("fees.examples.primaryMarket")}
                  title={tf(t("fees.examples.buyTitle"), { amount: usdt.format(examples.buy.buyAmount) })}
                  rows={[
                    { label: t("fees.examples.paymentAmount"), value: `${usdt.format(examples.buy.buyAmount)} USDT` },
                    {
                      label: tf(t("fees.examples.platformFeeLine"), { rate: pct(rates.platformBuy) }),
                      value: `− ${usdt.format(examples.buy.buyFee)} USDT`,
                    },
                    {
                      label: t("fees.examples.creditedUnt"),
                      value: `${usdt.format(examples.buy.buyNet)} USDT`,
                      dim: true,
                    },
                  ]}
                  highlight={{
                    label: t("fees.examples.totalFeeHeld"),
                    amount: usdt.format(examples.buy.buyFee),
                    tone: "primary",
                  }}
                />
                <ExampleCard
                  subtitle={t("fees.examples.secondaryMarket")}
                  title={tf(t("fees.examples.sellTitle"), {
                    units: String(examples.sell.sellUnits),
                    price: usdt.format(examples.sell.sellPrice),
                  })}
                  rows={[
                    { label: t("fees.examples.grossAmount"), value: `${usdt.format(examples.sell.sellGross)} USDT` },
                    {
                      label: tf(t("fees.examples.secondaryFeeLine"), { rate: pct(rates.secondary) }),
                      value: `− ${usdt.format(examples.sell.sellFee)} USDT`,
                    },
                  ]}
                  highlight={{
                    label: t("fees.examples.netReceive"),
                    amount: usdt.format(examples.sell.sellNet),
                    tone: "units",
                  }}
                />
                <ExampleCard
                  subtitle={t("fees.examples.withdrawal")}
                  title={tf(t("fees.examples.withdrawTitle"), { amount: usdt.format(examples.withdraw.wd) })}
                  rows={[
                    { label: t("fees.examples.requestedWithdraw"), value: `${usdt.format(examples.withdraw.wd)} USDT` },
                    { label: t("fees.examples.withdrawalFee"), value: `− ${usdt.format(examples.withdraw.wdFee)} USDT` },
                  ]}
                  highlight={{
                    label: t("fees.examples.netToTrc20"),
                    amount: usdt.format(examples.withdraw.wdNet),
                    tone: "primary",
                  }}
                />
              </div>
            </section>

            <section className="mt-10" aria-labelledby="fees-sections-heading">
              <h2 id="fees-sections-heading" className="text-lg font-semibold tracking-tight text-neutral-900">
                {t("fees.sections.title")}
              </h2>
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {sectionBlocks.map((block) => (
                  <div key={block.id} className="rounded-xl border border-neutral-200/80 px-5 py-5">
                    <h3 className="text-sm font-semibold text-neutral-900">{block.title}</h3>
                    <p className="mt-1 text-xs text-neutral-500">{block.subtitle}</p>
                    <ul className="mt-4 space-y-2 text-xs leading-relaxed text-neutral-600 sm:text-sm">
                      {block.bullets.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-600/70" aria-hidden />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {mainSection === "depositWithdrawal" ? (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              {t("fees.depositWithdrawal.title")}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-600">
              {t("fees.depositWithdrawal.description")}
            </p>

            <FeesTableSection title={t("fees.deposit.title")} description={t("fees.deposit.description")}>
              <FeesTable
                headers={[t("fees.table.col.tier"), t("fees.table.col.depositFee"), t("fees.table.col.note")]}
                rows={depositTierRows}
              />
            </FeesTableSection>

            <FeesTableSection title={t("fees.withdrawal.title")} description={t("fees.withdrawal.description")}>
              <FeesTable
                headers={[
                  t("fees.table.col.tier"),
                  t("fees.table.col.withdrawalFee"),
                  t("fees.table.col.withdrawLimit24h"),
                  t("fees.table.col.note"),
                ]}
                rows={withdrawalTierRows}
              />
            </FeesTableSection>

            <FeesTableSection title={t("fees.table.kycLimits")}>
              <FeesTable
                headers={[
                  t("fees.table.col.verification"),
                  t("fees.table.col.withdrawLimit24h"),
                  t("fees.table.col.withdrawalFee"),
                  t("fees.table.col.note"),
                ]}
                rows={kycLimitRows}
              />
            </FeesTableSection>

            <div className="mt-8 max-w-xl">
              <ExampleCard
                subtitle={t("fees.examples.example")}
                title={tf(t("fees.examples.withdrawTitle"), { amount: usdt.format(examples.withdraw.wd) })}
                rows={[
                  { label: t("fees.examples.requestedWithdraw"), value: `${usdt.format(examples.withdraw.wd)} USDT` },
                  { label: t("fees.examples.withdrawalFee"), value: `− ${usdt.format(examples.withdraw.wdFee)} USDT` },
                ]}
                highlight={{
                  label: t("fees.examples.netToTrc20"),
                  amount: usdt.format(examples.withdraw.wdNet),
                  tone: "primary",
                }}
              />
            </div>

            <RulesBlock
              sections={localizedRuleSections.filter(
                (s) => s.id === "withdraw-calc" || s.id === "updates" || s.id === "accounts",
              )}
            />
          </div>
        ) : null}

        {mainSection === "other" ? (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{t("fees.program.title")}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-600">{t("fees.program.description")}</p>

            <div className="mt-8">
              <FeesTable
                headers={[
                  t("fees.program.table.program"),
                  t("fees.program.table.rewardModel"),
                  t("fees.program.table.calculationBase"),
                  t("fees.table.col.note"),
                ]}
                rows={programRows.map((r) => [r.program, r.rewardModel, r.platformShare, r.note])}
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={ROUTES.referralProgram}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
              >
                {t("fees.program.referralProgram")}
                <ExternalLink className="size-4 text-neutral-500" aria-hidden />
              </Link>
              <Link
                href={ROUTES.partnerProgram}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
              >
                {t("fees.program.partnerProgram")}
                <ExternalLink className="size-4 text-neutral-500" aria-hidden />
              </Link>
            </div>

            <RulesBlock
              sections={[
                {
                  id: "program-rules",
                  title: t("fees.program.rules.title"),
                  paragraphs: [t("fees.program.rules.p1"), t("fees.program.rules.p2")],
                },
              ]}
            />
          </div>
        ) : null}
      </div>

      <div className="border-t border-neutral-200/80 px-5 py-7 sm:px-8 sm:py-8">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900">{t("fees.faq.title")}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t("fees.faq.subtitle")}</p>
        <FeesFaqList items={faqItems} defaultOpenId={faqItems[0]?.id ?? null} />
        {liveFees?.disclaimer ? (
          <p className="mt-6 text-xs leading-relaxed text-neutral-500">{liveFees.disclaimer}</p>
        ) : (
          <p className="mt-6 text-xs leading-relaxed text-neutral-500">{t("fees.disclaimer")}</p>
        )}
      </div>
    </div>
  );
}
