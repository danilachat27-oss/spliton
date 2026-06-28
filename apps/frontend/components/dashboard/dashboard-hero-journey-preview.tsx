"use client";

import "./dashboard-hero-journey-preview.css";

import type { RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";
import { FileText, Search } from "@/lib/lucide";

import { CatalogTrackCard } from "@/components/dashboard/catalog-track-card";
import { HeroJourneyBookPreview } from "@/components/dashboard/hero-journey-book-preview";
import { HeroJourneyBuyPreview } from "@/components/dashboard/hero-journey-buy-preview";
import { HeroJourneySellPreview } from "@/components/dashboard/hero-journey-sell-preview";
import {
  HERO_JOURNEY_CATALOG_ITEMS,
  HERO_JOURNEY_RELEASE,
} from "@/components/dashboard/hero-journey-data";
import { useI18n } from "@/components/providers/i18n-provider";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { localizeCatalogItem } from "@/lib/catalog/catalog-adapter";
import { tf } from "@/lib/i18n/financial-messages";
import { applyCatalogScrollOffset, measureCenterInContainer, setCursorPoint } from "@/lib/hero-journey/cursor-position";
import { cn } from "@/lib/utils";

const STAGE_W = 1280;
const STAGE_H = 720;
/** Портретный stage под телефон — отдельно от desktop 1280×720 */
const MOBILE_STAGE_W = 393;
const MOBILE_STAGE_H = 680;
const CURSOR_RING_OFFSET = 15;

type JourneyPreviewLayout = "default" | "embedded" | "mobile";

function useStageScale(
  viewportRef: RefObject<HTMLDivElement | null>,
  layout: JourneyPreviewLayout,
  { capAtOne = false, fitMultiplier = 1 }: { capAtOne?: boolean; fitMultiplier?: number } = {},
) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const update = () => {
      const { width, height } = node.getBoundingClientRect();

      if (layout === "mobile") {
        if (width <= 0 || height <= 0) return;
        setScale(Math.min(width / MOBILE_STAGE_W, height / MOBILE_STAGE_H));
        return;
      }

      const fit = Math.min(width / STAGE_W, height / STAGE_H) * fitMultiplier;
      setScale(capAtOne ? Math.min(fit, 1) : fit);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [viewportRef, layout, capAtOne, fitMultiplier]);

  return scale;
}

function useJourneyAnimationVars(stageRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const bindTarget = (root: HTMLElement, prefix: string, target: HTMLElement) => {
      const point = measureCenterInContainer(target, root);
      if (!point) return;
      setCursorPoint(root, prefix, point);
    };

    const update = () => {
      const catalogScroll = stage.querySelector<HTMLElement>('[data-journey-root="catalog-scroll"]');
      const catalogTarget = stage.querySelector<HTMLElement>('[data-journey-target="catalog"]');
      const catalogViewport = stage.querySelector<HTMLElement>(".hero-journey-catalog-viewport");

      if (catalogScroll && catalogTarget && catalogViewport) {
        applyCatalogScrollOffset(catalogScroll, catalogViewport, catalogTarget);
        bindTarget(catalogScroll, "catalog", catalogTarget);
      }

      const sceneTargets: Array<{ root: string; id: string }> = [
        { root: "buy", id: "buy-units" },
        { root: "buy", id: "buy" },
        { root: "sell", id: "sell" },
        { root: "book", id: "book" },
      ];

      for (const { root, id } of sceneTargets) {
        const rootEl = stage.querySelector<HTMLElement>(`[data-journey-root="${root}"]`);
        const targetEl = stage.querySelector<HTMLElement>(`[data-journey-target="${id}"]`);
        if (rootEl && targetEl) {
          bindTarget(rootEl, id, targetEl);
        }
      }
    };

    const scheduleUpdate = () => {
      update();
      window.requestAnimationFrame(update);
      window.setTimeout(update, 120);
      window.setTimeout(update, 480);
    };

    scheduleUpdate();
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(stage);
    window.addEventListener("load", scheduleUpdate);
    void document.fonts?.ready.then(scheduleUpdate);

    const images = stage.querySelectorAll("img");
    for (const img of images) {
      if (!img.complete) {
        img.addEventListener("load", scheduleUpdate);
      }
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("load", scheduleUpdate);
      for (const img of images) {
        img.removeEventListener("load", scheduleUpdate);
      }
    };
  }, [stageRef]);
}

