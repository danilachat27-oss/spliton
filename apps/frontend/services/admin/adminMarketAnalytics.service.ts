import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import type { AnalyticsQuery } from "@/features/admin/analytics/types";
import {
  MOCK_MARKET_ANALYTICS_DEPTH,
  MOCK_MARKET_ANALYTICS_FEES,
  MOCK_MARKET_ANALYTICS_LIQUIDITY,
  MOCK_MARKET_ANALYTICS_LISTINGS,
  MOCK_MARKET_ANALYTICS_PRICES,
  MOCK_MARKET_ANALYTICS_RISK,
  MOCK_MARKET_ANALYTICS_SUMMARY,
  MOCK_MARKET_ANALYTICS_TOP_USERS,
  MOCK_MARKET_ANALYTICS_TRADES,
  MOCK_MARKET_ANALYTICS_VOLUME,
} from "@/features/admin/mocks/admin-analytics-market.mock";
import { fetchAnalytics } from "./adminAnalytics.service";

export async function getMarketAnalyticsSummary(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsMarketSummary, query, client, () => MOCK_MARKET_ANALYTICS_SUMMARY);
}

export async function getMarketAnalyticsVolume(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsMarketVolume, query, client, () => MOCK_MARKET_ANALYTICS_VOLUME);
}

export async function getMarketAnalyticsListings(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsMarketListings, query, client, () => MOCK_MARKET_ANALYTICS_LISTINGS);
}

export async function getMarketAnalyticsTrades(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsMarketTrades, query, client, () => MOCK_MARKET_ANALYTICS_TRADES);
}

export async function getMarketAnalyticsTopUsers(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsMarketTopUsers, query, client, () => MOCK_MARKET_ANALYTICS_TOP_USERS);
}

export async function getMarketAnalyticsFees(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsMarketFees, query, client, () => MOCK_MARKET_ANALYTICS_FEES);
}

export async function getMarketAnalyticsDepth(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsMarketDepth, query, client, () => MOCK_MARKET_ANALYTICS_DEPTH);
}

export async function getMarketAnalyticsLiquidity(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsMarketLiquidity, query, client, () => MOCK_MARKET_ANALYTICS_LIQUIDITY);
}

export async function getMarketAnalyticsPrices(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsMarketPrices, query, client, () => MOCK_MARKET_ANALYTICS_PRICES);
}

export async function getMarketAnalyticsRisk(query?: AnalyticsQuery, client?: AdminApiClient) {
  return fetchAnalytics(ADMIN_API_PATHS.analyticsMarketRisk, query, client, () => MOCK_MARKET_ANALYTICS_RISK);
}
