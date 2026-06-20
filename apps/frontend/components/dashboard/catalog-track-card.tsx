"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "@/lib/lucide";

import { MediaPlaceholder } from "@/components/dashboard/dashboard-media-placeholder";
import { useI18n } from "@/components/providers/i18n-provider";
import { tf } from "@/lib/i18n/financial-messages";
import { CatalogTrackCardChart } from "@/components/dashboard/catalog-track-card-chart";
import type { ExchangeNeonTrend } from "@/components/shared/charts/exchange-neon-sparkline";
import { analyticsReleaseDetailPath, catalogBuyUnitsPathForRelease } from "@/constants/routes";
import type { CatalogItem } from "@/lib/catalog-mock";
import { isCatalogPrimaryPurchasable } from "@/lib/catalog/catalog-purchase.util";
import { cn } from "@/lib/utils";

export type CatalogTrackCardVariant = "card" | "row";
export type CatalogTrackCardSize = "default" | "large";

/** Цвет дельты цены: + sky, − fuchsia — без «трейдингового» зелёного. */
function shareDeltaClass(change: string) {
  const t = change.trim();
  if (t.startsWith("+") || t.startsWith("＋")) return "text-sky-300 tabular-nums";
  if (t.startsWith("-") || t.startsWith("−") || t.startsWith("–")) return "text-fuchsia-300 tabular-nums";
  return "text-zinc-400 tabular-nums";
}

function toneFromChange(change?: string): "up" | "down" | "neutral" {
  const t = (change ?? "").trim();
  if (t.startsWith("+") || t.startsWith("＋")) return "up";
  if (t.startsWith("-") || t.startsWith("−") || t.startsWith("–")) return "down";
  return "neutral";
}

function toneFromFundingProgress(pct: number): "up" | "down" | "neutral" {
  if (pct >= 70) return "up";
  if (pct < 40) return "down";
  return "neutral";
}

function toneForItem(item: CatalogItem): "up" | "down" | "neutral" {
  if (item.kind === "funding") {
    if (item.purchaseState === "sold_out" || item.purchaseState === "unavailable") return "down";
    if (item.purchaseState === "paused") return "neutral";
    return toneFromFundingProgress(item.pct);
  }
  return toneFromChange(item.sharePriceChange);
}

function toneAccentBarClass(tone: "up" | "down" | "neutral"): string {
  if (tone === "up") return "bg-[#B7F500]/85";
  if (tone === "down") return "bg-rose-400/85";
  return "bg-sky-400/85";
}

function getCardHeaderMeta(
  item: CatalogItem,
  t: (key: string) => string,
  noData: string,
): { label: string; hint: string } {
  if (item.kind === "funding") {
    if (item.purchaseState === "paused") {
      return { label: t("catalog.purchaseState.paused"), hint: `${item.pct}%` };
    }
    if (item.purchaseState === "sold_out" || item.purchaseState === "unavailable") {
      const hint = item.forecastYield !== noData ? item.forecastYield : `${item.pct}%`;
      return { label: t("catalog.purchaseState.sold_out"), hint };
    }
    if (item.status === "open" && isCatalogPrimaryPurchasable(item.purchaseState)) {
      return { label: t("catalog.cards.strip.fundingOpen"), hint: `${item.pct}%` };
    }
    const hint = item.forecastYield !== noData ? item.forecastYield : `${item.pct}%`;
    return { label: t("catalog.cards.strip.fundingPayouts"), hint };
  }
  return { label: t("catalog.cards.strip.market"), hint: item.sharePriceChange };
}

function CatalogStatusBadge({
  label,
  purchaseState,
}: {
  label?: string;
  purchaseState?: "available" | "sold_out" | "paused" | "unavailable";
}) {
  if (!label) return null;
  const tone =
    purchaseState === "available"
      ? "bg-[#B7F500]/15 text-[#B7F500]"
      : purchaseState === "paused"
        ? "bg-amber-500/15 text-amber-300"
        : "bg-zinc-800 text-zinc-400";
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold", tone)}>
      {label}
    </span>
  );
}

function formatFundingCollected(item: Extract<CatalogItem, { kind: "funding" }>): string {
  if (item.goal) {
    return `${item.raised} / ${item.goal}`;
  }
  return item.raised;
}

