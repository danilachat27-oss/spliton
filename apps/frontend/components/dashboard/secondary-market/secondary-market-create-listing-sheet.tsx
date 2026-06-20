"use client";

import * as React from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { CheckCircle2, ChevronRight, Search, X } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { smExchange } from "@/components/dashboard/secondary-market/secondary-market-exchange-styles";
import { secondaryMarketBookHref, secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { localizedApiError } from "@/lib/api/localized-error";
import { tf } from "@/lib/i18n/financial-messages";
import {
  classifySellListingError,
  extractApiErrorCode,
} from "@/lib/secondary-market/classify-sell-listing-error";
import { cn } from "@/lib/utils";
import {
  fetchFeePreview,
  type FeePreviewDto,
  type UserHoldingItem,
} from "@/services/secondary-market.service";
import { getWalletDataSource } from "@/services/wallet.service";
import { useLegalConsentGate } from "@/hooks/use-legal-consent-gate";
import { LegalConsentModal } from "@/components/compliance/legal-consent-modal";
import { LegalConsentGateAlert } from "@/components/compliance/legal-consent-gate-alert";
import { EligibilityNotice } from "@/components/compliance/eligibility-notice";

type SecondaryMarketCreateListingSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holdings: UserHoldingItem[];
  onSubmit: (body: { releaseId: string; units: number; pricePerUnit: number }) => Promise<void>;
};

function formatUsdt(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function roundUsdt2(n: number) {
  return Math.round(n * 100) / 100;
}

function ReleaseThumb({ symbol }: { symbol: string }) {
  const hue = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="size-11 shrink-0 rounded-xl ring-1 ring-white/10"
      style={{
        background: `linear-gradient(145deg, hsl(${hue}, 42%, 28%) 0%, hsl(${(hue + 48) % 360}, 28%, 12%) 100%)`,
      }}
      aria-hidden
    />
  );
}

