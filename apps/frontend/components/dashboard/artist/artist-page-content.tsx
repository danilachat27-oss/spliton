"use client";

import "./artist-page.css";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Disc3, FileText, Mic2, RefreshCw, TrendingUp, Wallet } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { IssuerPortalOnboarding } from "@/components/dashboard/artist/issuer-portal-onboarding";
import { MediaPlaceholder } from "@/components/dashboard/dashboard-media-placeholder";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { profileCardClass, profileMutedCardClass } from "@/components/dashboard/profile/profile-ui";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { catalogItems, type CatalogItem } from "@/lib/catalog-mock";
import { tf } from "@/lib/i18n/financial-messages";
import { formatUsdtRu } from "@/lib/wallet/format-money";
import { resolveApiUrl } from "@/lib/public-env";
import { cn } from "@/lib/utils";
import { isLiveCatalogEnabled, loadLiveCatalogItems } from "@/services/catalog.service";

type ArtistDashboard = {
  summary: {
    releases: number;
    liveRounds: number;
    tradesLast30Days: number;
    payoutsTotal: string;
    openSubmissions: number;
  };
};

type ArtistRelease = {
  id: string;
  slug: string;
  symbol: string;
  title: string;
  status: string;
  roundStatus: string | null;
  updatedAt: string;
};

type DisplayRelease = ArtistRelease & {
  artist?: string;
  coverUrl?: string | null;
  catalogId: string;
};

const carouselTrackClass =
  "artist-carousel-track flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4";

const carouselItemClass = "w-[min(78vw,300px)] shrink-0 snap-center sm:w-[min(42vw,320px)] lg:w-[min(34vw,340px)]";

function catalogCoverFallback(id: string, index = 0): string {
  const n = Number.parseInt(id, 10);
  const slot = Number.isFinite(n) ? ((n - 1) % 8) + 1 : (index % 8) + 1;
  return `/images/catalog/${slot}.png`;
}

function findCatalogMatch(pool: CatalogItem[], release: Pick<ArtistRelease, "id" | "slug">) {
  return pool.find((item) => item.slug === release.slug || item.id === release.id || item.id === release.slug);
}

function enrichRelease(release: ArtistRelease, pool: CatalogItem[]): DisplayRelease {
  const match = findCatalogMatch(pool, release);
  return {
    ...release,
    title: match?.title ?? release.title,
    artist: match?.artist,
    coverUrl: match?.coverUrl ?? catalogCoverFallback(release.id),
    catalogId: match?.id ?? release.id,
  };
}

function releaseHref(release: DisplayRelease) {
  return `/catalog/buy/${encodeURIComponent(release.catalogId)}`;
}

function ReleaseCover({
  coverUrl,
  title,
  large,
}: {
  coverUrl?: string | null;
  title: string;
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        "artist-slide-cover relative overflow-hidden bg-[#070707]",
        large ? "aspect-[5/4] w-full rounded-2xl" : "size-12 shrink-0 rounded-xl",
      )}
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt=""
          fill
          sizes={large ? "(max-width: 640px) 78vw, 320px" : "48px"}
          className="object-cover"
          unoptimized
        />
      ) : (
        <MediaPlaceholder label={title} aspectClassName="absolute inset-0 h-full w-full min-h-0" frameless />
      )}
      {large ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      ) : null}
    </div>
  );
}

function StatusPill({
  status,
  roundStatus,
  t,
}: {
  status: string;
  roundStatus?: string | null;
  t: (key: string, fallback?: string) => string;
}) {
  const isLive = status === "live" || roundStatus === "live";
  const label = roundStatus
    ? t(`artist.portal.round.${roundStatus}`, roundStatus)
    : t(`artist.portal.status.${status}`, status);

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
        isLive && "bg-[#B7F500] text-black",
        !isLive && status === "payouts" && "bg-emerald-100 text-emerald-800",
        !isLive && status !== "payouts" && "bg-neutral-100 text-neutral-700",
      )}
    >
      {label}
    </span>
  );
}