function JourneySceneCursor({
  variant,
  tips,
}: {
  variant: "catalog" | "buy" | "sell" | "book";
  tips: string[];
}) {
  return (
    <div
      className={cn("hero-journey-scene-cursor", `hero-journey-scene-cursor--${variant}`)}
      style={{
        marginLeft: -CURSOR_RING_OFFSET,
        marginTop: -CURSOR_RING_OFFSET,
      }}
      aria-hidden
    >
      <svg width="22" height="24" viewBox="0 0 14 16" className="drop-shadow-lg">
        <path
          d="M1 1L1 13.5L4.2 10.3L6.5 15.5L8.2 14.7L5.9 9.5L10.5 9.5L1 1Z"
          fill="white"
          stroke="#111"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <span className="hero-journey-scene-cursor-ring" />
      <span className="hero-journey-scene-cursor-tip">
        {tips.map((tip, index) => (
          <span
            key={`${variant}-${index}`}
            className={cn(
              "hero-journey-scene-cursor-tip-text",
              `hero-journey-scene-cursor-tip-text--${variant}-${index + 1}`,
            )}
          >
            {tip}
          </span>
        ))}
      </span>
    </div>
  );
}

function PreviewAppShell({ path, light }: { path: string; light?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-11 shrink-0 items-center justify-between border-b px-5",
        light ? "border-zinc-200 bg-white" : "border-white/10 bg-black",
      )}
    >
      <div className="flex items-center gap-2.5">
        <NextImage src="/images/LOGO/mini-logo.png" alt="" width={20} height={20} className="size-5 object-contain" unoptimized />
        <span className={cn("text-[13px] font-semibold tracking-tight", light ? "text-zinc-950" : "text-white")}>
          Spliton
        </span>
      </div>
      <span className={cn("truncate font-mono text-[11px]", light ? "text-zinc-400" : "text-zinc-500")}>{path}</span>
    </div>
  );
}

function CatalogScene() {
  const { locale, t } = useI18n();
  const catalogItems = useMemo(
    () => HERO_JOURNEY_CATALOG_ITEMS.map((item) => localizeCatalogItem(item, locale)),
    [locale],
  );

  return (
    <div className="hero-journey-scene hero-journey-scene--catalog absolute inset-0 flex flex-col bg-black text-white">
      <PreviewAppShell path="spliton.io/catalog" />

      <div className="shrink-0 border-b border-white/[0.06] px-6 pt-2 pb-2">
        <div className="flex items-center gap-5">
          <span className="border-b-2 border-white pb-1.5 text-[13px] font-semibold text-white">
            {t("catalog.markets.tabCatalog")}
          </span>
          <span className="border-b-2 border-transparent pb-1.5 text-[13px] font-medium text-zinc-500">
            {t("catalog.markets.tabOverview")}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-4 overflow-hidden">
          {[
            t("dashboard.heroJourney.catalog.chip.all"),
            t("catalog.filters.kind.funding"),
            t("catalog.filters.kind.market"),
          ].map((label, i) => (
            <span
              key={label}
              className={cn(
                "shrink-0 border-b-2 pb-1.5 text-[12px] font-medium",
                i === 0 ? "border-white text-white" : "border-transparent text-zinc-500",
              )}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="shrink-0 px-6 pt-3 pb-2">
        <div className="flex items-end justify-between gap-4">
          <div className="text-left">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              {t("dashboard.heroJourney.catalog.kicker")}
            </p>
            <h2 className="mt-0.5 text-[20px] font-semibold tracking-tight text-white">
              {t("dashboard.heroJourney.catalog.title")}
            </h2>
          </div>
          <div className="hidden h-8 w-44 items-center gap-2 rounded-full bg-zinc-950 px-3 md:flex">
            <Search className="size-3.5 text-zinc-500" strokeWidth={1.75} aria-hidden />
            <span className="text-[11px] text-zinc-600">{t("dashboard.heroJourney.catalog.searchPlaceholder")}</span>
          </div>
        </div>

        <p className="mt-2 text-[11px] text-zinc-500">{t("dashboard.heroJourney.catalog.shownCount")}</p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            t("dashboard.heroJourney.catalog.chip.all"),
            "Electronic",
            "Pop",
            "Indie",
          ].map((chip, i) => (
            <span
              key={chip}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-semibold",
                i === 0 ? "bg-white text-black" : "bg-white/8 text-zinc-400",
              )}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="hero-journey-catalog-viewport relative min-h-0 flex-1 overflow-hidden">
        <div
          className="hero-journey-catalog-scroll relative pointer-events-none px-6 pb-6 pt-1"
          data-journey-root="catalog-scroll"
        >
          <div className="grid grid-cols-3 items-start gap-3.5" data-journey-catalog-grid>
            {catalogItems.map((item, index) => (
              <div key={item.id} className="min-h-0">
                <CatalogTrackCard
                  item={item}
                  variant="card"
                  size="large"
                  journeyBuyTarget={index === 0}
                  journeyCompact
                />
              </div>
            ))}
          </div>

          <JourneySceneCursor
            variant="catalog"
            tips={[t("dashboard.heroJourney.cursor.buyUnt")]}
          />
        </div>
      </div>
    </div>
  );
}

function BuyScene() {
  const { t } = useI18n();
  const release = HERO_JOURNEY_RELEASE;

  return (
    <div
      className="hero-journey-scene hero-journey-scene--buy absolute inset-0 flex flex-col bg-white text-zinc-950"
      data-journey-root="buy"
    >
      <PreviewAppShell path={`spliton.io/catalog/buy/${release.symbol}`} light />

      <div
        className="hero-journey-toast hero-journey-toast--buy"
        aria-hidden
      >
        {tf(t("dashboard.heroJourney.buy.success"), { units: release.units })}
      </div>

      <div className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-100 px-8">
        <span className="text-[14px] font-semibold tracking-tight">{t("catalog.buy.screen.title")}</span>
        <span className="inline-flex items-center gap-2 text-[13px] font-medium text-zinc-700">
          <FileText className="size-4 text-zinc-500" strokeWidth={1.75} aria-hidden />
          {t("catalog.buy.screen.orderHistory")}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.9fr)_minmax(420px,1.25fr)] gap-8 px-8 py-6">
        <aside className="rounded-3xl bg-zinc-100/70 p-6 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {t("catalog.buy.screen.aboutRelease")}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-200">
              <NextImage src={release.cover} alt="" fill sizes="64px" className="object-contain object-center" unoptimized />
            </div>
            <div className="min-w-0">
              <h2 className="text-[20px] font-bold tracking-tight text-zinc-950">{release.symbol}</h2>
              <p className="text-[13px] text-zinc-600">
                «{release.title}» · {release.artist}
              </p>
            </div>
          </div>

          <dl className="mt-5 space-y-4 text-[13px]">
            <div>
              <dt className="text-zinc-500">{t("catalog.buy.screen.unitPrice")}</dt>
              <dd className="mt-0.5 font-mono text-[16px] font-semibold text-zinc-900">{release.unitPrice} USDT</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t("catalog.buy.screen.availableUnits")}</dt>
              <dd className="mt-0.5 font-mono text-[16px] font-semibold text-zinc-900">1 200 UNT</dd>
            </div>
          </dl>

          <div className="mt-7 rounded-2xl bg-white/85 px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              {t("catalog.buy.screen.purchaseTerms")}
            </p>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-zinc-500">{t("catalog.buy.screen.forSaleNow")}</dt>
                <dd className="font-mono font-semibold text-zinc-900">1 200 UNT</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-zinc-500">{t("catalog.buy.screen.minimum")}</dt>
                <dd className="font-mono font-semibold text-zinc-900">1 UNT</dd>
              </div>
            </dl>
          </div>
        </aside>

        <HeroJourneyBuyPreview />
      </div>
      <JourneySceneCursor
        variant="buy"
        tips={[
          t("dashboard.heroJourney.cursor.buyUnt"),
          t("dashboard.heroJourney.cursor.buyUnt"),
        ]}
      />
    </div>
  );
}

