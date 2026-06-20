"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Info,
  XCircle,
} from "@/lib/lucide";

import { SplitonLoader } from "@/components/ui/spliton-loader";
import { smExchange } from "@/components/dashboard/secondary-market/secondary-market-exchange-styles";
import {
  smTableActionReleasePill,
  smTableActionSecondaryPill,
} from "@/components/dashboard/secondary-market/secondary-market-table-action-styles";
import { secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import { analyticsReleaseDetailPath, secondaryMarketListingInfoPath } from "@/constants/routes";
import { tf } from "@/lib/i18n/financial-messages";
import type { AdaptedListing } from "@/lib/secondary-market/secondary-market-adapter";
import type { LotPurchaseFailedKind } from "@/lib/secondary-market/classify-lot-purchase-error";
import { formatUsdtRu } from "@/lib/wallet/format-money";
import { cn } from "@/lib/utils";
import type { BuyTradeResult, FeePreviewDto } from "@/services/secondary-market.service";

import { BreakdownRow } from "./secondary-market-lot-purchase-breakdown";
import {
  failedBodyKey,
  failedTitleKey,
  formatLotMessage,
  LOT_PURCHASE_DEPOSIT_PATH,
} from "./secondary-market-lot-purchase-flow-utils";

const actionRow = "inline-flex h-11 w-full items-center justify-center gap-2";

type TFn = (key: string) => string;

type ActionsScreenProps = {
  t: TFn;
  listing: AdaptedListing;
  feePreview: FeePreviewDto | null;
  feeLoading: boolean;
  feeError: string | null;
  walletBalance: string | null;
  walletLoading: boolean;
  walletError: string | null;
  canBuy: boolean;
  previewBlocking: boolean;
  bookId: string | null;
  onBuyClick: () => void;
  onOpenOrderBook: () => void;
  onClose: () => void;
};

export function LotPurchaseActionsScreen({
  t,
  listing,
  feePreview,
  feeLoading,
  feeError,
  walletBalance,
  walletLoading,
  walletError,
  canBuy,
  previewBlocking,
  bookId,
  onBuyClick,
  onOpenOrderBook,
  onClose,
}: ActionsScreenProps) {
  return (
    <div className="space-y-3.5">
      <div className="rounded-xl bg-white/4 px-4 py-3.5 ring-1 ring-white/8">
        <p className="font-mono text-[11px] text-zinc-500">
          {tf(t("secondaryMarket.lotPurchase.summaryLine"), {
            units: String(listing.unitsAvailable),
            price: formatUsdtRu(String(listing.pricePerUnit)).replace(/ USDT$/, ""),
          })}
        </p>
        <dl className="mt-3 space-y-0.5">
          <BreakdownRow
            label={t("secondaryMarket.lotPurchase.lotGross")}
            value={formatUsdtRu(feePreview?.grossAmount ?? String(listing.listingValueUsdt))}
          />
          {feeLoading ? (
            <p className="flex items-center gap-2 py-1 font-mono text-[11px] text-zinc-500">
              <SplitonLoader size="xxs" variant="light" />
              {t("secondaryMarket.lotPurchase.feePreviewLoading")}
            </p>
          ) : feePreview ? (
            <BreakdownRow
              label={formatLotMessage(t("secondaryMarket.lotPurchase.feeLine"), { pct: feePreview.feePct })}
              value={formatUsdtRu(feePreview.feeAmount)}
            />
          ) : null}
          <BreakdownRow
            label={t("secondaryMarket.lotPurchase.buyerTotal")}
            value={formatUsdtRu(feePreview?.buyerTotal ?? String(listing.listingValueUsdt))}
            highlight
          />
          {walletLoading ? (
            <p className="flex items-center gap-2 py-1 font-mono text-[11px] text-zinc-500">
              <SplitonLoader size="xxs" variant="light" />
              {t("secondaryMarket.lotPurchase.walletLoading")}
            </p>
          ) : walletBalance != null ? (
            <BreakdownRow
              label={t("secondaryMarket.lotPurchase.walletAvailable")}
              value={formatUsdtRu(walletBalance)}
            />
          ) : null}
        </dl>
        {feeError ? (
          <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200" role="alert">
            {feeError}
          </p>
        ) : null}
        {walletError ? (
          <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100" role="alert">
            {walletError}
          </p>
        ) : null}
      </div>

      <p className="text-[11px] leading-relaxed text-zinc-600">{t("secondaryMarket.lotPurchase.lotExplain")}</p>

      {canBuy ? (
        <button
          type="button"
          disabled={previewBlocking || !feePreview}
          onClick={onBuyClick}
          className={cn(smExchange.submitBuy, actionRow, "disabled:opacity-50")}
        >
          <Banknote className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          {t("secondaryMarket.listings.buyLot")}
        </button>
      ) : (
        <p className="rounded-lg bg-white/4 px-3 py-2.5 text-[12px] text-zinc-500" role="status">
          {t("secondaryMarket.lotPurchase.cannotBuyNote")}
        </p>
      )}

      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
        {t("secondaryMarket.lotPurchase.secondaryActions")}
      </p>
      <div className="space-y-2">
        {bookId ? (
          <button
            type="button"
            title={t("secondaryMarket.listings.modalTooltipOrderBook")}
            onClick={onOpenOrderBook}
            className={cn(smTableActionReleasePill, actionRow, "text-[13px]")}
          >
            <BookOpen className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            {t("secondaryMarket.actions.openOrderBook")}
          </button>
        ) : (
          <Link
            href={secondaryMarketHref("market")}
            title={t("secondaryMarket.listings.modalTooltipGoToMarket")}
            className={cn(smTableActionReleasePill, actionRow, "text-[13px]")}
            onClick={onClose}
          >
            <BookOpen className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            {t("secondaryMarket.trade.openMarket")}
          </Link>
        )}
        <Link
          href={`${analyticsReleaseDetailPath(listing.analyticsCatalogId)}?from=secondary`}
          scroll={false}
          title={t("secondaryMarket.listings.modalTooltipRelease")}
          className={cn(smTableActionSecondaryPill, actionRow, "text-[12px]")}
          onClick={onClose}
        >
          <ExternalLink className="size-3.5 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
          {t("secondaryMarket.actions.openRelease")}
        </Link>
        <Link
          href={secondaryMarketListingInfoPath(listing.id)}
          title={t("secondaryMarket.listings.modalTooltipListing")}
          className={cn(smTableActionSecondaryPill, actionRow, "text-[12px]")}
          onClick={onClose}
        >
          <Info className="size-3.5 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
          {t("secondaryMarket.listingDetail.moreAboutLot")}
        </Link>
      </div>
      <p className="text-[11px] leading-relaxed text-zinc-600">
        {tf(t("secondaryMarket.listings.modalLegendHint"), {
          book: t("secondaryMarket.listings.modalLegendBook"),
          lot: t("secondaryMarket.listings.modalLegendLot"),
          release: t("secondaryMarket.listings.modalLegendRelease"),
        })}
      </p>
    </div>
  );
}

type ConfirmScreenProps = {
  t: TFn;
  listing: AdaptedListing;
  feePreview: FeePreviewDto | null;
  walletBalance: string | null;
  walletLoading: boolean;
  feeError: string | null;
  walletError: string | null;
  hasInsufficientFunds: boolean;
  balanceAfter: number | null;
  onClose: () => void;
};

export function LotPurchaseConfirmScreen({
  t,
  listing,
  feePreview,
  walletBalance,
  walletLoading,
  feeError,
  walletError,
  hasInsufficientFunds,
  balanceAfter,
  onClose,
}: ConfirmScreenProps) {
  const showInsufficientWarning = hasInsufficientFunds && walletBalance != null;

  return (
    <div className="space-y-4">
      <dl className="rounded-xl bg-white/4 px-4 py-3.5 ring-1 ring-white/8">
        <BreakdownRow label={t("secondaryMarket.lotPurchase.summaryUnits")} value={listing.unitsAvailable} />
        <BreakdownRow
          label={t("secondaryMarket.listingDetail.pricePerUnit")}
          value={formatUsdtRu(String(listing.pricePerUnit))}
        />
        <BreakdownRow
          label={t("secondaryMarket.lotPurchase.lotGross")}
          value={formatUsdtRu(feePreview?.grossAmount ?? String(listing.listingValueUsdt))}
        />
        <BreakdownRow
          label={formatLotMessage(t("secondaryMarket.lotPurchase.feeLine"), { pct: feePreview?.feePct ?? "-" })}
          value={formatUsdtRu(feePreview?.feeAmount ?? "0")}
        />
        <div className="border-t border-white/10 pt-2">
          <BreakdownRow
            label={t("secondaryMarket.lotPurchase.buyerTotal")}
            value={formatUsdtRu(feePreview?.buyerTotal ?? String(listing.listingValueUsdt))}
            highlight
          />
        </div>
        <BreakdownRow
          label={t("secondaryMarket.lotPurchase.walletAvailable")}
          value={
            walletLoading
              ? t("secondaryMarket.lotPurchase.walletLoading")
              : walletBalance != null
                ? formatUsdtRu(walletBalance)
                : "-"
          }
        />
        {balanceAfter != null && !hasInsufficientFunds ? (
          <BreakdownRow
            label={t("secondaryMarket.lotPurchase.balanceAfter")}
            value={formatUsdtRu(String(Math.max(0, balanceAfter)))}
          />
        ) : null}
      </dl>

      <p className="text-[11px] leading-relaxed text-zinc-500">
        {t("secondaryMarket.listings.confirmPurchaseNote")}
      </p>

      {feeError ? (
        <p className="rounded-xl bg-rose-500/10 px-3 py-2.5 text-[12px] text-rose-200" role="alert">
          {feeError}
        </p>
      ) : null}
      {walletError ? (
        <p className="rounded-xl bg-amber-500/10 px-3 py-2.5 text-[12px] text-amber-100" role="alert">
          {walletError}
        </p>
      ) : null}

      {showInsufficientWarning ? (
        <div className="rounded-xl bg-amber-500/12 px-4 py-3.5 ring-1 ring-amber-400/20" role="alert">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
            <div>
              <p className="text-[13px] font-semibold text-amber-50">
                {t("secondaryMarket.lotPurchase.insufficientFundsTitle")}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-amber-100/90">
                {tf(t("secondaryMarket.lotPurchase.insufficientFundsBody"), {
                  total: formatUsdtRu(feePreview?.buyerTotal ?? String(listing.listingValueUsdt)),
                  balance: formatUsdtRu(walletBalance),
                })}
              </p>
              <Link
                href={LOT_PURCHASE_DEPOSIT_PATH}
                onClick={onClose}
                className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-amber-400 px-4 text-[12px] font-semibold text-black transition hover:bg-amber-300"
              >
                {t("secondaryMarket.lotPurchase.topUpWallet")}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function LotPurchaseProcessingScreen({ t }: { t: TFn }) {
  return (
    <div className="flex flex-col items-center px-2 py-10 text-center" role="status" aria-live="polite">
      <SplitonLoader size="xl" variant="light" labelKey="secondaryMarket.lotPurchase.processingTitle" />
      <p className="mt-6 text-base font-semibold text-white">{t("secondaryMarket.lotPurchase.processingTitle")}</p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-zinc-500">
        {t("secondaryMarket.lotPurchase.processingBody")}
      </p>
    </div>
  );
}

export function LotPurchaseSuccessScreen({
  t,
  buyResult,
  receiptError,
}: {
  t: TFn;
  buyResult: BuyTradeResult;
  receiptError: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-[#B7F500]" aria-hidden />
        <div>
          <p className="text-[15px] font-semibold text-white">{t("secondaryMarket.lotPurchase.successTitle")}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
            {t("secondaryMarket.lotPurchase.successBody")}
          </p>
        </div>
      </div>
      <dl className="rounded-xl bg-white/4 px-4 py-3.5 font-mono text-[12px] ring-1 ring-white/8">
        <BreakdownRow label={t("secondaryMarket.lotPurchase.unitsBought")} value={buyResult.units} />
        <BreakdownRow label={t("secondaryMarket.lotPurchase.debited")} value={formatUsdtRu(buyResult.grossAmount)} />
        <BreakdownRow label={t("secondaryMarket.lotPurchase.feeCharged")} value={formatUsdtRu(buyResult.feeAmount)} />
        <BreakdownRow label={t("secondaryMarket.lotPurchase.tradeId")} value={buyResult.tradeId} />
      </dl>
      {receiptError ? (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200" role="alert">
          {receiptError}
        </p>
      ) : null}
    </div>
  );
}

export function LotPurchaseFailedScreen({
  t,
  failedKind,
  listing,
  feePreview,
  walletBalance,
}: {
  t: TFn;
  failedKind: LotPurchaseFailedKind;
  listing: AdaptedListing;
  feePreview: FeePreviewDto | null;
  walletBalance: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <XCircle className="mt-0.5 size-6 shrink-0 text-rose-400" aria-hidden />
        <div>
          <p className="text-[15px] font-semibold text-white">{t(failedTitleKey(failedKind))}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
            {failedKind === "insufficient_funds" && walletBalance != null
              ? tf(t("secondaryMarket.lotPurchase.insufficientFundsBody"), {
                  total: formatUsdtRu(feePreview?.buyerTotal ?? String(listing.listingValueUsdt)),
                  balance: formatUsdtRu(walletBalance),
                })
              : t(failedBodyKey(failedKind))}
          </p>
        </div>
      </div>
    </div>
  );
}
