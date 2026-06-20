import { describe, expect, it } from "vitest";

import { getPortfolioDataSource, isLivePortfolioEnabled } from "@/lib/public-env";

describe("portfolio data source", () => {
  it("falls back to wallet data source when portfolio env is unset", () => {
    const prevPortfolio = process.env.NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE;
    const prevWallet = process.env.NEXT_PUBLIC_WALLET_DATA_SOURCE;
    delete process.env.NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE;
    process.env.NEXT_PUBLIC_WALLET_DATA_SOURCE = "live";
    expect(getPortfolioDataSource()).toBe("live");
    expect(isLivePortfolioEnabled()).toBe(true);
    process.env.NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE = prevPortfolio;
    process.env.NEXT_PUBLIC_WALLET_DATA_SOURCE = prevWallet;
  });

  it("honours explicit portfolio mock even when wallet is live", () => {
    const prevPortfolio = process.env.NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE;
    const prevWallet = process.env.NEXT_PUBLIC_WALLET_DATA_SOURCE;
    process.env.NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE = "mock";
    process.env.NEXT_PUBLIC_WALLET_DATA_SOURCE = "live";
    expect(getPortfolioDataSource()).toBe("mock");
    expect(isLivePortfolioEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE = prevPortfolio;
    process.env.NEXT_PUBLIC_WALLET_DATA_SOURCE = prevWallet;
  });
});
