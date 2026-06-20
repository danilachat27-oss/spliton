"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import type { DialogRoot } from "@base-ui/react/dialog";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export type OrderFeedbackTone = "success" | "warn" | "info";

export type OrderFeedback = {
  tone: OrderFeedbackTone;
  title: string;
  body: string;
};

export type SecondaryMarketOrderFeedbackModalProps = {
  open: boolean;
  onOpenChange: (open: boolean, eventDetails?: DialogRoot.ChangeEventDetails) => void;
  feedback: OrderFeedback | null;
};

export function SecondaryMarketOrderFeedbackModal({
  open,
  onOpenChange,
  feedback,
}: SecondaryMarketOrderFeedbackModalProps) {
  const { t } = useI18n();
  const closeRef = React.useRef<HTMLButtonElement>(null);

  if (!feedback) return null;

  const accentRing =
    feedback.tone === "success"
      ? "ring-[#B7F500]/30"
      : feedback.tone === "warn"
        ? "ring-amber-400/25"
        : "ring-white/12";

  const titleAccent =
    feedback.tone === "success"
      ? "text-[#d4f570]"
      : feedback.tone === "warn"
        ? "text-amber-100"
        : "text-zinc-100";

  const badgeLabel =
    feedback.tone === "success"
      ? t("secondaryMarket.forms.feedbackSuccessBadge")
      : feedback.tone === "warn"
        ? t("secondaryMarket.forms.feedbackWarnBadge")
        : t("secondaryMarket.forms.feedbackInfoBadge");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-120 bg-black/75 backdrop-blur-[3px]",
            "transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
          )}
        />
        <Dialog.Popup
          initialFocus={closeRef}
          className={cn(
            "fixed left-1/2 top-1/2 z-121 w-[min(100vw-1.5rem,440px)] -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl bg-[#0c0c0c] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)] ring-1",
            accentRing,
            "transition-[opacity,transform] duration-200",
            "data-ending-style:scale-[0.98] data-ending-style:opacity-0",
            "data-starting-style:scale-[0.98] data-starting-style:opacity-0",
          )}
        >
          <p
            className={cn(
              "font-mono text-[10px] font-semibold uppercase tracking-[0.18em]",
              feedback.tone === "success" && "text-[#B7F500]/90",
              feedback.tone === "warn" && "text-amber-300/90",
              feedback.tone === "info" && "text-zinc-500",
            )}
          >
            {badgeLabel}
          </p>
          <Dialog.Title
            className={cn(
              "mt-2 text-balance font-sans text-lg font-semibold leading-snug tracking-tight",
              titleAccent,
            )}
          >
            {feedback.title}
          </Dialog.Title>
          <Dialog.Description className="mt-3 font-mono text-[13px] leading-relaxed text-zinc-400">
            {feedback.body}
          </Dialog.Description>

          <div className="mt-6 flex justify-end">
            <button
              ref={closeRef}
              type="button"
              onClick={() => onOpenChange(false)}
              className={cn(
                "h-10 min-w-[120px] rounded-full px-5 font-mono text-[12px] font-semibold transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F500]/40",
                feedback.tone === "success" &&
                  "bg-[#B7F500] text-black hover:bg-[#c5f52a] active:scale-[0.99]",
                feedback.tone === "warn" &&
                  "bg-amber-500/20 text-amber-50 ring-1 ring-amber-400/30 hover:bg-amber-500/28",
                feedback.tone === "info" &&
                  "bg-white text-black hover:bg-zinc-100 active:scale-[0.99]",
              )}
            >
              {t("secondaryMarket.forms.feedbackOk")}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