function toneBarClass(tone: "up" | "down" | "neutral"): string {
  if (tone === "up") return "bg-zinc-300";
  if (tone === "down") return "bg-zinc-500";
  return "bg-zinc-400";
}

function toneValueClass(tone: "up" | "down" | "neutral"): string {
  if (tone === "up") return "text-zinc-100";
  if (tone === "down") return "text-zinc-400";
  return "text-zinc-300";
}

function toNeonTrend(tone: "up" | "down" | "neutral"): ExchangeNeonTrend {
  if (tone === "up") return "up";
  if (tone === "down") return "down";
  return "flat";
}

function buildCatalogSparkValues(item: CatalogItem, tone: "up" | "down" | "neutral"): number[] {
  let seed = item.id.charCodeAt(0) * 31 + item.title.length * 17;
  let v = item.kind === "funding" ? item.pct / 100 : 0.42;
  if (tone === "down") v = 0.68;
  if (tone === "up") v = 0.28;

  const out: number[] = [];
  for (let i = 0; i < 14; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const drift = tone === "up" ? 0.034 : tone === "down" ? -0.026 : 0.01;
    v = Math.max(0.1, Math.min(0.9, v + drift + ((seed % 100) - 50) / 750));
    out.push(Math.round(v * 1000) / 10);
  }
  return out;
}

const cardCoverTopClass =
  "aspect-[16/10] w-full min-h-[140px] sm:aspect-[5/4] sm:min-h-[168px]";

const cardBodyClass = "flex flex-col gap-4 p-4 sm:p-5";

const cardShellBase =
  "group relative flex h-auto shrink-0 flex-col overflow-hidden rounded-2xl bg-[#0c0c0e] p-0 font-mono text-[13px] tabular-nums tracking-tight transition hover:bg-[#111114]";

function CardKindStrip({
  item,
  t,
  noData,
  plain = false,
}: {
  item: CatalogItem;
  t: (key: string) => string;
  noData: string;
  plain?: boolean;
}) {
  const tone = toneForItem(item);
  const { label, hint } = getCardHeaderMeta(item, t, noData);

  return (
    <div className={cn("flex items-center justify-between gap-3", !plain && "border-b border-white/6 pb-2.5")}>
      <div className="flex min-w-0 items-center">
        <span className="truncate font-sans text-[11px] font-medium tracking-tight text-zinc-200">{label}</span>
      </div>
      <span className={cn("shrink-0 font-mono text-[10px] tabular-nums", toneValueClass(tone))}>{hint}</span>
    </div>
  );
}

/** Плоская строка каталога: одна рамка, без «шапки в шапке». */
function RowKindLine({
  item,
  t,
  noData,
}: {
  item: CatalogItem;
  t: (key: string) => string;
  noData: string;
}) {
  const tone = toneForItem(item);
  const { label, hint } = getCardHeaderMeta(item, t, noData);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className={cn("h-3 w-0.5 shrink-0 rounded-full", toneAccentBarClass(tone))} aria-hidden />
      <span className="font-sans text-[11px] font-medium text-zinc-300">{label}</span>
      <span className="font-mono text-[10px] tabular-nums text-zinc-600">{hint}</span>
    </div>
  );
}

function CatalogCover({
  coverUrl,
  className,
  rounded = "rounded-xl",
  showPlay = false,
  playLabel,
  imageClassName = "object-cover",
}: {
  coverUrl?: string | null;
  className?: string;
  rounded?: string;
  showPlay?: boolean;
  playLabel?: string;
  imageClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-[#070707]", rounded, className)}>
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt=""
          fill
          className={imageClassName}
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized
        />
      ) : (
        <MediaPlaceholder label="Spliton" aspectClassName="absolute inset-0 h-full w-full min-h-0" />
      )}
      {showPlay && playLabel ? <PlayFab label={playLabel} small /> : null}
    </div>
  );
}

const rowShell =
  "group flex w-full flex-col gap-2.5 rounded-xl bg-[#0a0a0a] p-3 font-mono text-[13px] tabular-nums tracking-tight transition-colors duration-200 hover:bg-[#101010] sm:flex-row sm:items-center sm:gap-4 sm:rounded-2xl sm:p-4";

const rowMainRow = "flex min-w-0 items-center gap-3 sm:flex-1";

