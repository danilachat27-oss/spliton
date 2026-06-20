"use client";

import "./payouts-megamenu-preview.css";

import { Copy, Search } from "@/lib/lucide";

import { BlockCursor } from "@/components/dashboard/megamenu-preview-blocks";
import { payoutComparisonWindowOptions } from "@/components/dashboard/assets/payouts-mock-data";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const MOCK_DEPOSIT_ADDRESS = "TP5eB1Af8z…fbBveo3";

function PayoutCursor({ step, hint, className }: { step: string; hint: string; className?: string }) {
  return <BlockCursor step={step} hint={hint} className={className} />;
}

function MiniAccrualChart() {
  const { t } = useI18n();

  return (
    <div className="preview-pay-chart-target relative mt-1 overflow-visible rounded-lg bg-white p-0.5 ring-1 ring-neutral-100">
      <svg viewBox="0 0 140 52" className="block h-12 w-full" aria-hidden>
        {[12, 24, 36, 48].map((y) => (
          <line key={y} x1="8" x2="132" y1={y} y2={y} stroke="#e5e5e5" strokeWidth="0.5" strokeDasharray="2 3" />
        ))}
        {[18, 34, 50, 66, 82, 98, 114].map((x, index) => (
          <rect
            key={x}
            x={x - 4}
            y={48 - [14, 22, 18, 28, 24, 32, 26][index]!}
            width="8"
            height={[14, 22, 18, 28, 24, 32, 26][index]!}
            rx="1"
            fill="rgba(96, 165, 250, 0.42)"
          />
        ))}
        <path
          d="M8,40 L26,36 L44,34 L62,28 L80,26 L98,22 L116,18 L132,16"
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="M8,40 L26,36 L44,34 L62,28 L80,26 L98,22 L116,18 L132,16 L132,48 L8,48 Z" fill="url(#payMiniFill)" />
        <defs>
          <linearGradient id="payMiniFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          className="preview-pay-chart-crosshair"
          x1="98"
          x2="98"
          y1="10"
          y2="48"
          stroke="#60a5fa"
          strokeWidth="0.6"
          strokeDasharray="2 2"
        />
        <circle className="preview-pay-chart-dot" cx="98" cy="22" r="2.4" fill="white" stroke="#1d4ed8" strokeWidth="1.2" />
      </svg>
      <div className="preview-pay-chart-tooltip pointer-events-none absolute left-[54%] top-[4%] z-10 rounded-md bg-white/95 px-1.5 py-0.5 text-[5px] shadow-sm ring-1 ring-neutral-200/70">
        <p className="font-semibold text-neutral-900">12.06</p>
        <p className="text-neutral-600">
          {t("payouts.tooltipCumulative")} <span className="font-mono text-neutral-900">412,80</span>
        </p>
      </div>
      <PayoutCursor step="pay-overview-chart" hint={t("preview.megamenu.payouts.cursorChart")} className="absolute left-[58%] top-[42%]" />
    </div>
  );
}

