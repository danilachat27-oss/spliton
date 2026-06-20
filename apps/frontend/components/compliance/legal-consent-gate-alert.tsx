"use client";

import type { useLegalConsentGate } from "@/hooks/use-legal-consent-gate";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

type Gate = ReturnType<typeof useLegalConsentGate>;

type Props = {
  gate: Gate;
  className?: string;
  variant?: "light" | "dark";
};

export function LegalConsentGateAlert({ gate, className, variant = "light" }: Props) {
  const { t } = useI18n();

  if (!gate.checkError) return null;

  const isDark = variant === "dark";

  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl px-3 py-2.5 text-[12px] leading-snug",
        isDark ? "bg-rose-500/10 text-rose-200 ring-1 ring-rose-500/25" : "bg-rose-50 text-rose-900",
        className,
      )}
    >
      <p className="font-semibold">{t("compliance.gate.checkFailedTitle")}</p>
      <p className={cn("mt-1", isDark ? "text-rose-200/90" : "text-rose-800")}>
        {t("compliance.gate.checkFailedBody")}
      </p>
      <button
        type="button"
        onClick={() => void gate.refresh()}
        disabled={gate.isChecking}
        className={cn(
          "mt-2 text-[12px] font-semibold underline underline-offset-2 disabled:opacity-50",
          isDark ? "text-rose-100" : "text-rose-900",
        )}
      >
        {t("compliance.gate.retryCheck")}
      </button>
    </div>
  );
}
