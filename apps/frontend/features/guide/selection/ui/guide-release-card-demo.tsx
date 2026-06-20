"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { CatalogTrackCardChart } from "@/components/dashboard/catalog-track-card-chart";
import { useI18n } from "@/components/providers/i18n-provider";
import { GUIDE_RELEASE_CARD_STEP_IDS, type GuideReleaseCardStepId } from "@/constants/guide/selection";
import { cn } from "@/lib/utils";

import "./guide-release-card.css";

const COVER_SRC = "/images/hero-journey/1.webp";
const SPARK_VALUES = [28, 32, 30, 36, 34, 38, 35, 40, 37, 42, 39, 44, 41, 46];

function AnnotatedBlock({
  stepId,
  index,
  activeStep,
  className,
  children,
}: {
  stepId: GuideReleaseCardStepId;
  index: number;
  activeStep: GuideReleaseCardStepId;
  className?: string;
  children: ReactNode;
}) {
  const isActive = activeStep === stepId;
  return (
    <div className={cn("guide-rc-block guide-rc-block-pad", isActive && "is-active", className)}>
      <span className="guide-rc-num" aria-hidden>
        {index}
      </span>
      {children}
    </div>
  );
}

export function GuideReleaseCardDemo({ activeStep }: { activeStep: GuideReleaseCardStepId }) {
  const { t } = useI18n();
  const stepIndex = (id: GuideReleaseCardStepId) => GUIDE_RELEASE_CARD_STEP_IDS.indexOf(id) + 1;

  return (
    <article className="guide-rc-card font-mono text-[13px] tabular-nums tracking-tight">
      <div className="guide-rc-cover">
        <Image
          src={COVER_SRC}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 420px"
          priority
        />
      </div>

      <div className="guide-rc-body">
        <AnnotatedBlock stepId="status" index={stepIndex("status")} activeStep={activeStep}>
          <div className="flex items-center justify-between gap-3 pb-0.5">
            <span className="truncate font-sans text-[11px] font-medium tracking-tight text-zinc-200">
              {t("guide.releaseCard.demo.stripLabel")}
            </span>
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-zinc-100">
              {t("guide.releaseCard.demo.stripHint")}
            </span>
          </div>
        </AnnotatedBlock>

        <div>
          <h3 className="truncate font-sans text-lg font-semibold tracking-tight text-white sm:text-xl">
            {t("guide.releaseCard.demo.title")}
          </h3>
          <p className="truncate text-sm text-zinc-500">{t("guide.releaseCard.demo.artist")}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            {t("guide.releaseCard.demo.genre")}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <span className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[#B7F500] px-5 text-[12px] font-semibold text-black sm:w-auto">
            {t("catalog.cards.buyUnits")}
          </span>
          <span className="inline-flex h-10 w-full items-center justify-center rounded-full bg-white px-5 text-[12px] font-semibold text-black sm:w-auto">
            {t("catalog.cards.details")}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:items-end">
          <AnnotatedBlock stepId="yield" index={stepIndex("yield")} activeStep={activeStep} className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {t("catalog.cards.yieldLabel")}
            </p>
            <p className="mt-1 font-bold leading-none tabular-nums text-2xl text-zinc-100 sm:text-[2rem]">
              {t("guide.releaseCard.demo.yield")}
            </p>
          </AnnotatedBlock>
          <div className="guide-rc-spark" aria-hidden>
            <CatalogTrackCardChart values={SPARK_VALUES} trend="up" height={56} />
          </div>
        </div>

        <AnnotatedBlock stepId="progress" index={stepIndex("progress")} activeStep={activeStep}>
          <p className="text-xs text-zinc-500">
            {t("catalog.cards.collected")}{" "}
            <span className="font-semibold tabular-nums text-zinc-300">{t("guide.releaseCard.demo.collected")}</span>
            <span className="text-zinc-600"> {t("catalog.cards.usdtSuffix")}</span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-zinc-300" style={{ width: "65%" }} />
          </div>
        </AnnotatedBlock>

        <div className="grid grid-cols-1 gap-y-2 pt-1 text-[12px] text-zinc-500 sm:grid-cols-2 sm:gap-x-4">
          <AnnotatedBlock stepId="price" index={stepIndex("price")} activeStep={activeStep}>
            <div className="flex justify-between gap-2 sm:block">
              <span>{t("catalog.cards.unitPrice")}</span>
              <span className="font-semibold tabular-nums text-zinc-200 sm:mt-0.5 sm:block">
                {t("guide.releaseCard.demo.unitPrice")}
                <span className="font-normal text-zinc-500"> {t("catalog.cards.usdtSuffix")}</span>
              </span>
            </div>
          </AnnotatedBlock>
          <AnnotatedBlock stepId="liquidity" index={stepIndex("liquidity")} activeStep={activeStep}>
            <div className="flex justify-between gap-2 sm:block">
              <span>{t("catalog.cards.liquidity")}</span>
              <span className="font-semibold tabular-nums text-zinc-200 sm:mt-0.5 sm:block">
                {t("guide.releaseCard.demo.liquidity")}
              </span>
            </div>
          </AnnotatedBlock>
        </div>
      </div>
    </article>
  );
}

export function GuideReleaseCardSteps({
  activeStep,
  onStepSelect,
}: {
  activeStep: GuideReleaseCardStepId;
  onStepSelect: (step: GuideReleaseCardStepId) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="guide-release-card-steps" role="list">
      {GUIDE_RELEASE_CARD_STEP_IDS.map((stepId, index) => {
        const isActive = activeStep === stepId;
        return (
          <button
            key={stepId}
            type="button"
            role="listitem"
            aria-current={isActive ? "step" : undefined}
            onClick={() => onStepSelect(stepId)}
            className={cn("guide-release-card-step", isActive && "is-active")}
          >
            <span className="guide-release-card-step-num">{index + 1}</span>
            <span>
              <span className="guide-release-card-step-title">{t(`guide.releaseCard.step.${stepId}.title`)}</span>
              <p className="guide-release-card-step-body">{t(`guide.releaseCard.step.${stepId}.body`)}</p>
            </span>
          </button>
        );
      })}
    </div>
  );
}
