"use client";

import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { secondaryMarketBookHref } from "@/constants/dashboard/secondary-market";
import { tf } from "@/lib/i18n/financial-messages";
import { formatNumber } from "@/lib/i18n/formatters";
import {
  classifySellListingError,
  extractApiErrorCode,
} from "@/lib/secondary-market/classify-sell-listing-error";
import { formatUsdtRu } from "@/lib/wallet/format-money";
import { getPrimaryUnitPriceUsdt, roundUsdt2 } from "@/lib/market-overview/pricing";
import { cn } from "@/lib/utils";
import {
  createListing,
  fetchFeePreview,
  fetchUserHoldings,
  type FeePreviewDto,
} from "@/services/secondary-market.service";
import { getWalletDataSource } from "@/services/wallet.service";
import { useLegalConsentGate } from "@/hooks/use-legal-consent-gate";
import { LegalConsentModal } from "@/components/compliance/legal-consent-modal";
import { LegalConsentGateAlert } from "@/components/compliance/legal-consent-gate-alert";
import { EligibilityNotice } from "@/components/compliance/eligibility-notice";
import type { MarketOverviewRow } from "@/types/market-overview";

const FIELD_BOX = cn(
  "rounded-2xl bg-neutral-50 px-4 py-3.5 transition-[background-color,box-shadow]",
  "focus-within:bg-white focus-within:shadow-[0_6px_28px_-12px_rgba(0,0,0,0.08)]",
);

const BIG_INPUT =
  "min-w-0 w-full max-w-[220px] border-0 bg-transparent p-0 text-[26px] font-semibold tabular-nums tracking-tight text-neutral-950 outline-none ring-0 md:max-w-[260px] md:text-[30px]";

type FlowStep = null | "confirm" | "processing" | "success" | "failed";

type Props = {
  row: MarketOverviewRow;
  heldUnits: number;
  secondaryTradeHref: string;
};

function sellFailedTitleKey(kind: ReturnType<typeof classifySellListingError>): string {
  switch (kind) {
    case "insufficient_units":
      return "sell.failedInsufficientUnitsTitle";
    case "invalid_price":
      return "sell.failedInvalidPriceTitle";
    case "network":
      return "sell.failedNetworkTitle";
    default:
      return "sell.failedGenericTitle";
  }
}

function sellFailedBodyKey(kind: ReturnType<typeof classifySellListingError>): string {
  switch (kind) {
    case "insufficient_units":
      return "sell.failedInsufficientUnitsBody";
    case "invalid_price":
      return "sell.failedInvalidPriceBody";
    case "network":
      return "sell.failedNetworkBody";
    default:
      return "sell.failedGenericBody";
  }
}

