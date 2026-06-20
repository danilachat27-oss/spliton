"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  Shield,
  XCircle,
} from "@/lib/lucide";

import { profileDashboardHref } from "@/constants/dashboard/profile-page";
import type { VerificationUiStatus } from "@/constants/dashboard/profile-verification";
import { ROUTES } from "@/constants/routes";
import { ProfileEligibilityRows } from "@/components/dashboard/profile/profile-eligibility-rows";
import { ProfileSectionSkeleton } from "@/components/dashboard/profile/profile-section-skeleton";
import { ProfileVerificationTimeline } from "@/components/dashboard/profile/profile-verification-timeline";
import {
  profileCardClass,
  profileMutedCardClass,
  profilePrimaryButtonClass,
} from "@/components/dashboard/profile/profile-ui";
import { useEligibilitySummary } from "@/hooks/use-eligibility-summary";
import { useKycStatus } from "@/hooks/use-kyc-status";
import { useI18n } from "@/components/providers/i18n-provider";
import { StyledSelect } from "@/components/ui/styled-select";
import { formatDate } from "@/lib/i18n/formatters";
import { mapEligibilityToAccess } from "@/lib/profile/eligibility-access";
import { mapKycStatusToUi } from "@/lib/kyc/kyc-status-adapter";
import { cn } from "@/lib/utils";

function statusMeta(status: VerificationUiStatus, t: (k: string) => string): {
  label: string;
  tone: string;
  description: string;
} {
  switch (status) {
    case "not_started":
      return {
        label: t("verification.status.notStarted"),
        tone: "bg-neutral-100 text-neutral-700",
        description: t("verification.status.notStartedDesc"),
      };
    case "in_progress":
      return {
        label: t("verification.status.inProgress"),
        tone: "bg-amber-50 text-amber-900",
        description: t("verification.status.inProgressDesc"),
      };
    case "pending_review":
      return {
        label: t("verification.status.pendingReview"),
        tone: "bg-blue-50 text-blue-900",
        description: t("verification.status.pendingReviewDesc"),
      };
    case "approved":
      return {
        label: t("verification.status.approved"),
        tone: "bg-lime-100/90 text-lime-950",
        description: t("verification.status.approvedDesc"),
      };
    case "rejected":
      return {
        label: t("verification.status.rejected"),
        tone: "bg-red-50 text-red-900",
        description: t("verification.status.rejectedDesc"),
      };
  }
}