const linkMarket =
  "inline-flex shrink-0 items-center font-sans text-[12px] font-semibold text-zinc-100 underline decoration-white/40 underline-offset-[3px] transition hover:text-white hover:decoration-white sm:text-[11px]";

const btnBuyAccent =
  "inline-flex h-9 min-w-[96px] shrink-0 items-center justify-center rounded-full bg-[#B7F500] px-3 text-[11px] font-semibold text-black transition hover:bg-[#c8ff3d] active:scale-[0.98] sm:h-10 sm:min-w-[128px] sm:px-0 sm:text-[12px]";

const btnBuyUnitsCard =
  "inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full bg-[#B7F500] px-5 text-[13px] font-semibold text-black transition hover:bg-[#c8ff3d] active:scale-[0.98] sm:h-10 sm:w-auto sm:bg-white sm:text-black sm:hover:bg-zinc-200 sm:text-[12px]";

const btnDetailsCard =
  "inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full bg-white px-5 text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.98] sm:h-10 sm:w-auto sm:text-[12px]";

const btnDetailsRow =
  "inline-flex h-9 min-w-[96px] shrink-0 items-center justify-center rounded-full bg-white px-3 text-[11px] font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.98] sm:h-10 sm:min-w-[128px] sm:px-0 sm:text-[12px]";

const rowCoverClass = (large: boolean) =>
  cn("shrink-0 self-center rounded-lg sm:rounded-xl", large ? "size-[72px] sm:size-[96px]" : "size-[64px] sm:size-[80px]");

type FundingPrimaryAction =
  | { kind: "buy"; href: string; labelKey: "catalog.cards.buyUnits" }
  | { kind: "market"; href: string; labelKey: "catalog.cards.viewMarket" }
  | { kind: "disabled"; labelKey: "catalog.cards.unavailable" | "catalog.cards.roundEnded" };

function resolveFundingPrimaryAction(
  item: Extract<CatalogItem, { kind: "funding" }>,
  detailHref: string,
): FundingPrimaryAction {
  const canBuy = item.purchaseState === "available";
  const hasSecondary =
    (item.activeListingsCount ?? 0) > 0 || item.secondaryMarketEnabled === true;

  if (canBuy) {
    return {
      kind: "buy",
      href: catalogBuyUnitsPathForRelease(item),
      labelKey: "catalog.cards.buyUnits",
    };
  }
  if (hasSecondary) {
    return { kind: "market", href: detailHref, labelKey: "catalog.cards.viewMarket" };
  }
  if (item.purchaseState === "sold_out" || item.roundStatus === "completed") {
    return { kind: "disabled", labelKey: "catalog.cards.roundEnded" };
  }
  return { kind: "disabled", labelKey: "catalog.cards.unavailable" };
}

function FundingPrimaryButton({
  action,
  t,
  buyClassName,
  marketClassName,
  disabledClassName,
  journeyTarget,
  journeyBtnClassName,
}: {
  action: FundingPrimaryAction;
  t: (key: string) => string;
  buyClassName: string;
  marketClassName: string;
  disabledClassName: string;
  journeyTarget?: boolean;
  journeyBtnClassName?: string;
}) {
  if (action.kind === "disabled") {
    return (
      <span className={disabledClassName} aria-disabled="true">
        {t(action.labelKey)}
      </span>
    );
  }

  if (action.kind === "market") {
    return (
      <Link href={action.href} className={marketClassName}>
        {t(action.labelKey)}
      </Link>
    );
  }

  return (
    <Link
      href={action.href}
      className={cn(buyClassName, journeyBtnClassName, "relative z-10 touch-manipulation")}
      data-journey-target={journeyTarget ? "catalog" : undefined}
    >
      {t(action.labelKey)}
    </Link>
  );
}

function CardMarketLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={linkMarket}>
      {label}
    </Link>
  );
}

function CardMetaBlock({
  title,
  artist,
  genre,
  marketLink,
  statusBadge,
  titleClassName,
  artistClassName,
}: {
  title: string;
  artist: string;
  genre: string;
  marketLink?: { href: string; label: string } | null;
  statusBadge?: ReactNode;
  titleClassName?: string;
  artistClassName?: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("truncate font-sans font-semibold tracking-tight text-white", titleClassName)}>{title}</h3>
            {statusBadge}
          </div>
          <p className={cn("truncate text-zinc-500", artistClassName)}>{artist}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{genre}</p>
        </div>
        {marketLink ? <CardMarketLink href={marketLink.href} label={marketLink.label} /> : null}
      </div>
    </div>
  );
}

