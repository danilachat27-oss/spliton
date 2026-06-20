"use client";

import Image from "next/image";

import { Download } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { useI18n } from "@/components/providers/i18n-provider";
import { intlLocaleFor } from "@/lib/i18n/formatters";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";

const LOGO_MINI = "/images/LOGO/mini-logo.png";
const LOGO_FULL = "/images/LOGO/black-logo-nofon.png";
const USDT_ICON = "/images/currency/usdt.svg";

function formatDocDate(iso: string | null | undefined, locale: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
}

function formatRangeDate(value: string | undefined, locale: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
}

function amountValue(value?: string | null) {
  if (!value) return "—";
  return value.replace(/\s*USDT\s*$/i, "").trim();
}

function maskEmail(email?: string | null) {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.length <= 2 ? local : `${local.slice(0, 2)}•••`;
  return `${visible}@${domain}`;
}

export type StatementDocumentPreviewProps = {
  kindLabel: string;
  periodLabel: string;
  dateFrom?: string;
  dateTo?: string;
  holderName?: string | null;
  holderEmail?: string | null;
  balance?: string | null;
  opsCount?: number | null;
  inflow?: string | null;
  outflow?: string | null;
  status: "idle" | "generating" | "ready" | "failed";
  reference?: string | null;
  issuedAt?: string | null;
  errorMessage?: string | null;
  showDownload?: boolean;
  downloading?: boolean;
  onDownload?: () => void;
};

export function StatementDocumentPreview({
  kindLabel,
  periodLabel,
  dateFrom,
  dateTo,
  holderName,
  holderEmail,
  balance,
  opsCount,
  inflow,
  outflow,
  status,
  reference,
  issuedAt,
  showDownload,
  downloading,
  onDownload,
}: StatementDocumentPreviewProps) {
  const { locale, t } = useI18n();
  const intl = intlLocaleFor(locale);

  const isReady = status === "ready";
  const isGenerating = status === "generating";
  const isFailed = status === "failed";
  const docRef = reference ?? "ST-PREVIEW";
  const holder = holderName?.trim() || maskEmail(holderEmail);

  const stampLabel = isReady
    ? t("statements.preview.stamp.confirmed")
    : isGenerating
      ? t("statements.preview.stamp.generating")
      : isFailed
        ? t("statements.preview.stamp.error")
        : t("statements.preview.stamp.preview");

  return (
    <div
      className={cn(
        "stmt-doc relative overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_-28px_rgba(0,0,0,0.35)]",
        isReady && "stmt-doc--ready",
        isGenerating && "stmt-doc--generating",
      )}
    >
      <div className="stmt-doc-watermark pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <Image src={LOGO_MINI} alt="" width={120} height={120} className="size-[7.5rem] object-contain opacity-[0.04] sm:size-32" unoptimized />
      </div>

      <div className="stmt-doc-accent absolute inset-x-0 top-0 h-1 bg-[#B7F500]" aria-hidden />

      <header className="relative bg-neutral-50/70 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Image
              src={LOGO_FULL}
              alt={t("statements.preview.logoAlt")}
              width={320}
              height={76}
              className="h-8 w-auto max-w-[11rem] object-contain object-left sm:h-9 sm:max-w-[13rem]"
              unoptimized
            />
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              {t("statements.preview.platformTagline")}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              {t("statements.preview.referenceLabel")}
            </p>
            <p className="mt-0.5 font-mono text-xs font-semibold text-neutral-900">{docRef}</p>
            <p className="mt-1 text-[10px] text-neutral-500">{formatDocDate(issuedAt ?? new Date().toISOString(), intl)}</p>
          </div>
        </div>
      </header>

      <div className="relative px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">{kindLabel}</h3>
            <p className="mt-1 text-xs text-neutral-500">
              {tf(t("statements.preview.reportingPeriod"), { period: periodLabel })}
            </p>
          </div>
          <span
            className={cn(
              "stmt-doc-stamp inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
              isReady && "bg-emerald-50 text-emerald-800",
              isGenerating && "bg-amber-50 text-amber-900",
              isFailed && "bg-red-50 text-red-800",
              status === "idle" && "bg-neutral-100 text-neutral-500",
            )}
          >
            {stampLabel}
          </span>
        </div>

        <dl className="stmt-doc-meta mt-4 grid gap-3 rounded-xl bg-neutral-50 px-3 py-3 sm:grid-cols-2 sm:gap-x-4 sm:px-4">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              {t("statements.preview.holder")}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-neutral-900">{holder}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              {t("statements.preview.period")}
            </dt>
            <dd className="mt-0.5 font-mono text-sm text-neutral-800">
              {dateFrom && dateTo ? `${formatRangeDate(dateFrom, intl)} — ${formatRangeDate(dateTo, intl)}` : periodLabel}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              {t("statements.preview.currency")}
            </dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-neutral-900">
              <span className="relative size-4 shrink-0 overflow-hidden rounded-full">
                <Image src={USDT_ICON} alt="" fill className="object-cover" sizes="16px" />
              </span>
              {t("statements.preview.currencyValue")}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              {t("statements.preview.opsInPeriod")}
            </dt>
            <dd className="mt-0.5 font-mono text-sm font-semibold text-neutral-900">{opsCount ?? "—"}</dd>
          </div>
        </dl>

        <div className="stmt-doc-summary mt-4 overflow-hidden rounded-xl bg-neutral-50">
          <div className="bg-neutral-900 px-3 py-2 sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">
              {t("statements.preview.summaryTitle")}
            </p>
          </div>
          <table className="w-full text-left text-xs sm:text-sm">
            <tbody>
              <tr>
                <td className="px-3 py-2.5 text-neutral-600 sm:px-4">{t("statements.preview.availableBalance")}</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-neutral-900 sm:px-4">
                  {amountValue(balance)} USDT
                </td>
              </tr>
              <tr className="bg-white/70">
                <td className="px-3 py-2.5 text-neutral-600 sm:px-4">{t("statements.preview.inflow")}</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700 sm:px-4">
                  +{amountValue(inflow)} USDT
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 text-neutral-600 sm:px-4">{t("statements.preview.outflow")}</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-neutral-800 sm:px-4">
                  −{amountValue(outflow)} USDT
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {status === "idle" ? (
          <p className="mt-4 text-xs leading-relaxed text-neutral-500">{t("statements.preview.idleHint")}</p>
        ) : null}

        {isGenerating ? (
          <p className="stmt-doc-status mt-4 flex items-center gap-2 text-xs text-neutral-600">
            <SplitonLoader size="xxs" variant="light" className="shrink-0" />
            {t("statements.preview.generatingHint")}
          </p>
        ) : null}

        {isFailed ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">{t("statements.errors.requestFailed")}</p>
        ) : null}

        {showDownload ? (
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="stmt-doc-download mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60 sm:text-sm"
          >
            {downloading ? <SplitonLoader size="xxs" variant="light" className="shrink-0" /> : <Download className="size-4" />}
            {t("statements.preview.downloadPdf")}
          </button>
        ) : null}
      </div>

      <footer className="relative bg-neutral-50/80 px-4 py-3 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] leading-relaxed text-neutral-500">{t("statements.preview.footerDisclaimer")}</p>
            <p className="mt-1 font-mono text-[9px] text-neutral-400">{t("statements.preview.footerContact")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 shadow-[0_4px_16px_-12px_rgba(0,0,0,0.25)]">
            <Image src={LOGO_MINI} alt="" width={20} height={20} className="size-5 object-contain" unoptimized />
            <span className="text-[9px] font-semibold text-neutral-700">{t("statements.preview.spliton")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
