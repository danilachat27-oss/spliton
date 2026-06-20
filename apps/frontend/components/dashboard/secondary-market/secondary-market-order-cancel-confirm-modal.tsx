"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import type { DialogRoot } from "@base-ui/react/dialog";
import { X } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export type OrderCancelConfirmModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: "active" | "partial";
  side: "buy" | "sell";
  onConfirm: () => void | Promise<void>;
};

export function OrderCancelConfirmModal({
  open,
  onOpenChange,
  variant,
  side,
  onConfirm,
}: OrderCancelConfirmModalProps) {
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleOpenChange = (next: boolean, eventDetails: DialogRoot.ChangeEventDetails) => {
    if (!next && isSubmitting) {
      eventDetails.preventUnmountOnClose();
      return;
    }
    if (!next) setIsSubmitting(false);
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    variant === "partial"
      ? t("secondaryMarket.forms.cancelPartialTitle")
      : t("secondaryMarket.forms.cancelActiveTitle");

  const body =
    variant === "partial" ? (
      <div className="text-[13px] leading-relaxed text-zinc-400">
        {t("secondaryMarket.forms.cancelPartialBody")}
        <span className="mt-2 block text-zinc-500">
          {side === "buy"
            ? t("secondaryMarket.forms.cancelPartialBuyFunds")
            : t("secondaryMarket.forms.cancelPartialSellUnits")}
        </span>
      </div>
    ) : (
      <div className="text-[13px] leading-relaxed text-zinc-400">
        {side === "buy"
          ? t("secondaryMarket.forms.cancelActiveBuy")
          : t("secondaryMarket.forms.cancelActiveSell")}
      </div>
    );

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-120 bg-black/70 backdrop-blur-[2px]",
            "transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-121 w-[min(100vw-2rem,560px)] -translate-x-1/2 -translate-y-1/2 p-6",
            "rounded-2xl bg-[#101010] text-white shadow-[0_32px_120px_rgba(0,0,0,0.78)]",
            "transition-[opacity,transform] duration-200",
            "data-ending-style:scale-[0.98] data-ending-style:opacity-0",
            "data-starting-style:scale-[0.98] data-starting-style:opacity-0",
          )}
        >
          <Dialog.Close
            aria-label={t("secondaryMarket.aria.close")}
            className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
          >
            <X className="size-4" />
          </Dialog.Close>
          <Dialog.Title className="pr-10 text-base font-semibold tracking-tight text-white">{title}</Dialog.Title>
          <Dialog.Description className="mt-3">{body}</Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close
              className="h-10 rounded-full bg-white/10 px-5 font-mono text-[12px] font-medium text-zinc-200 transition hover:bg-white/14 hover:text-white disabled:opacity-50"
              disabled={isSubmitting}
            >
              {t("secondaryMarket.forms.doNotCancel")}
            </Dialog.Close>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleConfirm()}
              className="h-10 rounded-full bg-white px-5 font-mono text-[12px] font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "…" : t("secondaryMarket.forms.confirmCancel")}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
