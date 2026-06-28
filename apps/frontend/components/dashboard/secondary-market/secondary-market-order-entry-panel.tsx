"use client";

import * as React from "react";
import Link from "next/link";
import { Minus, Plus } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { messageForApiError } from "@/lib/i18n/dictionaries";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";

import { smExchange } from "./secondary-market-exchange-styles";
import { walkBuyAgainstAsks, walkSellAgainstBids } from "./secondary-market-book-math";
import { fetchOrderPreview } from "@/services/secondary-market.service";
import { SECONDARY_FEE_FALLBACK_PCT, SECONDARY_FEE_FALLBACK_RATE } from "@/lib/market/platform-fee-fallbacks";
import { computeSecondaryTrade } from "@/lib/market/pricing-calculator";
import { intlLocaleFor } from "@/lib/i18n/formatters";

type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

const FEE_RATE = SECONDARY_FEE_FALLBACK_RATE;

export type LimitSeed = { price: number; side: "buy" | "sell" };

export type BookMarketLite = {
  symbol: string;
  asks: { price: number; units: number }[];
  bids: { price: number; units: number }[];
};

function roundToTick(price: number, tick: number) {
  const k = Math.round(price / tick);
  const rounded = k * tick;
  const decimals = Math.max(0, `${tick}`.split(".")[1]?.length ?? 0);
  return Number(rounded.toFixed(decimals));
}

export type SecondaryMarketOrderEntryPanelProps = {
  m: BookMarketLite;
  tick: number;
  bestAsk: number;
  bestBid: number;
  limitSeed: LimitSeed | null;
  /** Свободные units для продажи (без учёта locked). */
  unitsAvailable: number;
  usdtBalance: number;
  lockedUnits: number;
  isSubmitting: boolean;
  /** Live: блокировка submit из-за consent/eligibility gate */
  consentBlocked?: boolean;
  /** Live: preview с backend orders/preview */
  liveTrading?: {
    releaseUuid: string;
    marketId: string;
    authorizedFetch: AuthorizedFetch;
  };
  onSubmit: (payload: {
    orderMode: "limit" | "market";
    side: "buy" | "sell";
    price: number;
    units: number;
  }) => Promise<void>;
};

