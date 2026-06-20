"use client";

import * as React from "react";
import Link from "next/link";
import { Download, ExternalLink } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import type { SecondaryMarketUserTradeMock } from "@/components/dashboard/secondary-market/secondary-market-trade-history-tab";
import { SecondaryMarketResponsiveSheet } from "@/components/dashboard/secondary-market/secondary-market-responsive-sheet";
import {
  smTableActionReleasePill,
  smTableActionSecondaryPill,
} from "@/components/dashboard/secondary-market/secondary-market-table-action-styles";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { statusLabel } from "@/lib/i18n/status-labels";
import type { AppLocale } from "@/lib/i18n/types";
import {
  analyticsReleaseDetailPath,
  secondaryMarketReleaseAnalyticsPath,
} from "@/constants/routes";
import { secondaryMarketBookHref, secondaryMarketBookIdForSymbol } from "@/constants/dashboard/secondary-market";
import { getSecondaryMarketAnalyticsCatalogIdForReleaseSlug } from "@/mocks/dashboard/secondary-market-listings.mock";
import { cn } from "@/lib/utils";
import { downloadTradeReceipt } from "@/services/secondary-market.service";
import { saveBlob } from "@/services/documents.service";
import { getWalletDataSource } from "@/services/wallet.service";

type SettlementStatus = SecondaryMarketUserTradeMock["settlementStatus"];

function formatUsdt(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function settlementLabel(s: SettlementStatus, locale: AppLocale): string {
  return statusLabel("trade", s, locale);
}

function settlementPillClass(s: SettlementStatus) {
  switch (s) {
    case "settled":
      return "bg-[#B7F500]/12 text-[#d4f570] ring-1 ring-[#B7F500]/22";
    case "processing":
      return "bg-amber-500/12 text-amber-200/95 ring-1 ring-amber-400/20";
    case "failed":
      return "bg-fuchsia-500/12 text-fuchsia-200/90 ring-1 ring-fuchsia-400/22";
    default:
      return "bg-zinc-600/20 text-zinc-400";
  }
}

function releaseAssetHref(releaseId: string) {
  const catalogId = getSecondaryMarketAnalyticsCatalogIdForReleaseSlug(releaseId);
  return `${analyticsReleaseDetailPath(catalogId)}?from=secondary`;
}

type SecondaryMarketTradeDetailSheetProps = {
  trade: SecondaryMarketUserTradeMock | null;
  onOpenChange: (open: boolean) => void;
  onToast?: (message: string) => void;
};

export function SecondaryMarketTradeDetailSheet({
  trade,
  onOpenChange,
  onToast,
}: SecondaryMarketTradeDetailSheetProps) {
  const { authorizedFetch } = useAuth();
  const { t, locale } = useI18n();
  const isLive = getWalletDataSource() === "live";
  const [receiptLoading, setReceiptLoading] = React.useState(false);

  const stackHref = trade ? (() => {
    const id = secondaryMarketBookIdForSymbol(trade.ticker);
    return id ? secondaryMarketBookHref(id) : null;
  })() : null;

  const handleReceipt = async () => {
    if (!trade) return;
    if (!isLive) {
      onToast?.(t("secondaryMarket.trade.toastReceiptLiveOnly"));
      return;
    }
    setReceiptLoading(true);
    try {
      const file = await downloadTradeReceipt(authorizedFetch, trade.id);
      const binary = atob(file.contentBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      saveBlob(new Blob([bytes], { type: file.mimeType }), file.filename);
      onToast?.(t("secondaryMarket.trade.toastReceiptDownloaded"));
    } catch {
      onToast?.(t("secondaryMarket.trade.toastReceiptFailed"));
    } finally {
      setReceiptLoading(false);
    }
  };

  const detailRows = trade
    ? [
        [t("secondaryMarket.trade.tradeId"), trade.id],
        [t("secondaryMarket.trade.time"), formatDateTime(trade.timestamp)],
        [t("secondaryMarket.trade.pricePerUnitUnt"), `${formatUsdt(trade.price)} USDT`],
        ["Units", String(trade.units)],
        ["Gross", `${formatUsdt(trade.grossAmount)} USDT`],
        [t("secondaryMarket.trade.fee"), `${formatUsdt(trade.feeAmount)} USDT`],
        [t("secondaryMarket.trade.total"), `${formatUsdt(trade.netAmount)} USDT`],
        [t("secondaryMarket.trade.order"), trade.linkedOrderId],
        [t("secondaryMarket.trade.listing"), trade.linkedListingId],
      ]
    : [];

  return (
    <SecondaryMarketResponsiveSheet
      open={trade != null}
      onOpenChange={onOpenChange}
      title={trade?.title ?? t("secondaryMarket.actions.tradeDetails")}
      description={
        trade ? `${trade.artist} · ${trade.ticker} · ${formatDateTime(trade.timestamp)}` : undefined
      }
      widthClassName="md:w-[min(100vw-1rem,480px)]"
      footer={
        trade ? (
          <div className="space-y-2">
            <button
              type="button"
              disabled={receiptLoading}
              onClick={() => void handleReceipt()}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white/10 font-mono text-[12px] font-semibold text-zinc-200 transition hover:bg-white/14 disabled:opacity-50"
            >
              {receiptLoading ? (
                <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
              ) : (
                <Download className="size-4" aria-hidden />
              )}
              {t("secondaryMarket.market.downloadReceipt")}
            </button>
            <div className="flex flex-wrap gap-2">
              <Link
                href={releaseAssetHref(trade.releaseId)}
                scroll={false}
                className={cn(smTableActionReleasePill, "h-10 flex-1 justify-center px-4")}
                onClick={() => onOpenChange(false)}
              >
                {t("secondaryMarket.actions.release")}
                <ExternalLink className="size-3.5 opacity-55" aria-hidden />
              </Link>
              {stackHref ? (
                <Link
                  href={stackHref}
                  scroll={false}
                  className={cn(smTableActionSecondaryPill, "h-10 flex-1 justify-center")}
                  onClick={() => onOpenChange(false)}
                >
                  {t("secondaryMarket.actions.orderBook")}
                </Link>
              ) : null}
            </div>
          </div>
        ) : undefined
      }
    >
      {trade ? (
        <div className="space-y-4 pb-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase",
                trade.side === "buy" ? "bg-[#B7F500]/14 text-[#d4f570]" : "bg-fuchsia-500/14 text-fuchsia-200/90",
              )}
            >
              {t(`secondaryMarket.side.${trade.side}`)}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
                settlementPillClass(trade.settlementStatus),
              )}
            >
              {settlementLabel(trade.settlementStatus, locale)}
            </span>
          </div>

          <dl className="space-y-0 font-mono text-[12px]">
            {detailRows.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 border-b border-white/5 py-2.5"
              >
                <dt className="text-zinc-600">{label}</dt>
                <dd className="text-right tabular-nums text-zinc-200">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="rounded-xl bg-white/3 p-3.5 text-[12px] leading-relaxed text-zinc-500">
            {trade.side === "buy"
              ? t("secondaryMarket.trade.clearingNoteBuy")
              : t("secondaryMarket.trade.clearingNoteSell")}
          </p>

          <Link
            href={secondaryMarketReleaseAnalyticsPath(trade.releaseId)}
            scroll={false}
            className="block font-mono text-[11px] text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline"
            onClick={() => onOpenChange(false)}
          >
            {t("secondaryMarket.trade.secondaryAnalyticsLink")}
          </Link>
        </div>
      ) : null}
    </SecondaryMarketResponsiveSheet>
  );
}
