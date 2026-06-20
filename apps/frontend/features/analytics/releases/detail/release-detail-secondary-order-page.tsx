"use client";

import * as React from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { CheckCircle2, X } from "@/lib/lucide";

import { secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import {
  analyticsReleaseDetailPath,
  assetsSellUnitsPath,
  catalogBuyUnitsPath,
  secondaryMarketReleaseAnalyticsPath,
} from "@/constants/routes";
import type { ReleaseLedgerEventUi } from "@/lib/analytics/release-analytics-adapter";
import {
  analyticsReleaseStatusLabel,
  analyticsTermLabel,
} from "@/lib/i18n/analytics-messages";
import { useI18n } from "@/components/providers/i18n-provider";
import type { ReleaseDetailPageData } from "@/types/analytics/release-detail";
import { cn } from "@/lib/utils";

import { DetailSection } from "./detail-section";
import { ReleaseDetailPerformanceChart } from "./release-detail-performance-chart";
import { ReleaseDetailHero } from "./release-detail-hero";

function KVPairs({
  rows,
}: {
  rows: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.label} className="rounded-xl bg-[#0a0a0a] px-3 py-2.5 ring-1 ring-white/6">
          <p className="text-[11px] leading-snug text-zinc-500">{r.label}</p>
          <p className="mt-1 font-mono text-[13px] font-semibold leading-snug text-zinc-100">{r.value}</p>
        </div>
      ))}
    </div>
  );
}

type LedgerTone = ReleaseLedgerEventUi["tone"];

function ledgerToneDot(tone: LedgerTone) {
  const map: Record<LedgerTone, string> = {
    buy: "bg-[#B7F500]/90",
    order: "bg-sky-400/90",
    fill: "bg-amber-400/90",
    cancel: "bg-zinc-500",
    payout: "bg-emerald-400/90",
    sell: "bg-fuchsia-400/90",
    other: "bg-zinc-600",
  };
  return map[tone] ?? map.other;
}

