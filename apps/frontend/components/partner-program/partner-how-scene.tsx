"use client";

import "./partner-how-scene.css";

import { Check, FileText, Link2, Send, Shield } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";
import { useMemo } from "react";

import { PartnerLogoMark, PartnerSurface } from "@/components/partner-program/partner-surface";
import { useI18n } from "@/components/providers/i18n-provider";
import { partnerHowSteps } from "@/constants/partner-program-mock";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "apply" as const, step: partnerHowSteps[0]! },
  { id: "review" as const, step: partnerHowSteps[1]! },
  { id: "onboard" as const, step: partnerHowSteps[2]! },
];

function MiniChrome() {
  const { t } = useI18n();
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 bg-black/40 px-3 backdrop-blur-sm">
      <span className="size-2 rounded-full bg-red-400/90" aria-hidden />
      <span className="size-2 rounded-full bg-amber-400/90" aria-hidden />
      <span className="size-2 rounded-full bg-emerald-400/90" aria-hidden />
      <span className="ml-1 truncate text-[10px] font-medium text-zinc-400">{t("partner.how.chrome")}</span>
      <span className="partner-how-live-dot ml-auto size-1.5 rounded-full bg-[#B7F500]" aria-hidden />
    </div>
  );
}

function SceneToast({
  step,
  title,
  subtitle,
  tone = "lime",
}: {
  step: "apply" | "review" | "onboard";
  title: string;
  subtitle: string;
  tone?: "lime" | "amber" | "emerald";
}) {
  const toneCls =
    tone === "emerald"
      ? "bg-emerald-500/10"
      : tone === "amber"
        ? "bg-amber-500/10"
        : "bg-[#B7F500]/10";

  return (
    <div
      className={cn(
        "partner-how-toast partner-how-toast--" + step,
        "pointer-events-none absolute right-3 top-3 z-20 flex items-start gap-2 rounded-xl px-3 py-2 shadow-lg sm:right-4",
        toneCls,
      )}
      aria-hidden
    >
      <span className="mt-0.5 size-2 shrink-0 rounded-full bg-[#B7F500]" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-white">{title}</p>
        <p className="text-[9px] leading-snug text-zinc-400">{subtitle}</p>
      </div>
    </div>
  );
}

function ApplyPanel() {
  const { t } = useI18n();

  return (
    <div className="partner-how-panel--apply absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="apply"
        title={t("partner.how.toast.apply.title")}
        subtitle={t("partner.how.toast.apply.subtitle")}
      />

      <div className="flex items-center gap-2">
        <PartnerLogoMark size="sm" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{t("partner.how.panel.cabinet")}</p>
      </div>
      <p className="mt-1 text-sm font-semibold text-white">{t("partner.how.panel.applyTitle")}</p>

      <div className="mt-3 space-y-2 rounded-xl bg-black/35 p-3">
        <div className="rounded-lg bg-black/40 px-3 py-2">
          <p className="text-[9px] text-zinc-500">{t("partner.how.panel.type")}</p>
          <p className="text-xs font-medium text-zinc-200">{t("partner.how.panel.typeValue")}</p>
        </div>
        <div className="rounded-lg bg-black/40 px-3 py-2">
          <p className="text-[9px] text-zinc-500">{t("partner.how.panel.audience")}</p>
          <p className="text-xs text-zinc-300">{t("partner.how.panel.audienceValue")}</p>
        </div>
        <div className="rounded-lg bg-black/40 px-3 py-2">
          <p className="text-[9px] text-zinc-500">{t("partner.how.panel.payouts")}</p>
          <p className="font-mono text-xs text-zinc-300">{t("partner.how.panel.payoutsValue")}</p>
        </div>
      </div>

      <button
        type="button"
        className="partner-how-submit mt-auto inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#B7F500] text-xs font-semibold text-black"
      >
        <Send className="size-3.5" aria-hidden />
        {t("partner.how.panel.submit")}
      </button>
    </div>
  );
}

