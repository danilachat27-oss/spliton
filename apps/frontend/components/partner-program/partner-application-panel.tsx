"use client";

import "./partner-application-panel.css";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, Check, Copy, Send, X } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { usePartnerApplyModal } from "@/components/partner-program/partner-apply-context";
import {
  PartnerIntroSurvey,
  partnerTypeFromSurvey,
  readStoredSurveyAnswers,
  surveyAnswersToNote,
  type PartnerSurveyAnswers,
} from "@/components/partner-program/partner-intro-survey";
import { PartnerLogoMark, PartnerSurface } from "@/components/partner-program/partner-surface";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { StyledSelectField } from "@/components/ui/styled-select";
import { ROUTES } from "@/constants/routes";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";
import {
  applyPartner,
  fetchPartnerMe,
  fetchPartnerPerformance,
  PARTNER_TYPE_OPTIONS,
  type PartnerMe,
  type PartnerPerformance,
  type PartnerType,
} from "@/services/partners.service";

const fieldClass =
  "partner-app-field h-11 w-full rounded-xl border-0 bg-black/40 px-3.5 text-sm text-white transition placeholder:text-zinc-500 focus:bg-black/55 focus:outline-none focus:ring-0";

const textareaClass =
  "partner-app-field min-h-[7.5rem] w-full resize-y rounded-xl border-0 bg-black/40 px-3.5 py-3 text-sm leading-relaxed text-white transition placeholder:text-zinc-500 focus:bg-black/55 focus:outline-none focus:ring-0";

const labelClass = "mb-1.5 block text-xs font-medium text-zinc-400";