function RowSideActions({
  detailHref,
  t,
  fundingPrimaryAction,
  marketLink,
}: {
  detailHref: string;
  t: (key: string) => string;
  fundingPrimaryAction?: FundingPrimaryAction | null;
  marketLink?: { href: string; label: string } | null;
}) {
  const buyClassName = cn(btnBuyAccent, "w-full sm:w-[128px]");
  const disabledClass = cn(
    btnBuyAccent,
    "w-full cursor-not-allowed bg-white/10 text-zinc-500 hover:bg-white/10 hover:text-zinc-500 sm:w-[128px]",
  );

  return (
    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[128px]">
      {marketLink ? <CardMarketLink href={marketLink.href} label={marketLink.label} /> : null}
      {fundingPrimaryAction?.kind === "buy" || fundingPrimaryAction?.kind === "disabled" ? (
        <FundingPrimaryButton
          action={fundingPrimaryAction}
          t={t}
          buyClassName={buyClassName}
          marketClassName={buyClassName}
          disabledClassName={disabledClass}
        />
      ) : null}
      <Link href={detailHref} className={cn(btnDetailsRow, "w-full")}>
        {t("catalog.cards.details")}
      </Link>
    </div>
  );
}

function resolveMarketLink(
  action: FundingPrimaryAction | null,
  t: (key: string) => string,
): { href: string; label: string } | null {
  if (action?.kind === "market") {
    return { href: action.href, label: t(action.labelKey) };
  }
  return null;
}

function PlayFab({ label, small, large }: { label: string; small?: boolean; large?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "absolute flex items-center justify-center rounded-full bg-black/82 text-white shadow-md backdrop-blur-sm transition",
        "hover:bg-black",
        small ? "bottom-1.5 left-1.5 size-6.5" : large ? "bottom-4 left-4 size-12" : "bottom-3 left-3 size-10",
      )}
      aria-label={label}
    >
      <Play className={cn("fill-current text-zinc-100", small ? "ml-0.5 size-3" : large ? "ml-1 size-5" : "ml-0.5 size-4")} />
    </button>
  );
}

