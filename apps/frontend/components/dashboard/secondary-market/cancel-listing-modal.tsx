"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import type { DialogRoot } from "@base-ui/react/dialog";

import { useI18n } from "@/components/providers/i18n-provider";
import { formatUsdtAmount } from "@/lib/i18n/formatters";
import { statusLabel } from "@/lib/i18n/status-labels";
import {
  useSecondaryMarketOrderTypeLabel,
} from "@/hooks/use-secondary-market-i18n";
import { cn } from "@/lib/utils";

export type CancelListingModalListing = {
  id: string;
  releaseTitle: string;
  artist?: string;
  symbol?: string;
  side: "buy" | "sell";
  pricePerUnit: number | null;
  unitsListed: number;
  unitsFilled: number;
  unitsRemaining: number;
  status: string;
  mode: "limit" | "market";
};

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 font-mono text-[11px]">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span className="min-w-0 text-right tabular-nums text-zinc-100">{value}</span>
    </div>
  );
}

export type CancelListingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: CancelListingModalListing | null;
  onConfirm: (listing: CancelListingModalListing) => void | Promise<void>;
};

export function CancelListingModal({ open, onOpenChange, listing, onConfirm }: CancelListingModalProps) {
  const { t, locale } = useI18n();
  const orderTypeLabel = useSecondaryMarketOrderTypeLabel(listing?.mode ?? "limit");
  const safeRef = React.useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!listing) return null;

  const title =
    listing.side === "sell"
      ? t("secondaryMarket.forms.cancelListingSellTitle")
      : t("secondaryMarket.forms.cancelListingBuyTitle");

  const sideText =
    listing.side === "sell" ? t("secondaryMarket.forms.sideSellUnt") : t("secondaryMarket.forms.sideBuyUnt");

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
      await onConfirm(listing);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root key={listing.id} open={open} onOpenChange={handleOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-120 bg-black/70 backdrop-blur-[2px]",
            "transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
          )}
        />
        <Dialog.Popup
          initialFocus={safeRef}
          className={cn(
            "fixed left-1/2 top-1/2 z-121 w-[min(100vw-1.5rem,420px)] -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl bg-zinc-950/95 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
            "transition-[opacity,transform] duration-200",
            "data-ending-style:scale-[0.98] data-ending-style:opacity-0",
            "data-starting-style:scale-[0.98] data-starting-style:opacity-0",
          )}
        >
          <Dialog.Title className="text-balance font-sans text-base font-semibold leading-snug tracking-tight text-white">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-3 space-y-2 font-sans text-[13px] leading-relaxed text-zinc-400">
            <p>{t("secondaryMarket.forms.cancelListingDesc1")}</p>
          </Dialog.Description>

          <div className="mt-4 rounded-xl bg-black/35 px-3 py-2">
            <SummaryRow
              label={t("secondaryMarket.actions.release")}
              value={
                <span className="block">
                  <span className="block font-medium text-white">{listing.releaseTitle}</span>
                  {listing.artist ? (
                    <span className="mt-0.5 block text-[10px] font-normal text-zinc-500">
                      {listing.artist}
                      {listing.symbol ? ` · ${listing.symbol}` : ""}
                    </span>
                  ) : null}
                </span>
              }
            />
            <SummaryRow
              label={t("secondaryMarket.forms.orderType")}
              value={
                <span>
                  {sideText} · {orderTypeLabel}
                </span>
              }
            />
            <SummaryRow
              label={t("secondaryMarket.forms.pricePerUnit")}
              value={
                listing.pricePerUnit != null ? formatUsdtAmount(listing.pricePerUnit, locale) : "—"
              }
            />
            <SummaryRow label={t("secondaryMarket.forms.listedUnits")} value={listing.unitsListed} />
            <SummaryRow label={t("secondaryMarket.forms.filledUnits")} value={listing.unitsFilled} />
            <SummaryRow label={t("secondaryMarket.forms.toCancel")} value={listing.unitsRemaining} />
            <SummaryRow
              label={t("secondaryMarket.forms.status")}
              value={<span className="text-zinc-300">{statusLabel("listing", listing.status, locale)}</span>}
            />
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              ref={safeRef}
              type="button"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className={cn(
                "h-9 shrink-0 rounded-lg px-3.5 font-mono text-[12px] font-medium text-zinc-200",
                "bg-white/6 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F500]/35",
                "disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              {t("secondaryMarket.forms.keepOrder")}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              onClick={() => void handleConfirm()}
              className={cn(
                "h-9 shrink-0 rounded-lg px-3.5 font-mono text-[12px] font-semibold",
                "bg-fuchsia-500/18 text-fuchsia-100 ring-1 ring-fuchsia-400/25",
                "transition hover:bg-fuchsia-500/26 hover:ring-fuchsia-400/35",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/40",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              {isSubmitting ? t("secondaryMarket.forms.submitting") : t("secondaryMarket.forms.cancelOrder")}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