function SellScene() {
  const { t } = useI18n();
  const release = HERO_JOURNEY_RELEASE;

  return (
    <div
      className="hero-journey-scene hero-journey-scene--sell absolute inset-0 flex flex-col bg-[#f6f7f9] text-zinc-950"
      data-journey-root="sell"
    >
      <PreviewAppShell path="spliton.io/assets/sell" light />

      <div
        className="hero-journey-toast hero-journey-toast--sell"
        aria-hidden
      >
        {tf(t("dashboard.heroJourney.sell.listed"), { symbol: release.symbol })}
        <span className="mx-1.5 opacity-40" aria-hidden>
          ·
        </span>
        {t("dashboard.heroJourney.sell.active")}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.95fr)_minmax(380px,1.15fr)] items-start gap-6 px-8 py-5">
        <section className="min-w-0 space-y-5 rounded-3xl bg-white px-6 py-7 text-left shadow-[0_8px_32px_-20px_rgba(0,0,0,0.12)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            {t("dashboard.heroJourney.sell.kicker")}
          </p>
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight text-neutral-950">
              {t("dashboard.heroJourney.sell.title")}
            </h1>
            <p className="mt-2 text-[15px] font-medium text-neutral-800">
              «{release.title}» · {release.artist}
            </p>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-neutral-600">
              {t("dashboard.heroJourney.sell.description")}
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-100/75 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              {t("dashboard.heroJourney.sell.positionData")}
            </p>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">{t("dashboard.heroJourney.sell.inPortfolio")}</dt>
                <dd className="font-mono font-semibold text-neutral-900">{release.units} UNT</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">{t("dashboard.heroJourney.sell.refPrice")}</dt>
                <dd className="font-mono font-semibold text-neutral-900">{release.askPrice} USDT</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">{t("dashboard.heroJourney.sell.symbol")}</dt>
                <dd className="font-mono font-semibold text-neutral-900">{release.symbol}</dd>
              </div>
            </dl>
          </div>
        </section>

        <HeroJourneySellPreview />
      </div>
      <JourneySceneCursor
        variant="sell"
        tips={[t("dashboard.heroJourney.cursor.listLot")]}
      />
    </div>
  );
}

