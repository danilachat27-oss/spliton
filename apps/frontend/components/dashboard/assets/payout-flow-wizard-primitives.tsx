"use client";

import type { ReactNode } from "react";

import { Check, Pencil } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";

export function FlowSummaryRow({
  stepId,
  title,
  value,
  onEdit,
}: {
  stepId: number;
  title: string;
  value: string;
  onEdit: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="animate-payout-flow-summary-in flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 ring-1 ring-neutral-200/60">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
        <Check className="size-4" strokeWidth={2.5} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          {tf(t("payoutFlow.step"), { n: String(stepId) })}
        </p>
        <p className="truncate text-sm font-semibold text-neutral-900">{title}</p>
      </div>
      <span className="hidden max-w-[min(200px,38%)] truncate font-mono text-xs text-neutral-600 sm:inline">{value}</span>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
      >
        <Pencil className="size-3.5" aria-hidden />
        {t("payoutFlow.edit")}
      </button>
    </div>
  );
}

export function FlowPanel({
  stepId,
  title,
  children,
  tone = "neutral",
}: {
  stepId: number;
  title: string;
  children: ReactNode;
  tone?: "neutral" | "accent";
}) {
  return (
    <div
      className={cn(
        "animate-payout-flow-panel-in rounded-3xl px-5 py-6 sm:px-7 sm:py-7",
        tone === "accent" ? "bg-blue-50/80 ring-1 ring-blue-200/50" : "bg-neutral-50/90 ring-1 ring-neutral-200/40",
      )}
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
            tone === "accent" ? "bg-blue-700" : "bg-neutral-900",
          )}
        >
          {stepId}
        </span>
        <div className="min-w-0 flex-1 space-y-4">
          <p className="text-base font-semibold tracking-tight text-neutral-900">{title}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function FlowContinueButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-neutral-900 text-sm font-semibold text-white transition hover:bg-neutral-800 sm:w-auto sm:min-w-[200px]"
      >
        {label}
      </button>
    </div>
  );
}
