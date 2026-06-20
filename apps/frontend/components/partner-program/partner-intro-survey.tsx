"use client";

import { ChevronLeft, X } from "@/lib/lucide";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import type { PartnerType } from "@/services/partners.service";
import { cn } from "@/lib/utils";

export type PartnerSurveyAnswers = {
  incomeModel: string;
  partnershipFormat: string;
  mainChannel: string;
};

export const PARTNER_SURVEY_STORAGE_KEY = "spliton-partner-survey-v1";

export function partnerTypeFromSurvey(answers: PartnerSurveyAnswers): PartnerType {
  if (answers.partnershipFormat === "strategic") {
    return "STRATEGIC_PARTNER";
  }
  if (answers.mainChannel === "business") {
    return answers.partnershipFormat === "affiliate" ? "AGENCY" : "STRATEGIC_PARTNER";
  }
  if (answers.partnershipFormat === "community" || answers.mainChannel === "media") {
    return "INFLUENCER";
  }
  return "AFFILIATE";
}

export function surveyAnswersToNote(answers: PartnerSurveyAnswers, t: (key: string) => string): string {
  const income = t(`partner.survey.q1.${answers.incomeModel}`);
  const format = t(`partner.survey.q2.${answers.partnershipFormat}`);
  const channel = t(`partner.survey.q3.${answers.mainChannel}`);

  return [`• ${income}`, `• ${format}`, `• ${channel}`].join("\n");
}

export function readStoredSurveyAnswers(): PartnerSurveyAnswers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PARTNER_SURVEY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PartnerSurveyAnswers;
    if (parsed.incomeModel && parsed.partnershipFormat && parsed.mainChannel) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function storeSurveyAnswers(answers: PartnerSurveyAnswers): void {
  sessionStorage.setItem(PARTNER_SURVEY_STORAGE_KEY, JSON.stringify(answers));
}

type PartnerIntroSurveyProps = {
  onComplete: (answers: PartnerSurveyAnswers) => void;
  onDismiss?: () => void;
  variant?: "inline" | "modal";
  open?: boolean;
};

export function PartnerIntroSurvey({
  onComplete,
  onDismiss,
  variant = "inline",
  open = true,
}: PartnerIntroSurveyProps) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<PartnerSurveyAnswers>>({});

  const surveySteps = useMemo(
    () =>
      [
        {
          id: "incomeModel" as const,
          question: t("partner.survey.q1"),
          options: [
            { value: "registrations", label: t("partner.survey.q1.registrations") },
            { value: "activity", label: t("partner.survey.q1.activity") },
            { value: "campaigns", label: t("partner.survey.q1.campaigns") },
          ],
        },
        {
          id: "partnershipFormat" as const,
          question: t("partner.survey.q2"),
          options: [
            { value: "affiliate", label: t("partner.survey.q2.affiliate") },
            { value: "community", label: t("partner.survey.q2.community") },
            { value: "strategic", label: t("partner.survey.q2.strategic") },
          ],
        },
        {
          id: "mainChannel" as const,
          question: t("partner.survey.q3"),
          options: [
            { value: "social", label: t("partner.survey.q3.social") },
            { value: "media", label: t("partner.survey.q3.media") },
            { value: "business", label: t("partner.survey.q3.business") },
          ],
        },
      ] as const,
    [t],
  );

  const current = surveySteps[step]!;
  const selected = answers[current.id];
  const totalSteps = surveySteps.length;

  const selectOption = useCallback(
    (value: string) => {
      setAnswers((prev) => ({ ...prev, [current.id]: value }));
    },
    [current.id],
  );

  const goNext = useCallback(() => {
    if (!selected) return;
    const nextAnswers = { ...answers, [current.id]: selected };
    if (step >= totalSteps - 1) {
      const finalAnswers = nextAnswers as PartnerSurveyAnswers;
      storeSurveyAnswers(finalAnswers);
      onComplete(finalAnswers);
      return;
    }
    setAnswers(nextAnswers);
    setStep((s) => s + 1);
  }, [answers, current.id, onComplete, selected, step, totalSteps]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  useEffect(() => {
    if (variant !== "modal" || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, variant]);

  if (variant === "modal" && !open) return null;

  const content = (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{t("partner.survey.title")}</h3>
            <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs font-medium tabular-nums text-zinc-300">
              {step + 1} / {totalSteps}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-zinc-500">{t("partner.survey.subtitle")}</p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="grid size-9 shrink-0 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label={t("partner.application.close")}
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      <p className="mt-6 text-base font-medium leading-snug text-white sm:text-[17px]">{current.question}</p>

      <ul className="mt-5 space-y-2.5" role="radiogroup" aria-label={current.question}>
        {current.options.map((option) => {
          const on = selected === option.value;
          return (
            <li key={option.value}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => selectOption(option.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3.5 text-left transition-colors",
                  on ? "bg-black/55" : "bg-black/35 hover:bg-black/45",
                )}
              >
                <span className="text-sm leading-relaxed text-zinc-100">{option.label}</span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full ring-2 transition-colors",
                    on ? "bg-[#B7F500] ring-[#B7F500]" : "ring-zinc-600",
                  )}
                  aria-hidden
                >
                  {on ? <span className="size-2 rounded-full bg-black" /> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center justify-between gap-3 pt-5">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-zinc-200"
          >
            <ChevronLeft className="size-4" aria-hidden />
            {t("partner.survey.back")}
          </button>
        ) : (
          <span aria-hidden />
        )}
        <button
          type="button"
          disabled={!selected}
          onClick={goNext}
          className={cn(
            "ml-auto inline-flex h-10 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors",
            selected ? "bg-white text-black hover:bg-zinc-200" : "cursor-not-allowed bg-zinc-800 text-zinc-500",
          )}
        >
          {step >= totalSteps - 1 ? t("partner.survey.toApplication") : t("partner.survey.next")}
        </button>
      </div>
    </div>
  );

  if (variant === "modal") {
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm sm:px-6"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onDismiss?.();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="partner-survey-title"
          className="w-full max-w-lg rounded-2xl bg-[#141414] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:p-7"
        >
          {content}
        </div>
      </div>
    );
  }

  return content;
}