function ReviewPanel() {
  const { t } = useI18n();
  const rows = useMemo(
    () =>
      [
        { id: 1, label: t("partner.how.panel.check.values"), ok: true },
        { id: 2, label: t("partner.how.panel.check.legal"), ok: true },
        { id: 3, label: t("partner.how.panel.check.audience"), ok: false },
      ] as const,
    [t],
  );

  return (
    <div className="partner-how-panel--review absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="review"
        title={t("partner.how.toast.review.title")}
        subtitle={t("partner.how.toast.review.subtitle")}
        tone="amber"
      />
      <div className="partner-how-spinner partner-how-spinner--review absolute left-4 top-14 flex items-center gap-2 rounded-xl bg-black/50 px-3 py-2 sm:left-6">
        <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
        <span className="text-[10px] text-zinc-300">{t("partner.how.panel.reviewing")}</span>
      </div>

      <div className="flex items-center gap-2">
        <Shield className="size-4 text-[#B7F500]" aria-hidden />
        <p className="text-sm font-semibold text-white">{t("partner.how.panel.reviewTitle")}</p>
      </div>
      <p className="mt-1 text-[10px] text-zinc-500">{t("partner.how.panel.reviewSubtitle")}</p>

      <ul className="mt-3 space-y-1.5">
        {rows.map((row) => (
          <li
            key={row.id}
            className={cn(
              "partner-how-check-row partner-how-check-row--" + row.id,
              "flex items-center justify-between gap-2 rounded-xl bg-black/30 px-3 py-2.5",
            )}
          >
            <span className="text-xs text-zinc-300">{row.label}</span>
            {row.ok ? (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Check className="size-3" strokeWidth={3} />
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold text-amber-200">
                {t("partner.how.panel.inProgress")}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-center text-[10px] font-medium text-amber-100">
        {t("partner.how.panel.statusReview")}
      </div>
    </div>
  );
}

function OnboardPanel() {
  const { t } = useI18n();
  const kitItems = useMemo(
    () =>
      [
        { id: 1, label: t("partner.how.panel.kit.mediakit"), icon: FileText },
        { id: 2, label: t("partner.how.panel.kit.terms"), icon: Shield },
        { id: 3, label: t("partner.how.panel.kit.analytics"), icon: Check },
      ] as const,
    [t],
  );

  return (
    <div className="partner-how-panel--onboard absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="onboard"
        title={t("partner.how.toast.onboard.title")}
        subtitle={t("partner.how.toast.onboard.subtitle")}
        tone="emerald"
      />

      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{t("partner.how.panel.onboard.kicker")}</p>
      <p className="mt-1 text-sm font-semibold text-white">{t("partner.how.panel.onboard.title")}</p>

      <div className="partner-how-link-box mt-3 rounded-xl bg-black/35 px-3 py-3">
        <p className="text-[9px] text-zinc-500">{t("partner.how.panel.partnerLink")}</p>
        <p className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-[#d4f570]">
          <Link2 className="size-3 shrink-0" aria-hidden />
          spliton.io/r/partner-7f2a
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {kitItems.map(({ id, label, icon: Icon }) => (
          <div
            key={id}
            className={cn(
              "partner-how-kit-item partner-how-kit-item--" + id,
              "flex flex-col items-center gap-1 rounded-xl bg-black/30 px-2 py-2.5",
            )}
          >
            <Icon className="size-3.5 text-zinc-400" aria-hidden />
            <span className="text-[9px] font-medium text-zinc-300">{label}</span>
          </div>
        ))}
      </div>

      <p className="mt-auto text-center text-[10px] text-zinc-500">{t("partner.how.panel.onboard.footer")}</p>
    </div>
  );
}

export function PartnerHowScene() {
  const { t } = useI18n();

  return (
    <section aria-labelledby="how-work-title">
      <PartnerSurface
        className="partner-how-scene"
        innerClassName="space-y-8 p-6 sm:p-8"
        imageOpacity="opacity-45"
        overlayClassName="bg-black/62"
      >
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">{t("partner.how.kicker")}</p>
          <h2 id="how-work-title" className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {t("partner.how.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">{t("partner.how.subtitle")}</p>
        </div>

        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-black/45 backdrop-blur-[2px] sm:rounded-3xl">
          <MiniChrome />
          <div className="relative isolate aspect-[16/11] min-h-[280px] overflow-hidden bg-black/35 sm:min-h-[320px]">
            <ApplyPanel />
            <ReviewPanel />
            <OnboardPanel />
          </div>
          <div className="h-1 bg-black/50">
            <div className="partner-how-progress h-full bg-[#B7F500]" />
          </div>
        </div>

        <div className="relative mx-auto max-w-3xl rounded-3xl bg-black/45 px-4 py-6 backdrop-blur-[1px] sm:px-8 sm:py-7">
          <div className="pointer-events-none absolute left-12 right-12 top-[1.65rem] hidden h-px bg-white/8 sm:block" aria-hidden />
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {STEPS.map((item, i) => (
              <div key={item.id} className="flex flex-col items-center text-center">
                <span className={cn("partner-how-step-label--" + item.id, "relative min-h-8 text-xs sm:text-sm")}>
                  <span className="relative inline-block pb-1">
                    {item.step.title}
                    <span
                      className={cn(
                        "partner-how-underline--" + item.id,
                        "absolute inset-x-0 -bottom-0.5 h-0.5 origin-left bg-[#B7F500]",
                      )}
                      aria-hidden
                    />
                  </span>
                </span>
                <div
                  className={cn(
                    "partner-how-dot partner-how-dot--" + item.id,
                    "mt-2 flex size-8 items-center justify-center rounded-full bg-white/8 text-[11px] font-bold text-zinc-400 sm:size-9",
                  )}
                >
                  {i + 1}
                </div>
              </div>
            ))}
          </div>

          <div className="relative mx-auto mt-8 min-h-[7rem] max-w-2xl text-center sm:min-h-[6.5rem]">
            {STEPS.map((item, i) => (
              <div
                key={item.id}
                className={cn("partner-how-detail--" + item.id, "absolute inset-x-0 top-0 px-2")}
                aria-hidden={i !== 0}
              >
                <p className="font-mono text-xs text-zinc-500">0{i + 1}</p>
                <h3 className="mt-2 text-lg font-semibold text-white sm:text-xl">{item.step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </PartnerSurface>
    </section>
  );
}