export function AssetsSellUnitsOrderPanel({ row, heldUnits, secondaryTradeHref }: Props) {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { t, locale } = useI18n();
  const isLive = getWalletDataSource() === "live" && isAuthenticated;
  const consentGate = useLegalConsentGate("SECONDARY_TRADE", isLive);

  const primaryRef = getPrimaryUnitPriceUsdt(row);
  const suggestedAsk = useMemo(() => roundUsdt2(primaryRef * 1.015), [primaryRef]);
  const [unitPrice, setUnitPrice] = useState(suggestedAsk);
  const [qty, setQty] = useState(() => Math.min(heldUnits, Math.max(1, Math.floor(heldUnits * 0.1) || 1)));
  const [releaseUuid, setReleaseUuid] = useState<string | null>(null);
  const [liveHeldUnits, setLiveHeldUnits] = useState(heldUnits);
  const [feePreview, setFeePreview] = useState<FeePreviewDto | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feePreviewFailed, setFeePreviewFailed] = useState(false);
  const [holdingsLoadFailed, setHoldingsLoadFailed] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>(null);
  const [failedKind, setFailedKind] = useState<ReturnType<typeof classifySellListingError>>("generic");

  const effectiveHeld = isLive ? liveHeldUnits : heldUnits;
  const clampedQty = Math.min(Math.max(1, qty), effectiveHeld);
  const totalUsdt = roundUsdt2(unitPrice * clampedQty);
  const feeRateMock = 0.002;
  const feeUsdt = feePreview
    ? roundUsdt2(Number(feePreview.feeAmount))
    : roundUsdt2(totalUsdt * feeRateMock);
  const netReceiveUsdt = feePreview
    ? roundUsdt2(Number(feePreview.sellerNet))
    : roundUsdt2(Math.max(0, totalUsdt - feeUsdt));
  const feePctLabel = feePreview?.feePct ?? "1";

  const previewBlocking =
    isLive &&
    Boolean(releaseUuid) &&
    clampedQty > 0 &&
    unitPrice > 0 &&
    !feeLoading &&
    feePreviewFailed;

  useEffect(() => {
    if (!isLive) return;
    setHoldingsLoadFailed(false);
    void (async () => {
      try {
        const holdings = await fetchUserHoldings(authorizedFetch);
        const match = holdings.items.find((h) => h.symbol === row.symbol);
        if (match) {
          setReleaseUuid(match.releaseId);
          setLiveHeldUnits(Number(match.unitsAvailable));
        } else {
          setHoldingsLoadFailed(true);
        }
      } catch {
        setHoldingsLoadFailed(true);
      }
    })();
  }, [authorizedFetch, isLive, row.symbol]);

  useEffect(() => {
    if (!isLive || !releaseUuid) {
      setFeePreview(null);
      setFeePreviewFailed(false);
      return;
    }
    setFeeLoading(true);
    setFeePreviewFailed(false);
    void (async () => {
      try {
        const preview = await fetchFeePreview(authorizedFetch, {
          releaseId: releaseUuid,
          units: clampedQty,
          pricePerUnit: unitPrice,
        });
        setFeePreview(preview);
      } catch {
        setFeePreview(null);
        setFeePreviewFailed(true);
      } finally {
        setFeeLoading(false);
      }
    })();
  }, [authorizedFetch, clampedQty, isLive, releaseUuid, unitPrice]);

  const bookHref = secondaryMarketBookHref(row.id);
  const flowOpen = flowStep != null;

  async function runConfirmListing() {
    setFlowStep("processing");
    try {
      if (isLive) {
        if (!releaseUuid) {
          setFailedKind("generic");
          setFlowStep("failed");
          return;
        }
        await createListing(authorizedFetch, {
          releaseId: releaseUuid,
          units: clampedQty,
          pricePerUnit: unitPrice,
        });
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
      setFlowStep("success");
    } catch (e) {
      setFailedKind(classifySellListingError(extractApiErrorCode(e)));
      setFlowStep("failed");
    }
  }

  function handleConfirmListing() {
    consentGate.requestProceed(() => void runConfirmListing());
  }

  const closeFlow = () => setFlowStep(null);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.12)] ring-1 ring-neutral-100 md:p-7">
      <div className="mb-5 rounded-2xl bg-neutral-50 px-3.5 py-3 ring-1 ring-neutral-100/80">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{t("sell.orderTitle")}</p>
        <p className="mt-1 truncate text-[15px] font-semibold text-neutral-950">{row.title}</p>
        <p className="mt-0.5 truncate text-[12px] text-neutral-600">{row.artist}</p>
        <p className="mt-2 font-mono text-[13px] tabular-nums text-neutral-800">
          <span className="text-neutral-500">{t("sell.symbol")}</span> {row.symbol}
          <span className="mx-2 text-neutral-300" aria-hidden>
            ·
          </span>
          <span className="text-neutral-500">{t("sell.available")}</span> {formatNumber(effectiveHeld, locale)} UNT
        </p>
        <p className="mt-1.5 text-[11px] leading-snug text-neutral-500">
          {t("sell.primaryRef")}{" "}
          <span className="font-mono text-neutral-700">{formatUsdtRu(primaryRef, "USDT", locale)}</span> / UNT.
        </p>
      </div>

      {holdingsLoadFailed && isLive ? (
        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950" role="alert">
          {t("sell.feePreviewError")}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setUnitPrice(suggestedAsk)}
          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-neutral-800 transition hover:bg-neutral-50"
        >
          {tf(t("sell.applySuggested"), { price: formatUsdtRu(suggestedAsk, "USDT", locale).replace(/ USDT$/, "") })}
        </button>
      </div>

      <div className={FIELD_BOX}>
        <p className="text-[12px] font-medium text-neutral-500">{t("sell.priceLabel")}</p>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={0.01}
            step={0.01}
            value={unitPrice}
            onChange={(e) => {
              const n = Number.parseFloat(e.target.value);
              if (!Number.isFinite(n) || n <= 0) return;
              setUnitPrice(roundUsdt2(n));
            }}
            className={BIG_INPUT}
            aria-label={t("sell.priceAria")}
          />
          <span className="shrink-0 rounded-xl bg-neutral-100/90 px-2.5 py-1.5 text-[12px] font-semibold text-neutral-800">
            USDT
          </span>
        </div>
      </div>

      <div className="my-4 flex justify-center" aria-hidden>
        <div className="h-px w-12 rounded-full bg-neutral-200" />
      </div>

      <div className={FIELD_BOX}>
        <p className="text-[12px] font-medium text-neutral-500">{t("sell.qtyLabel")}</p>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={effectiveHeld}
            value={qty}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              if (Number.isNaN(n)) {
                setQty(1);
                return;
              }
              setQty(Math.min(Math.max(1, n), effectiveHeld));
            }}
            className={cn(
              BIG_INPUT,
              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            )}
            aria-label={t("sell.qtyAria")}
          />
          <span className="shrink-0 rounded-xl bg-neutral-100/90 px-2.5 py-1.5 text-[12px] font-semibold text-neutral-800">
            UNT
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-neutral-200 bg-white px-4 py-4 ring-1 ring-neutral-100">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{t("sell.summary")}</p>
        <dl className="mt-3 space-y-2.5 font-mono text-[13px] tabular-nums">
          <div className="flex items-baseline justify-between gap-3 border-b border-neutral-100 pb-2">
            <dt className="text-[12px] font-sans font-medium text-neutral-600">{t("sell.gross")}</dt>
            <dd className="text-right font-semibold text-neutral-950">{formatUsdtRu(totalUsdt, "USDT", locale)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-b border-neutral-100 pb-2">
            <dt className="text-[12px] font-sans font-medium text-neutral-600">
              {tf(t("sell.fee"), { pct: feePctLabel })}
              {feeLoading ? <SplitonLoader size="xxs" variant="dark" className="shrink-0" /> : null}
            </dt>
            <dd className="text-right text-neutral-800">−{formatUsdtRu(feeUsdt, "USDT", locale)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 pt-0.5">
            <dt className="text-[12px] font-sans font-semibold text-neutral-800">{t("sell.net")}</dt>
            <dd className="text-right text-lg font-semibold text-neutral-950">{formatUsdtRu(netReceiveUsdt, "USDT", locale)}</dd>
          </div>
        </dl>
        {previewBlocking ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950" role="alert">
            {t("sell.feePreviewError")}
          </p>
        ) : null}
      </div>

      {isLive ? <LegalConsentGateAlert gate={consentGate} className="mb-4" /> : null}
      {isLive ? <EligibilityNotice result={consentGate.eligibility} className="mb-4" /> : null}

      <button
        type="button"
        onClick={() => setFlowStep("confirm")}
        disabled={
          isLive &&
          (!releaseUuid ||
            previewBlocking ||
            holdingsLoadFailed ||
            consentGate.isChecking ||
            consentGate.checkError ||
            consentGate.hasBlockingEligibility)
        }
        className="mt-6 h-12 w-full rounded-2xl bg-neutral-900 text-[14px] font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
      >
        {tf(t("sell.submit"), { symbol: row.symbol })}
      </button>
      <p className="mt-2.5 text-center text-[11px] leading-snug text-neutral-500">
        {isLive ? t("sell.submitHintLive") : t("sell.submitHintDemo")}{" "}
        <Link href={secondaryTradeHref} className="font-medium text-neutral-800 underline decoration-neutral-300 underline-offset-2">
          {t("sell.myOrders")}
        </Link>
      </p>

      <Dialog.Root
        open={flowOpen}
        onOpenChange={(open) => {
          if (!open && flowStep !== "processing") closeFlow();
        }}
        modal
      >
        <Dialog.Portal>
          <Dialog.Backdrop
            className={cn(
              "fixed inset-0 z-[127] bg-black/60 backdrop-blur-[2px]",
              flowStep === "processing" && "pointer-events-none",
            )}
          />
          <Dialog.Popup
            className="fixed left-1/2 top-1/2 z-[128] w-[min(100vw-1.5rem,460px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
            onKeyDown={(e) => {
              if (flowStep === "processing" && e.key === "Escape") e.preventDefault();
            }}
          >
            {flowStep === "confirm" ? (
              <>
                <Dialog.Title className="text-lg font-semibold">{t("sell.confirmTitle")}</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-neutral-600">
                  {tf(t("sell.confirmBody"), {
                    qty: String(clampedQty),
                    price: formatUsdtRu(unitPrice, "USDT", locale).replace(/ USDT$/, ""),
                    net: formatUsdtRu(netReceiveUsdt, "USDT", locale).replace(/ USDT$/, ""),
                  })}
                </Dialog.Description>
                <div className="mt-5 flex gap-2">
                  <Dialog.Close className="flex-1 rounded-xl border py-2.5 text-sm font-semibold">{t("common.cancel")}</Dialog.Close>
                  <button
                    type="button"
                    onClick={handleConfirmListing}
                    disabled={
                      consentGate.isChecking ||
                      consentGate.checkError ||
                      consentGate.hasBlockingEligibility
                    }
                    className="flex-1 rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white"
                  >
                    {t("sell.confirmSubmit")}
                  </button>
                </div>
              </>
            ) : null}

            {flowStep === "processing" ? (
              <div className="flex flex-col items-center py-4 text-center">
                <SplitonLoader size="md" variant="dark" />
                <Dialog.Title className="mt-5 text-lg font-semibold">{t("sell.processingTitle")}</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-neutral-600">{t("sell.processingBody")}</Dialog.Description>
              </div>
            ) : null}

            {flowStep === "success" ? (
              <>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <Dialog.Title className="text-lg font-semibold">{t("sell.successTitle")}</Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-neutral-600">{t("sell.successBody")}</Dialog.Description>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 font-mono text-[13px] tabular-nums text-neutral-800">
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">{t("sell.successUnits")}</dt>
                    <dd>
                      {formatNumber(clampedQty, locale)} UNT · {row.symbol}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">{t("sell.successPrice")}</dt>
                    <dd>{formatUsdtRu(unitPrice, "USDT", locale)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">{t("sell.successFee")}</dt>
                    <dd>−{formatUsdtRu(feeUsdt, "USDT", locale)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 font-semibold">
                    <dt className="text-neutral-700">{t("sell.successNet")}</dt>
                    <dd>{formatUsdtRu(netReceiveUsdt, "USDT", locale)}</dd>
                  </div>
                </dl>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Dialog.Close className="rounded-xl border px-4 py-2 text-sm font-semibold">{t("sell.ok")}</Dialog.Close>
                  <Link
                    href={secondaryTradeHref}
                    onClick={closeFlow}
                    className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {t("sell.openMyOrders")}
                  </Link>
                  <Link href={bookHref} onClick={closeFlow} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold">
                    {t("sell.orderBook")}
                  </Link>
                </div>
              </>
            ) : null}

            {flowStep === "failed" ? (
              <>
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <Dialog.Title className="text-lg font-semibold">{t(sellFailedTitleKey(failedKind))}</Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-neutral-600">{t(sellFailedBodyKey(failedKind))}</Dialog.Description>
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={closeFlow}
                    className="flex-1 rounded-xl border py-2.5 text-sm font-semibold"
                  >
                    {t("sell.editOrder")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlowStep("confirm")}
                    className="flex-1 rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white"
                  >
                    {t("sell.retry")}
                  </button>
                </div>
              </>
            ) : null}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {isLive ? (
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
    </div>
  );
}
