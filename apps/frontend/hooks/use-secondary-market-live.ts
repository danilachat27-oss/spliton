"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import {
  adaptRichListing,
  adaptRichTrade,
  adaptUserOrder,
  type AdaptedListing,
  type AdaptedUserOrder,
} from "@/lib/secondary-market/secondary-market-adapter";
import {
  DEFAULT_MARKET_LISTINGS_QUERY,
  marketListingsQueryKey,
  type MarketListingsQuery,
} from "@/lib/secondary-market/market-listings-query";
import { getWalletDataSource } from "@/services/wallet.service";
import {
  buyListing,
  cancelListing,
  cancelMarketOrder,
  createListing,
  fetchMarketListings,
  fetchMarketTrades,
  fetchMyListings,
  fetchMyOrders,
  fetchUserHoldings,
  type BuyTradeResult,
  type UserHoldingItem,
} from "@/services/secondary-market.service";
import { walletErrorMessage } from "@/services/wallet.service";
import type { SecondaryMarketUserTradeMock } from "@/components/dashboard/secondary-market/secondary-market-trade-history-tab";

export function useSecondaryMarketCatalog(query: MarketListingsQuery = DEFAULT_MARKET_LISTINGS_QUERY) {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const live = getWalletDataSource() === "live" && isAuthenticated;
  const [listings, setListings] = useState<AdaptedListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryKey = useMemo(() => marketListingsQueryKey(query), [query]);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMarketListings(authorizedFetch, query);
      setListings(res.items.map(adaptRichListing));
      setTotal(res.total);
    } catch (e) {
      setError(walletErrorMessage(e));
      setListings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live, queryKey, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const buy = useCallback(
    async (listingId: string): Promise<BuyTradeResult> => {
      const result = await buyListing(authorizedFetch, listingId);
      await load();
      return result;
    },
    [authorizedFetch, load],
  );

  return { live, loading, error, listings, total, reload: load, buy };
}

export function useSecondaryMarketMyOrders() {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const live = getWalletDataSource() === "live" && isAuthenticated;
  const [orders, setOrders] = useState<AdaptedUserOrder[]>([]);
  const [holdings, setHoldings] = useState<UserHoldingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const [o, h] = await Promise.all([
        fetchMyOrders(authorizedFetch),
        fetchUserHoldings(authorizedFetch),
      ]);
      setOrders(o.items.map(adaptUserOrder));
      setHoldings(h.items);
    } catch (e) {
      setError(walletErrorMessage(e));
      setOrders([]);
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (body: { releaseId: string; units: number; pricePerUnit: number }) => {
      await createListing(authorizedFetch, body);
      await load();
    },
    [authorizedFetch, load],
  );

  const cancel = useCallback(
    async (listingId: string) => {
      await cancelListing(authorizedFetch, listingId);
      await load();
    },
    [authorizedFetch, load],
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      await cancelMarketOrder(authorizedFetch, orderId);
      await load();
    },
    [authorizedFetch, load],
  );

  return { live, loading, error, orders, holdings, reload: load, create, cancel, cancelOrder };
}

export function useSecondaryMarketTrades() {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const live = getWalletDataSource() === "live" && isAuthenticated;
  const [trades, setTrades] = useState<SecondaryMarketUserTradeMock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMarketTrades(authorizedFetch);
      setTrades(res.items.map(adaptRichTrade));
    } catch (e) {
      setError(walletErrorMessage(e));
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live]);

  useEffect(() => {
    void load();
  }, [load]);

  return { live, loading, error, trades, reload: load };
}