export function SecondaryMarketOrderEntryPanel({
  m,
  tick,
  bestAsk,
  bestBid,
  limitSeed,
  unitsAvailable,
  usdtBalance,
  lockedUnits,
  isSubmitting,
  consentBlocked = false,
  liveTrading,
  onSubmit,
}: SecondaryMarketOrderEntryPanelProps) {
  const { t, locale } = useI18n();

  const formatUsdt = React.useCallback(
    (n: number) =>
      n.toLocaleString(intlLocaleFor(locale), {
        minimumFractionDigits: n % 1 ? 2 : 0,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const [livePreviewBlocked, setLivePreviewBlocked] = React.useState<string | null>(null);
  const [liveFeeLoading, setLiveFeeLoading] = React.useState(false);
  const [liveFeeError, setLiveFeeError] = React.useState<string | null>(null);
  const [liveFeeGross, setLiveFeeGross] = React.useState<number | null>(null);
  const [liveFeeAmount, setLiveFeeAmount] = React.useState<number | null>(null);
  const [liveBuyerTotal, setLiveBuyerTotal] = React.useState<number | null>(null);
  const [liveSellerNet, setLiveSellerNet] = React.useState<number | null>(null);
  const [orderMode, setOrderMode] = React.useState<"limit" | "market">("limit");
  const [side, setSide] = React.useState<"buy" | "sell">(limitSeed?.side ?? "buy");
  const [price, setPrice] = React.useState(() =>
    limitSeed ? String(limitSeed.price) : bestAsk ? String(bestAsk) : "",
  );
  const [units, setUnits] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!limitSeed) return;
    setSide(limitSeed.side);
    setPrice(String(limitSeed.price));
    setOrderMode("limit");
    setLocalError(null);
  }, [limitSeed]);

  const priceNum = parseFloat(price.replace(",", ".")) || 0;
  const unitsNum = parseFloat(units.replace(",", ".")) || 0;

  const marketBuyWalk = React.useMemo(
    () => (unitsNum > 0 ? walkBuyAgainstAsks(m.asks, unitsNum) : null),
    [m.asks, unitsNum],
  );
  const marketSellWalk = React.useMemo(
    () => (unitsNum > 0 ? walkSellAgainstBids(m.bids, unitsNum) : null),
    [m.bids, unitsNum],
  );

  const limitBuyCross = React.useMemo(() => {
    if (orderMode !== "limit" || side !== "buy" || !unitsNum || !priceNum || !bestAsk) return null;
    if (priceNum < bestAsk) return null;
    return walkBuyAgainstAsks(m.asks, unitsNum, priceNum);
  }, [orderMode, side, unitsNum, priceNum, bestAsk, m.asks]);

  const limitSellCross = React.useMemo(() => {
    if (orderMode !== "limit" || side !== "sell" || !unitsNum || !priceNum || !bestBid) return null;
    if (priceNum > bestBid) return null;
    return walkSellAgainstBids(m.bids, unitsNum, priceNum);
  }, [orderMode, side, unitsNum, priceNum, bestBid, m.bids]);

  const subtotalUsdt =
    orderMode === "market"
      ? side === "buy"
        ? (marketBuyWalk?.totalUsdt ?? 0)
        : (marketSellWalk?.totalUsdt ?? 0)
      : priceNum * unitsNum;

  React.useEffect(() => {
    if (!liveTrading || !unitsNum || unitsNum <= 0) {
      setLiveFeeGross(null);
      setLiveFeeAmount(null);
      setLiveBuyerTotal(null);
      setLiveSellerNet(null);
      setLiveFeeError(null);
      setLivePreviewBlocked(null);
      return;
    }
    const px =
      orderMode === "limit" && priceNum > 0
        ? priceNum
        : side === "buy"
          ? bestAsk || marketBuyWalk?.avgPrice || 0
          : bestBid || marketSellWalk?.avgPrice || 0;
    if (orderMode === "limit" && (!px || px <= 0)) return;

    let cancelled = false;
    setLiveFeeLoading(true);
    setLiveFeeError(null);
    setLivePreviewBlocked(null);
    void fetchOrderPreview(liveTrading.authorizedFetch, {
      marketId: liveTrading.marketId,
      side,
      type: orderMode,
      price: orderMode === "limit" ? px : undefined,
      units: unitsNum,
      tickSize: tick,
    })
      .then((p) => {
        if (cancelled) return;
        setLiveFeeGross(Number(p.subtotal));
        setLiveFeeAmount(Number(p.feeAmount));
        setLiveBuyerTotal(Number(p.totalAmount));
        setLiveSellerNet(Number(p.subtotal) - Number(p.feeAmount));
        if (!p.canSubmit && p.blockingReason) {
          setLivePreviewBlocked(p.blockingReason);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setLiveFeeError(t("secondaryMarket.errors.feeCalcFailed"));
        setLiveFeeGross(null);
        setLiveFeeAmount(null);
        setLiveBuyerTotal(null);
        setLiveSellerNet(null);
      })
      .finally(() => {
        if (!cancelled) setLiveFeeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    liveTrading,
    unitsNum,
    priceNum,
    orderMode,
    side,
    bestAsk,
    bestBid,
    marketBuyWalk,
    marketSellWalk,
    tick,
    t,
  ]);

  const useLiveFee =
    Boolean(liveTrading) &&
    liveFeeGross != null &&
    liveFeeAmount != null &&
    !liveFeeError;

  const demoQuote =
    subtotalUsdt > 0 && unitsNum > 0
      ? computeSecondaryTrade({
          unitPrice: subtotalUsdt / unitsNum,
          units: unitsNum,
          feePct: FEE_RATE * 100,
        })
      : null;

  const feeUsdt = useLiveFee ? liveFeeAmount! : demoQuote?.feeAmount ?? subtotalUsdt * FEE_RATE;
  const buyDebit = useLiveFee
    ? liveBuyerTotal ?? subtotalUsdt
    : demoQuote?.buyerTotal ?? subtotalUsdt;
  const sellNet = useLiveFee
    ? (liveSellerNet ?? Math.max(0, subtotalUsdt - feeUsdt))
    : demoQuote?.sellerNet ?? Math.max(0, subtotalUsdt - feeUsdt);
  const feePctLabel =
    useLiveFee && liveFeeGross != null && liveFeeGross > 0 && liveFeeAmount != null
      ? ((liveFeeAmount / liveFeeGross) * 100).toFixed(1)
      : String(SECONDARY_FEE_FALLBACK_PCT);
  const avgExec =
    orderMode === "market"
      ? side === "buy"
        ? (marketBuyWalk?.avgPrice ?? 0)
        : (marketSellWalk?.avgPrice ?? 0)
      : priceNum;

  const bumpPrice = (dir: -1 | 1) => {
    const base = priceNum || (side === "buy" ? bestAsk : bestBid) || 0;
    if (!base) return;
    setPrice(String(roundToTick(base + dir * tick, tick)));
  };

  const bumpUnits = (dir: -1 | 1) => {
    const base = unitsNum || 0;
    const next = Math.max(0, base + dir);
    setUnits(next > 0 ? String(next) : "");
  };

  const applyPct = (pct: number) => {
    if (pct === 0) {
      setUnits("");
      return;
    }
    if (side === "buy") {
      const px =
        orderMode === "limit" && priceNum > 0 ? priceNum : bestAsk || marketBuyWalk?.avgPrice || 0;
      if (!px) return;
      const maxU = usdtBalance / px;
      setUnits(String(Math.max(1, Math.floor((maxU * pct) / 100))));
    } else {
      setUnits(String(Math.max(1, Math.floor((unitsAvailable * pct) / 100))));
    }
  };

  const validate = (): string | null => {
    if (!unitsNum || unitsNum <= 0) return t("secondaryMarket.errors.unitsRequired");
    if (orderMode === "limit" && (!priceNum || priceNum <= 0)) return t("secondaryMarket.errors.priceRequired");
    if (side === "buy") {
      if (unitsNum % 1 !== 0) return t("secondaryMarket.errors.unitsInteger");
      if (buyDebit > usdtBalance + 1e-6)
        return tf(t("secondaryMarket.errors.insufficientUsdt"), {
          need: formatUsdt(buyDebit),
          available: formatUsdt(usdtBalance),
        });
    } else {
      if (unitsNum > unitsAvailable + 1e-6)
        return tf(t("secondaryMarket.errors.insufficientUnits"), {
          available: String(unitsAvailable),
          locked: String(lockedUnits),
        });
    }
    return null;
  };

  const submit = async () => {
    setLocalError(null);
    const err = validate();
    if (err) {
      setLocalError(err);
      return;
    }
    const px = orderMode === "limit" ? priceNum : side === "buy" ? marketBuyWalk?.avgPrice ?? bestAsk : marketSellWalk?.avgPrice ?? bestBid;
    try {
      await onSubmit({ orderMode, side, price: px || 0, units: unitsNum });
    } catch {
      setLocalError(t("secondaryMarket.errors.submitFailed"));
    }
  };

  const caption =
    orderMode === "limit"
      ? t("secondaryMarket.forms.limitOrderCaption")
      : t("secondaryMarket.forms.marketOrderCaption");

  const dash = "—";
  const paramsDescParts = t("secondaryMarket.listingDetail.paramsDesc").split("{link}");

  return (
    <div className="flex flex-col gap-3 bg-black">
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-lg bg-[#161616] p-0.5 font-mono text-[12px] ring-1 ring-white/8">
          <button
            type="button"
            onClick={() => {
              setOrderMode("limit");
              setLocalError(null);
              setPrice(side === "buy" ? (bestAsk ? String(bestAsk) : "") : bestBid ? String(bestBid) : "");
            }}
            className={cn(
              "rounded-md px-3 py-1.5 font-semibold transition-colors",
              orderMode === "limit" ? "bg-[#2a2a2a] text-white" : "text-zinc-500",
            )}
          >
            {t("secondaryMarket.forms.limit")}
          </button>
          <button
            type="button"
            onClick={() => {
              setOrderMode("market");
              setLocalError(null);
              setPrice("");
            }}
            className={cn(
              "rounded-md px-3 py-1.5 font-semibold transition-colors",
              orderMode === "market" ? "bg-[#2a2a2a] text-white" : "text-zinc-500",
            )}
          >
            {t("secondaryMarket.forms.market")}
          </button>
        </div>
        <span className="font-mono text-[10px] text-zinc-600">{m.symbol}/USDT</span>
      </div>

      <div className={smExchange.sideToggle}>
        <button
          type="button"
          onClick={() => {
            setSide("buy");
            setLocalError(null);
            if (orderMode === "limit") setPrice(bestAsk ? String(bestAsk) : "");
          }}
          className={cn(
            "rounded-md py-2.5 transition-colors",
            side === "buy" ? smExchange.buySideActive : smExchange.buySideIdle,
          )}
        >
          {t("secondaryMarket.forms.buy")}
        </button>
        <button
          type="button"
          onClick={() => {
            setSide("sell");
            setLocalError(null);
            if (orderMode === "limit") setPrice(bestBid ? String(bestBid) : "");
          }}
          className={cn(
            "rounded-md py-2.5 transition-colors",
            side === "sell" ? smExchange.sellSideActive : smExchange.sellSideIdle,
          )}
        >
          {t("secondaryMarket.forms.sell")}
        </button>
      </div>

      <div className="flex items-center justify-between font-mono text-[11px]">
        <span className="text-zinc-600">
          {side === "buy" ? t("secondaryMarket.forms.availableLabel") : t("secondaryMarket.forms.availableUnt")}
        </span>
        <span className="font-semibold text-zinc-200">
          {side === "buy" ? `${formatUsdt(usdtBalance)} USDT` : `${unitsAvailable} UNT`}
          {side === "buy" ? (
            <Link href="/assets/payouts/deposit" className="ml-1.5 text-[#B7F500] hover:underline" aria-label={t("secondaryMarket.forms.topUpAria")}>
              +
            </Link>
          ) : null}
        </span>
      </div>
      {lockedUnits > 0 ? (
        <p className="font-mono text-[9px] text-zinc-600">
          {tf(t("secondaryMarket.forms.lockedInOrders"), { locked: String(lockedUnits) })}
        </p>
      ) : null}

      {orderMode === "limit" ? (
        <div>
          <span className="font-mono text-[11px] text-zinc-500">{t("secondaryMarket.forms.priceUsdt")}</span>
          <div className="mt-1.5 flex items-stretch gap-1">
            <button
              type="button"
              onClick={() => bumpPrice(-1)}
              className="flex w-10 shrink-0 items-center justify-center rounded-lg bg-[#161616] text-zinc-400 ring-1 ring-white/8"
              aria-label={t("secondaryMarket.forms.ariaStepMinus")}
            >
              <Minus className="size-4" />
            </button>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={cn(smExchange.input, "text-center")}
              inputMode="decimal"
            />
            <button
              type="button"
              onClick={() => {
                if (side === "buy" && bestAsk) setPrice(String(bestAsk));
                if (side === "sell" && bestBid) setPrice(String(bestBid));
              }}
              className="shrink-0 rounded-lg bg-[#161616] px-2.5 font-mono text-[10px] font-semibold text-zinc-400 ring-1 ring-white/8"
            >
              BBO
            </button>
            <button
              type="button"
              onClick={() => bumpPrice(1)}
              className="flex w-10 shrink-0 items-center justify-center rounded-lg bg-[#161616] text-zinc-400 ring-1 ring-white/8"
              aria-label={t("secondaryMarket.forms.ariaStepPlus")}
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-black/40 px-2 py-2 font-mono text-[10px] text-zinc-400">
          {side === "buy" ? (
            <>
              <p className="text-zinc-500">{t("secondaryMarket.forms.marketAskEstimate")}</p>
              <p className="mt-1 text-zinc-200">
                {tf(t("secondaryMarket.forms.marketAvgPriceLine"), {
                  avg: marketBuyWalk && unitsNum ? formatUsdt(marketBuyWalk.avgPrice) : dash,
                  filled: String(marketBuyWalk?.filledUnits ?? 0),
                  total: String(unitsNum || 0),
                })}
              </p>
              <p className="mt-1 text-amber-200/85">{t("secondaryMarket.forms.marketSlippageHint")}</p>
            </>
          ) : (
            <>
              <p className="text-zinc-500">{t("secondaryMarket.forms.marketBidEstimate")}</p>
              <p className="mt-1 text-zinc-200">
                {tf(t("secondaryMarket.forms.marketAvgPriceLine"), {
                  avg: marketSellWalk && unitsNum ? formatUsdt(marketSellWalk.avgPrice) : dash,
                  filled: String(marketSellWalk?.filledUnits ?? 0),
                  total: String(unitsNum || 0),
                })}
              </p>
            </>
          )}
        </div>
      )}

      {orderMode === "limit" && side === "buy" && limitBuyCross && unitsNum ? (
        <p className="rounded-md bg-amber-500/10 px-2 py-1.5 font-mono text-[9px] text-amber-200/95">
          {tf(t("secondaryMarket.forms.limitBuyCrossHint"), {
            filled: String(limitBuyCross.filledUnits),
            price: formatUsdt(priceNum),
          })}
        </p>
      ) : null}
      {orderMode === "limit" && side === "sell" && limitSellCross && unitsNum ? (
        <p className="rounded-md bg-amber-500/10 px-2 py-1.5 font-mono text-[9px] text-amber-200/95">
          {tf(t("secondaryMarket.forms.limitSellCrossHint"), {
            filled: String(limitSellCross.filledUnits),
            price: formatUsdt(priceNum),
          })}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => {
            if (bestAsk) {
              setOrderMode("limit");
              setSide("buy");
              setPrice(String(bestAsk));
            }
          }}
          className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
        >
          {tf(t("secondaryMarket.forms.bestAskBtn"), { price: bestAsk ? formatUsdt(bestAsk) : dash })}
        </button>
        <button
          type="button"
          onClick={() => {
            if (bestBid) {
              setOrderMode("limit");
              setSide("sell");
              setPrice(String(bestBid));
            }
          }}
          className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
        >
          {tf(t("secondaryMarket.forms.bestBidBtn"), { price: bestBid ? formatUsdt(bestBid) : dash })}
        </button>
      </div>

      <div>
        <span className="font-mono text-[11px] text-zinc-500">{t("secondaryMarket.forms.amountUnt")}</span>
        <div className="mt-1.5 flex items-stretch gap-1">
          <button
            type="button"
            onClick={() => bumpUnits(-1)}
            className="flex w-10 shrink-0 items-center justify-center rounded-lg bg-[#161616] text-zinc-400 ring-1 ring-white/8"
            aria-label={t("secondaryMarket.forms.ariaUnitMinus")}
          >
            <Minus className="size-4" />
          </button>
          <input
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            className={cn(smExchange.input, "text-center")}
            inputMode="decimal"
            placeholder={t("secondaryMarket.forms.unitsMinPlaceholder")}
          />
          <button
            type="button"
            onClick={() => bumpUnits(1)}
            className="flex w-10 shrink-0 items-center justify-center rounded-lg bg-[#161616] text-zinc-400 ring-1 ring-white/8"
            aria-label={t("secondaryMarket.forms.ariaUnitPlus")}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="relative px-1 pt-1">
        <div className="h-px bg-white/10" aria-hidden />
        <div className="mt-2 flex justify-between">
          {([0, 25, 50, 75, 100] as const).map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => applyPct(pct)}
              className="flex flex-col items-center gap-1"
              aria-label={`${pct}%`}
            >
              <span className="size-2 rounded-full bg-zinc-600 transition-colors hover:bg-[#B7F500]" />
              <span className="font-mono text-[10px] text-zinc-600">{pct === 0 ? "0" : `${pct}%`}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="font-mono text-[11px] text-zinc-500">{t("secondaryMarket.forms.totalUsdt")}</span>
        <div className={cn(smExchange.input, "mt-1.5 flex items-center text-zinc-300")}>
          {subtotalUsdt > 0 ? formatUsdt(subtotalUsdt) : dash}
        </div>
      </div>

      <div className="space-y-1 font-mono text-[11px]">
        <div className="flex items-center justify-between text-zinc-500">
          <span>{orderMode === "market" ? t("secondaryMarket.forms.turnoverEstimate") : t("secondaryMarket.forms.subtotal")}</span>
          <span className="text-zinc-200">{subtotalUsdt > 0 ? `${formatUsdt(subtotalUsdt)} USDT` : dash}</span>
        </div>
        <div className="flex items-center justify-between text-zinc-500">
          <span>{tf(t("secondaryMarket.forms.fee"), { pct: feePctLabel })}</span>
          <span className="text-zinc-300">{subtotalUsdt > 0 ? `${formatUsdt(feeUsdt)} USDT` : dash}</span>
        </div>
        {side === "buy" ? (
          <div className="flex items-center justify-between text-zinc-500">
            <span>{t("secondaryMarket.forms.totalDebit")}</span>
            <span className="font-semibold text-white">{subtotalUsdt > 0 ? `${formatUsdt(buyDebit)} USDT` : dash}</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-zinc-500">
              <span>{t("secondaryMarket.forms.receiveGross")}</span>
              <span className="text-zinc-200">{subtotalUsdt > 0 ? `${formatUsdt(subtotalUsdt)} USDT` : dash}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-500">
              <span>{t("secondaryMarket.forms.receiveNet")}</span>
              <span className="font-semibold text-white">{subtotalUsdt > 0 ? `${formatUsdt(sellNet)} USDT` : dash}</span>
            </div>
          </>
        )}
        {orderMode === "market" && unitsNum > 0 ? (
          <div className="flex items-center justify-between text-zinc-600">
            <span>{t("secondaryMarket.forms.avgPriceEstimate")}</span>
            <span>{avgExec > 0 ? `${formatUsdt(avgExec)} USDT` : dash}</span>
          </div>
        ) : null}
      </div>

      {liveFeeError ? (
        <p className="rounded-md bg-rose-500/12 px-2 py-1.5 font-mono text-[10px] text-rose-200">{liveFeeError}</p>
      ) : null}
      {livePreviewBlocked ? (
        <p className="rounded-md bg-amber-500/12 px-2 py-1.5 font-mono text-[10px] text-amber-100" role="alert">
          {messageForApiError(livePreviewBlocked, locale)}
        </p>
      ) : null}
      {localError ? <p className="rounded-md bg-rose-500/12 px-2 py-1.5 font-mono text-[10px] text-rose-200">{localError}</p> : null}

      <button
        type="button"
        disabled={isSubmitting || consentBlocked || Boolean(livePreviewBlocked) || (Boolean(liveTrading) && orderMode === "market")}
        onClick={() => void submit()}
        className={cn(
          side === "buy" ? smExchange.submitBuy : smExchange.submitSell,
          isSubmitting && "cursor-wait opacity-70",
        )}
      >
        {isSubmitting
          ? t("secondaryMarket.forms.submitting")
          : side === "buy"
            ? tf(t("secondaryMarket.forms.submitBuySymbol"), { symbol: m.symbol })
            : tf(t("secondaryMarket.forms.submitSellSymbol"), { symbol: m.symbol })}
      </button>
      <p className="text-center font-mono text-[10px] leading-relaxed text-zinc-600">{caption}</p>
    </div>
  );
}
