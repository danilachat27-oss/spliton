"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { BarChart3, Check, FileStack, Layers3 } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { IssuerApplicationModal } from "@/components/dashboard/artist/issuer-application-modal";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

import "./artist-page.css";

const ISSUER_HERO_IMAGE = "/images/issuer/portal-hero.png";
const ISSUER_PROCESS_BG = "/images/%27vbntn/2.png";

const FEATURE_CONFIG = [
  { id: "analytics", icon: BarChart3 },
  { id: "documents", icon: FileStack },
  { id: "releases", icon: Layers3 },
] as const;

const FEATURE_I18N_ID: Record<(typeof FEATURE_CONFIG)[number]["id"], string> = {
  analytics: "analytics",
  documents: "documents",
  releases: "management",
};

const STEP_NUMBERS = ["01", "02", "03"] as const;

function IssuerProcessCursor({ step, hint }: { step: 1 | 2 | 3; hint: string }) {
  return (
    <div className="pointer-events-none absolute right-3 top-3 z-20 sm:right-4 sm:top-4" aria-hidden>
      <div className={cn("issuer-process-cursor relative", `issuer-process-cursor--${step}`)}>
        <svg width="18" height="20" viewBox="0 0 14 16" className="drop-shadow-md">
          <path
            d="M1 1L1 13.5L4.2 10.3L6.5 15.5L8.2 14.7L5.9 9.5L10.5 9.5L1 1Z"
            fill="white"
            stroke="#111"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className={cn(
            "issuer-process-ring absolute left-2 top-2 size-3.5 rounded-full border-2 border-[#B7F500]/90",
            `issuer-process-ring--${step}`,
          )}
        />
        <span
          className={cn(
            "issuer-process-tip absolute left-5 top-4 max-w-[9rem] rounded-lg bg-neutral-900 px-2 py-1 text-[10px] font-medium leading-tight text-white shadow-lg",
            `issuer-process-tip--${step}`,
          )}
        >
          {hint}
        </span>
      </div>
    </div>
  );
}