export function SecondaryMarketCreateListingSheet({
  open,
  onOpenChange,
  holdings,
  onSubmit,
}: SecondaryMarketCreateListingSheetProps) {
  const { t, locale } = useI18n();
  const { authorizedFetch } = useAuth();
  const isLive = getWalletDataSource() === "live";
  const consentGate = useLegalConsentGate("SECONDARY_TRADE", isLive);

  const [releaseSearch, setReleaseSearch] = React.useState("");
  const [selectedReleaseId, setSelectedReleaseId] = React.useState("");
  const [units, setUnits] = React.useState("1");
  const [pricePerUnit, setPricePerUnit] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [feePreview, setFeePreview] = React.useState<FeePreviewDto | null>(null);
  const [feeLoading, setFeeLoading] = React.useState(false);
  const [feePreviewFailed, setFeePreviewFailed] = React.useState(false);

  const selected = React.useMemo(
    () => holdings.find((h) => h.releaseId === selectedReleaseId) ?? null,
    [holdings, selectedReleaseId],
  );

  const filteredHoldings = React.useMemo(() => {
    const q = releaseSearch.trim().toLowerCase();
    if (!q) return holdings;
    return holdings.filter(
      (h) =>
        h.symbol.toLowerCase().includes(q) ||
        h.trackTitle.toLowerCase().includes(q),
    );
  }, [holdings, releaseSearch]);

  const unitsNum = Math.floor(Number.parseFloat(units.replace(",", ".")) || 0);
  const priceNum = roundUsdt2(Number.parseFloat(pricePerUnit.replace(",", ".")) || 0);
  const availableUnits = selected ? Math.floor(Number(selected.unitsAvailable)) : 0;
  const avgEntry = selected ? Number(selected.avgEntryPrice) : 0;

  React.useEffect(() => {
    if (!open) return;
    if (holdings.length === 0) {
      setSelectedReleaseId("");
      return;
    }
    if (!selectedReleaseId || !holdings.some((h) => h.releaseId === selectedReleaseId)) {
      const first = holdings[0]!;
      setSelectedReleaseId(first.releaseId);
      const suggested = roundUsdt2(Number(first.avgEntryPrice) * 1.015 || 1);
      setPricePerUnit(String(suggested));
      setUnits("1");
    }
  }, [open, holdings, selectedReleaseId]);

  React.useEffect(() => {
    if (!open) {
      setReleaseSearch("");
      setLocalError(null);
      setIsSuccess(false);
      setFeePreview(null);
      setFeePreviewFailed(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!selected) return;
    const suggested = roundUsdt2(Number(selected.avgEntryPrice) * 1.015 || 1);
    setPricePerUnit((prev) => (prev.trim() ? prev : String(suggested)));
  }, [selected]);

  React.useEffect(() => {
    if (!isLive || !selectedReleaseId || unitsNum <= 0 || priceNum <= 0) {
      setFeePreview(null);
      setFeePreviewFailed(false);
      return;
    }
    setFeeLoading(true);
    setFeePreviewFailed(false);
    const timer = window.setTimeout(() => {
      void fetchFeePreview(authorizedFetch, {
        releaseId: selectedReleaseId,
        units: unitsNum,
        pricePerUnit: priceNum,
      })
        .then((preview) => {
          setFeePreview(preview);
          setFeePreviewFailed(false);
        })
        .catch(() => {
          setFeePreview(null);
          setFeePreviewFailed(true);
        })
        .finally(() => setFeeLoading(false));
    }, 280);
    return () => window.clearTimeout(timer);
  }, [authorizedFetch, isLive, priceNum, selectedReleaseId, unitsNum]);

  const grossUsdt = roundUsdt2(unitsNum * priceNum);
  const feeUsdt = feePreview ? roundUsdt2(Number(feePreview.feeAmount)) : roundUsdt2(grossUsdt * 0.01);
  const netUsdt = feePreview ? roundUsdt2(Number(feePreview.sellerNet)) : roundUsdt2(Math.max(0, grossUsdt - feeUsdt));
  const feePct = feePreview?.feePct ?? "1";

  const applyUnitsPct = (pct: number) => {
    if (!availableUnits) return;
    const n = Math.max(1, Math.floor((availableUnits * pct) / 100));
    setUnits(String(n));
  };

  const previewBlocking =
    isLive && selectedReleaseId && unitsNum > 0 && priceNum > 0 && !feeLoading && feePreviewFailed;

  const validate = (): string | null => {
    if (!selectedReleaseId) return t("secondaryMarket.errors.selectRelease");
    if (!unitsNum || unitsNum <= 0) return t("secondaryMarket.errors.unitsRequired");
    if (unitsNum % 1 !== 0) return t("secondaryMarket.errors.unitsInteger");
    if (unitsNum > availableUnits) return tf(t("secondaryMarket.errors.unitsAvailableOnly"), { available: String(availableUnits) });
    if (!priceNum || priceNum <= 0) return t("secondaryMarket.errors.pricePerUnitRequired");
    return null;
  };

  const runSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ releaseId: selectedReleaseId, units: unitsNum, pricePerUnit: priceNum });
      setIsSuccess(true);
    } catch (e) {
      const kind = classifySellListingError(extractApiErrorCode(e));
      if (kind === "insufficient_units") {
        setLocalError(t("sell.failedInsufficientUnitsBody"));
      } else if (kind === "invalid_price") {
        setLocalError(t("sell.failedInvalidPriceBody"));
      } else if (kind === "network") {
        setLocalError(t("sell.failedNetworkBody"));
      } else {
        setLocalError(localizedApiError(e, locale));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    setLocalError(null);
    const err = validate();
    if (err) {
      setLocalError(err);
      return;
    }
    consentGate.requestProceed(() => void runSubmit());
  };

  const handleSelectRelease = (releaseId: string) => {
    setSelectedReleaseId(releaseId);
    setLocalError(null);
    const h = holdings.find((x) => x.releaseId === releaseId);
    if (h) {
      setPricePerUnit(String(roundUsdt2(Number(h.avgEntryPrice) * 1.015 || 1)));
      setUnits("1");
    }
  };

  return (
    <>
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (isSubmitting) return;
        onOpenChange(next);
      }}
      modal
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-[127] bg-black/75 backdrop-blur-[3px]",
            "transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed z-[128] flex flex-col bg-[#0a0a0a] text-white",
            "shadow-[0_-24px_80px_rgba(0,0,0,0.55)] md:shadow-[24px_0_80px_rgba(0,0,0,0.55)]",
            "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[24px]",
            "max-md:data-starting-style:translate-y-full max-md:data-ending-style:translate-y-full",
            "md:inset-y-0 md:left-0 md:right-auto md:max-h-dvh md:w-[min(100vw-1rem,440px)] md:translate-y-0 md:rounded-none md:rounded-r-2xl",
            "md:data-starting-style:-translate-x-full md:data-ending-style:-translate-x-full",
          )}
        >
          <div className="flex shrink-0 flex-col items-center pt-2.5 md:hidden">
            <div className="h-1 w-10 rounded-full bg-white/20" aria-hidden />
          </div>

          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/6 px-5 pb-4 pt-3 md:px-6 md:pt-5">
            <div className="min-w-0">
              <Dialog.Title className="text-[17px] font-semibold tracking-tight text-white md:text-lg">
                {t("secondaryMarket.forms.createListingTitle")}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[12px] leading-relaxed text-zinc-500 md:text-[13px]">
                {t("secondaryMarket.forms.createListingDesc")}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label={t("secondaryMarket.aria.close")}
              disabled={isSubmitting}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 md:px-6">
            {isSubmitting ? (
              <div className="flex flex-col items-center py-12 text-center">
                <SplitonLoader size="md" variant="dark" />
                <h3 className="mt-5 text-lg font-semibold text-white">{t("secondaryMarket.forms.listingProcessingTitle")}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
                  {t("secondaryMarket.forms.listingProcessingBody")}
                </p>
              </div>
            ) : isSuccess ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-[#B7F500]/12 ring-1 ring-[#B7F500]/25">
                  <CheckCircle2 className="size-8 text-[#B7F500]" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{t("secondaryMarket.forms.listingCreatedTitle")}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
                  {selected ? (
                    tf(t("secondaryMarket.forms.listingCreatedLine"), {
                      trackTitle: selected.trackTitle,
                      units: String(unitsNum),
                      price: formatUsdt(priceNum),
                    })
                  ) : (
                    t("secondaryMarket.forms.listingCreatedFallback")
                  )}
                </p>
                <dl className="mt-6 w-full max-w-xs space-y-2 text-left font-mono text-[12px] text-zinc-400">
                  <div className="flex justify-between gap-3">
                    <dt>{t("sell.successUnits")}</dt>
                    <dd className="text-zinc-200">
                      {unitsNum} UNT
                      {selected ? ` · ${selected.symbol}` : ""}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>{t("sell.successPrice")}</dt>
                    <dd className="text-zinc-200">{formatUsdt(priceNum)} USDT</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>{t("sell.successFee")}</dt>
                    <dd className="text-zinc-500">−{formatUsdt(feeUsdt)} USDT</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-white/6 pt-2">
                    <dt className="text-zinc-300">{t("sell.successNet")}</dt>
                    <dd className="font-semibold text-[#B7F500]">{formatUsdt(netUsdt)} USDT</dd>
                  </div>
                </dl>
                <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
                  <Link
                    href={secondaryMarketHref("orders")}
                    onClick={() => onOpenChange(false)}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#B7F500] px-6 text-[13px] font-semibold text-black transition hover:bg-[#c8ff3d]"
                  >
                    {t("secondaryMarket.forms.openMyOrders")}
                  </Link>
                  {selectedReleaseId ? (
                    <Link
                      href={secondaryMarketBookHref(selectedReleaseId)}
                      onClick={() => onOpenChange(false)}
                      className="inline-flex h-11 items-center justify-center rounded-full bg-white/10 px-6 text-[13px] font-medium text-zinc-200 transition hover:bg-white/14"
                    >
                      {t("secondaryMarket.forms.openOrderBook")}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-6 text-[13px] font-medium text-zinc-300 transition hover:bg-white/5"
                  >
                    {t("secondaryMarket.forms.done")}
                  </button>
                </div>
              </div>
            ) : holdings.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-[#161616] ring-1 ring-white/8">
                  <span className="font-mono text-2xl text-zinc-600">∅</span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">{t("secondaryMarket.forms.noReleasesTitle")}</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
                  {t("secondaryMarket.forms.noReleasesDesc")}
                </p>
                <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
                  <Link
                    href={ROUTES.catalogMarketOverview}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#B7F500] px-5 text-[13px] font-semibold text-black transition hover:bg-[#c8ff3d]"
                    onClick={() => onOpenChange(false)}
                  >
                    {t("secondaryMarket.actions.goToCatalog")}
                  </Link>
                  <Link
                    href={ROUTES.myAssetsOverview}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-white/10 px-5 text-[13px] font-medium text-zinc-200 transition hover:bg-white/14"
                    onClick={() => onOpenChange(false)}
                  >
                    {t("secondaryMarket.actions.myAssets")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-5 pb-2">
                <section>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{t("secondaryMarket.forms.stepRelease")}</p>
                  <div className="relative mt-2">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600"
                      aria-hidden
                    />
                    <input
                      type="search"
                      value={releaseSearch}
                      onChange={(e) => setReleaseSearch(e.target.value)}
                      placeholder={t("secondaryMarket.watchlist.searchPlaceholder")}
                      className={cn(smExchange.inputPill, "pl-10")}
                    />
                  </div>
                  <ul
                    className="mt-3 max-h-[min(240px,38vh)] space-y-1.5 overflow-y-auto overscroll-contain pr-0.5 [scrollbar-width:thin]"
                    role="listbox"
                    aria-label={t("secondaryMarket.aria.selectRelease")}
                  >
                    {filteredHoldings.length === 0 ? (
                      <li className="rounded-xl bg-[#111111] px-4 py-6 text-center text-sm text-zinc-500">
                        {t("secondaryMarket.empty.noResults")}
                      </li>
                    ) : (
                      filteredHoldings.map((h) => {
                        const isActive = h.releaseId === selectedReleaseId;
                        const avail = Math.floor(Number(h.unitsAvailable));
                        return (
                          <li key={h.releaseId}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={isActive}
                              onClick={() => handleSelectRelease(h.releaseId)}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                                isActive
                                  ? "bg-[#B7F500]/10 ring-1 ring-[#B7F500]/35"
                                  : "bg-[#111111] ring-1 ring-white/6 hover:bg-[#161616] hover:ring-white/10",
                              )}
                            >
                              <ReleaseThumb symbol={h.symbol} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[14px] font-semibold text-white">{h.trackTitle}</p>
                                <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                                  {tf(t("secondaryMarket.forms.holdingUnitsFree"), { symbol: h.symbol, avail: String(avail) })}
                                  {Number(h.unitsLocked) > 0 ? (
                                    <span className="text-zinc-600">
                                      {tf(t("secondaryMarket.forms.holdingUnitsLocked"), { locked: String(h.unitsLocked) })}
                                    </span>
                                  ) : null}
                                </p>
                              </div>
                              <ChevronRight
                                className={cn("size-4 shrink-0", isActive ? "text-[#B7F500]" : "text-zinc-600")}
                                aria-hidden
                              />
                            </button>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </section>

                {selected ? (
                  <>
                    <section>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{t("secondaryMarket.forms.stepParams")}</p>
                      <div className="mt-3 space-y-3">
                        <div className="rounded-xl bg-[#111111] p-3.5 ring-1 ring-white/6">
                          <label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                            {t("secondaryMarket.forms.unitsLabel")}
                          </label>
                          <div className="mt-2 flex items-baseline justify-between gap-2">
                            <input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={availableUnits}
                              value={units}
                              onChange={(e) => setUnits(e.target.value)}
                              className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[26px] font-semibold tabular-nums text-white outline-none"
                            />
                            <span className="shrink-0 rounded-lg bg-[#161616] px-2.5 py-1 font-mono text-[11px] font-semibold text-zinc-400">
                              UNT
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {[25, 50, 75, 100].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => applyUnitsPct(pct)}
                                className={cn(smExchange.chipBase, smExchange.chipIdle, "px-2.5 py-1 text-[11px]")}
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                          <p className="mt-2 font-mono text-[11px] text-zinc-600">
                            {tf(t("secondaryMarket.forms.availableUnitsLine"), { available: String(availableUnits) })}
                            {avgEntry > 0 ? (
                              <>
                                {tf(t("secondaryMarket.forms.entryPriceLine"), { price: formatUsdt(avgEntry) })}
                              </>
                            ) : null}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#111111] p-3.5 ring-1 ring-white/6">
                          <label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                            {t("secondaryMarket.forms.pricePerUnit")}
                          </label>
                          <div className="mt-2 flex items-baseline justify-between gap-2">
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0.01}
                              step={0.01}
                              value={pricePerUnit}
                              onChange={(e) => setPricePerUnit(e.target.value)}
                              className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[26px] font-semibold tabular-nums text-white outline-none"
                            />
                            <span className="shrink-0 rounded-lg bg-[#161616] px-2.5 py-1 font-mono text-[11px] font-semibold text-zinc-400">
                              USDT
                            </span>
                          </div>
                          {avgEntry > 0 ? (
                            <button
                              type="button"
                              onClick={() => setPricePerUnit(String(roundUsdt2(avgEntry * 1.015)))}
                              className="mt-2 font-mono text-[11px] text-[#B7F500] hover:underline"
                            >
                              {tf(t("secondaryMarket.forms.applyEntryPlus"), {
                                price: formatUsdt(roundUsdt2(avgEntry * 1.015)),
                              })}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </section>

                    <section className="rounded-xl bg-[#111111] p-4 ring-1 ring-white/6">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{t("secondaryMarket.forms.summaryTitle")}</p>
                      <dl className="mt-3 space-y-2 font-mono text-[12px]">
                        <div className="flex justify-between gap-3 text-zinc-400">
                          <dt>{t("secondaryMarket.forms.grossLabel")}</dt>
                          <dd className="tabular-nums text-zinc-200">{formatUsdt(grossUsdt)} USDT</dd>
                        </div>
                        <div className="flex justify-between gap-3 text-zinc-400">
                          <dt>
                            {tf(t("secondaryMarket.forms.fee"), { pct: feePct })}
                            {feeLoading ? <SplitonLoader size="xxs" variant="dark" className="shrink-0" /> : null}
                          </dt>
                          <dd className="tabular-nums text-zinc-500">−{formatUsdt(feeUsdt)} USDT</dd>
                        </div>
                        <div className="flex justify-between gap-3 border-t border-white/6 pt-2">
                          <dt className="font-semibold text-zinc-300">{t("secondaryMarket.forms.receiveNetLabel")}</dt>
                          <dd className="text-base font-semibold tabular-nums text-[#B7F500]">
                            {formatUsdt(netUsdt)} USDT
                          </dd>
                        </div>
                      </dl>
                      {previewBlocking ? (
                        <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100/90" role="alert">
                          {t("sell.feePreviewError")}
                        </p>
                      ) : null}
                      <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
                        {tf(t("secondaryMarket.forms.lockAfterPublish"), { units: String(unitsNum || "—") })}
                      </p>
                    </section>

                    {localError ? (
                      <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/25">
                        {localError}
                      </p>
                    ) : null}
                    {isLive ? <LegalConsentGateAlert gate={consentGate} variant="dark" className="mt-3" /> : null}
                    {isLive ? <EligibilityNotice result={consentGate.eligibility} className="mt-3" /> : null}
                  </>
                ) : (
                  <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90 ring-1 ring-amber-500/20">
                    {t("secondaryMarket.forms.selectReleaseHint")}
                  </p>
                )}
              </div>
            )}
          </div>

          {!isSuccess && !isSubmitting && holdings.length > 0 ? (
            <div className="shrink-0 border-t border-white/6 bg-[#0a0a0a] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6">
              <button
                type="button"
                disabled={
                  isSubmitting ||
                  !selected ||
                  Boolean(previewBlocking) ||
                  (isLive &&
                    (consentGate.isChecking ||
                      consentGate.checkError ||
                      consentGate.hasBlockingEligibility))
                }
                onClick={handleSubmit}
                className={cn(
                  smExchange.submitBuy,
                  "disabled:cursor-not-allowed disabled:opacity-45",
                )}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
                    {t("secondaryMarket.forms.submitting")}
                  </span>
                ) : (
                  t("secondaryMarket.forms.listForSale")
                )}
              </button>
            </div>
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
    </>
  );
}
