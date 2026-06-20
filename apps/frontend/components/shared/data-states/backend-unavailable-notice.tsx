"use client";

import { Info } from "@/lib/lucide";

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
      className={cn(
        "flex items-start gap-3 border-b border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-50 sm:px-5",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-amber-200" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-50">{t("errors.backendUnavailable.title")}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-amber-100/90">
          {t("errors.backendUnavailable.description")}
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-xs font-semibold text-amber-50 underline underline-offset-2 hover:text-white"
          >
            {t("actions.retry")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