export function ReleaseDetailSecondaryOrderPage({
  data,
  contextFrom,
  ledgerEvents,
  isLive = false,
}: {
  data: ReleaseDetailPageData;
  contextFrom?: string;
  ledgerEvents?: ReleaseLedgerEventUi[];
  isLive?: boolean;
}) {
  const { locale, t } = useI18n();
  const { row, liveContext, myHistory, slug, performance } = data;
  const [cancelOpen, setCancelOpen] = React.useState(false);

  const stackHref =
    isLive && slug
      ? secondaryMarketHref("market", { release: slug })
      : secondaryMarketHref("market");

  const assetQuery = new URLSearchParams();
  if (contextFrom) assetQuery.set("from", contextFrom);
  const assetHref =
    assetQuery.size > 0
      ? `${analyticsReleaseDetailPath(row.id)}?${assetQuery.toString()}`
      : analyticsReleaseDetailPath(row.id);

  const tradingAnalyticsHref = isLive
    ? secondaryMarketHref("analytics", slug ? { release: slug } : undefined)
    : secondaryMarketReleaseAnalyticsPath(row.id);

  const user = liveContext?.user;
  const sm = liveContext?.secondarySummary;

  const positionRows = isLive
    ? user
      ? [
          { label: t("analytics.detail.secondary.position.totalUnits"), value: user.userUnits ?? "—" },
          { label: t("analytics.detail.secondary.position.availableUnits"), value: user.userAvailableUnits ?? "—" },
          { label: t("analytics.detail.secondary.position.lockedUnits"), value: user.userLockedUnits ?? "0" },
          {
            label: t("analytics.detail.secondary.position.avgEntry"),
            value: user.userAvgEntryPrice ? `${user.userAvgEntryPrice} USDT` : "—",
          },
          {
            label: t("analytics.detail.secondary.position.currentValue"),
            value: user.userCurrentValue ? `${user.userCurrentValue} USDT` : "—",
          },
          {
            label: t("analytics.detail.secondary.position.payoutsReceived"),
            value: user.userPayoutsReceived ? `${user.userPayoutsReceived} USDT` : "—",
          },
        ]
      : [{ label: t("analytics.detail.secondary.position.label"), value: t("analytics.detail.secondary.position.signIn") }]
    : [
        { label: t("analytics.detail.secondary.position.totalUnits"), value: "1 842" },
        { label: t("analytics.detail.secondary.position.availableUnits"), value: "1 794" },
        { label: t("analytics.detail.secondary.position.lockedUnits"), value: "48" },
        { label: t("analytics.detail.secondary.position.avgEntry"), value: "18,12 USDT" },
        { label: t("analytics.detail.secondary.position.guidancePrice"), value: "18,48 USDT" },
        { label: t("analytics.detail.secondary.position.payoutsReceived"), value: "126,40 USDT" },
      ];

  const latestOrder = isLive ? myHistory?.orders[0] : null;
  const orderRows = isLive
    ? latestOrder
      ? [
          { label: t("analytics.detail.secondary.order.type"), value: latestOrder.side },
          { label: t("analytics.detail.secondary.order.pricePerUnit"), value: latestOrder.price ?? "—" },
          { label: t("analytics.detail.secondary.order.units"), value: latestOrder.units },
          {
            label: t("analytics.detail.secondary.order.createdAt"),
            value: new Date(latestOrder.createdAt).toLocaleString(locale === "ru" ? "ru-RU" : locale === "pt" ? "pt-PT" : locale === "es" ? "es-ES" : "en-US"),
          },
          { label: t("analytics.detail.secondary.order.status"), value: latestOrder.status },
        ]
      : [{ label: t("analytics.detail.secondary.order.ordersLabel"), value: t("analytics.detail.secondary.order.none") }]
    : [
        { label: t("analytics.detail.secondary.order.type"), value: t("analytics.detail.secondary.order.demoBuy") },
        { label: t("analytics.detail.secondary.order.executionType"), value: t("analytics.detail.secondary.order.demoLimit") },
        { label: t("analytics.detail.secondary.order.pricePerUnit"), value: "18,48 USDT" },
        { label: t("analytics.detail.secondary.order.totalUnits"), value: "80" },
        { label: t("analytics.detail.secondary.order.filled"), value: "32" },
        { label: t("analytics.detail.secondary.order.remaining"), value: "48" },
        { label: t("analytics.detail.secondary.order.amount"), value: "1 478,40 USDT" },
        { label: t("analytics.detail.secondary.order.createdAt"), value: "21.04.2026 23:45" },
        { label: t("analytics.detail.secondary.order.status"), value: t("analytics.detail.secondary.order.demoPartial") },
      ];

  const marketRows = isLive && sm
    ? [
        { label: t("analytics.detail.secondary.market.bestBid"), value: sm.bestBid ? `${sm.bestBid} USDT` : "—" },
        { label: t("analytics.detail.secondary.market.bestAsk"), value: sm.bestAsk ? `${sm.bestAsk} USDT` : "—" },
        { label: t("analytics.detail.secondary.market.lastPrice"), value: sm.lastTradePrice ? `${sm.lastTradePrice} USDT` : "—" },
        { label: t("analytics.detail.secondary.market.spread"), value: sm.averageSpread ? `${sm.averageSpread} USDT` : "—" },
        { label: t("analytics.detail.secondary.market.volume24h"), value: sm.secondaryVolume24h || "—" },
        { label: t("analytics.detail.secondary.market.trades7d"), value: String(sm.trades7d) },
        { label: t("analytics.detail.secondary.market.liquidity"), value: sm.liquidityLabel || "—" },
        { label: t("analytics.detail.secondary.market.activeListings"), value: String(sm.activeListings) },
      ]
    : [
        { label: t("analytics.detail.secondary.market.bestBid"), value: "18,41 USDT" },
        { label: t("analytics.detail.secondary.market.bestAsk"), value: "18,55 USDT" },
        { label: t("analytics.detail.secondary.market.lastPrice"), value: "18,48 USDT" },
        { label: t("analytics.detail.secondary.market.spread"), value: "0,14 USDT" },
        { label: t("analytics.detail.secondary.market.volume24h"), value: "184 200 USDT" },
        { label: t("analytics.detail.secondary.market.tradeCount"), value: "126" },
        { label: t("analytics.detail.secondary.market.liquidity"), value: t("analytics.detail.secondary.market.liquidityMedium") },
        { label: t("analytics.detail.secondary.market.activeOrders"), value: "48" },
      ];

  const timeline =
    isLive && ledgerEvents?.length
      ? ledgerEvents
      : isLive
        ? [{ title: t("analytics.detail.secondary.timeline.emptyTitle"), date: "—", detail: t("analytics.detail.secondary.timeline.emptyDetail"), tone: "other" as const }]
        : ledgerEvents?.length
          ? ledgerEvents
          : [
              { title: "Покупка UNT", date: "12.03.2026", detail: "320 UNT", tone: "buy" as const },
              { title: "Выставление заявки", date: "21.04.2026", detail: "80 UNT · лимит", tone: "order" as const },
              { title: "Получение выплат", date: "14.04.2026", detail: "+24,80 USDT", tone: "payout" as const },
            ];

  return (
    <div className="bg-black text-white">
      <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-6 md:px-6 lg:px-8 lg:pb-24 lg:pt-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(360px,100%)] lg:items-start">
          <div className="min-w-0">
            <ReleaseDetailHero
              data={data}
              source={contextFrom === "secondary" ? "secondary" : undefined}
              backHrefOverride={assetHref}
              backLabelOverride={t("analytics.detail.hero.back.releaseCard")}
            />
          </div>
          <aside className="rounded-2xl bg-[#111111] px-4 py-4 ring-1 ring-white/8 md:px-5 md:py-5">
            <h3 className="text-[14px] font-semibold tracking-tight text-white">{t("analytics.detail.secondary.myPosition")}</h3>
            <div className="mt-3">
              <KVPairs rows={positionRows} />
            </div>
          </aside>
        </div>

        <DetailSection
          className="mt-10"
          eyebrow={t("analytics.detail.secondary.chartEyebrow")}
          title={performance.title}
          description={`${performance.subtitle}${t("analytics.detail.secondary.chartHint")}`}
        >
          <ReleaseDetailPerformanceChart
            title={performance.title}
            subtitle={performance.subtitle}
            seriesByPeriod={performance.seriesByPeriod}
            miniStats={performance.miniStats}
            releaseId={row.id}
            buyHref={stackHref}
            buyLabel={t("analytics.detail.screen.buyToBook")}
          />
        </DetailSection>

        <DetailSection
          eyebrow={t("analytics.detail.secondary.orderEyebrow")}
          title={t("analytics.detail.secondary.orderTitle")}
          description={t("analytics.detail.secondary.orderDescription")}
        >
          <KVPairs rows={orderRows} />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="inline-flex h-10 items-center rounded-xl border border-fuchsia-400/35 bg-fuchsia-500/12 px-4 text-[13px] font-semibold text-fuchsia-200 transition hover:bg-fuchsia-500/20"
            >
              {t("analytics.detail.secondary.cancelOrder")}
            </button>
            <Link
              href={stackHref}
              className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-[13px] font-semibold text-black transition hover:opacity-90"
            >
              {t("analytics.detail.secondary.goToBook")}
            </Link>
            <Link
              href={catalogBuyUnitsPath(row.id)}
              className="inline-flex h-10 items-center rounded-xl border border-white/15 px-4 text-[13px] font-semibold text-zinc-200 transition hover:border-white/25 hover:text-white"
            >
              {t("analytics.detail.secondary.buyMore")}
            </Link>
            <Link
              href={assetsSellUnitsPath(row.id)}
              className="inline-flex h-10 items-center rounded-xl border border-white/15 px-4 text-[13px] font-semibold text-zinc-200 transition hover:border-white/25 hover:text-white"
            >
              {t("analytics.detail.secondary.newSellOrder")}
            </Link>
            <Link
              href={tradingAnalyticsHref}
              scroll={false}
              className="inline-flex h-10 items-center rounded-xl border border-white/15 px-4 text-[13px] font-semibold text-zinc-200 transition hover:border-white/25 hover:text-white"
            >
              {t("analytics.detail.secondary.tradingAnalytics")}
            </Link>
          </div>
        </DetailSection>

        <DetailSection
          eyebrow={t("analytics.detail.secondary.marketEyebrow")}
          title={t("analytics.detail.secondary.marketTitle")}
          description={t("analytics.detail.secondary.marketDescription")}
        >
          <KVPairs rows={marketRows} />
        </DetailSection>

        <DetailSection
          eyebrow={t("analytics.detail.secondary.orderBookEyebrow")}
          title={t("analytics.detail.secondary.orderBookTitle")}
          description={
            isLive
              ? t("analytics.detail.secondary.orderBookDescriptionLive")
              : t("analytics.detail.secondary.orderBookDescriptionDemo")
          }
        >
          {isLive ? (
            <div className="rounded-2xl bg-[#111111] p-4 ring-1 ring-white/8">
              <p className="text-sm text-zinc-400">
                {t("analytics.detail.secondary.orderBookLiveHint")}
              </p>
              <Link
                href={stackHref}
                className="mt-3 inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-[12px] font-semibold text-zinc-200 transition hover:border-white/25 hover:text-white"
              >
                {t("analytics.detail.secondary.openFullBook")}
              </Link>
            </div>
          ) : (
          <>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl bg-[#111111] p-3 ring-1 ring-white/8">
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t("analytics.detail.secondary.bestBids")}</p>
              <div className="mt-2 space-y-1.5 font-mono text-[12px]">
                <div className="flex items-center justify-between text-[#B7F500]">
                  <span>18,41</span>
                  <span className="text-zinc-300">120u</span>
                </div>
                <div className="flex items-center justify-between text-[#B7F500]">
                  <span>18,38</span>
                  <span className="text-zinc-300">95u</span>
                </div>
                <div className="flex items-center justify-between text-[#B7F500]">
                  <span>18,34</span>
                  <span className="text-zinc-300">82u</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-[#111111] p-3 ring-1 ring-white/8">
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t("analytics.detail.secondary.bestAsks")}</p>
              <div className="mt-2 space-y-1.5 font-mono text-[12px]">
                <div className="flex items-center justify-between text-fuchsia-300">
                  <span>18,55</span>
                  <span className="text-zinc-300">76u</span>
                </div>
                <div className="flex items-center justify-between text-fuchsia-300">
                  <span>18,58</span>
                  <span className="text-zinc-300">62u</span>
                </div>
                <div className="flex items-center justify-between text-fuchsia-300">
                  <span>18,63</span>
                  <span className="text-zinc-300">48u</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-[#111111] p-3 ring-1 ring-white/8">
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t("analytics.detail.secondary.recentTrades")}</p>
              <div className="mt-2 space-y-1.5 font-mono text-[12px] text-zinc-200">
                <div className="flex items-center justify-between">
                  <span>18,48</span>
                  <span className="text-zinc-400">24u</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>18,50</span>
                  <span className="text-zinc-400">12u</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>18,46</span>
                  <span className="text-zinc-400">8u</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Link
              href={stackHref}
              className="inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-[12px] font-semibold text-zinc-200 transition hover:border-white/25 hover:text-white"
            >
              {t("analytics.detail.secondary.openFullBookTrade")}
            </Link>
          </div>
          </>
          )}
        </DetailSection>

        <DetailSection
          eyebrow={t("analytics.detail.secondary.contextEyebrow")}
          title={t("analytics.detail.secondary.contextTitle")}
          description={t("analytics.detail.secondary.contextDescriptionLive")}
        >
          {isLive && sm ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: t("analytics.detail.secondary.context.activity7d"),
                  value: t("analytics.detail.secondary.context.tradesCount").replace("{count}", String(sm.trades7d)),
                },
                {
                  label: t("analytics.detail.secondary.context.turnover24h"),
                  value: sm.secondaryVolume24h || "—",
                },
                {
                  label: t("analytics.detail.secondary.market.liquidity"),
                  value: sm.liquidityLabel || "—",
                },
              ].map((c) => (
                <div key={c.label} className="rounded-xl bg-[#0a0a0a] px-3 py-3 ring-1 ring-white/6 sm:min-h-[88px]">
                  <p className="text-[11px] leading-snug text-zinc-500">{c.label}</p>
                  <p className="mt-2 font-mono text-[13px] font-semibold leading-snug text-zinc-100">{c.value}</p>
                </div>
              ))}
            </div>
          ) : (
          <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: t("analytics.detail.secondary.context.activity7d30d"), value: "126 / 412 сделок" },
              { label: t("analytics.detail.secondary.context.trend"), value: t("analytics.detail.secondary.context.trendModerateUp") },
              { label: t("analytics.detail.secondary.context.supplyDemand"), value: t("analytics.detail.secondary.context.demandUp") },
            ].map((c) => (
              <div key={c.label} className="rounded-xl bg-[#0a0a0a] px-3 py-3 ring-1 ring-white/6 sm:min-h-[88px]">
                <p className="text-[11px] leading-snug text-zinc-500">{c.label}</p>
                <p className="mt-2 font-mono text-[13px] font-semibold leading-snug text-zinc-100">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl bg-[#111111] px-4 py-4 ring-1 ring-white/8 md:px-5 md:py-5">
              <h3 className="text-[15px] font-semibold tracking-tight text-white">{t("analytics.detail.secondary.payoutsTitle")}</h3>
              <p className="mt-1 text-[11px] text-zinc-600">
                {isLive ? t("analytics.detail.secondary.payoutsHintLive") : t("analytics.detail.secondary.payoutsHintDemo")}
              </p>
              <div className="mt-3">
                <KVPairs
                  rows={[
                    {
                      label: t("analytics.detail.secondary.payouts.window"),
                      value: data.quickStats.find((s) => s.label.includes("30D"))?.value ?? row.payouts,
                    },
                    {
                      label: t("analytics.detail.secondary.payouts.last"),
                      value:
                        data.payoutHistory[0]?.period
                          ? data.payoutHistory[0].period
                          : isLive
                            ? "—"
                            : "14.04.2026",
                    },
                    {
                      label: t("analytics.detail.secondary.payouts.total"),
                      value: data.quickStats.find((s) => s.label.includes("all-time"))?.value ?? row.payouts,
                    },
                    { label: t("analytics.detail.secondary.payouts.yield"), value: row.yieldPct },
                  ]}
                />
              </div>
            </section>
            <section className="rounded-2xl bg-[#111111] px-4 py-4 ring-1 ring-white/8 md:px-5 md:py-5">
              <h3 className="text-[15px] font-semibold tracking-tight text-white">{t("analytics.detail.secondary.termsTitle")}</h3>
              <p className="mt-1 text-[11px] text-zinc-600">
                {isLive ? t("analytics.detail.secondary.termsHintLive") : t("analytics.detail.secondary.termsHintDemo")}
              </p>
              <div className="mt-3">
                <KVPairs
                  rows={[
                    ...data.terms.rows.slice(0, 6).map((termRow) => ({
                      label: analyticsTermLabel(termRow.key, locale),
                      value: termRow.val,
                    })),
                    {
                      label: t("analytics.detail.secondary.terms.totalUnitsEmission"),
                      value: data.terms.rows.find((termRow) => termRow.key.toLowerCase().includes("total_units"))?.val ?? "—",
                    },
                    {
                      label: t("analytics.detail.secondary.terms.availablePrimary"),
                      value:
                        data.quickStats.find((s) => s.label === "Available units")?.value ?? row.units,
                    },
                    { label: t("analytics.detail.secondary.terms.roundStatus"), value: analyticsReleaseStatusLabel(row.status, locale, "round") },
                  ]}
                />
              </div>
            </section>
          </div>
          </>
          )}
        </DetailSection>

        <DetailSection
          eyebrow={t("analytics.detail.secondary.ledgerEyebrow")}
          title={t("analytics.detail.secondary.ledgerTitle")}
          description={t("analytics.detail.secondary.ledgerDescription")}
        >
          <ul className="overflow-hidden rounded-2xl border border-white/8 bg-[#111111] ring-1 ring-white/6">
            {timeline.map((ev) => (
              <li
                key={"id" in ev && ev.id ? ev.id : ev.title}
                className="flex gap-4 border-b border-white/6 px-4 py-3.5 last:border-b-0 sm:px-5 sm:py-4"
              >
                <span
                  className={cn("mt-1.5 size-2 shrink-0 rounded-full", ledgerToneDot(ev.tone))}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tracking-tight text-white">{ev.title}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{ev.date}</p>
                  <p className="mt-1 font-mono text-[12px] text-zinc-300">{ev.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </DetailSection>
      </div>

      <Dialog.Root open={cancelOpen} onOpenChange={setCancelOpen} modal>
        <Dialog.Portal>
          <Dialog.Backdrop
            className={cn(
              "fixed inset-0 z-120 bg-black/70 backdrop-blur-[2px]",
              "transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
            )}
          />
          <Dialog.Popup
            className={cn(
              "fixed left-1/2 top-1/2 z-121 w-[min(100vw-1.5rem,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-zinc-950 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
              "transition-[opacity,transform] duration-200 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0",
            )}
          >
            <Dialog.Close
              aria-label={t("analytics.detail.secondary.closeDialog")}
              className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
            >
              <X className="size-4" />
            </Dialog.Close>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
              <div>
                <Dialog.Title className="text-base font-semibold tracking-tight text-white">{t("analytics.detail.secondary.cancelDialogTitle")}</Dialog.Title>
                <Dialog.Description className="mt-1 text-[13px] text-zinc-400">
                  {t("analytics.detail.secondary.cancelDialogDescription")}
                </Dialog.Description>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close className="inline-flex h-9 items-center rounded-lg bg-white/6 px-3.5 text-[12px] font-medium text-zinc-200 transition hover:bg-white/10">
                {t("analytics.detail.secondary.cancelDialogKeep")}
              </Dialog.Close>
              <Dialog.Close className="inline-flex h-9 items-center rounded-lg bg-fuchsia-500/18 px-3.5 text-[12px] font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/26">
                {t("analytics.detail.secondary.cancelDialogConfirm")}
              </Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