export function PayoutsOverviewScene() {
  const { t } = useI18n();
  const kpis = [
    { label: t("payouts.kpi.totalAccrued"), value: "412,80" },
    { label: t("payouts.kpi.totalPaid"), value: "280,00" },
    { label: t("payouts.kpi.available"), value: "44,40", highlight: true },
  ];
  const ranges = ["7d", "30d", "90d"] as const;
  const rangeKeys = {
    "7d": "chart.range7d",
    "30d": "chart.range30d",
    "90d": "chart.range90d",
  } as const;

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="shrink-0">
        <p className="text-[4.5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">USDT · TRC20</p>
        <h1 className="mt-0.5 text-[7px] font-semibold leading-none tracking-tight text-neutral-900">
          {t("meta.payouts.overviewTitle")}
        </h1>
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-1">
        {kpis.map((item) => (
          <article
            key={item.label}
            className={cn(
              "relative overflow-visible rounded-lg bg-white px-1 py-1 ring-1 ring-neutral-200/60",
              item.highlight && "preview-pay-kpi-target preview-megamenu-target",
            )}
          >
            <p className="line-clamp-2 text-[4px] leading-tight text-neutral-500">{item.label}</p>
            <p className="mt-0.5 font-mono text-[7px] font-semibold tabular-nums leading-none text-neutral-900">{item.value}</p>
            {item.highlight ? (
              <PayoutCursor
                step="pay-overview-kpi"
                hint={t("preview.megamenu.payouts.cursorAvailable")}
                className="absolute left-[42%] top-[62%]"
              />
            ) : null}
          </article>
        ))}
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-[4.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">USDT · Chart</p>
            <p className="mt-0.5 text-[6.5px] font-semibold tracking-tight text-neutral-900">{t("payouts.accrualTitle")}</p>
            <p className="mt-0.5 font-mono text-[8px] font-semibold tabular-nums text-neutral-900">412,80</p>
          </div>
          <div className="flex shrink-0 rounded-md bg-neutral-100 p-0.5" role="tablist" aria-hidden>
            {ranges.map((id) => (
              <span
                key={id}
                className={cn(
                  "rounded px-1 py-0.5 text-[4px] font-semibold",
                  id === "7d" && "preview-pay-range-tab--active",
                  id === "30d" && "preview-pay-range-tab--30d",
                  id !== "7d" && id !== "30d" && "text-neutral-500",
                )}
              >
                {t(rangeKeys[id])}
              </span>
            ))}
          </div>
        </div>
        <MiniAccrualChart />
      </section>
    </div>
  );
}

export function PayoutsComparisonScene() {
  const { t } = useI18n();
  const pan = {
    titleKey: "assets.overview.pan.previous_30d",
    period: "01.04 — 30.04",
    accruals: "186,40",
    withdrawals: "72,00",
  };

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="shrink-0">
        <p className="text-[4.5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">USDT</p>
        <h1 className="mt-0.5 text-[7px] font-semibold leading-none tracking-tight text-neutral-900">
          {t("meta.payouts.comparison.hero")}
        </h1>
      </div>

      <div className="flex shrink-0 items-end justify-between gap-1">
        <p className="text-[5.5px] font-semibold text-neutral-900">{t("assets.overview.windowMetricsTitle")}</p>
        <div className="flex rounded-md bg-neutral-100 p-0.5" aria-hidden>
          {payoutComparisonWindowOptions.slice(0, 3).map((opt) => (
            <span
              key={opt.id}
              className={cn(
                "rounded px-1 py-0.5 text-[4px] font-semibold",
                opt.id === "30d" ? "preview-pay-compare-tab--30d" : "text-neutral-500",
              )}
            >
              {t(opt.labelKey)}
            </span>
          ))}
        </div>
      </div>

      <article className="preview-pay-compare-target preview-megamenu-target relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1.5 py-1.5 ring-1 ring-neutral-200/60">
        <p className="text-[4px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{t(pan.titleKey)}</p>
        <p className="font-mono text-[5px] text-neutral-500">{pan.period}</p>
        <div className="mt-1.5 grid grid-cols-2 gap-1">
          <div>
            <p className="text-[4px] font-semibold uppercase tracking-[0.1em] text-neutral-400">{t("assets.overview.accruals")}</p>
            <p className="font-mono text-[10px] font-semibold text-neutral-900">+{pan.accruals}</p>
          </div>
          <div>
            <p className="text-[4px] font-semibold uppercase tracking-[0.1em] text-neutral-400">{t("assets.overview.withdrawals")}</p>
            <p className="font-mono text-[8px] font-semibold text-neutral-700">−{pan.withdrawals}</p>
          </div>
        </div>
        <p className="mt-1.5 text-center font-mono text-[4.5px] text-neutral-500">
          {t("assets.overview.deltaAccruals")}{" "}
          <span className="font-semibold text-blue-700">+31,3%</span>
        </p>
        <PayoutCursor
          step="pay-compare-accruals"
          hint={t("preview.megamenu.payouts.cursorComparison")}
          className="absolute left-[18%] top-[58%]"
        />
      </article>
    </div>
  );
}

