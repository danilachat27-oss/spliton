"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ExchangeNeonSparkline } from "@/components/shared/charts/exchange-neon-sparkline";
import { useI18n } from "@/components/providers/i18n-provider";
import { RELEASE_DETAIL_ANALYTICS_ICONS } from "@/constants/analytics/release-detail-analytics-icons";
import { filterMetricRows } from "@/lib/analytics/display-value";
import { detailPageText } from "@/lib/i18n/analytics-detail-page-messages";
import {
  parseUnitsAmount,
  parseUsdtAmount,
  trendFromSeries,
} from "@/lib/analytics/release-detail-summary-sparklines";
import { cn } from "@/lib/utils";
import type { ReleaseDetailPageData, ReleaseDetailSummaryRowKind } from "@/types/analytics/release-detail";

import { DetailAnalyticsIllustration } from "./detail-analytics-illustration";

type SummaryTone = "up" | "down" | "neutral" | "muted";

type PulseGroup = "status" | "snapshot" | "market" | "action";

function groupForKind(kind?: ReleaseDetailSummaryRowKind): PulseGroup {
  switch (kind) {
    case "round-status":
      return "status";
    case "gross":
    case "position":
    case "payouts":
    case "my-position":
      return "snapshot";
    case "units":
    case "available":
    case "secondary":
    case "min-entry":
      return "market";
    case "action":
      return "action";
    default:
      return "market";
  }
}

function toneForRow(kind: ReleaseDetailSummaryRowKind | undefined, value: string, sparkline?: number[]): SummaryTone {
  switch (kind) {
    case "round-status": {
      const v = value.toLowerCase();
      if (v.includes("закрыт") || v.includes("closed") || v.includes("пауз") || v.includes("pause")) return "down";
      if (v.includes("открыт") || v.includes("open") || v.includes("актив") || v.includes("active")) return "up";
      if (v.includes("распродан") || v.includes("sold")) return "neutral";
      return "neutral";
    }
    case "position":
    case "my-position": {
      if (value === "—" || parseUnitsAmount(value) <= 0) return "muted";
      return "up";
    }
    case "payouts":
    case "secondary": {
      if (parseUsdtAmount(value) <= 0) return "muted";
      if (sparkline && sparkline.length >= 2) {
        const trend = trendFromSeries(sparkline);
        return trend === "flat" ? "neutral" : trend;
      }
      return "neutral";
    }
    case "units":
      return "neutral";
    case "available": {
      if (parseUnitsAmount(value) <= 0) return "muted";
      return "neutral";
    }
    case "gross":
      return "up";
    case "action":
      return "neutral";
    default:
      return "neutral";
  }
}

function toneValueClass(tone: SummaryTone): string {
  if (tone === "up") return "text-emerald-300";
  if (tone === "down") return "text-rose-300";
  if (tone === "muted") return "text-zinc-400";
  return "text-white";
}

function sparklineTrend(tone: SummaryTone, values: number[]) {
  const dataTrend = trendFromSeries(values);
  if (tone === "muted") return "flat" as const;
  if (tone === "up" || tone === "down") return tone;
  return dataTrend;
}

function formatSparklineDelta(values: number[]): string | null {
  if (values.length < 2) return null;
  const first = values[0]!;
  const last = values[values.length - 1]!;
  if (first === 0 && last === 0) return null;
  const scale = Math.max(Math.abs(first), Math.abs(last), 1);
  const pct = ((last - first) / scale) * 100;
  if (Math.abs(pct) < 0.5) return "→";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

function PulseSidebarSparkline({
  values,
  tone,
  caption,
}: {
  values: number[];
  tone: SummaryTone;
  caption: string;
}) {
  const trend = sparklineTrend(tone, values);
  const delta = formatSparklineDelta(values);

  return (
    <div className="flex shrink-0 flex-col items-end gap-1" aria-hidden>
      <div className="relative rounded-lg bg-black/50 px-2 py-1.5 ring-1 ring-white/10">
        {delta ? (
          <span
            className={cn(
              "absolute right-1.5 top-1 z-10 font-mono text-[9px] font-semibold leading-none",
              trend === "up" ? "text-emerald-400/90" : trend === "down" ? "text-rose-400/90" : "text-zinc-500",
            )}
          >
            {delta}
          </span>
        ) : null}
        <ExchangeNeonSparkline values={values} trend={trend} width={92} height={36} detailSegments={8} />
      </div>
      <span className="pr-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-600">{caption}</span>
    </div>
  );
}

function UnitsFillBar({ value, soldPctLabel }: { value: string; soldPctLabel: string }) {
  const match = value.match(/([\d\s.,]+)\s*\/\s*([\d\s.,]+)/);
  if (!match) return null;
  const sold = parseUnitsAmount(match[1]!);
  const total = parseUnitsAmount(match[2]!);
  if (total <= 0) return null;
  const pct = Math.min(100, Math.round((sold / total) * 100));

  return (
    <div className="mt-2.5">
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500/70 to-emerald-300/90 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-zinc-600">{soldPctLabel.replace("{pct}", String(pct))}</p>
    </div>
  );
}

function PulseTextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "text-[13px] font-medium text-zinc-300 underline decoration-white/20 underline-offset-[3px] transition hover:text-white hover:decoration-white/40",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function PulseMetricRow({
  item,
  sparklineCaption,
  soldPctLabel,
}: {
  item: ReleaseDetailPageData["summaryPanel"][number];
  sparklineCaption: string;
  soldPctLabel: string;
}) {
  const kind = item.kind;
  const isStatus = kind === "round-status";
  const tone = toneForRow(kind, item.value, item.sparkline);
  const hasSparkline = Boolean(item.sparkline && item.sparkline.length >= 2);

  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2.5",
        isStatus ? "bg-emerald-500/[0.06] ring-1 ring-emerald-500/15" : "bg-[#090909]",
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{item.label}</p>
          <div className="mt-1">
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  "font-mono font-semibold hover:text-zinc-300",
                  toneValueClass(tone),
                  isStatus ? "text-xl leading-none sm:text-2xl" : "text-base leading-tight sm:text-lg",
                )}
              >
                {item.value}
              </Link>
            ) : (
              <p
                className={cn(
                  "font-mono font-semibold",
                  toneValueClass(tone),
                  isStatus ? "text-xl leading-none sm:text-2xl" : "text-base leading-tight sm:text-lg",
                )}
              >
                {item.value}
              </p>
            )}
            {item.hint ? (
              <p className={cn("mt-0.5 text-[11px] leading-relaxed", tone === "muted" ? "text-zinc-600" : "text-zinc-500")}>
                {item.hint}
              </p>
            ) : null}
          </div>
          {kind === "units" ? <UnitsFillBar value={item.value} soldPctLabel={soldPctLabel} /> : null}
        </div>
        {hasSparkline ? (
          <PulseSidebarSparkline values={item.sparkline!} tone={tone} caption={sparklineCaption} />
        ) : null}
      </div>
    </div>
  );
}

