"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { StyledSelect } from "@/components/ui/styled-select";
import { tf } from "@/lib/i18n/financial-messages";
import { formatUsdtRu } from "@/lib/wallet/format-money";
import { listingStatusLabel, tradeStatusLabel } from "@/lib/wallet/status-labels";
import {
  buyMarketListing,
  cancelMarketListing,
  createMarketListing,
  getWalletDataSource,
  listMarketListings,
  listMarketTrades,
  listMyMarketListings,
  listUserHoldings,
  type MarketListingItem,
  walletErrorMessage,
} from "@/services/wallet.service";
import { InlineToastBanner, useInlineToast } from "@/hooks/use-inline-toast";

const SECONDARY_FEE_PCT = 1;

export function SecondaryMarketLivePanel({ mode }: { mode: "market" | "orders" | "history" }) {
  const { t } = useI18n();
  const { authorizedFetch, user, isAuthenticated } = useAuth();
  const live = getWalletDataSource() === "live" && isAuthenticated;
  const [listings, setListings] = useState<MarketListingItem[]>([]);
  const [mine, setMine] = useState<MarketListingItem[]>([]);
  const [trades, setTrades] = useState<Awaited<ReturnType<typeof listMarketTrades>>["items"]>([]);
  const [holdings, setHoldings] = useState<Awaited<ReturnType<typeof listUserHoldings>>["items"]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackFilter, setTrackFilter] = useState("");
  const [form, setForm] = useState({ releaseId: "", units: "1", pricePerUnit: "1" });
  const [pendingBuy, setPendingBuy] = useState<MarketListingItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { message: toastMessage, showToast } = useInlineToast();

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === "market") {
        const res = await listMarketListings(authorizedFetch);
        setListings(res.items.filter((l) => l.status === "active"));
      } else if (mode === "orders") {
        const [m, h] = await Promise.all([
          listMyMarketListings(authorizedFetch),
          listUserHoldings(authorizedFetch),
        ]);
        setMine(m.items);
        setHoldings(h.items);
        if (h.items[0] && !form.releaseId) {
          setForm((f) => ({ ...f, releaseId: h.items[0]!.releaseId }));
        }
      } else {
        const t = await listMarketTrades(authorizedFetch);
        setTrades(t.items);
      }
    } catch (e) {
      setError(walletErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (mode !== "orders" || form.releaseId) return;
    const first = holdings[0]?.releaseId;
    if (first) setForm((f) => ({ ...f, releaseId: first }));
  }, [mode, holdings, form.releaseId]);

  const filteredListings = useMemo(() => {
    const q = trackFilter.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((l) => l.trackTitle.toLowerCase().includes(q));
  }, [listings, trackFilter]);

  if (!live) return null;

  if (loading && listings.length === 0 && mine.length === 0 && trades.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-400">{t("secondaryMarket.errors.loadingSecondaryMarket")}</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-sm text-red-200">
        {error}
        <button type="button" className="ml-2 underline" onClick={() => void load()}>
          {t("common.retry")}
        </button>
      </div>
    );
  }

  if (mode === "market") {
    return (
      <div className="space-y-4 py-4">
        <p className="text-xs text-zinc-500">{t("secondaryMarket.market.buyNote")}</p>
        <input
          type="search"
          placeholder={t("secondaryMarket.listings.filterTrackPlaceholder")}
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value)}
          className="h-10 w-full max-w-md rounded-lg border border-white/10 bg-zinc-900 px-3 text-sm text-white"
        />
        {filteredListings.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("secondaryMarket.listings.noActiveListings")}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredListings.map((l) => {
              const isOwn = l.sellerUserId === user?.id;
              const gross = Number(l.unitsAvailable) * Number(l.pricePerUnit);
              const fee = (gross * SECONDARY_FEE_PCT) / 100;
              return (
                <article
                  key={l.id}
                  className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 transition hover:border-lime-400/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white">{l.trackTitle}</h3>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-300">
                      {listingStatusLabel(l.status, t)}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-1 text-sm text-zinc-400">
                    <div className="flex justify-between">
                      <dt>{t("secondaryMarket.forms.unitsLabel")}</dt>
                      <dd className="font-mono text-white">{l.unitsAvailable}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>{t("secondaryMarket.forms.pricePerUnit")}</dt>
                      <dd className="font-mono text-white">{formatUsdtRu(l.pricePerUnit)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>{t("secondaryMarket.listings.sumLabel")}</dt>
                      <dd className="font-mono text-white">{formatUsdtRu(String(gross))}</dd>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <dt>{tf(t("secondaryMarket.forms.fee"), { pct: String(SECONDARY_FEE_PCT) })}</dt>
                      <dd className="font-mono">{formatUsdtRu(String(fee))}</dd>
                    </div>
                  </dl>
                  {isOwn ? (
                    <p className="mt-3 text-xs text-zinc-500">{t("secondaryMarket.listings.ownListingNote")}</p>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === l.id}
                      className="mt-4 w-full rounded-lg bg-lime-400 py-2 text-xs font-semibold text-black disabled:opacity-50"
                      onClick={() => setPendingBuy(l)}
                    >
                      {t("secondaryMarket.forms.buy")}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {pendingBuy ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-6 text-white shadow-xl">
              <h4 className="text-lg font-semibold">{t("secondaryMarket.forms.confirmPurchase")}</h4>
              <p className="mt-2 text-sm text-zinc-400">{pendingBuy.trackTitle}</p>
              <p className="mt-4 text-sm">
                {tf(t("secondaryMarket.listings.purchaseUnitsLine"), {
                  units: pendingBuy.unitsAvailable,
                  amount: formatUsdtRu(String(Number(pendingBuy.unitsAvailable) * Number(pendingBuy.pricePerUnit))),
                })}
              </p>
              <p className="mt-2 text-xs text-zinc-500">{t("secondaryMarket.listings.confirmPurchaseNote")}</p>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-white/20 py-2 text-sm"
                  onClick={() => setPendingBuy(null)}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-lime-400 py-2 text-sm font-semibold text-black"
                  disabled={!!busyId}
                  onClick={async () => {
                    setBusyId(pendingBuy.id);
                    try {
                      await buyMarketListing(pendingBuy.id, authorizedFetch);
                      setPendingBuy(null);
                      void load();
                    } catch (e) {
                      showToast(walletErrorMessage(e));
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  {t("secondaryMarket.forms.confirmPurchase")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <InlineToastBanner message={toastMessage} />
      </div>
    );
  }

  if (mode === "orders") {
    return (
      <div className="space-y-6 py-4">
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-white">{t("secondaryMarket.forms.createListingTitle")}</h3>
          <p className="mt-1 text-xs text-zinc-500">{t("secondaryMarket.listings.createListingHint")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StyledSelect
              tone="dark"
              fullWidth
              value={form.releaseId}
              options={holdings.map((h) => ({
                value: h.releaseId,
                label: tf(t("secondaryMarket.listings.holdingOptionLabel"), {
                  title: h.trackTitle,
                  units: h.unitsAvailable,
                }),
              }))}
              onChange={(releaseId) => setForm((f) => ({ ...f, releaseId }))}
            />
            <input
              className="rounded-lg bg-zinc-800 px-2 py-2 text-sm text-white"
              placeholder={t("secondaryMarket.listings.unitsPlaceholder")}
              value={form.units}
              onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
            />
            <input
              className="rounded-lg bg-zinc-800 px-2 py-2 text-sm text-white"
              placeholder={t("secondaryMarket.listings.pricePlaceholder")}
              value={form.pricePerUnit}
              onChange={(e) => setForm((f) => ({ ...f, pricePerUnit: e.target.value }))}
            />
          </div>
          <button
            type="button"
            className="mt-4 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black"
            onClick={async () => {
              try {
                await createMarketListing(
                  {
                    releaseId: form.releaseId,
                    units: Number(form.units),
                    pricePerUnit: Number(form.pricePerUnit),
                  },
                  authorizedFetch,
                );
                void load();
              } catch (e) {
                showToast(walletErrorMessage(e));
              }
            }}
          >
            {t("secondaryMarket.forms.listForSale")}
          </button>
        </div>

        <h3 className="text-sm font-semibold text-white">{t("secondaryMarket.listings.myListingsTitle")}</h3>
        {mine.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("secondaryMarket.listings.noListings")}</p>
        ) : (
          mine.map((l) => (
            <div key={l.id} className="rounded-xl border border-white/10 p-4">
              <div className="flex justify-between gap-2">
                <p className="text-white">{l.trackTitle}</p>
                <span className="text-xs text-zinc-400">{listingStatusLabel(l.status, t)}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                {tf(t("secondaryMarket.listings.listingUnitsLine"), {
                  available: l.unitsAvailable,
                  total: l.unitsTotal,
                  price: formatUsdtRu(l.pricePerUnit),
                })}
              </p>
              {(l.status === "active" || l.status === "paused") && (
                <button
                  type="button"
                  className="mt-2 text-xs text-red-400 underline"
                  onClick={async () => {
                    if (!window.confirm(t("secondaryMarket.listings.cancelListingConfirm"))) return;
                    await cancelMarketListing(l.id, authorizedFetch);
                    void load();
                  }}
                >
                  {t("secondaryMarket.listings.cancelListing")}
                </button>
              )}
            </div>
          ))
        )}
        <InlineToastBanner message={toastMessage} />
      </div>
    );
  }

  return (
    <div className="space-y-3 py-4">
      {trades.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("secondaryMarket.empty.noTrades")}</p>
      ) : (
        trades.map((trade) => (
          <div key={trade.id} className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
            <p className="font-medium text-white">{trade.trackTitle}</p>
            <p className="mt-1 text-sm text-zinc-400">
              {trade.role === "buyer" ? t("secondaryMarket.forms.buy") : t("secondaryMarket.forms.sell")} ·{" "}
              {trade.units} UNT · {formatUsdtRu(trade.grossAmount)}
            </p>
            <p className="text-xs text-zinc-500">
              {tf(t("secondaryMarket.listings.tradeFeeLine"), {
                fee: formatUsdtRu(trade.feeAmount),
                status: tradeStatusLabel(trade.status, t),
              })}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
