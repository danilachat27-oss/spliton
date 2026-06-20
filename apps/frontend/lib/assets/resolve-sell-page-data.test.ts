import { describe, expect, it } from "vitest";

import { resolveSellPageCatalogRow } from "@/lib/assets/resolve-sell-page-data";

describe("resolveSellPageCatalogRow", () => {
  it("returns null for unknown id in mock catalog mode", async () => {
    const prevCatalog = process.env.NEXT_PUBLIC_CATALOG_DATA_SOURCE;
    const prevWallet = process.env.NEXT_PUBLIC_WALLET_DATA_SOURCE;
    process.env.NEXT_PUBLIC_CATALOG_DATA_SOURCE = "mock";
    process.env.NEXT_PUBLIC_WALLET_DATA_SOURCE = "mock";
    try {
      const row = await resolveSellPageCatalogRow("00000000-0000-4000-8000-000000000099");
      expect(row).toBeNull();
    } finally {
      process.env.NEXT_PUBLIC_CATALOG_DATA_SOURCE = prevCatalog;
      process.env.NEXT_PUBLIC_WALLET_DATA_SOURCE = prevWallet;
    }
  });
});