export function IssuerPortalOnboarding() {
  const { t } = useI18n();
  const [applyOpen, setApplyOpen] = React.useState(false);

  const steps = React.useMemo(
    () =>
      STEP_NUMBERS.map((number, index) => {
        const stepId = (index + 1) as 1 | 2 | 3;
        return {
          number,
          stepId,
          title: t(`artist.onboarding.process.step${stepId}.title`),
          description: t(`artist.onboarding.process.step${stepId}.description`),
          hint: t(`artist.onboarding.process.step${stepId}.hint`),
        };
      }),
    [t],
  );

  return (
    <>
      <div className="mt-6 space-y-4 overflow-visible sm:mt-8 sm:space-y-6">
        <div className="issuer-hero-card relative overflow-visible">
          <div className="issuer-hero-aurora pointer-events-none absolute" aria-hidden>
            <span className="issuer-hero-aurora__halo" />
          </div>

          <section className="issuer-hero-panel relative z-[1] overflow-hidden rounded-[28px] bg-white">
            <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-stretch">
              <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
                <Image
                  src="/images/LOGO/mini-logo.png"
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 rounded-xl object-contain"
                  unoptimized
                />

                <h2 className="mt-5 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                  {t("artist.onboarding.hero.title")}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
                  {t("artist.onboarding.hero.description")}
                </p>

                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => setApplyOpen(true)}
                    className="issuer-cta-primary inline-flex h-11 items-center justify-center rounded-xl bg-black px-6 text-sm font-semibold text-white transition hover:bg-[#1a1a1a]"
                  >
                    {t("artist.onboarding.hero.applyCta")}
                  </button>
                  <Link
                    href={ROUTES.guideSelection}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#F5F5F5] px-6 text-sm font-semibold text-neutral-900 transition hover:bg-[#EBEBEB]"
                  >
                    {t("artist.onboarding.hero.howItWorks")}
                  </Link>
                </div>

                <div className="mt-8 grid gap-5 sm:grid-cols-3 sm:gap-4">
                  {FEATURE_CONFIG.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div key={feature.id} className="min-w-0">
                        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-[#F5F5F5]">
                          <Icon className="size-4 text-neutral-900" aria-hidden />
                        </span>
                        <p className="mt-2.5 text-sm font-semibold text-neutral-900">
                          {t(`artist.onboarding.features.${FEATURE_I18N_ID[feature.id]}.title`)}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                          {t(`artist.onboarding.features.${FEATURE_I18N_ID[feature.id]}.description`)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative flex min-h-[260px] items-end justify-center overflow-hidden bg-[linear-gradient(180deg,#fafafa_0%,#f3f4f6_100%)] px-4 pb-0 pt-8 sm:min-h-[320px] lg:min-h-full lg:pt-10">
                <Image
                  src={ISSUER_HERO_IMAGE}
                  alt=""
                  width={640}
                  height={520}
                  className="relative z-[1] h-auto w-full max-w-[520px] object-contain object-bottom lg:max-w-none lg:scale-[1.02] lg:origin-bottom"
                  priority
                  unoptimized
                />
              </div>
            </div>
          </section>
        </div>

        <section
          className="issuer-process-section relative overflow-hidden rounded-[28px]"
          aria-labelledby="issuer-process-title"
        >
          <div className="pointer-events-none absolute -inset-[5%] overflow-hidden" aria-hidden>
            <div className="issuer-process-bg relative h-full w-full">
              <Image
                src={ISSUER_PROCESS_BG}
                alt=""
                fill
                className="object-cover object-center"
                sizes="(max-width: 1200px) 100vw, 1200px"
                unoptimized
              />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-black/58" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(255,255,255,0.1),transparent_55%)]"
            aria-hidden
          />

          <div className="relative z-[1] px-6 py-7 sm:px-8 sm:py-9">
            <div className="max-w-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                {t("artist.onboarding.process.kicker")}
              </p>
              <h2 id="issuer-process-title" className="mt-1.5 text-lg font-semibold tracking-tight text-white sm:text-xl">
                {t("artist.onboarding.process.title")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                {t("artist.onboarding.process.subtitle")}
              </p>
            </div>

            <div className="relative mt-7 sm:mt-8">
              <div className="issuer-process-track relative h-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
                <span className="issuer-process-track-fill absolute inset-y-0 left-0 rounded-full bg-[#B7F500] shadow-[0_0_12px_rgba(183,245,0,0.55)]" />
              </div>

              <ol className="relative mt-5 grid gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
                {steps.map((step) => (
                  <li key={step.number}>
                    <article
                      className={cn(
                        "issuer-process-card relative rounded-2xl px-4 py-4 sm:px-5 sm:py-5",
                        `issuer-process-card--${step.stepId}`,
                      )}
                    >
                      <IssuerProcessCursor step={step.stepId} hint={step.hint} />

                      <span
                        className={cn(
                          "issuer-process-check pointer-events-none absolute right-3 top-3 inline-flex size-7 items-center justify-center rounded-full bg-emerald-500/15 sm:right-4 sm:top-4",
                          `issuer-process-check--${step.stepId}`,
                        )}
                        aria-hidden
                      >
                        <Check className="size-3.5 stroke-[3] text-emerald-300" />
                      </span>

                      {step.stepId === 2 ? (
                        <span
                          className="issuer-process-spinner pointer-events-none absolute right-3 top-3 inline-flex size-7 items-center justify-center rounded-full bg-white/10 sm:right-4 sm:top-4"
                          aria-hidden
                        >
                          <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
                        </span>
                      ) : null}

                      <p
                        className={cn(
                          "issuer-process-number font-mono text-2xl font-semibold tabular-nums",
                          `issuer-process-number--${step.stepId}`,
                        )}
                      >
                        {step.number}
                      </p>
                      <h3
                        className={cn(
                          "issuer-process-title mt-3 text-sm font-semibold",
                          `issuer-process-title--${step.stepId}`,
                        )}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={cn(
                          "issuer-process-text mt-1.5 text-xs leading-relaxed sm:text-[13px]",
                          `issuer-process-text--${step.stepId}`,
                        )}
                      >
                        {step.description}
                      </p>
                    </article>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </div>

      <IssuerApplicationModal open={applyOpen} onOpenChange={setApplyOpen} />
    </>
  );
}
