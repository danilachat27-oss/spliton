import { describe, expect, it } from "vitest";

import { classifyLotPurchaseError } from "./classify-lot-purchase-error";

describe("classifyLotPurchaseError", () => {
  it("maps insufficient balance codes", () => {
    expect(classifyLotPurchaseError("WALLET_INSUFFICIENT_BALANCE")).toBe("insufficient_funds");
    expect(classifyLotPurchaseError("INSUFFICIENT_BALANCE")).toBe("insufficient_funds");
  });

  it("maps listing unavailable codes", () => {
    expect(classifyLotPurchaseError("LISTING_ALREADY_SOLD")).toBe("listing_unavailable");
    expect(classifyLotPurchaseError("LISTING_UNAVAILABLE")).toBe("listing_unavailable");
  });

  it("maps conflict codes to price changed", () => {
    expect(classifyLotPurchaseError("CONFLICT")).toBe("price_changed");
    expect(classifyLotPurchaseError("SECONDARY_TRADE_CONFLICT")).toBe("price_changed");
  });

  it("maps network codes", () => {
    expect(classifyLotPurchaseError("NETWORK_ERROR")).toBe("network");
    expect(classifyLotPurchaseError("SERVER_UNAVAILABLE")).toBe("network");
  });

  it("falls back to generic", () => {
    expect(classifyLotPurchaseError("VALIDATION_ERROR")).toBe("generic");
    expect(classifyLotPurchaseError(undefined)).toBe("generic");
  });
});