export function PayoutsHistoryScene() {
  const { t } = useI18n();
  const stats = [
    { label: t("history.stats.inflow"), value: "+412,80", tone: "text-blue-800" },
    { label: t("history.stats.net"), value: "+292,80", tone: "text-blue-800" },
  ];
  const row = {
    date: "12.06",
    release: "Neon Pulse",
    type: t("history.type.accrual"),
    amount: "+42,00",
  };

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="shrink-0">
        <p className="text-[4.5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">USDT · TRC20</p>
        <h1 className="mt-0.5 text-[7px] font-semibold leading-none tracking-tight text-neutral-900">{t("history.title")}</h1>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-1">
        {stats.map((card) => (
          <article key={card.label} className="rounded-lg bg-white px-1 py-1 ring-1 ring-neutral-200/60">
            <p className="line-clamp-2 text-[4px] leading-tight text-neutral-500">{card.label}</p>
            <p className={cn("mt-0.5 font-mono text-[7px] font-semibold tabular-nums leading-none", card.tone ?? "text-neutral-900")}>
              {card.value}
            </p>
          </article>
        ))}
      </div>

      <div className="relative shrink-0 overflow-visible">
        <Search className="pointer-events-none absolute left-1 top-1/2 size-2 -translate-y-1/2 text-neutral-400" aria-hidden />
        <div className="h-4 rounded-lg bg-white py-1 pl-3 pr-1 text-[4.5px] leading-[16px] text-neutral-400 ring-1 ring-neutral-200/60">
          {t("history.searchPlaceholder")}
        </div>
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1 py-1 ring-1 ring-neutral-200/60">
        <p className="px-0.5 text-[5.5px] font-semibold text-neutral-900">{t("history.table.title")}</p>
        <div className="mt-0.5 grid grid-cols-[0.55fr_1fr_0.65fr] gap-1 border-b border-neutral-100 px-0.5 py-1 text-[4px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
          <span>{t("history.table.colDateRef")}</span>
          <span>{t("history.table.colRelease")}</span>
          <span className="text-right">{t("history.table.colAmount")}</span>
        </div>
        <div className="preview-pay-history-target preview-megamenu-target relative grid grid-cols-[0.55fr_1fr_0.65fr] items-center gap-1 border-t border-neutral-100 px-0.5 py-1.5 text-[5px] text-neutral-800">
          <span className="font-mono">{row.date}</span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-neutral-900">{row.release}</p>
            <p className="truncate text-[4.5px] text-neutral-500">{row.type}</p>
          </div>
          <span className="text-right font-mono font-semibold">{row.amount}</span>
          <PayoutCursor
            step="pay-history-row"
            hint={t("preview.megamenu.payouts.cursorHistory")}
            className="absolute left-[8%] top-[52%]"
          />
        </div>
      </section>
    </div>
  );
}

