"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

type SecondaryMarketListingActionsTriggerProps = {
  compactTrigger?: boolean;
  disabled?: boolean;
  onOpen: () => void;
};

/** Opens the unified lot purchase flow at the actions step (parent owns the dialog). */
export function SecondaryMarketListingActionsTrigger({
  compactTrigger = false,
  disabled = false,
  onOpen,
}: SecondaryMarketListingActionsTriggerProps) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      className={cn(
        "inline-flex items-center justify-center rounded-full border text-[11px] font-medium transition",
        compactTrigger ? "h-7 px-2.5" : "h-8 px-3",
        disabled
          ? "cursor-not-allowed border-white/8 text-zinc-600"
          : "border-white/15 text-zinc-300 hover:border-white/25 hover:text-white",
      )}
    >
      {disabled ? t("secondaryMarket.listings.unavailable") : t("secondaryMarket.actions.actions")}
    </button>
  );
}

/** @deprecated Use SecondaryMarketListingActionsTrigger + SecondaryMarketLotPurchaseFlowDialog */
export const SecondaryMarketListingActionsModal = SecondaryMarketListingActionsTrigger;