function ReleaseCarousel({
  items,
  activeSlide,
  onSlideChange,
  t,
}: {
  items: DisplayRelease[];
  activeSlide: number;
  onSlideChange: (index: number) => void;
  t: (key: string, fallback?: string) => string;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = trackRef.current?.children[activeSlide] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeSlide]);

  const prev = () => onSlideChange((activeSlide - 1 + items.length) % items.length);
  const next = () => onSlideChange((activeSlide + 1) % items.length);

  if (items.length === 0) return null;

  return (
    <section className={cn(profileCardClass, "relative overflow-hidden p-0 sm:p-0")}>
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            {t("artist.portal.carousel.eyebrow")}
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-neutral-900 sm:text-lg">
            {t("artist.portal.carousel.title")}
          </h2>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            onClick={prev}
            className="inline-flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
            aria-label={t("artist.portal.carousel.prevAria")}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
            aria-label={t("artist.portal.carousel.nextAria")}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div ref={trackRef} className={cn(carouselTrackClass, "mt-3 px-4 sm:mt-4 sm:px-6")}>
        {items.map((release, index) => {
          const isActive = index === activeSlide;
          const href = releaseHref(release);
          return (
            <article
              key={release.id}
              className={cn(carouselItemClass, "artist-slide", isActive && "artist-slide--active")}
              aria-hidden={!isActive}
            >
              <Link
                href={href}
                className="group block overflow-hidden rounded-3xl bg-white p-2.5 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.18)] transition hover:shadow-[0_18px_48px_-24px_rgba(0,0,0,0.22)] sm:p-3"
                onClick={() => onSlideChange(index)}
              >
                <ReleaseCover coverUrl={release.coverUrl} title={release.title} large />
                <div className="mt-3 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={release.status} roundStatus={release.roundStatus} t={t} />
                    <span className="font-mono text-[10px] text-neutral-400">{release.symbol}</span>
                  </div>
                  <h3 className="text-sm font-semibold leading-snug text-neutral-900 group-hover:underline sm:text-base">
                    {release.title}
                  </h3>
                  {release.artist ? <p className="text-xs text-neutral-500">{release.artist}</p> : null}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-800">
                    {t("artist.portal.carousel.openRelease")}
                    <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-1.5 px-4 py-4 sm:px-6">
        {items.map((r, i) => (
          <button
            key={r.id}
            type="button"
            aria-label={tf(t("artist.portal.carousel.slideAria"), { n: String(i + 1) })}
            onClick={() => onSlideChange(i)}
            className={cn(
              "artist-dot size-1.5 rounded-full bg-neutral-200",
              i === activeSlide && "artist-dot--active",
            )}
          />
        ))}
      </div>
    </section>
  );
}

function PortalFlowScene({
  summary,
  t,
}: {
  summary: ArtistDashboard["summary"] | null;
  t: (key: string, fallback?: string) => string;
}) {
  const steps = [
    { id: 1, label: t("artist.portal.flow.release"), value: summary?.releases ?? "—", icon: Disc3 },
    { id: 2, label: t("artist.portal.flow.round"), value: summary?.liveRounds ?? "—", icon: TrendingUp },
    { id: 3, label: t("artist.portal.flow.trades"), value: summary?.tradesLast30Days ?? "—", icon: RefreshCw },
    {
      id: 4,
      label: t("artist.portal.flow.payouts"),
      value: summary ? formatUsdtRu(summary.payoutsTotal) : "—",
      icon: Wallet,
    },
  ] as const;

  const activeStep = summary
    ? summary.liveRounds > 0
      ? 2
      : summary.tradesLast30Days > 0
        ? 3
        : summary.releases > 0
          ? 1
          : 1
    : 2;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = step.id === activeStep;
          const done = step.id < activeStep;
          return (
            <div key={step.id} className="flex flex-col items-center gap-1 text-center">
              <span
                className={cn(
                  "artist-flow-step flex size-8 items-center justify-center rounded-full sm:size-9",
                  done && "bg-neutral-900 text-white",
                  isActive && "bg-[#B7F500] text-black artist-flow-step--active",
                  !done && !isActive && "bg-neutral-100 text-neutral-400",
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <span className="text-[9px] leading-tight text-neutral-500 sm:text-[10px]">{step.label}</span>
              <span className="font-mono text-[10px] font-semibold tabular-nums text-neutral-800 sm:text-xs">
                {String(step.value)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div className="artist-flow-bar h-full rounded-full bg-neutral-900" />
      </div>
      <p className="text-center text-[11px] text-neutral-500">{t("artist.portal.flow.description")}</p>
    </div>
  );
}

export function ArtistPageContent() {
  const { accessToken, user } = useAuth();
  const { t, locale } = useI18n();
  const [data, setData] = React.useState<ArtistDashboard | null>(null);
  const [releases, setReleases] = React.useState<ArtistRelease[]>([]);
  const [forbidden, setForbidden] = React.useState(false);
  const [loading, setLoading] = React.useState(Boolean(user));
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [catalogPool, setCatalogPool] = React.useState<CatalogItem[]>(catalogItems);

  const kpiConfig = React.useMemo(
    () =>
      [
        { key: "releases" as const, label: t("artist.portal.kpi.releases") },
        { key: "liveRounds" as const, label: t("artist.portal.kpi.liveRounds") },
        { key: "tradesLast30Days" as const, label: t("artist.portal.kpi.tradesLast30Days") },
        {
          key: "payoutsTotal" as const,
          label: t("artist.portal.kpi.payoutsTotal"),
          format: (v: string | number) => formatUsdtRu(String(v)),
        },
        { key: "openSubmissions" as const, label: t("artist.portal.kpi.openSubmissions") },
      ] as const,
    [t],
  );

  React.useEffect(() => {
    if (!isLiveCatalogEnabled()) {
      setCatalogPool(catalogItems);
      return;
    }
    let cancelled = false;
    void loadLiveCatalogItems({ page: 1, pageSize: 32 }, locale)
      .then((res) => {
        if (!cancelled && res.items.length > 0) setCatalogPool(res.items);
      })
      .catch(() => {
        if (!cancelled) setCatalogPool(catalogItems);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const load = React.useCallback(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const headers = { Authorization: `Bearer ${accessToken}` };
    void Promise.all([
      fetch(resolveApiUrl("/api/v1/artist/dashboard"), { headers, credentials: "include" }),
      fetch(resolveApiUrl("/api/v1/artist/releases"), { headers, credentials: "include" }),
    ])
      .then(async ([dashRes, relRes]) => {
        if (dashRes.status === 403 || relRes.status === 403) {
          setForbidden(true);
          setData(null);
          setReleases([]);
          return;
        }
        if (!dashRes.ok || !relRes.ok) throw new Error("load failed");
        const dash = (await dashRes.json()) as ArtistDashboard;
        const rel = (await relRes.json()) as { items: ArtistRelease[] };
        setForbidden(false);
        setData(dash);
        setReleases(rel.items);
      })
      .catch(() => {
        setForbidden(true);
        setData(null);
        setReleases([]);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  React.useEffect(() => {
    load();
  }, [load]);

  const displayReleases = React.useMemo(
    () => releases.map((r) => enrichRelease(r, catalogPool)),
    [releases, catalogPool],
  );

  React.useEffect(() => {
    if (displayReleases.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveSlide((i) => (i + 1) % displayReleases.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [displayReleases.length]);

  React.useEffect(() => {
    setActiveSlide(0);
  }, [displayReleases.length]);

  const hasPortalAccess = Boolean(data) && !forbidden;

  return (
    <div className="flex min-h-dvh flex-col bg-[#f6f7f9]">
      <DashboardHeader />
      <main className="scheme-light flex-1 text-neutral-900">
        <div className="mx-auto w-full max-w-[1320px] px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] pt-4 sm:px-6 sm:pb-8 lg:px-8 lg:pt-6">
          <header className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {t("artist.portal.page.eyebrow")}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              {t("artist.portal.page.title")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {t("artist.portal.page.descriptionBefore")}{" "}
              <Link href={ROUTES.dashboardCatalog} className="font-medium text-neutral-900 underline-offset-2 hover:underline">
                {t("artist.portal.page.catalogLink")}
              </Link>
              {t("artist.portal.page.descriptionAfter")}
            </p>
          </header>

          {!user ? (
            <section className={cn(profileCardClass, "mt-6 max-w-lg text-center sm:mt-8")}>
              <Mic2 className="mx-auto size-10 text-neutral-400" aria-hidden />
              <p className="mt-3 text-sm text-neutral-700">{t("artist.portal.signInPrompt")}</p>
              <Link
                href={ROUTES.login}
                className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-neutral-900 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                {t("auth.login.submit")}
              </Link>
            </section>
          ) : loading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-neutral-500 sm:mt-8">
              <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
              {t("artist.portal.loading")}
            </div>
          ) : (
            <>
              {forbidden ? <IssuerPortalOnboarding /> : null}

              {hasPortalAccess && data ? (
                <>
                  <div className="mt-4 grid gap-2.5 sm:mt-6 sm:grid-cols-2 lg:grid-cols-5 sm:gap-3">
                    {kpiConfig.map((kpi) => (
                      <div key={kpi.key} className={profileMutedCardClass}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">{kpi.label}</p>
                        <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-neutral-900 sm:text-2xl">
                          {"format" in kpi && kpi.format
                            ? kpi.format(data.summary[kpi.key])
                            : String(data.summary[kpi.key])}
                        </p>
                      </div>
                    ))}
                  </div>

                  {displayReleases.length > 0 ? (
                    <div className="mt-4 sm:mt-6">
                      <ReleaseCarousel
                        items={displayReleases}
                        activeSlide={activeSlide}
                        onSlideChange={setActiveSlide}
                        t={t}
                      />
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6">
                    <section className={cn(profileCardClass, "space-y-4")}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
                            {t("artist.portal.releases.title")}
                          </h2>
                          <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
                            {t("artist.portal.releases.subtitle")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={load}
                          className="inline-flex size-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
                          aria-label={t("artist.portal.releases.refreshAria")}
                        >
                          <RefreshCw className="size-4" />
                        </button>
                      </div>

                      {releases.length === 0 ? (
                        <p className="rounded-2xl bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
                          {t("artist.portal.releases.empty")}
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {releases.map((r, i) => {
                            const display = enrichRelease(r, catalogPool);
                            const statusText = t(`artist.portal.status.${r.status}`, r.status);
                            const roundText = r.roundStatus
                              ? t(`artist.portal.round.${r.roundStatus}`, r.roundStatus)
                              : "";
                            return (
                              <li
                                key={r.id}
                                className="artist-release-row flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-3"
                                style={{ animationDelay: `${i * 60}ms` }}
                              >
                                <ReleaseCover coverUrl={display.coverUrl} title={display.title} />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-neutral-900">{r.title}</p>
                                  <p className="mt-0.5 text-xs text-neutral-500">
                                    {r.symbol} · {statusText}
                                    {roundText ? ` · ${roundText}` : ""}
                                  </p>
                                </div>
                                <Link
                                  href={releaseHref(display)}
                                  className="shrink-0 text-xs font-semibold text-neutral-800 underline-offset-2 hover:underline"
                                >
                                  {t("artist.portal.releases.open")}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>

                    <section className={cn(profileCardClass, "space-y-5")}>
                      <div>
                        <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
                          {t("artist.portal.pulse.title")}
                        </h2>
                        <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
                          {t("artist.portal.pulse.subtitle")}
                        </p>
                      </div>
                      <PortalFlowScene summary={data.summary} t={t} />

                      <div className="rounded-2xl bg-neutral-50 p-4">
                        <p className="text-xs font-semibold text-neutral-800">{t("artist.portal.quickActions.title")}</p>
                        <div className="mt-3 flex flex-col gap-2">
                          <Link
                            href={ROUTES.dashboardDocuments}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.12)] transition hover:bg-neutral-50"
                          >
                            <FileText className="size-4 text-neutral-500" aria-hidden />
                            {t("artist.portal.quickActions.documents")}
                          </Link>
                          <Link
                            href={ROUTES.dashboardSupport}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.12)] transition hover:bg-neutral-50"
                          >
                            <Mic2 className="size-4 text-neutral-500" aria-hidden />
                            {t("artist.portal.quickActions.newRelease")}
                          </Link>
                          <Link
                            href={ROUTES.dashboardStatements}
                            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#F5F5F5] text-sm font-semibold text-neutral-900 transition hover:bg-[#EBEBEB]"
                          >
                            {t("artist.portal.quickActions.statements")}
                          </Link>
                        </div>
                      </div>
                    </section>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
