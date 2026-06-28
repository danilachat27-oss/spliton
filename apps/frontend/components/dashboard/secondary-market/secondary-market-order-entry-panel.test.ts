import { describe, expect, it } from "vitest";

import { computeSecondaryTrade } from "@/lib/market/pricing-calculator";

const DEMO_FEE_PCT = 1;

describe("secondary order book demo fee model", () => {
  it("demo buyDebit equals gross — fee does not increase buyer debit", () => {
    const subtotalUsdt = 100;
    const unitsNum = 10;
    const quote = computeSecondaryTrade({
      unitPrice: subtotalUsdt / unitsNum,
      units: unitsNum,
      feePct: DEMO_FEE_PCT,
    });

    expect(quote?.buyerTotal).toBe(subtotalUsdt);
    expect(quote?.grossAmount).toBe(subtotalUsdt);
    expect(quote?.feeAmount).toBe(1);
    expect(quote?.buyerTotal).not.toBe(subtotalUsdt + (quote?.feeAmount ?? 0));
  });

  it("seller proceeds are gross minus fee", () => {
    const subtotalUsdt = 50;
    const quote = computeSecondaryTrade({
      unitPrice: 5,
      units: 10,
      feePct: DEMO_FEE_PCT,
    });

    expect(quote?.sellerNet).toBe(subtotalUsdt - 0.5);
  });
});