function PartnerFormSteps({ active, t }: { active: 1 | 2 | 3; t: (key: string) => string }) {
  const steps = [
    { id: 1, label: t("partner.application.step.apply") },
    { id: 2, label: t("partner.application.step.review") },
    { id: 3, label: t("partner.application.step.access") },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-2">
      {steps.map((step) => {
        const done = active > step.id;
        const isActive = active === step.id;
        return (
          <div key={step.id} className="flex flex-col items-center gap-1.5 text-center">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-[11px] font-bold",
                done && "bg-white text-black",
                isActive && "bg-[#B7F500] text-black",
                !done && !isActive && "bg-white/[0.06] text-zinc-500",
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : step.id}
            </span>
            <span className="text-[10px] text-zinc-500">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const tone =
    status === "APPROVED"
      ? "bg-emerald-500/15 text-emerald-300"
      : status === "REJECTED" || status === "SUSPENDED"
        ? "bg-red-500/15 text-red-300"
        : "bg-amber-500/15 text-amber-200";

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold", tone)}>
      {t(`partner.status.${status}`) || status}
    </span>
  );
}

function applySurveyToForm(answers: PartnerSurveyAnswers, t: (key: string) => string) {
  return {
    partnerType: partnerTypeFromSurvey(answers),
    notePrefix: surveyAnswersToNote(answers, t),
  };
}

function PartnerCabinetHeader({
  status,
  onClose,
  t,
}: {
  status?: string;
  onClose?: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <PartnerLogoMark />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{t("partner.application.brand")}</p>
          <h2 id="partner-cabinet-modal-title" className="mt-0.5 text-lg font-semibold text-white sm:text-xl">
            {t("partner.application.cabinet.title")}
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-500">
            {t("partner.application.cabinet.subtitle")}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {status ? <StatusBadge status={status} t={t} /> : null}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label={t("partner.application.close")}
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PartnerApplicationModalBody({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { user, authorizedFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PartnerMe | null>(null);
  const [performance, setPerformance] = useState<PartnerPerformance | null>(null);
  const [partnerType, setPartnerType] = useState<PartnerType>("AFFILIATE");
  const [note, setNote] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [surveyDone, setSurveyDone] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState<PartnerSurveyAnswers | null>(null);

  useEffect(() => {
    const stored = readStoredSurveyAnswers();
    if (stored) {
      setSurveyDone(true);
      setSurveyAnswers(stored);
      const { partnerType: suggested, notePrefix } = applySurveyToForm(stored, t);
      setPartnerType(suggested);
      setNote(notePrefix);
    }
  }, [t]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const me = await fetchPartnerMe(authorizedFetch);
      setProfile(me);
      if (me && "status" in me && me.status === "APPROVED") {
        const perf = await fetchPartnerPerformance(authorizedFetch);
        setPerformance(perf);
      } else {
        setPerformance(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("partner.application.error.load"));
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, user, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSurveyComplete = useCallback(
    (answers: PartnerSurveyAnswers) => {
      setSurveyAnswers(answers);
      setSurveyDone(true);
      const { partnerType: suggested, notePrefix } = applySurveyToForm(answers, t);
      setPartnerType(suggested);
      setNote(notePrefix);
    },
    [t],
  );

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const next = await applyPartner(authorizedFetch, {
        partnerType,
        applicationNote: note.trim() || undefined,
        payoutMethod: payoutMethod.trim() || undefined,
      });
      setProfile(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("partner.application.error.submit"));
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-5">
        <PartnerCabinetHeader onClose={onClose} t={t} />
        <p className="text-sm leading-relaxed text-zinc-400">{t("partner.application.signInPrompt")}</p>
        <Link
          href={ROUTES.login}
          className={cn(buttonVariants({ size: "sm" }), "bg-white text-black hover:bg-zinc-200")}
        >
          {t("partner.application.signIn")}
        </Link>
      </div>
    );
  }

  const canApply = profile && "canApply" in profile ? profile.canApply : true;
  const hasProfile = profile && "status" in profile && profile.status;
  const formStep: 1 | 2 | 3 = hasProfile
    ? profile.status === "APPROVED"
      ? 3
      : 2
    : 1;
  const showSurvey = canApply && !hasProfile && !surveyDone;

  return (
    <div className="space-y-5">
      <PartnerCabinetHeader
        status={hasProfile && profile && "status" in profile ? String(profile.status) : undefined}
        onClose={onClose}
        t={t}
      />

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-zinc-400">
          <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
          {t("partner.application.loading")}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">{error}</p>
      ) : null}

      {showSurvey ? <PartnerIntroSurvey variant="inline" onComplete={onSurveyComplete} /> : null}

      {!showSurvey && hasProfile && profile && "status" in profile ? (
        <div className="space-y-5">
          <PartnerFormSteps active={formStep} t={t} />

          <div className="rounded-2xl bg-white/[0.04] px-4 py-4 sm:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {t("partner.application.status.title")}
            </p>
            <p className="mt-1.5 text-base font-semibold text-white">
              {profile.status ? t(`partner.status.${profile.status}`) || profile.status : "—"}
            </p>
            {profile.tier ? (
              <p className="mt-1 text-sm text-zinc-400">{tf(t("partner.application.tier"), { tier: profile.tier })}</p>
            ) : null}
            {profile.rejectedReason ? (
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{profile.rejectedReason}</p>
            ) : null}
          </div>

          {profile.status === "APPROVED" && profile.partnerLink ? (
            <div className="rounded-2xl bg-black/45 px-4 py-4 backdrop-blur-[1px] sm:px-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {t("partner.application.partnerLink")}
              </p>
              <p className="mt-2 break-all rounded-xl bg-black/35 px-3 py-2.5 font-mono text-xs text-zinc-200">
                {profile.partnerLink}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3 border-0 bg-white/[0.06] text-zinc-100 hover:bg-white/10"
                onClick={() => void copyLink(profile.partnerLink ?? "")}
              >
                {copied ? <Check className="mr-1.5 size-3.5" /> : <Copy className="mr-1.5 size-3.5" />}
                {copied ? t("partner.application.copied") : t("partner.application.copyLink")}
              </Button>
            </div>
          ) : null}

          {performance ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-black/45 px-4 py-4 backdrop-blur-[1px]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {t("partner.application.metric.invited")}
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold text-white">{performance.referral.invitedUsersCount}</p>
              </div>
              <div className="rounded-2xl bg-black/45 px-4 py-4 backdrop-blur-[1px]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {t("partner.application.metric.paid")}
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold text-white">{performance.totals.paidUsdt}</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!showSurvey && canApply && !hasProfile ? (
        <form
          className="partner-app-form space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <PartnerFormSteps active={1} t={t} />

          {surveyAnswers ? <p className="text-xs text-zinc-500">{t("partner.application.surveyDone")}</p> : null}

          <div className="space-y-4 rounded-2xl bg-black/45 p-4 backdrop-blur-[1px] sm:p-5">
            <StyledSelectField
              label={t("partner.application.type.label")}
              tone="dark"
              borderless
              className="gap-1.5 text-zinc-300 [&>span:first-child]:text-xs [&>span:first-child]:font-medium"
              value={partnerType}
              options={PARTNER_TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(`partner.type.${o.value}`) }))}
              onChange={(value) => setPartnerType(value as PartnerType)}
            />
            <p className="text-xs leading-relaxed text-zinc-500">{t(`partner.typeHint.${partnerType}`)}</p>

            <div>
              <label htmlFor="partner-note" className={labelClass}>
                {t("partner.application.note.label")}
              </label>
              <textarea
                id="partner-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className={textareaClass}
                placeholder={t("partner.application.note.placeholder")}
              />
            </div>

            <div>
              <label htmlFor="partner-payout" className={labelClass}>
                {t("partner.application.payout.label")}{" "}
                <span className="font-normal text-zinc-600">{t("partner.application.payout.optional")}</span>
              </label>
              <input
                id="partner-payout"
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className={fieldClass}
                placeholder={t("partner.application.payout.placeholder")}
              />
            </div>
          </div>

          <p className="rounded-xl bg-amber-500/8 px-3.5 py-2.5 text-xs leading-relaxed text-amber-100/90">
            {t("partner.application.disclaimer")}
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="partner-app-submit inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B7F500] px-6 text-sm font-semibold text-black transition hover:bg-[#c8ff3d] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
          >
            {submitting ? (
              <>
                <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
                {t("partner.application.submitting")}
              </>
            ) : (
              <>
                <Send className="size-4" aria-hidden />
                {t("partner.process.apply.submit")}
              </>
            )}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function PartnerApplicationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-cabinet-modal-title"
        className="flex max-h-[min(92vh,820px)] w-full max-w-xl flex-col overflow-hidden rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <PartnerSurface
          className="flex min-h-0 flex-1 flex-col rounded-3xl"
          innerClassName="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6"
          imageOpacity="opacity-40"
          overlayClassName="bg-black/72"
        >
          <PartnerApplicationModalBody onClose={onClose} />
        </PartnerSurface>
      </div>
    </div>,
    document.body,
  );
}

export function PartnerApplicationPanel() {
  const { t } = useI18n();
  const { openModal } = usePartnerApplyModal();

  return (
    <section id="partner-apply" className="scroll-mt-28">
      <PartnerSurface
        innerClassName="flex flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-8"
        imageOpacity="opacity-50"
        overlayClassName="bg-black/58"
      >
        <div className="flex min-w-0 items-start gap-3">
          <PartnerLogoMark />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              {t("partner.application.brand")}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-white sm:text-xl">{t("partner.application.cabinet.title")}</h2>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-zinc-300">{t("partner.application.panel.subtitle")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openModal}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-11 shrink-0 border-0 bg-[#B7F500] px-6 text-sm font-semibold text-black hover:bg-[#c8ff3d]",
          )}
        >
          {t("partner.process.apply.submit")}
          <ArrowRight className="ml-2 size-4" aria-hidden />
        </button>
      </PartnerSurface>
    </section>
  );
}

export function PartnerApplyModalHost() {
  const { open, closeModal } = usePartnerApplyModal();

  const handleClose = useCallback(() => {
    closeModal();
    if (typeof window !== "undefined" && window.location.hash === "#partner-apply") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [closeModal]);

  return <PartnerApplicationModal open={open} onClose={handleClose} />;
}
