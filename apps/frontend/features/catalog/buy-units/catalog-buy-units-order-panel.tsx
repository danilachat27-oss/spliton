"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { messageForApiError } from "@/lib/i18n/dictionaries";
import { tf } from "@/lib/i18n/financial-messages";
import { formatUsdtRu } from "@/lib/wallet/format-money";
import {
  createPrimaryOrder,
  downloadPrimaryOrderReceipt,
  fetchPrimaryOrderPreview,
  fetchPrimaryRound,
  getWalletDataSource,
  type PrimaryOrderPreview,
  type PrimaryRoundInfo,
  walletErrorMessage,
} from "@/services/wallet.service";
import { saveBlob } from "@/services/documents.service";
import { LegalConsentModal } from "@/components/compliance/legal-consent-modal";
import { LegalConsentGateAlert } from "@/components/compliance/legal-consent-gate-alert";
import { ComplianceEligibilityBanner } from "@/components/compliance/compliance-eligibility-banner";
import { useLegalConsentGate } from "@/hooks/use-legal-consent-gate";
import { UntMark, UsdtMark } from "@/components/shared/asset-marks";
import { ProductDemoBanner } from "@/components/shared/product-demo-banner";
import { AuthActionPanel } from "@/components/shared/auth-action-panel";

import { formatUsdtFixedRu, formatUnitsCompact } from "@/lib/market-overview/format";
import {
  amountFromUnits,
  clampUnits,
  computeOwnershipPercent,
  computePrimaryPurchase,
  parseRuMoneyInput,
  unitsFromUsdtBudget,
} from "@/lib/market-overview/pricing";
import {
  derivePrimaryBuyTermsFromSsr,
  mergePrimaryBuyTermsFromClientRound,
  mergePrimaryBuyTermsFromPreview,
  quoteFromPreview,
  type PrimaryBuyTerms,
} from "@/lib/catalog/primary-buy-terms";
import { cn } from "@/lib/utils";
import { resolveBuyCheckoutMode } from "@/lib/catalog/buy-checkout-policy";
import { isCatalogBuyBlocked, resolveBlockedCatalogPurchaseState } from "@/lib/catalog/buy-unavailable";
import { loginPathWithNext } from "@/constants/routes";
import { isLiveCatalogEnabled, type CatalogPrimaryRoundPublic } from "@/services/catalog.service";
import type { MarketOverviewRow } from "@/types/market-overview";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
import {
  BuyUnitsPaymentResultModal,
  type BuyUnitsPaymentReceipt,
} from "./buy-units-payment-result-modal";
import { CatalogBuyUnavailablePanel } from "./catalog-buy-unavailable-panel";

const FIELD_BOX = cn(
  "rounded-2xl bg-[#f5f5f6] px-4 py-3.5 transition-[background-color,box-shadow]",
  "focus-within:bg-white focus-within:shadow-[0_6px_28px_-12px_rgba(0,0,0,0.08)]",
);

const PAY_INPUT_CLASS =
  "min-w-0 w-full max-w-[220px] border-0 bg-transparent p-0 text-[28px] font-semibold tabular-nums tracking-tight text-zinc-950 outline-none ring-0 md:max-w-[260px] md:text-[32px]";

function BuyPanelNotice({
  tone,
  className,
  children,
}: {
  tone: "warning" | "error";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl px-3 py-2.5 text-[12px] leading-snug",
        tone === "warning" ? "bg-amber-50 text-amber-900" : "bg-rose-50 text-rose-800",
        className,
      )}
    >
      {children}
    </div>
  );
}

function AssetSelectorPill({ icon, symbol }: { icon: ReactNode; symbol: string }) {
  return (
    <div
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#ebebeb] px-2.5 font-semibold text-zinc-950"
      role="presentation"
    >
      {icon}
      <span className="text-[13px] tracking-tight">{symbol}</span>
    </div>
  );
}

function resolveBlockingMessage(
  code: string | null | undefined,
  locale: Parameters<typeof messageForApiError>[1],
  t: (key: string) => string,
): string | null {
  if (!code) return null;
  if (code === "INSUFFICIENT_BALANCE") return t("catalog.buy.insufficientUsdt");
  if (code === "SOLD_OUT") return messageForApiError("SOLD_OUT", locale);
  if (code === "ROUND_NOT_ACTIVE") return messageForApiError("ROUND_NOT_ACTIVE", locale);
  if (code === "MIN_PURCHASE_UNITS") return messageForApiError("MIN_PURCHASE_UNITS", locale);
  if (code === "MAX_PURCHASE_UNITS") return messageForApiError("MAX_PURCHASE_UNITS", locale);
  if (code === "INSUFFICIENT_PRIMARY_UNITS") return messageForApiError("INSUFFICIENT_PRIMARY_UNITS", locale);
  return messageForApiError(code, locale);
}

