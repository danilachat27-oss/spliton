"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import type { DialogRoot } from "@base-ui/react/dialog";
import { X } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { LegalConsentModal } from "@/components/compliance/legal-consent-modal";
import { LegalConsentGateAlert } from "@/components/compliance/legal-consent-gate-alert";
import { EligibilityNotice } from "@/components/compliance/eligibility-notice";
import { useLegalConsentGate } from "@/hooks/use-legal-consent-gate";
import { secondaryMarketBookHref } from "@/constants/dashboard/secondary-market";
import { ROUTES } from "@/constants/routes";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import type { AdaptedListing } from "@/lib/secondary-market/secondary-market-adapter";
import {
  classifyLotPurchaseError,
  type LotPurchaseFailedKind,
} from "@/lib/secondary-market/classify-lot-purchase-error";
import { cn } from "@/lib/utils";
import {
  downloadTradeReceipt,
  fetchFeePreview,
  type BuyTradeResult,
  type FeePreviewDto,
} from "@/services/secondary-market.service";
import { saveBlob } from "@/services/documents.service";
import { fetchWalletSummary } from "@/services/wallet.service";

import {
  LotPurchaseActionsScreen,
  LotPurchaseConfirmScreen,
  LotPurchaseFailedScreen,
  LotPurchaseProcessingScreen,
  LotPurchaseSuccessScreen,
} from "./secondary-market-lot-purchase-flow-screens";
import {
  failedTitleKey,
  LOT_PURCHASE_DEPOSIT_PATH,
  type AuthorizedFetch,
  type LotPurchaseStep,
} from "./secondary-market-lot-purchase-flow-utils";

export type SecondaryMarketLotPurchaseFlowDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: AdaptedListing | null;
  bookId: string | null;
  canBuy: boolean;
  authorizedFetch: AuthorizedFetch;
  onBuy: (listingId: string) => Promise<BuyTradeResult>;
  onReloadListings?: () => void | Promise<void>;
  /** Live secondary trade — enables SECONDARY_TRADE legal consent gate (same as order book). */
  consentEnabled?: boolean;
};

