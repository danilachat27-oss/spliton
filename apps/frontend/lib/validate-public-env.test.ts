import { describe, expect, it } from "vitest";

import { validatePublicEnvForBuild } from "@/lib/validate-public-env";

function withEnv(
  vars: Record<string, string | undefined>,
  fn: () => void,
): void {
  const prev: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    prev[key] = process.env[key];
    const value = vars[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(vars)) {
      const value = prev[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

const LIVE_ENV: Record<string, string> = {
  NEXT_PUBLIC_APP_ENV: "staging",
  NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
  NEXT_PUBLIC_ADMIN_DATA_SOURCE: "live",
  NEXT_PUBLIC_WALLET_DATA_SOURCE: "live",
  NEXT_PUBLIC_CATALOG_DATA_SOURCE: "live",
  NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE: "live",
  NEXT_PUBLIC_PAYOUTS_DATA_SOURCE: "live",
  NEXT_PUBLIC_SERVICES_DATA_SOURCE: "live",
  NEXT_PUBLIC_RELEASE_ANALYTICS_DATA_SOURCE: "live",
  NEXT_PUBLIC_MARKET_OVERVIEW_DATA_SOURCE: "live",
  NEXT_PUBLIC_AUTH_DATA_SOURCE: "live",
  NEXT_PUBLIC_SUPPORT_DATA_SOURCE: "live",
  NEXT_PUBLIC_NEWS_DATA_SOURCE: "live",
  NEXT_PUBLIC_STATUS_DATA_SOURCE: "live",
};

describe("validatePublicEnvForBuild", () => {
  it("allows development with mock sources", () => {
    withEnv(
      {
        NEXT_PUBLIC_APP_ENV: "development",
        NEXT_PUBLIC_WALLET_DATA_SOURCE: "mock",
        NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE: "mock",
      },
      () => {
        expect(() => validatePublicEnvForBuild()).not.toThrow();
      },
    );
  });

  it("passes production build when all critical sources are live", () => {
    withEnv(
      {
        ...LIVE_ENV,
        NEXT_PUBLIC_APP_ENV: "production",
      },
      () => {
        expect(() => validatePublicEnvForBuild()).not.toThrow();
      },
    );
  });

  it("passes staging build when all critical sources are live", () => {
    withEnv(LIVE_ENV, () => {
      expect(() => validatePublicEnvForBuild()).not.toThrow();
    });
  });

  it("passes staging when only WALLET is explicit live and others inherit live", () => {
    withEnv(
      {
        NEXT_PUBLIC_APP_ENV: "staging",
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
        NEXT_PUBLIC_WALLET_DATA_SOURCE: "live",
        NEXT_PUBLIC_ADMIN_DATA_SOURCE: "live",
        NEXT_PUBLIC_SUPPORT_DATA_SOURCE: "live",
        NEXT_PUBLIC_NEWS_DATA_SOURCE: "live",
        NEXT_PUBLIC_STATUS_DATA_SOURCE: "live",
        NEXT_PUBLIC_CATALOG_DATA_SOURCE: undefined,
        NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE: undefined,
        NEXT_PUBLIC_PAYOUTS_DATA_SOURCE: undefined,
        NEXT_PUBLIC_SERVICES_DATA_SOURCE: undefined,
        NEXT_PUBLIC_AUTH_DATA_SOURCE: undefined,
        NEXT_PUBLIC_MARKET_OVERVIEW_DATA_SOURCE: undefined,
        NEXT_PUBLIC_RELEASE_ANALYTICS_DATA_SOURCE: undefined,
      },
      () => {
        expect(() => validatePublicEnvForBuild()).not.toThrow();
      },
    );
  });

  it("fails staging build when PORTFOLIO resolves to mock", () => {
    withEnv(
      {
        ...LIVE_ENV,
        NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE: "mock",
      },
      () => {
        expect(() => validatePublicEnvForBuild()).toThrow(/PORTFOLIO_DATA_SOURCE/);
      },
    );
  });

  it("fails staging build when PAYOUTS resolves to mock", () => {
    withEnv(
      {
        ...LIVE_ENV,
        NEXT_PUBLIC_PAYOUTS_DATA_SOURCE: "mock",
      },
      () => {
        expect(() => validatePublicEnvForBuild()).toThrow(/PAYOUTS_DATA_SOURCE/);
      },
    );
  });

  it("fails staging build when SERVICES resolves to mock", () => {
    withEnv(
      {
        ...LIVE_ENV,
        NEXT_PUBLIC_SERVICES_DATA_SOURCE: "mock",
      },
      () => {
        expect(() => validatePublicEnvForBuild()).toThrow(/SERVICES_DATA_SOURCE/);
      },
    );
  });

  it("fails staging build when MARKET_OVERVIEW resolves to mock", () => {
    withEnv(
      {
        ...LIVE_ENV,
        NEXT_PUBLIC_MARKET_OVERVIEW_DATA_SOURCE: "mock",
      },
      () => {
        expect(() => validatePublicEnvForBuild()).toThrow(/MARKET_OVERVIEW_DATA_SOURCE/);
      },
    );
  });

  it("fails staging build when RELEASE_ANALYTICS resolves to mock", () => {
    withEnv(
      {
        ...LIVE_ENV,
        NEXT_PUBLIC_RELEASE_ANALYTICS_DATA_SOURCE: "mock",
      },
      () => {
        expect(() => validatePublicEnvForBuild()).toThrow(/RELEASE_ANALYTICS_DATA_SOURCE/);
      },
    );
  });

  it("fails staging when WALLET is mock even if catalog is explicit live", () => {
    withEnv(
      {
        ...LIVE_ENV,
        NEXT_PUBLIC_WALLET_DATA_SOURCE: "mock",
        NEXT_PUBLIC_CATALOG_DATA_SOURCE: "live",
      },
      () => {
        expect(() => validatePublicEnvForBuild()).toThrow(/WALLET_DATA_SOURCE/);
      },
    );
  });

  it("fails staging when API base URL is missing", () => {
    withEnv(
      {
        ...LIVE_ENV,
        NEXT_PUBLIC_API_BASE_URL: undefined,
      },
      () => {
        expect(() => validatePublicEnvForBuild()).toThrow(/API_BASE_URL/);
      },
    );
  });
});