export function CatalogBuyUnitsOrderPanel({
  row,
  publicRound,
  purchaseState,
  initialBuyTerms,
  onBuyTermsChange,
}: {
  row: MarketOverviewRow;
  publicRound?: CatalogPrimaryRoundPublic | null;
  purchaseState?: "available" | "sold_out" | "paused" | "unavailable" | null;
  initialBuyTerms?: PrimaryBuyTerms;
  onBuyTermsChange?: (terms: PrimaryBuyTerms) => void;
}) {
  const { authorizedFetch, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useI18n();
  const catalogLive = isLiveCatalogEnabled();
  const walletDataSource = getWalletDataSource();
  const checkoutMode = resolveBuyCheckoutMode(walletDataSource, isAuthenticated, authLoading);
  const mockCheckout = checkoutMode === "mock";
  const live = checkoutMode === "live";
  const buyReturnPath = `/catalog/buy/${encodeURIComponent(row.id)}`;

  const ssrTerms = useMemo(
    () => initialBuyTerms ?? derivePrimaryBuyTermsFromSsr(row, publicRound),
    [initialBuyTerms, publicRound, row],
  );

  const [buyTerms, setBuyTerms] = useState<PrimaryBuyTerms>(ssrTerms);
  const [round, setRound] = useState<PrimaryRoundInfo | null>(() =>
    publicRound?.roundId
      ? {
          roundId: publicRound.roundId,
          releaseId: row.id,
          trackTitle: row.title,
          status: publicRound.status,
          availableUnits: publicRound.availableUnits,
          pricePerUnit: publicRound.pricePerUnit,
          primaryPurchaseFeePct: publicRound.primaryPurchaseFeePct,
        }
      : null,
  );
  const [preview, setPreview] = useState<PrimaryOrderPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [roundError, setRoundError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [payAmountError, setPayAmountError] = useState<string | null>(null);

  const applyTerms = useCallback(
    (updater: (prev: PrimaryBuyTerms) => PrimaryBuyTerms) => {
      setBuyTerms((prev) => {
        const next = updater(prev);
        onBuyTermsChange?.(next);
        return next;
      });
    },
    [onBuyTermsChange],
  );

  useEffect(() => {
    applyTerms(() => ssrTerms);
  }, [ssrTerms, applyTerms]);

  const loadRound = useCallback(async () => {
    if (!live) return;
    setRoundError(null);
    try {
      const r = await fetchPrimaryRound(row.id, authorizedFetch);
      setRound(r);
      applyTerms((prev) => mergePrimaryBuyTermsFromClientRound(prev, r));
    } catch (e) {
      if (publicRound?.roundId) {
        setRoundError(walletErrorMessage(e));
      } else {
        setRound(null);
        setRoundError(walletErrorMessage(e));
      }
    }
  }, [authorizedFetch, applyTerms, live, publicRound?.roundId, row.id]);

  useEffect(() => {
    void loadRound();
  }, [loadRound]);

  const { unitPrice, minUnits, maxUnits, feePct, priceInvalid, totalUnits } = buyTerms;
  const [qty, setQty] = useState(() => Math.max(1, ssrTerms.minUnits));
  const [payBuf, setPayBuf] = useState<string | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [receipt, setReceipt] = useState<BuyUnitsPaymentReceipt | null>(null);
  const consentGate = useLegalConsentGate("PRIMARY_PURCHASE", live);

  useEffect(() => {
    setQty((prev) => clampUnits(prev, minUnits, maxUnits));
  }, [minUnits, maxUnits]);

  const clampedQty = clampUnits(qty, minUnits, maxUnits);
  const ownershipPct = computeOwnershipPercent(clampedQty, totalUnits);

  useEffect(() => {
    if (!live || !round?.roundId || clampedQty < minUnits || priceInvalid || maxUnits < minUnits) {
      setPreview(null);
      setPreviewFailed(false);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    setPreviewFailed(false);
    void fetchPrimaryOrderPreview(round.roundId, clampedQty, authorizedFetch)
      .then((p) => {
        if (cancelled) return;
        setPreview(p);
        applyTerms((prev) => mergePrimaryBuyTermsFromPreview(prev, p));
      })
      .catch(() => {
        if (!cancelled) {
          setPreview(null);
          setPreviewFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authorizedFetch, applyTerms, clampedQty, live, maxUnits, minUnits, priceInvalid, round?.roundId]);

  const previewQuote = preview ? quoteFromPreview(preview) : null;
  const localQuote =
    unitPrice != null && !priceInvalid && clampedQty > 0
      ? computePrimaryPurchase({ unitPrice, units: clampedQty, feePct })
      : null;
  const grossUsdt = previewQuote?.grossAmount ?? localQuote?.grossAmount ?? 0;
  const feeUsdt = previewQuote?.feeAmount ?? localQuote?.feeAmount ?? 0;
  const totalUsdt = previewQuote?.totalPaid ?? localQuote?.totalPaid ?? 0;
  const payShown = payBuf !== null ? payBuf : formatUsdtFixedRu(totalUsdt);

  const unitsBelowMin = clampedQty < minUnits;
  const unitsAboveMax = clampedQty > maxUnits;
  const limitsViolation = unitsBelowMin || unitsAboveMax;

  const blockingLabel = resolveBlockingMessage(preview?.blockingReason, locale, t);
  const insufficientUsdtMsg = t("catalog.buy.insufficientUsdt");
  const isInsufficientUsdt =
    preview?.blockingReason === "INSUFFICIENT_BALANCE" ||
    blockingLabel === insufficientUsdtMsg ||
    Boolean(submitError?.includes(insufficientUsdtMsg));

  const canPurchaseLive =
    live &&
    !priceInvalid &&
    unitPrice != null &&
    round != null &&
    !previewLoading &&
    !previewFailed &&
    preview?.canPurchase === true &&
    !limitsViolation &&
    clampedQty >= minUnits &&
    clampedQty <= maxUnits;

  const canPurchaseMock =
    mockCheckout &&
    !priceInvalid &&
    unitPrice != null &&
    maxUnits >= minUnits &&
    clampedQty >= minUnits &&
    clampedQty <= maxUnits &&
    !payAmountError &&
    grossUsdt >= amountFromUnits(unitPrice, minUnits);

  const canPurchase = live ? canPurchaseLive : canPurchaseMock;

  const otherBlockingLabel =
    blockingLabel && blockingLabel !== insufficientUsdtMsg ? blockingLabel : null;
  const otherSubmitError =
    submitError && !submitError.includes(insufficientUsdtMsg) ? submitError : null;

  if (isCatalogBuyBlocked(purchaseState, catalogLive, row)) {
    return (
      <CatalogBuyUnavailablePanel
        purchaseState={resolveBlockedCatalogPurchaseState(purchaseState, row)}
      />
    );
  }

  if (live && !UUID_RE.test(row.id)) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <p className="font-semibold">{t("catalog.buy.panel.unavailableMock")}</p>
        <p className="mt-2">{t("catalog.buy.panel.unavailableMockHint")}</p>
      </div>
    );
  }

  if (checkoutMode === "auth_loading") {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] md:p-8">
        <p className="text-sm text-zinc-500">{t("catalog.buy.panel.checkingSession")}</p>
      </div>
    );
  }

  if (checkoutMode === "login_required") {
    return (
      <AuthActionPanel
        title={t("auth.login.title")}
        description={t("catalog.buy.loginGate")}
        ctaHref={loginPathWithNext(buyReturnPath)}
        ctaLabel={t("catalog.buy.loginCta")}
        testId="buy-login-gate"
        ctaTestId="buy-login-cta"
        className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] md:p-8"
      />
    );
  }

  if (priceInvalid || unitPrice == null) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] md:p-8">
        <BuyPanelNotice tone="error">{t("catalog.buy.panel.invalidPrice")}</BuyPanelNotice>
      </div>
    );
  }

  if (maxUnits < minUnits) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] md:p-8">
        <p className="text-[15px] leading-relaxed text-zinc-600">
          {tf(t("catalog.buy.panel.noUnits"), {
            title: row.title,
            availableUnits: formatUnitsCompact(0),
            unitPrice: `${formatUsdtFixedRu(unitPrice)} ${t("catalog.buy.panel.perUnit")}`,
          })}
        </p>
      </div>
    );
  }

  const executePurchase = async () => {
    setSubmitError(null);
    if (!canPurchase) return;

    if (live) {
      if (!round) {
        setSubmitError(roundError ?? t("catalog.buy.panel.roundUnavailable"));
        return;
      }
      if (preview && !preview.canPurchase) {
        setSubmitError(blockingLabel ?? t("catalog.buy.panel.unavailable"));
        return;
      }
      setSubmitting(true);
      try {
        const result = await createPrimaryOrder(round.roundId, clampedQty, authorizedFetch);
        setReceipt({
          releaseTitle: row.title,
          artist: row.artist,
          symbol: row.symbol,
          releaseId: row.id,
          units: Number(result.units),
          unitPriceUsdt: Number(result.pricePerUnit),
          totalUsdt: Number(result.grossAmount),
          paidAtIso: new Date().toISOString(),
          transactionId: result.orderId,
          orderId: result.orderId,
          status: "approved",
          useServerReceipt: true,
        });
        setIsResultOpen(true);
        void loadRound();
        void consentGate.refresh();
      } catch (e) {
        setSubmitError(walletErrorMessage(e));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!mockCheckout) return;

    setReceipt({
      releaseTitle: row.title,
      artist: row.artist,
      symbol: row.symbol,
      releaseId: row.id,
      units: clampedQty,
      unitPriceUsdt: unitPrice,
      totalUsdt,
      paidAtIso: new Date().toISOString(),
      transactionId: `DEMO-${row.id}`,
      status: "approved",
    });
    setIsResultOpen(true);
  };

  const handlePay = () => {
    consentGate.requestProceed(() => void executePurchase());
  };

  const minPay = formatUsdtFixedRu(amountFromUnits(unitPrice, minUnits));
  const maxPay = formatUsdtFixedRu(amountFromUnits(unitPrice, maxUnits));

  const localLimitError = limitsViolation
    ? unitsBelowMin
      ? tf(t("catalog.buy.panel.minUnitsRequired"), { min: String(minUnits) })
      : tf(t("catalog.buy.panel.maxUnitsExceeded"), { max: String(maxUnits) })
    : null;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] md:p-7">
      {mockCheckout ? (
        <ProductDemoBanner messageKey="catalog.buy.panel.demoMode" className="mb-4" />
      ) : null}
      <div className={FIELD_BOX}>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-zinc-500">{t("catalog.buy.panel.youPay")}</p>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              className={cn(PAY_INPUT_CLASS, "mt-1 block w-full max-w-none")}
              value={payShown}
              onFocus={() => setPayBuf(formatUsdtFixedRu(totalUsdt))}
              onChange={(e) => {
                setPayBuf(e.target.value);
                setPayAmountError(null);
              }}
              onBlur={() => {
                const parsed = parseRuMoneyInput(payBuf ?? "");
                if (parsed !== null) {
                  const nextUnits = unitsFromUsdtBudget(unitPrice, parsed, maxUnits, minUnits);
                  if (nextUnits <= 0) {
                    setPayAmountError(t("catalog.buy.panel.insufficientAmount"));
                  } else {
                    setPayAmountError(null);
                    setQty(nextUnits);
                  }
                }
                setPayBuf(null);
              }}
              aria-label={t("catalog.buy.panel.payAmountAria")}
            />
          </div>
          <AssetSelectorPill icon={<UsdtMark />} symbol="USDT" />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-zinc-400">
          {minPay} — {maxPay} USDT
        </p>
      </div>

      <p className="mt-3 text-center text-[11px] leading-snug text-zinc-500">
        {tf(t("catalog.buy.panel.unitPriceFee"), {
          price: formatUsdtFixedRu(unitPrice),
          fee: String(feePct),
        })}
      </p>
      {ownershipPct != null ? (
        <p className="mt-1 text-center text-[11px] text-zinc-500">
          {tf(t("catalog.buy.panel.ownershipHint"), { pct: String(ownershipPct) })}
        </p>
      ) : null}
      {live && round ? (
        <p className="mt-1 text-center text-[11px] text-zinc-500">
          {tf(t("catalog.buy.panel.totalDebit"), {
            total: formatUsdtRu(String(totalUsdt)),
            fee: formatUsdtRu(String(feeUsdt)),
            loading: previewLoading ? t("catalog.buy.panel.totalDebitLoading") : "",
            balance: preview?.walletBalance
              ? tf(t("catalog.buy.panel.totalDebitBalance"), {
                  balance: formatUsdtRu(preview.walletBalance),
                })
              : "",
          })}
        </p>
      ) : null}
      {previewLoading && live ? (
        <BuyPanelNotice tone="warning" className="mt-3">
          {t("catalog.buy.panel.previewLoading")}
        </BuyPanelNotice>
      ) : null}
      {previewFailed && live ? (
        <BuyPanelNotice tone="error" className="mt-3">
          {t("catalog.buy.panel.previewFailed")}
        </BuyPanelNotice>
      ) : null}
      {payAmountError ? (
        <BuyPanelNotice tone="warning" className="mt-3">
          {payAmountError}
        </BuyPanelNotice>
      ) : null}
      {localLimitError ? (
        <BuyPanelNotice tone="warning" className="mt-3">
          {localLimitError}
        </BuyPanelNotice>
      ) : null}
      {isInsufficientUsdt && live ? (
        <BuyPanelNotice tone="warning" className="mt-3">
          <p>{insufficientUsdtMsg}</p>
          <Link
            href="/assets/payouts/deposit"
            className="mt-1.5 inline-block font-medium underline decoration-amber-400/70 underline-offset-2 hover:decoration-amber-600"
          >
            {t("catalog.buy.panel.topUpBalance")}
          </Link>
        </BuyPanelNotice>
      ) : null}
      {otherBlockingLabel && live ? (
        <BuyPanelNotice tone="warning" className="mt-3">
          {otherBlockingLabel}
        </BuyPanelNotice>
      ) : null}
      {roundError && live ? (
        <BuyPanelNotice tone="error" className="mt-3">
          {roundError}
        </BuyPanelNotice>
      ) : null}
      {otherSubmitError ? (
        <BuyPanelNotice tone="error" className="mt-3">
          {otherSubmitError}
        </BuyPanelNotice>
      ) : null}

      <p className="mt-4 rounded-xl bg-zinc-50 px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
        {t("catalog.buy.panel.disclaimer")}
      </p>

      <div className="mt-3">
        <div className={FIELD_BOX}>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-zinc-500">{t("catalog.buy.panel.youReceive")}</p>
              <input
                type="number"
                inputMode="numeric"
                min={minUnits}
                max={maxUnits}
                value={clampedQty > 0 ? clampedQty : ""}
                onChange={(e) => {
                  setPayBuf(null);
                  setPayAmountError(null);
                  const n = Number.parseInt(e.target.value, 10);
                  if (Number.isNaN(n)) {
                    setQty(minUnits);
                    return;
                  }
                  setQty(n);
                }}
                className="mt-1 block min-w-0 w-full max-w-none border-0 bg-transparent p-0 text-[28px] font-semibold tabular-nums tracking-tight text-zinc-950 outline-none ring-0 [appearance:textfield] md:text-[32px] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-label={t("catalog.buy.panel.unitsAria")}
              />
            </div>
            <AssetSelectorPill icon={<UntMark />} symbol="UNT" />
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            {tf(t("catalog.buy.panel.availableToBuy"), {
              units: formatUnitsCompact(maxUnits),
            })}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            {tf(t("catalog.buy.panel.unitsRange"), {
              min: String(minUnits),
              max: String(maxUnits),
            })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setPayBuf(null);
                setPayAmountError(null);
                setQty(Math.max(minUnits, Math.floor(maxUnits * 0.25)));
              }}
              className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => {
                setPayBuf(null);
                setPayAmountError(null);
                setQty(Math.max(minUnits, Math.floor(maxUnits * 0.5)));
              }}
              className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => {
                setPayBuf(null);
                setPayAmountError(null);
                setQty(maxUnits);
              }}
              className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Max
            </button>
          </div>
        </div>
      </div>

      {live ? <LegalConsentGateAlert gate={consentGate} className="mt-4" /> : null}
      {live ? <ComplianceEligibilityBanner result={consentGate.eligibility} className="mt-4" /> : null}

      <button
        type="button"
        onClick={handlePay}
        disabled={
          submitting ||
          (live && !round) ||
          !canPurchase ||
          (live && consentGate.hasBlockingEligibility) ||
          (live && (consentGate.isChecking || consentGate.checkError))
        }
        className="mt-5 h-12 w-full rounded-2xl bg-zinc-950 text-[14px] font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-50"
        data-testid="buy-submit-button"
      >
        {submitting
          ? t("catalog.buy.processing")
          : mockCheckout
            ? t("catalog.buy.submitDemo")
            : t("catalog.buy.submit")}
      </button>

      <LegalConsentModal
        open={consentGate.consentOpen}
        title={t("catalog.buy.panel.confirmTitle")}
        description={t("catalog.buy.panel.confirmDesc")}
        items={consentGate.missingItems}
        source="PRIMARY_PURCHASE"
        authorizedFetch={authorizedFetch}
        onClose={() => consentGate.dismissConsent()}
        onAccepted={consentGate.onConsentAccepted}
      />

      <BuyUnitsPaymentResultModal
        open={isResultOpen}
        onOpenChange={setIsResultOpen}
        receipt={receipt}
        onDownloadServerReceipt={
          live
            ? async (orderId) => {
                const file = await downloadPrimaryOrderReceipt(authorizedFetch, orderId);
                const binary = atob(file.contentBase64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
                saveBlob(new Blob([bytes], { type: file.mimeType }), file.filename);
              }
            : undefined
        }
      />
    </div>
  );
}
