"use client";

import Link from "next/link";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useI18n } from "@/components/providers/i18n-provider";
import { secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import { ROUTES } from "@/constants/routes";

export type NotFoundVariant =
  | "default"
  | "analyticsRelease"
  | "catalogRelease"
  | "secondaryListing";

type LocalizedNotFoundScreenProps = {
  variant?: NotFoundVariant;
  showHeader?: boolean;
};

export function LocalizedNotFoundScreen({
  variant = "default",
  showHeader = false,
}: LocalizedNotFoundScreenProps) {
  const { t } = useI18n();

  const title =
    variant === "catalogRelease"
      ? t("notFound.catalogRelease.title")
      : variant === "secondaryListing"
        ? t("notFound.secondaryListing.title")
        : t("notFound.title");

  const description =
    variant === "analyticsRelease"
      ? t("notFound.analyticsRelease.description")
      : variant === "catalogRelease"
        ? t("notFound.catalogRelease.description")
        : variant === "secondaryListing"
          ? t("notFound.secondaryListing.description")
          : t("notFound.description");

  const primaryHref =
    variant === "analyticsRelease"
      ? ROUTES.analyticsReleases
      : variant === "catalogRelease"
        ? ROUTES.catalogMarketOverview
        : variant === "secondaryListing"
          ? secondaryMarketHref("market")
          : ROUTES.dashboard;

  const primaryLabel =
    variant === "analyticsRelease"
      ? t("notFound.analyticsRelease.cta")
      : variant === "catalogRelease"
        ? t("notFound.catalogRelease.cta")
        : variant === "secondaryListing"
          ? t("notFound.secondaryListing.cta")
          : t("notFound.goHome");

  const shellClass =
    variant === "default"
      ? "flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-12 text-center"
      : variant === "secondaryListing"
        ? "mx-auto flex w-full max-w-lg flex-col items-center justify-center px-4 py-8 text-center"
        : "flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center";

  const content = (
    <div className={shellClass}>
      {variant === "secondaryListing" ? (
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
          {t("notFound.secondaryListing.eyebrow")}
        </p>
      ) : null}
      {variant !== "analyticsRelease" ? (
        <h1
          className={
            variant === "secondaryListing"
              ? "mt-3 text-xl font-semibold tracking-tight text-white"
              : variant === "catalogRelease"
                ? "text-center text-2xl font-semibold tracking-tight text-white md:text-3xl"
                : "text-xl font-semibold text-neutral-900"
          }
        >
          {title}
        </h1>
      ) : (
        <p className="text-sm text-zinc-500">{description}</p>
      )}
      {variant !== "analyticsRelease" ? (
        <p
          className={
            variant === "default"
              ? "max-w-md text-sm text-neutral-600"
              : "max-w-md text-sm leading-relaxed text-zinc-500 md:text-[15px]"
          }
        >
          {description}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={primaryHref}
          className={
            variant === "secondaryListing"
              ? "mx-auto mt-8 inline-flex h-10 items-center justify-center rounded-full bg-white px-6 text-xs font-semibold text-black hover:opacity-90"
              : variant === "analyticsRelease"
                ? "text-sm font-medium text-lime-400/90 underline-offset-4 hover:underline"
                : variant === "catalogRelease"
                  ? "rounded-md bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-zinc-200 ring-1 ring-white/8 transition-colors hover:bg-white/[0.04] hover:text-white"
                  : "text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
          }
        >
          {primaryLabel}
        </Link>
        {variant === "default" ? (
          <Link
            href={ROUTES.dashboardCatalog}
            className="text-sm font-medium text-neutral-600 underline-offset-4 hover:underline"
          >
            {t("notFound.goCatalog")}
          </Link>
        ) : null}
      </div>
    </div>
  );

  if (!showHeader) {
    return content;
  }

  const isDark = variant !== "default";

  return (
    <div
      className={
        isDark
          ? "flex h-dvh min-h-0 flex-col overflow-hidden bg-black text-white"
          : "flex min-h-dvh flex-col"
      }
    >
      {showHeader ? (
        <div className={isDark ? "sticky top-0 z-120 shrink-0 bg-black" : undefined}>
          <DashboardHeader sticky={isDark} />
        </div>
      ) : null}
      {variant === "catalogRelease" ? (
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain" data-mobile-scroll-root>
          {content}
        </div>
      ) : variant === "secondaryListing" ? (
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-x-hidden overflow-y-auto overscroll-y-contain">
          {content}
        </main>
      ) : (
        content
      )}
    </div>
  );
}