function BookScene() {
  const { t } = useI18n();

  return (
    <div
      className="hero-journey-scene hero-journey-scene--book absolute inset-0 flex flex-col bg-black text-white"
      data-journey-root="book"
    >
      <PreviewAppShell path={`spliton.io/dashboard/secondary-market/book/${HERO_JOURNEY_RELEASE.symbol}`} />
      <HeroJourneyBookPreview />
      <JourneySceneCursor
        variant="book"
        tips={[t("dashboard.heroJourney.cursor.buyBid")]}
      />
    </div>
  );
}

export function DashboardHeroJourneyPreview({
  className,
  embedded = false,
  layout,
}: {
  className?: string;
  embedded?: boolean;
  layout?: JourneyPreviewLayout;
}) {
  const { t } = useI18n();
  const mounted = useClientMounted();
  const resolvedLayout: JourneyPreviewLayout = layout ?? (embedded ? "embedded" : "default");

  if (!mounted) {
    if (resolvedLayout === "mobile") {
      return (
        <div
          className={cn(
            "hero-journey-preview hero-journey-preview--mobile relative h-full w-full overflow-hidden rounded-2xl bg-zinc-950",
            className,
          )}
          role="img"
          aria-label={t("dashboard.heroJourney.ariaLabel")}
        />
      );
    }

    return (
      <div
        className={cn(
          "hero-journey-preview relative h-full w-full overflow-hidden bg-black",
          embedded && "rounded-[8px]",
          className,
        )}
        role="img"
        aria-label={t("dashboard.heroJourney.ariaLabel")}
      />
    );
  }

  if (resolvedLayout === "mobile") {
    return <DashboardHeroJourneyPreviewMobile className={className} />;
  }

  return (
    <DashboardHeroJourneyPreviewAnimated className={className} embedded={embedded || resolvedLayout === "embedded"} />
  );
}

function DashboardHeroJourneyPreviewMobile({ className }: { className?: string }) {
  const { t } = useI18n();
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scale = useStageScale(viewportRef, "mobile");
  useJourneyAnimationVars(stageRef);

  return (
    <div
      className={cn(
        "hero-journey-preview hero-journey-preview--mobile relative h-full w-full overflow-hidden rounded-2xl bg-zinc-950",
        className,
      )}
      role="img"
      aria-label={t("dashboard.heroJourney.ariaLabel")}
    >
      <div
        ref={viewportRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <div
          className="relative shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10"
          style={{
            width: MOBILE_STAGE_W * scale,
            height: MOBILE_STAGE_H * scale,
          }}
        >
          <div
            ref={stageRef}
            className="hero-journey-stage absolute top-0 left-0 overflow-hidden rounded-xl bg-black"
            style={{
              width: MOBILE_STAGE_W,
              height: MOBILE_STAGE_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <CatalogScene />
            <BuyScene />
            <SellScene />
            <BookScene />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardHeroJourneyPreviewAnimated({
  className,
  embedded = false,
}: {
  className?: string;
  embedded?: boolean;
}) {
  const { t } = useI18n();
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scale = useStageScale(viewportRef, embedded ? "embedded" : "default", {
    capAtOne: embedded,
    fitMultiplier: embedded ? 0.78 : 1,
  });
  useJourneyAnimationVars(stageRef);

  return (
    <div
      className={cn(
        "hero-journey-preview relative h-full w-full overflow-hidden",
        embedded && "rounded-[8px]",
        className,
      )}
      role="img"
      aria-label={t("dashboard.heroJourney.ariaLabel")}
    >
      <div
        ref={viewportRef}
        className={cn(
          "absolute inset-0 flex justify-center overflow-hidden",
          embedded ? "items-end" : "items-center",
        )}
      >
        <div
          className={cn("relative shrink-0 overflow-hidden", embedded ? "rounded-[8px]" : "rounded-[2px]")}
          style={{
            width: STAGE_W * scale,
            height: STAGE_H * scale,
          }}
        >
          <div
            ref={stageRef}
            className={cn(
              "hero-journey-stage absolute top-0 left-0 overflow-hidden bg-black",
              embedded && "rounded-[8px]",
            )}
            style={{
              width: STAGE_W,
              height: STAGE_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <CatalogScene />
            <BuyScene />
            <SellScene />
            <BookScene />
          </div>
        </div>
      </div>
    </div>
  );
}