export function PayoutsDepositScene() {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="shrink-0">
        <p className="text-[4.5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {t("preview.megamenu.payouts.depositEyebrow")}
        </p>
        <h1 className="mt-0.5 text-[7px] font-semibold leading-none tracking-tight text-neutral-900">{t("deposit.heading")}</h1>
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-blue-50/60 px-1.5 py-1.5 ring-1 ring-blue-100">
        <span className="inline-flex rounded-full bg-white/95 px-1.5 py-0.5 text-[4px] font-semibold uppercase tracking-wider text-neutral-600">
          USDT · TRC20
        </span>

        <div className="mt-1 grid grid-cols-[36px_minmax(0,1fr)] gap-1">
          <div className="flex aspect-square items-center justify-center rounded-lg bg-white/95 text-[4px] font-medium text-neutral-400 ring-1 ring-blue-100">
            {t("deposit.qrDemo")}
          </div>
          <div className="relative overflow-visible rounded-lg bg-white/95 px-1 py-1 ring-1 ring-blue-100">
            <div className="flex items-start justify-between gap-1">
              <p className="text-[4px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{t("deposit.trc20Address")}</p>
              <button
                type="button"
                className="preview-pay-deposit-copy-btn preview-megamenu-target relative inline-flex items-center gap-0.5 rounded-md bg-neutral-900 px-1.5 py-0.5 text-[4.5px] font-semibold text-white"
              >
                <Copy className="size-2" aria-hidden />
                {t("deposit.copyAddress")}
                <span className="preview-pay-deposit-copied absolute -right-0.5 -top-2.5 rounded bg-emerald-600 px-0.5 py-px text-[3.5px] text-white">
                  {t("deposit.copied")}
                </span>
                <PayoutCursor step="pay-deposit-copy" hint={t("preview.megamenu.payouts.cursorCopy")} className="absolute left-[48%] top-[88%]" />
              </button>
            </div>
            <p className="mt-1 font-mono text-[5.5px] font-semibold text-neutral-900">{MOCK_DEPOSIT_ADDRESS}</p>
          </div>
        </div>

        <div className="mt-1 space-y-0.5 border-t border-blue-200/50 pt-1">
          <div className="flex justify-between text-[4.5px]">
            <span className="text-neutral-500">{t("deposit.minDepositLabel")}</span>
            <span className="font-mono font-medium text-neutral-900">0,01 USDT</span>
          </div>
          <div className="flex justify-between text-[4.5px]">
            <span className="text-neutral-500">{t("deposit.creditTimeLabel")}</span>
            <span className="text-neutral-800">{t("deposit.mock.creditTime")}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export function PayoutsWithdrawScene() {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="shrink-0">
        <p className="text-[4.5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {t("preview.megamenu.payouts.withdrawEyebrow")}
        </p>
        <h1 className="mt-0.5 text-[7px] font-semibold leading-none tracking-tight text-neutral-900">{t("withdraw.heading")}</h1>
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1.5 py-1.5 ring-1 ring-neutral-200/60">
        <div className="flex items-start gap-1">
          <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[4px] font-bold text-white">
            1
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[6px] font-semibold text-neutral-900">{t("withdraw.amountLabel")}</p>
            <div className="preview-pay-withdraw-input relative h-5 overflow-visible rounded-lg bg-neutral-50 px-1.5 ring-1 ring-neutral-200/60">
              <span className="preview-pay-withdraw-value-a absolute inset-y-0 left-1.5 flex items-center font-mono text-[5px] text-neutral-400">
                100
              </span>
              <span className="preview-pay-withdraw-value-b absolute inset-y-0 left-1.5 flex items-center font-mono text-[5.5px] font-semibold text-neutral-800">
                200 USDT
              </span>
              <PayoutCursor
                step="pay-withdraw-amount"
                hint={t("preview.megamenu.payouts.cursorWithdraw")}
                className="absolute left-[52%] top-[58%]"
              />
            </div>

            <div className="relative overflow-visible">
              <button
                type="button"
                className="preview-pay-withdraw-submit inline-flex h-5 w-full items-center justify-center rounded-lg bg-neutral-900 text-[5px] font-semibold text-white"
              >
                {t("withdraw.submit")}
              </button>
              <PayoutCursor
                step="pay-withdraw-submit"
                hint={t("preview.megamenu.payouts.cursorContinue")}
                className="absolute left-[48%] top-[72%]"
              />
            </div>

            <div className="mt-1 space-y-0.5 rounded-lg bg-neutral-50 px-1 py-1">
              <div className="flex justify-between text-[4.5px]">
                <span className="text-neutral-500">{t("withdraw.feePreview")}</span>
                <span className="font-mono font-medium text-neutral-900">0,15 USDT</span>
              </div>
              <div className="flex justify-between text-[4.5px]">
                <span className="text-neutral-500">{t("withdraw.netPreview")}</span>
                <span className="font-mono font-semibold text-neutral-900">199,85 USDT</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
