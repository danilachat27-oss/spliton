"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { useI18n } from "@/components/providers/i18n-provider";
import { disputeStampLabel } from "@/lib/i18n/disputes-messages";
import { formatDate } from "@/lib/i18n/formatters";
import { cn } from "@/lib/utils";

const LOGO_MINI = "/images/LOGO/mini-logo.png";
const LOGO_FULL = "/images/LOGO/black-logo-nofon.png";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.length <= 2 ? local : `${local.slice(0, 2)}•••`;
  return `${visible}@${domain}`;
}

function statusStepIndex(status: string): number {
  if (status === "open") return 1;
  if (status === "in_review" || status === "waiting_for_admin" || status === "escalated") return 2;
  if (status === "waiting_for_user") return 3;
  if (status === "resolved" || status === "closed" || status === "rejected") return 4;
  return 1;
}

export function DisputeStatusSteps({ status }: { status: string }) {
  const { t } = useI18n();
  const steps = [
    { id: 1, label: t("disputes.step.accepted") },
    { id: 2, label: t("disputes.step.review") },
    { id: 3, label: t("disputes.step.response") },
    { id: 4, label: t("disputes.step.resolution") },
  ] as const;

  const active = statusStepIndex(status);
  const terminal = status === "resolved" || status === "closed";
  const rejected = status === "rejected";

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {steps.map((step) => {
        const done = active > step.id || (active === 4 && step.id <= 4 && terminal);
        const isActive = active === step.id && !terminal && !rejected;
        return (
          <div key={step.id} className="flex flex-col items-center gap-1 text-center">
            <span
              className={cn(
                "dsp-step flex size-7 items-center justify-center rounded-full text-[10px] font-bold sm:size-8",
                done && !rejected && "bg-neutral-900 text-white",
                rejected && step.id === 4 && "bg-red-600 text-white",
                isActive && "bg-[#B7F500] text-black dsp-step--active",
                !done && !isActive && !(rejected && step.id === 4) && "bg-neutral-100 text-neutral-400",
              )}
            >
              {done || (rejected && step.id === 4) ? <Check className="size-3.5" strokeWidth={3} /> : step.id}
            </span>
            <span className="text-[9px] leading-tight text-neutral-500 sm:text-[10px]">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function stampTone(status?: string, draft?: boolean): "neutral" | "amber" | "emerald" | "red" {
  if (draft || !status) return "neutral";
  if (status === "rejected") return "red";
  if (status === "resolved" || status === "closed") return "emerald";
  if (status === "waiting_for_user") return "neutral";
  return "amber";
}

export type DisputeDocumentPreviewProps = {
  reference: string;
  typeLabel: string;
  subject: string;
  description: string;
  amount?: string;
  holderName?: string | null;
  holderEmail?: string | null;
  createdAt?: string | null;
  dueAt?: string | null;
  disputeStatus?: string;
  draft?: boolean;
  processing?: boolean;
  conversationHref?: string;
};

export function DisputeDocumentPreview({
  reference,
  typeLabel,
  subject,
  description,
  amount,
  holderName,
  holderEmail,
  createdAt,
  dueAt,
  disputeStatus,
  draft,
  processing,
  conversationHref,
}: DisputeDocumentPreviewProps) {
  const { t, locale } = useI18n();

  const resolveHolder = (name?: string | null, email?: string | null) => {
    if (name?.trim()) return name.trim();
    if (email?.trim()) return maskEmail(email.trim());
    return t("disputes.doc.placeholder.holder");
  };

  const formatDocDate = (iso?: string | null, emptyLabel?: string) => {
    if (!iso) return emptyLabel ?? t("disputes.doc.placeholder.date");
    const formatted = formatDate(iso, locale, { day: "2-digit", month: "long", year: "numeric" });
    if (formatted === "—") return iso;
    return formatted;
  };

  const holder = resolveHolder(holderName, holderEmail);
  const holderIsPlaceholder = !holderName?.trim() && !holderEmail?.trim();
  const tone = stampTone(disputeStatus, draft);
  const label = disputeStampLabel(disputeStatus, draft, locale);
  const stepsStatus = disputeStatus ?? "open";
  const submittedAt = formatDocDate(createdAt);
  const submittedAtIsPlaceholder = !createdAt;
  const subjectText = subject.trim() || (draft ? t("disputes.doc.placeholder.subject") : t("disputes.doc.placeholder.noSubject"));
  const subjectIsPlaceholder = !subject.trim();
  const descriptionText =
    description.trim() || (draft ? t("disputes.doc.placeholder.description") : t("disputes.doc.placeholder.noDescription"));
  const descriptionIsPlaceholder = !description.trim();
  const amountText = amount?.trim() || t("disputes.doc.placeholder.amount");
  const amountIsPlaceholder = !amount?.trim();

  return (
    <div
      className={cn(
        "dsp-doc relative overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_-28px_rgba(0,0,0,0.35)]",
        processing && "dsp-doc--processing",
        !draft && disputeStatus && ["resolved", "closed"].includes(disputeStatus) && "dsp-doc--resolved",
      )}
    >
      <div className="dsp-doc-watermark pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <Image src={LOGO_MINI} alt="" width={120} height={120} className="size-30 object-contain opacity-[0.04]" unoptimized />
      </div>

      <div className="dsp-doc-accent absolute inset-x-0 top-0 h-1 bg-[#B7F500]" aria-hidden />

      <header className="relative bg-neutral-50/70 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Image
              src={LOGO_FULL}
              alt="Spliton"
              width={320}
              height={76}
              className="h-8 w-auto max-w-44 object-contain object-left sm:h-9 sm:max-w-52"
              unoptimized
            />
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              {t("disputes.doc.centerLabel")}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              {t("disputes.doc.ticketLabel")}
            </p>
            <p className="mt-0.5 font-mono text-xs font-semibold text-neutral-900">{reference}</p>
            <p
              className={cn(
                "mt-1 text-[10px]",
                submittedAtIsPlaceholder ? "text-neutral-400" : "text-neutral-500",
              )}
            >
              {submittedAt}
            </p>
          </div>
        </div>
      </header>

      <div className="relative px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">{t("disputes.doc.heading")}</h3>
            <p className="mt-1 text-xs text-neutral-500">{typeLabel}</p>
          </div>
          <span
            className={cn(
              "dsp-doc-stamp inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
              tone === "emerald" && "bg-emerald-50 text-emerald-800",
              tone === "amber" && "bg-amber-50 text-amber-900",
              tone === "red" && "bg-red-50 text-red-800",
              tone === "neutral" && "bg-neutral-100 text-neutral-600",
            )}
          >
            {label}
          </span>
        </div>

        <dl className="dsp-doc-meta mt-4 grid gap-3 rounded-xl bg-neutral-50 px-3 py-3 sm:grid-cols-2 sm:gap-x-4 sm:px-4">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{t("disputes.doc.applicant")}</dt>
            <dd
              className={cn(
                "mt-0.5 text-sm font-medium",
                holderIsPlaceholder ? "text-neutral-400" : "text-neutral-900",
              )}
            >
              {holder}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{t("disputes.doc.category")}</dt>
            <dd className="mt-0.5 text-sm font-medium text-neutral-900">{typeLabel}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{t("disputes.doc.submittedAt")}</dt>
            <dd
              className={cn(
                "mt-0.5 text-sm",
                submittedAtIsPlaceholder ? "text-neutral-400" : "font-mono text-neutral-800",
              )}
            >
              {submittedAt}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{t("disputes.doc.responseDue")}</dt>
            <dd className="mt-0.5 font-mono text-sm text-neutral-800">
              {dueAt ? formatDocDate(dueAt) : t("disputes.doc.responseDueDefault")}
            </dd>
          </div>
        </dl>

        <div className="dsp-doc-body dsp-ticket-in mt-4 overflow-hidden rounded-xl bg-neutral-50">
          <div className="bg-neutral-900 px-3 py-2 sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">{t("disputes.doc.contentHeading")}</p>
          </div>
          <div className="space-y-3 px-3 py-3 sm:px-4 sm:py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{t("disputes.doc.subjectLabel")}</p>
              <p
                className={cn(
                  "mt-1 text-sm",
                  subjectIsPlaceholder ? "font-normal text-neutral-400" : "font-semibold text-neutral-900",
                )}
              >
                {subjectText}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{t("disputes.doc.descriptionLabel")}</p>
              <p
                className={cn(
                  "mt-1 text-xs leading-relaxed sm:text-sm",
                  descriptionIsPlaceholder ? "text-neutral-400" : "text-neutral-600",
                )}
              >
                {descriptionText}
              </p>
            </div>
            <table className="w-full text-left text-xs sm:text-sm">
              <tbody>
                <tr>
                  <td className="py-2 pr-3 text-neutral-600">{t("disputes.doc.amountLabel")}</td>
                  <td
                    className={cn(
                      "py-2 text-right text-sm",
                      amountIsPlaceholder ? "text-neutral-400" : "font-mono font-semibold text-neutral-900",
                    )}
                  >
                    {amountText}
                  </td>
                </tr>
                <tr className="bg-white/70">
                  <td className="py-2 pr-3 text-neutral-600">{t("disputes.doc.ticketNumberLabel")}</td>
                  <td className="py-2 text-right font-mono font-semibold text-neutral-900">{reference}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {!draft && disputeStatus ? (
          <div className="mt-4 space-y-3">
            <DisputeStatusSteps status={stepsStatus} />
            {processing ? (
              <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
                <div className="dsp-progress h-full rounded-full bg-[#B7F500]" />
              </div>
            ) : null}
            {["resolved", "closed"].includes(disputeStatus) ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                {t("disputes.doc.closedNotice")}
              </p>
            ) : processing ? (
              <p className="flex items-center gap-2 text-xs text-neutral-600">
                <SplitonLoader size="xxs" variant="light" className="shrink-0" />
                {t("disputes.doc.processingNotice")}
              </p>
            ) : disputeStatus === "waiting_for_user" ? (
              <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                {t("disputes.doc.waitingUserNotice")}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-xs leading-relaxed text-neutral-500">{t("disputes.doc.draftHint")}</p>
        )}

        {conversationHref ? (
          <Link
            href={conversationHref}
            className="dsp-doc-action mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-xs font-semibold text-white transition hover:bg-neutral-800 sm:text-sm"
          >
            {t("disputes.doc.openConversation")}
            <ChevronRight className="size-3.5" />
          </Link>
        ) : null}
      </div>

      <footer className="relative bg-neutral-50/80 px-4 py-3 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] leading-relaxed text-neutral-500">{t("disputes.doc.footer")}</p>
            <p className="mt-1 font-mono text-[9px] text-neutral-400">spliton.io · disputes@spliton.io</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 shadow-[0_4px_16px_-12px_rgba(0,0,0,0.25)]">
            <Image src={LOGO_MINI} alt="" width={20} height={20} className="size-5 object-contain" unoptimized />
            <span className="text-[9px] font-semibold text-neutral-700">Spliton</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