export function ProfileVerificationLiveContent() {
  const { t, locale } = useI18n();
  const { data, loading, error, submitting, reload, start, submitManual } = useKycStatus();
  const {
    data: eligibility,
    loading: eligibilityLoading,
    error: eligibilityError,
  } = useEligibilitySummary();

  const [countryCode, setCountryCode] = useState("RU");
  const [documentType, setDocumentType] = useState("passport");
  const [documentRef, setDocumentRef] = useState("");

  const status = useMemo(
    () => (data ? mapKycStatusToUi(data.status) : "not_started"),
    [data],
  );
  const meta = statusMeta(status, t);

  const eligibilityRows = useMemo(() => {
    if (!eligibility) return [];
    return [
      mapEligibilityToAccess("deposit", "verification.access.deposit", eligibility.deposit),
      mapEligibilityToAccess("withdraw", "verification.access.withdraw", eligibility.withdraw),
      mapEligibilityToAccess("primary", "verification.access.primary", eligibility.primary),
      mapEligibilityToAccess("secondary", "verification.access.secondary", eligibility.secondary),
      {
        id: "payouts",
        labelKey: "verification.access.payouts",
        status: eligibility.withdraw.allowed ? ("allowed" as const) : ("limited" as const),
        message: eligibility.withdraw.userMessage,
        ctaHref: eligibility.withdraw.allowed ? ROUTES.dashboardPayoutsHistory : profileDashboardHref("verification"),
        ctaLabelKey: eligibility.withdraw.allowed
          ? "verification.eligibility.cta.viewPayouts"
          : "verification.eligibility.cta.completeKyc",
      },
      {
        id: "documents",
        labelKey: "verification.access.documents",
        status: "allowed" as const,
        ctaHref: ROUTES.dashboardDocuments,
        ctaLabelKey: "verification.eligibility.cta.openDocuments",
      },
      {
        id: "statements",
        labelKey: "verification.access.statements",
        status: "allowed" as const,
        ctaHref: ROUTES.dashboardStatements,
        ctaLabelKey: "verification.eligibility.cta.openStatements",
      },
    ];
  }, [eligibility]);

  if (loading && !data) {
    return <ProfileSectionSkeleton variant="cards" />;
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
        {error.startsWith("verification.") ? t(error) : error}
        <button type="button" className="ml-3 font-semibold underline" onClick={() => void reload()}>
          {t("actions.retry")}
        </button>
      </div>
    );
  }

  const submittedAt = data?.submittedAt;
  const reviewedAt = data?.reviewedAt;

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className={profileCardClass}>
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-2xl",
              status === "approved" && "bg-lime-100/90 text-lime-950",
              status === "pending_review" && "bg-blue-50 text-blue-800",
              status === "rejected" && "bg-red-50 text-red-800",
              status === "in_progress" && "bg-amber-50 text-amber-900",
              status === "not_started" && "bg-neutral-100 text-neutral-600",
            )}
          >
            {status === "approved" ? (
              <CheckCircle2 className="size-6" aria-hidden />
            ) : status === "pending_review" ? (
              <Clock className="size-6" aria-hidden />
            ) : status === "rejected" ? (
              <XCircle className="size-6" aria-hidden />
            ) : (
              <Shield className="size-6" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              {t("verification.statusLabel")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", meta.tone)}>
                {meta.label}
              </span>
              {data?.level ? (
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                  {t("verification.level")}: {data.level}
                </span>
              ) : null}
            </div>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">{meta.description}</p>
            <dl className="mt-3 grid gap-1 text-xs text-neutral-500 sm:grid-cols-2">
              {submittedAt ? (
                <div>
                  <dt className="inline">{t("verification.submittedAt")}: </dt>
                  <dd className="inline font-medium text-neutral-700">
                    {formatDate(new Date(submittedAt), locale, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              ) : null}
              {reviewedAt ? (
                <div>
                  <dt className="inline">{t("verification.reviewedAt")}: </dt>
                  <dd className="inline font-medium text-neutral-700">
                    {formatDate(new Date(reviewedAt), locale, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              ) : null}
              {data?.countryCode ? (
                <div>
                  <dt className="inline">{t("verification.countryCode")}: </dt>
                  <dd className="inline font-medium text-neutral-700">{data.countryCode}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      </section>

      {status === "rejected" && data?.rejectionReasonSafe ? (
        <section className="rounded-2xl bg-red-50 px-4 py-4 sm:px-5" role="status">
          <div className="flex gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-700" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-red-900">{t("verification.rejectionTitle")}</p>
              <p className="mt-2 text-sm text-red-800/95">{data.rejectionReasonSafe}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className={profileCardClass}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {t("verification.timeline.title")}
        </p>
        <ProfileVerificationTimeline status={status} />
      </section>

      <section className={profileCardClass}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {t("verification.accessTitle")}
        </p>
        {eligibilityLoading ? (
          <div className="mt-3">
            <ProfileSectionSkeleton variant="table" rows={4} />
          </div>
        ) : eligibilityError ? (
          <p className="mt-3 text-sm text-red-600">{t(eligibilityError)}</p>
        ) : (
          <ProfileEligibilityRows rows={eligibilityRows} />
        )}
      </section>

      <section className={profileCardClass}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {t("verification.documents.title")}
        </p>
        <p className="mt-1 text-sm text-neutral-500">{t("verification.uploadSoon")}</p>
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-3 text-xs text-amber-950">
          <FileText className="mr-1 inline size-3.5 align-text-bottom" aria-hidden />
          {t("verification.manualProviderHint")}
        </p>
      </section>

      {(status === "in_progress" || status === "not_started" || status === "rejected") && (
        <section className={profileMutedCardClass}>
          <h2 className="text-base font-semibold tracking-tight text-neutral-900">
            {t("verification.manualFormTitle")}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">{t("verification.manualFormHint")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              placeholder="RU"
              className="h-11 rounded-2xl bg-white px-3 text-sm"
              aria-label={t("verification.countryCode")}
            />
            <StyledSelect
              value={documentType}
              options={[
                { value: "passport", label: t("verification.docPassport") },
                { value: "id_card", label: t("verification.docId") },
              ]}
              onChange={setDocumentType}
              aria-label={t("verification.documentType")}
              fullWidth
            />
            <input
              type="text"
              value={documentRef}
              onChange={(e) => setDocumentRef(e.target.value)}
              placeholder="****1234"
              className="h-11 rounded-2xl bg-white px-3 font-mono text-sm"
              aria-label={t("verification.documentRef")}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(status === "not_started" || status === "rejected") && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void start(countryCode.trim() || undefined)}
                className={profilePrimaryButtonClass}
              >
                {t("verification.start")}
              </button>
            )}
            {(status === "in_progress" || status === "rejected") && (
              <button
                type="button"
                disabled={submitting || !documentRef.trim() || countryCode.trim().length < 2}
                onClick={() =>
                  void submitManual({
                    countryCode: countryCode.trim(),
                    documentType,
                    documentReference: documentRef.trim(),
                  })
                }
                className="inline-flex h-10 items-center justify-center rounded-full bg-neutral-900 px-5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {submitting ? t("verification.submitting") : t("verification.submit")}
              </button>
            )}
          </div>
          {error ? (
            <p className="mt-2 text-xs text-red-600">{error.startsWith("verification.") ? t(error) : error}</p>
          ) : null}
        </section>
      )}

      {status === "pending_review" ? (
        <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-900">{t("verification.pendingHint")}</p>
      ) : null}

      {status === "approved" ? (
        <Link
          href={ROUTES.dashboardPayoutsHistory}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-900 px-5 text-xs font-semibold text-white"
        >
          {t("verification.goPayouts")}
          <ChevronRight className="ml-1 size-4" aria-hidden />
        </Link>
      ) : null}

      <section className={cn(profileCardClass, "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between")}>
        <div className="flex gap-3">
          <HelpCircle className="mt-0.5 size-5 shrink-0 text-neutral-400" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-neutral-900">{t("verification.helpTitle")}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{t("verification.helpBody")}</p>
          </div>
        </div>
        <Link
          href={ROUTES.dashboardSupport}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-neutral-800 hover:text-neutral-950"
        >
          {t("verification.helpLink")}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