function PulseGroupBlock({
  title,
  items,
  sparklineCaption,
  soldPctLabel,
}: {
  title?: string;
  items: ReleaseDetailPageData["summaryPanel"];
  sparklineCaption: string;
  soldPctLabel: string;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      {title ? (
        <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">{title}</p>
      ) : null}
      <div className="grid gap-1.5">
        {items.map((item) => (
          <PulseMetricRow
            key={`${item.kind ?? "row"}-${item.label}`}
            item={item}
            sparklineCaption={sparklineCaption}
            soldPctLabel={soldPctLabel}
          />
        ))}
      </div>
    </div>
  );
}

export function ReleaseDetailSidebar({
  data,
  personalLedgerHref,
  isLive = false,
}: {
  data: ReleaseDetailPageData;
  personalLedgerHref?: string;
  isLive?: boolean;
}) {
  const { locale } = useI18n();
  const summaryItems = filterMetricRows(data.summaryPanel);
  const { pageState } = data;
  const pulseIllustration =
    pageState.hasUserPosition
      ? RELEASE_DETAIL_ANALYTICS_ICONS.holderPulse
      : pageState.isGuest
        ? RELEASE_DETAIL_ANALYTICS_ICONS.guestPulse
        : pageState.lifecycle === "sold_out"
          ? RELEASE_DETAIL_ANALYTICS_ICONS.soldOutPulse
          : null;

  const sparklineCaption = detailPageText(locale, "analytics.detail.pulse.sparklineCaption");
  const soldPctLabel = detailPageText(locale, "analytics.detail.pulse.soldPct");

  const statusItems = summaryItems.filter((item) => groupForKind(item.kind) === "status");
  const snapshotItems = summaryItems.filter((item) => groupForKind(item.kind) === "snapshot");
  const marketItems = summaryItems.filter((item) => groupForKind(item.kind) === "market");
  const actionItems = summaryItems.filter((item) => groupForKind(item.kind) === "action");

  return (
    <aside className="rounded-2xl bg-[#0d0d0d] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.35)] sm:p-4 lg:sticky lg:top-20">
      {pulseIllustration ? (
        <div className="mb-3 flex justify-center px-2 py-2">
          <DetailAnalyticsIllustration
            src={pulseIllustration}
            className="w-full max-w-[112px] sm:max-w-[128px]"
            sizes="128px"
          />
        </div>
      ) : null}
      <div className="rounded-xl bg-[#090909] px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {detailPageText(locale, "analytics.detail.pulse.title")}
        </p>
      </div>
      <div className="mt-2 grid gap-3">
        {summaryItems.length === 0 ? (
          <p className="rounded-xl bg-[#090909] px-3 py-2.5 text-[12px] leading-relaxed text-zinc-500">
            {detailPageText(locale, "analytics.detail.pulse.empty")}
          </p>
        ) : (
          <>
            <PulseGroupBlock items={statusItems} sparklineCaption={sparklineCaption} soldPctLabel={soldPctLabel} />
            <PulseGroupBlock
              title={snapshotItems.length > 0 ? detailPageText(locale, "analytics.detail.pulse.group.snapshot") : undefined}
              items={snapshotItems}
              sparklineCaption={sparklineCaption}
              soldPctLabel={soldPctLabel}
            />
            <PulseGroupBlock
              title={marketItems.length > 0 ? detailPageText(locale, "analytics.detail.pulse.group.market") : undefined}
              items={marketItems}
              sparklineCaption={sparklineCaption}
              soldPctLabel={soldPctLabel}
            />
          </>
        )}
      </div>
      {actionItems.length > 0 || personalLedgerHref || isLive ? (
        <div className="mt-4 space-y-2.5 border-t border-white/8 pt-3.5">
          {actionItems.map((item) =>
            item.href ? (
              <div key={`${item.kind}-${item.label}`}>
                <PulseTextLink href={item.href}>{item.value}</PulseTextLink>
              </div>
            ) : null,
          )}
          {personalLedgerHref && (data.liveContext?.user || !isLive) ? (
            <div>
              <PulseTextLink href={personalLedgerHref}>
                {detailPageText(locale, "analytics.detail.pulse.personalHistory")}
              </PulseTextLink>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
                {detailPageText(locale, "analytics.detail.pulse.personalHistoryHint")}
              </p>
            </div>
          ) : isLive ? (
            <PulseTextLink href="/login">
              {detailPageText(locale, "analytics.detail.pulse.loginHistory")}
            </PulseTextLink>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
