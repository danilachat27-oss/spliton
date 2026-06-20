"use client";

import { AlertTriangle } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

type BackendUnavailableNoticeProps = {
  onRetry?: () => void;
  className?: string;
};

export function BackendUnavailableNotice({ onRetry, className }: BackendUnavailableNoticeProps) {
  const { t } = useI18n();

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:px-5",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-950">{t("errors.backendUnavailable.title")}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-amber-800">
          {t("errors.backendUnavailable.description")}
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-xs font-semibold text-amber-900 underline underline-offset-2 transition hover:text-amber-950"
          >
            {t("actions.retry")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