export function SecondaryMarketLotPurchaseFlowDialog({
  open,
  onOpenChange,
  listing,
  bookId,
  canBuy,
  authorizedFetch,
  onBuy,
  onReloadListings,
  consentEnabled = false,
}: SecondaryMarketLotPurchaseFlowDialogProps) {
  const router = useRouter();
  const { t } = useI18n();
  const consentGate = useLegalConsentGate("SECONDARY_TRADE", consentEnabled);
  const { messageWithMeta } = useApiErrorMessage();
  const closeRef = React.useRef<HTMLButtonElement>(null);

  const [step, setStep] = React.useState<LotPurchaseStep>("actions");
  const [feePreview, setFeePreview] = React.useState<FeePreviewDto | null>(null);
  const [feeLoading, setFeeLoading] = React.useState(false);
  const [feeError, setFeeError] = React.useState<string | null>(null);
  const [walletBalance, setWalletBalance] = React.useState<string | null>(null);
  const [walletLoading, setWalletLoading] = React.useState(false);
  const [walletError, setWalletError] = React.useState<string | null>(null);
  const [buyResult, setBuyResult] = React.useState<BuyTradeResult | null>(null);
  const [failedKind, setFailedKind] = React.useState<LotPurchaseFailedKind>("generic");
  const [receiptError, setReceiptError] = React.useState<string | null>(null);

  const resetFlow = React.useCallback(() => {
    setStep("actions");
    setFeePreview(null);
    setFeeLoading(false);
    setFeeError(null);
    setWalletBalance(null);
    setWalletLoading(false);
    setWalletError(null);
    setBuyResult(null);
    setFailedKind("generic");
    setReceiptError(null);
  }, []);

  const loadPreviewData = React.useCallback(async () => {
    if (!listing) return;
    setFeeLoading(true);
    setWalletLoading(true);
    setFeeError(null);
    setWalletError(null);

    await Promise.all([
      fetchFeePreview(authorizedFetch, { listingId: listing.id })
        .then(setFeePreview)
        .catch(() => {
          setFeePreview(null);
          setFeeError(t("secondaryMarket.lotPurchase.feePreviewError"));
        })
        .finally(() => setFeeLoading(false)),
      fetchWalletSummary(authorizedFetch)
        .then((summary) => setWalletBalance(summary.availableBalance))
        .catch(() => {
          setWalletBalance(null);
          setWalletError(t("secondaryMarket.lotPurchase.walletCheckError"));
        })
        .finally(() => setWalletLoading(false)),
    ]);
  }, [authorizedFetch, listing, t]);

  React.useEffect(() => {
    if (!open || !listing) return;
    resetFlow();
    void loadPreviewData();
  }, [open, listing, listing?.id, loadPreviewData, resetFlow]);

  const buyerTotal = feePreview ? Number(feePreview.buyerTotal) : Number(listing?.listingValueUsdt ?? 0);
  const walletAvailable = walletBalance != null ? Number(walletBalance) : null;
  const balanceAfter =
    walletAvailable != null && Number.isFinite(buyerTotal) ? walletAvailable - buyerTotal : null;

  const hasInsufficientFunds =
    walletAvailable != null &&
    Number.isFinite(buyerTotal) &&
    buyerTotal > 0 &&
    walletAvailable < buyerTotal;

  const previewBlocking = Boolean(feeError || walletError || feeLoading || walletLoading);
  const confirmDisabled =
    previewBlocking ||
    hasInsufficientFunds ||
    !feePreview ||
    walletAvailable == null ||
    consentGate.hasBlockingEligibility ||
    (consentEnabled && (consentGate.isChecking || consentGate.checkError));

  const handleOpenChange = (next: boolean, eventDetails?: DialogRoot.ChangeEventDetails) => {
    if (!next && step === "processing") {
      eventDetails?.preventUnmountOnClose?.();
      return;
    }
    if (!next) {
      resetFlow();
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (step === "processing") return;
    resetFlow();
    onOpenChange(false);
  };

  const handleConfirmPurchase = async () => {
    if (!listing || confirmDisabled) return;
    setStep("processing");
    try {
      const result = await onBuy(listing.id);
      setBuyResult(result);
      setStep("success");
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[lot-purchase]", err);
      }
      const meta = messageWithMeta(err);
      setFailedKind(classifyLotPurchaseError(meta.code));
      setStep("failed");
    }
  };

  const handleConfirmClick = () => {
    if (confirmDisabled) return;
    const run = () => void handleConfirmPurchase();
    if (!consentEnabled) {
      run();
      return;
    }
    consentGate.requestProceed(run);
  };

  const handleRefreshLot = async () => {
    await loadPreviewData();
    void onReloadListings?.();
    setStep("actions");
  };

  const handleRetry = () => {
    if (failedKind === "network") {
      void handleConfirmPurchase();
      return;
    }
    void handleRefreshLot();
  };

  const handleOpenOrderBook = () => {
    if (!bookId) return;
    handleClose();
    router.replace(secondaryMarketBookHref(bookId), { scroll: false });
  };

  if (!listing) return null;

  const stepTitle =
    step === "actions"
      ? t("secondaryMarket.lotPurchase.actionsTitle")
      : step === "confirm"
        ? t("secondaryMarket.lotPurchase.confirmTitle")
        : step === "processing"
          ? t("secondaryMarket.lotPurchase.processingTitle")
          : step === "success"
            ? t("secondaryMarket.lotPurchase.successTitle")
            : t(failedTitleKey(failedKind));

  return (
    <>
    <Dialog.Root open={open} onOpenChange={handleOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-127 bg-black/75 backdrop-blur-[3px]",
            "transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0",
          )}
        />
        <Dialog.Popup
          initialFocus={closeRef}
          className={cn(
            "fixed z-128 flex max-h-[92dvh] flex-col bg-[#101010] text-white shadow-[0_-24px_80px_rgba(0,0,0,0.78)]",
            "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "inset-x-0 bottom-0 rounded-t-[24px]",
            "md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[90dvh] md:w-[min(100vw-2rem,520px)] md:-translate-x-1/2 md:-translate-y-1/2 md:overflow-y-auto md:rounded-2xl md:shadow-[0_32px_120px_rgba(0,0,0,0.78)] md:[scrollbar-width:none] md:[-ms-overflow-style:none] md:[&::-webkit-scrollbar]:hidden",
            "max-md:data-starting-style:translate-y-full max-md:data-ending-style:translate-y-full",
            "md:data-starting-style:scale-[0.98] md:data-ending-style:scale-[0.98] md:data-starting-style:opacity-0 md:data-ending-style:opacity-0",
          )}
        >
          <div className="flex shrink-0 flex-col items-center pt-2.5 md:hidden">
            <div className="h-1 w-10 rounded-full bg-white/20" aria-hidden />
          </div>

          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/6 px-5 pb-4 pt-3 md:px-6 md:pt-5">
            <div className="min-w-0 pr-2">
              <Dialog.Title className="text-[17px] font-semibold tracking-tight text-white md:text-lg">
                {stepTitle}
              </Dialog.Title>
              {step === "actions" || step === "confirm" ? (
                <Dialog.Description className="mt-1 text-[12px] leading-relaxed text-zinc-500 md:text-[13px]">
                  {listing.track} · {listing.artist} · {listing.symbol}
                </Dialog.Description>
              ) : null}
            </div>
            {step !== "processing" ? (
              <button
                ref={closeRef}
                type="button"
                aria-label={t("secondaryMarket.aria.close")}
                onClick={handleClose}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            ) : (
              <span className="size-9 shrink-0" aria-hidden />
            )}
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 overscroll-contain px-5 py-4 md:flex-none md:overflow-visible md:px-6 md:py-5",
              "overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            )}
          >
            {step === "actions" ? (
              <LotPurchaseActionsScreen
                t={t}
                listing={listing}
                feePreview={feePreview}
                feeLoading={feeLoading}
                feeError={feeError}
                walletBalance={walletBalance}
                walletLoading={walletLoading}
                walletError={walletError}
                canBuy={canBuy}
                previewBlocking={previewBlocking}
                bookId={bookId}
                onBuyClick={() => setStep("confirm")}
                onOpenOrderBook={handleOpenOrderBook}
                onClose={handleClose}
              />
            ) : null}
            {step === "confirm" ? (
              <LotPurchaseConfirmScreen
                t={t}
                listing={listing}
                feePreview={feePreview}
                walletBalance={walletBalance}
                walletLoading={walletLoading}
                feeError={feeError}
                walletError={walletError}
                hasInsufficientFunds={hasInsufficientFunds}
                balanceAfter={balanceAfter}
                onClose={handleClose}
              />
            ) : null}
            {step === "processing" ? <LotPurchaseProcessingScreen t={t} /> : null}
            {step === "success" && buyResult ? (
              <LotPurchaseSuccessScreen t={t} buyResult={buyResult} receiptError={receiptError} />
            ) : null}
            {step === "failed" ? (
              <LotPurchaseFailedScreen
                t={t}
                failedKind={failedKind}
                listing={listing}
                feePreview={feePreview}
                walletBalance={walletBalance}
              />
            ) : null}
          </div>

          {step === "confirm" ? (
            <div className="shrink-0 border-t border-white/6 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6">
              {consentEnabled ? <EligibilityNotice result={consentGate.eligibility} className="mb-3" /> : null}
              {consentEnabled ? <LegalConsentGateAlert gate={consentGate} variant="dark" className="mb-3" /> : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-10 flex-1 rounded-full bg-white/10 px-5 font-mono text-[12px] font-medium text-zinc-200 transition hover:bg-white/14"
                  onClick={() => setStep("actions")}
                >
                  {t("secondaryMarket.lotPurchase.backToLot")}
                </button>
                <button
                  type="button"
                  disabled={confirmDisabled}
                  className="h-10 flex-1 rounded-full bg-[#B7F500] px-5 font-mono text-[12px] font-semibold text-black transition hover:bg-[#c8ff3d] disabled:opacity-50"
                  onClick={handleConfirmClick}
                >
                  {t("secondaryMarket.lotPurchase.confirm")}
                </button>
              </div>
            </div>
          ) : null}

          {step === "success" && buyResult ? (
            <div className="shrink-0 border-t border-white/6 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <Link
                  href={ROUTES.dashboardPositions}
                  onClick={handleClose}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#B7F500] px-5 font-mono text-[12px] font-semibold text-black transition hover:bg-[#c8ff3d]"
                >
                  {t("secondaryMarket.lotPurchase.openInPortfolio")}
                </Link>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-white/10 px-5 font-mono text-[12px] font-medium text-zinc-200 transition hover:bg-white/14"
                  onClick={handleClose}
                >
                  {t("secondaryMarket.lotPurchase.backToMarket")}
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 px-5 font-mono text-[12px] font-medium text-zinc-300 transition hover:bg-white/6"
                  onClick={async () => {
                    setReceiptError(null);
                    try {
                      const file = await downloadTradeReceipt(authorizedFetch, buyResult.tradeId);
                      const binary = atob(file.contentBase64);
                      const bytes = new Uint8Array(binary.length);
                      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
                      saveBlob(new Blob([bytes], { type: file.mimeType }), file.filename);
                    } catch {
                      setReceiptError(t("secondaryMarket.lotPurchase.receiptFailed"));
                    }
                  }}
                >
                  {t("secondaryMarket.lotPurchase.downloadReceipt")}
                </button>
              </div>
            </div>
          ) : null}

          {step === "failed" ? (
            <div className="shrink-0 border-t border-white/6 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6">
              <div className="flex flex-wrap gap-2">
                {failedKind === "insufficient_funds" ? (
                  <Link
                    href={LOT_PURCHASE_DEPOSIT_PATH}
                    onClick={handleClose}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-[#B7F500] px-5 font-mono text-[12px] font-semibold text-black"
                  >
                    {t("secondaryMarket.lotPurchase.topUpWallet")}
                  </Link>
                ) : null}
                {failedKind === "listing_unavailable" || failedKind === "price_changed" ? (
                  <button
                    type="button"
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-[#B7F500] px-5 font-mono text-[12px] font-semibold text-black"
                    onClick={() => void handleRefreshLot()}
                  >
                    {t("secondaryMarket.lotPurchase.refreshLot")}
                  </button>
                ) : null}
                {failedKind === "network" ? (
                  <button
                    type="button"
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-[#B7F500] px-5 font-mono text-[12px] font-semibold text-black"
                    onClick={() => void handleRetry()}
                  >
                    {t("secondaryMarket.lotPurchase.retry")}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-white/10 px-5 font-mono text-[12px] font-medium text-zinc-200"
                  onClick={handleClose}
                >
                  {t("secondaryMarket.lotPurchase.backToMarket")}
                </button>
              </div>
            </div>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
    {consentEnabled ? (
      <LegalConsentModal
        open={consentGate.consentOpen}
        title={t("secondaryMarket.orderBook.consentTitle")}
        description={t("secondaryMarket.orderBook.consentDescription")}
        items={consentGate.missingItems}
        source="SECONDARY_TRADE"
        authorizedFetch={authorizedFetch}
        onAccepted={consentGate.onConsentAccepted}
        onClose={() => consentGate.dismissConsent()}
      />
    ) : null}
    </>
  );
}