export function CatalogTrackCard({
  item,
  variant = "card",
  size = "default",
  journeyBuyTarget = false,
  journeyCompact = false,
}: {
  item: CatalogItem;
  variant?: CatalogTrackCardVariant;
  size?: CatalogTrackCardSize;
  /** Подсветка кнопки «Купить UNT» для hero-анимации на главной. */
  journeyBuyTarget?: boolean;
  /** Компактная карточка для hero-preview — без блока доходности. */
  journeyCompact?: boolean;
}) {
  const { t } = useI18n();
  const noData = t("catalog.cards.noData");
  const usdt = t("catalog.cards.usdtSuffix");
  const playLabel = tf(t("catalog.cards.playAria"), { title: item.title });
  const isRow = variant === "row";
  const L = size === "large";
  const showSparklineBlock = item.hasSparkline === true;
  const tone = toneForItem(item);
  const sparkValues = showSparklineBlock ? buildCatalogSparkValues(item, tone) : [];
  const neonTrend = toNeonTrend(tone);
  const showPlay = item.hasAudioPreview === true;
  const detailHref = `${analyticsReleaseDetailPath(item.id)}?from=catalog`;
  const fundingPrimaryAction =
    item.kind === "funding" ? resolveFundingPrimaryAction(item, detailHref) : null;
  const fundingMarketLink =
    item.kind === "funding" ? resolveMarketLink(fundingPrimaryAction, t) : null;
  const disabledPrimaryCardClass = cn(
    btnBuyUnitsCard,
    "cursor-not-allowed bg-white/10 text-zinc-500 hover:bg-white/10 hover:text-zinc-500",
  );

  if (item.kind === "funding") {
    if (isRow) {
      return (
        <article
        className={rowShell}
        data-purchase-state={"purchaseState" in item ? item.purchaseState : undefined}
      >
          <div className={rowMainRow}>
            <CatalogCover
              coverUrl={item.coverUrl}
              rounded="rounded-lg"
              showPlay={showPlay}
              playLabel={playLabel}
              className={rowCoverClass(L)}
            />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 sm:gap-2">
              <RowKindLine item={item} t={t} noData={noData} />
              <div className="min-w-0">
                <h3
                  className={cn(
                    "font-sans font-semibold tracking-tight text-white line-clamp-2 sm:truncate",
                    L ? "text-base sm:text-lg" : "text-sm sm:text-base",
                  )}
                >
                  {item.title}
                </h3>
                <p className="truncate text-xs text-zinc-400">{item.artist}</p>
              </div>
              <div>
                <div className="h-1 overflow-hidden rounded-full bg-zinc-800 sm:h-1.5">
                  <div className={cn("h-full rounded-full", toneBarClass(tone))} style={{ width: `${item.pct}%` }} />
                </div>
                <p className="mt-1 font-sans text-[10px] text-zinc-400 sm:text-[11px]">
                  <span className="font-semibold tabular-nums text-zinc-100">{item.raised}</span>
                  {item.goal ? <span className="text-zinc-500"> / {item.goal}</span> : null}
                </p>
              </div>
            </div>
          </div>
          <RowSideActions
            detailHref={detailHref}
            t={t}
            fundingPrimaryAction={fundingPrimaryAction}
            marketLink={fundingMarketLink}
          />
        </article>
      );
    }

    return (
      <article
        className={cardShellBase}
        data-purchase-state={"purchaseState" in item ? item.purchaseState : undefined}
      >
        <CatalogCover
          coverUrl={item.coverUrl}
          rounded="rounded-none"
          showPlay={showPlay}
          playLabel={playLabel}
          className={cardCoverTopClass}
        />

        <div className={cardBodyClass}>
          <CardKindStrip item={item} t={t} noData={noData} />

          <CardMetaBlock
            title={item.title}
            artist={item.artist}
            genre={item.genre}
            marketLink={fundingMarketLink}
            statusBadge={
              item.statusLabel ? (
                <CatalogStatusBadge label={item.statusLabel} purchaseState={item.purchaseState} />
              ) : null
            }
            titleClassName="text-lg sm:text-xl"
            artistClassName="text-sm"
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            {fundingPrimaryAction?.kind === "buy" || fundingPrimaryAction?.kind === "disabled" ? (
              <FundingPrimaryButton
                action={fundingPrimaryAction}
                t={t}
                buyClassName={btnBuyUnitsCard}
                marketClassName={btnBuyUnitsCard}
                disabledClassName={disabledPrimaryCardClass}
                journeyTarget={journeyBuyTarget}
                journeyBtnClassName={journeyBuyTarget ? "hero-journey-catalog-buy-btn" : undefined}
              />
            ) : null}
            <Link href={detailHref} className={btnDetailsCard}>
              {t("catalog.cards.details")}
            </Link>
          </div>

          {!journeyCompact ? (
          <div
            className={cn(
              showSparklineBlock &&
                "grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:items-end",
            )}
          >
            <div>
              <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                {t("catalog.cards.yieldLabel")}
              </p>
              <p
                className={cn(
                  "mt-1 font-bold leading-none tabular-nums text-2xl sm:text-3xl sm:text-[2rem]",
                  toneValueClass(tone),
                )}
              >
                {item.forecastYield}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {t("catalog.cards.collected")}{" "}
                <span className="font-semibold tabular-nums text-zinc-300">{formatFundingCollected(item)}</span>
                <span className="text-zinc-600"> {usdt}</span>
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={cn("h-full rounded-full", toneBarClass(tone))} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
            {showSparklineBlock && sparkValues.length > 0 ? (
              <div className="h-14 w-full min-w-0">
                <CatalogTrackCardChart values={sparkValues} trend={neonTrend} />
              </div>
            ) : null}
          </div>
          ) : null}

          {!journeyCompact ? (
          <div className="grid grid-cols-1 gap-y-2 border-t border-white/6 pt-3 text-[11px] text-zinc-500 sm:grid-cols-2 sm:gap-x-4 text-[12px]">
            <div className="flex justify-between gap-2">
              <span>{t("catalog.cards.unitPrice")}</span>
              <span className="font-semibold tabular-nums text-zinc-200">
                {item.unitPriceUsdt}
                {item.unitPriceUsdt !== "—" && item.unitPriceUsdt !== noData ? (
                  <span className="font-normal text-zinc-500"> {usdt}</span>
                ) : null}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span>{t("catalog.cards.liquidity")}</span>
              <span className="font-semibold tabular-nums text-zinc-200">{item.availablePct}</span>
            </div>
          </div>
          ) : null}
        </div>
      </article>
    );
  }

  if (isRow) {
    return (
      <article
        className={rowShell}
        data-purchase-state={"purchaseState" in item ? item.purchaseState : undefined}
      >
        <div className={rowMainRow}>
          <CatalogCover
            coverUrl={"coverUrl" in item ? item.coverUrl : undefined}
            rounded="rounded-lg"
            showPlay={showPlay}
            playLabel={playLabel}
            className={rowCoverClass(L)}
          />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 sm:gap-2">
            <RowKindLine item={item} t={t} noData={noData} />
            <div className="min-w-0">
              <h3
                className={cn(
                  "font-sans font-semibold tracking-tight text-white line-clamp-2 sm:truncate",
                  L ? "text-base sm:text-lg" : "text-sm sm:text-base",
                )}
              >
                {item.title}
              </h3>
              <p className="truncate text-xs text-zinc-400">{item.artist}</p>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[10px] sm:text-[11px]">
              <p className="font-semibold tabular-nums text-zinc-100">
                {item.sharePrice}{" "}
                <span className={cn("font-semibold", shareDeltaClass(item.sharePriceChange))}>
                  {item.sharePriceChange}
                </span>
              </p>
              <p className="font-sans text-zinc-500">
                {t("catalog.cards.payoutsLabel")}:{" "}
                <span className="font-medium tabular-nums text-zinc-300">{item.lastMonthPayout}</span>
              </p>
            </div>
          </div>
        </div>
        <RowSideActions
          detailHref={detailHref}
          t={t}
          marketLink={{ href: detailHref, label: t("catalog.cards.viewSecondary") }}
        />
      </article>
    );
  }

  return (
    <article
      className={cardShellBase}
      data-purchase-state={"purchaseState" in item ? item.purchaseState : undefined}
    >
      <CatalogCover
        coverUrl={"coverUrl" in item ? item.coverUrl : undefined}
        rounded="rounded-none"
        showPlay={showPlay}
        playLabel={playLabel}
        className={cardCoverTopClass}
      />

      <div className={cardBodyClass}>
        <CardKindStrip item={item} t={t} noData={noData} />

        <CardMetaBlock
          title={item.title}
          artist={item.artist}
          genre={item.genre}
          marketLink={{ href: detailHref, label: t("catalog.cards.viewSecondary") }}
          titleClassName="text-lg sm:text-xl"
          artistClassName="text-sm"
        />

        <Link href={detailHref} className={btnDetailsCard}>
          {t("catalog.cards.details")}
        </Link>

        <div
          className={cn(
            showSparklineBlock && "grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:items-end",
          )}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{t("catalog.cards.entrySecondary")}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-2xl font-semibold leading-none tabular-nums text-white sm:text-3xl sm:text-[2rem]">{item.sharePrice}</span>
              <span className={cn("text-lg font-semibold leading-none tabular-nums sm:text-xl sm:text-2xl", toneValueClass(tone))}>
                {item.sharePriceChange}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {t("catalog.cards.payoutsLastPeriod")}{" "}
              <span className="font-semibold tabular-nums text-zinc-300">{item.lastMonthPayout}</span>
            </p>
          </div>
          {showSparklineBlock && sparkValues.length > 0 ? (
            <div className="h-14 w-full min-w-0">
              <CatalogTrackCardChart values={sparkValues} trend={neonTrend} />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/6 pt-3 text-[11px] text-zinc-500">
          <div className="flex justify-between gap-2">
            <span>{t("catalog.cards.unitPrice")}</span>
            <span className="font-semibold tabular-nums text-zinc-200">{item.sharePrice}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span>{t("catalog.cards.delta24h")}</span>
            <span className={cn("font-semibold tabular-nums", toneValueClass(tone))}>{item.sharePriceChange}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
