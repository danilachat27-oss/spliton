import { describe, expect, it } from "vitest";

import {
  amountFromUnits,
  clampUnits,
  computeEducationalPrimaryBuy,
  computeOwnershipPercent,
  computePrimaryPurchase,
  computeSecondaryTrade,
  effectiveMaxUnits,
  effectiveMinUnits,
  parseUnitPrice,
  unitsFromAmount,
  unitsFromUsdtBudget,
  validateUnitPrice,
} from "@/lib/market/pricing-calculator";

describe("pricing-calculator", () => {
  describe("parseUnitPrice / validateUnitPrice", () => {
    it("accepts positive finite prices", () => {
      expect(parseUnitPrice("10.5")).toBe(10.5);
      expect(validateUnitPrice(10.5)).toBe(true);
    });

    it("rejects zero, negative, NaN, Infinity", () => {
      expect(parseUnitPrice(0)).toBeNull();
      expect(parseUnitPrice(-1)).toBeNull();
      expect(parseUnitPrice(Number.NaN)).toBeNull();
      expect(parseUnitPrice(Number.POSITIVE_INFINITY)).toBeNull();
      expect(parseUnitPrice(undefined)).toBeNull();
      expect(validateUnitPrice(0)).toBe(false);
    });
  });

  describe("unitsFromAmount", () => {
    const price = 10;

    it("returns 0 when amount < pricePerUnit", () => {
      expect(unitsFromAmount(price, 5, 100)).toBe(0);
      expect(unitsFromUsdtBudget(price, 5, 100)).toBe(0);
    });

    it("returns 1 when amount equals pricePerUnit", () => {
      expect(unitsFromAmount(price, 10, 100)).toBe(1);
    });

    it("floors when amount > pricePerUnit", () => {
      expect(unitsFromAmount(price, 25, 100)).toBe(2);
      expect(unitsFromAmount(price, 29.99, 100)).toBe(2);
    });

    it("clamps to maxUnits", () => {
      expect(unitsFromAmount(price, 500, 3)).toBe(3);
    });

    it("respects minUnits", () => {
      expect(unitsFromAmount(price, 50, 100, 5)).toBe(5);
      expect(unitsFromAmount(price, 30, 100, 5)).toBe(0);
    });

    it("returns 0 for invalid price", () => {
      expect(unitsFromAmount(0, 100, 10)).toBe(0);
    });
  });

  describe("amountFromUnits", () => {
    it("different pricePerUnit yields different total for same units", () => {
      expect(amountFromUnits(10, 5)).toBe(50);
      expect(amountFromUnits(25, 5)).toBe(125);
    });

    it("computes totalAmount = units * pricePerUnit", () => {
      expect(amountFromUnits(10, 3)).toBe(30);
    });

    it("returns 0 for invalid inputs", () => {
      expect(amountFromUnits(0, 3)).toBe(0);
      expect(amountFromUnits(10, 0)).toBe(0);
    });
  });

  describe("effectiveMin/Max units", () => {
    it("uses minPurchaseUnits when provided", () => {
      expect(effectiveMinUnits(10)).toBe(10);
      expect(effectiveMinUnits(null)).toBe(1);
    });

    it("effectiveMaxUnits = min(available, maxPurchase)", () => {
      expect(effectiveMaxUnits(100, 50)).toBe(50);
      expect(effectiveMaxUnits(30, 50)).toBe(30);
      expect(effectiveMaxUnits(0, 50)).toBe(0);
    });
  });

  describe("clampUnits", () => {
    it("clamps within range", () => {
      expect(clampUnits(0, 1, 10)).toBe(1);
      expect(clampUnits(15, 1, 10)).toBe(10);
      expect(clampUnits(5, 1, 10)).toBe(5);
    });

    it("returns 0 when max < min", () => {
      expect(clampUnits(5, 10, 5)).toBe(0);
    });
  });

  describe("computePrimaryPurchase", () => {
    it("buyer total equals gross; fee inside gross", () => {
      const quote = computePrimaryPurchase({ unitPrice: 10, units: 2, feePct: 2 });
      expect(quote).toEqual({ grossAmount: 20, feeAmount: 0.4, totalPaid: 20 });
    });
  });

  describe("computeSecondaryTrade", () => {
    it("buyerTotal equals gross; seller receives net", () => {
      const quote = computeSecondaryTrade({ unitPrice: 10, units: 2, feePct: 1 });
      expect(quote?.buyerTotal).toBe(20);
      expect(quote?.grossAmount).toBe(20);
      expect(quote?.feeAmount).toBe(0.2);
      expect(quote?.sellerNet).toBe(19.8);
    });
  });

  describe("computeEducationalPrimaryBuy", () => {
    it("usdt mode matches primary checkout: floor(budget / price)", () => {
      const quote = computeEducationalPrimaryBuy({
        mode: "usdt",
        budgetUsdt: 25,
        unitPrice: 10,
        feePct: 2,
      });
      expect(quote?.units).toBe(2);
      expect(quote?.totalPaid).toBe(20);
      expect(quote?.grossAmount).toBe(20);
    });

    it("returns null when budget below one unit", () => {
      expect(
        computeEducationalPrimaryBuy({ mode: "usdt", budgetUsdt: 5, unitPrice: 10, feePct: 2 }),
      ).toBeNull();
    });

    it("units mode: totalPaid = units × price", () => {
      const quote = computeEducationalPrimaryBuy({
        mode: "units",
        unitsInput: 3,
        unitPrice: 10,
        feePct: 2,
      });
      expect(quote?.totalPaid).toBe(30);
      expect(quote?.feeAmount).toBe(0.6);
    });
  });

  describe("computeOwnershipPercent", () => {
    it("returns units / totalUnits * 100", () => {
      expect(computeOwnershipPercent(10, 1000)).toBe(1);
      expect(computeOwnershipPercent(25, 100)).toBe(25);
    });

    it("returns null when totalUnits invalid", () => {
      expect(computeOwnershipPercent(10, 0)).toBeNull();
      expect(computeOwnershipPercent(10, null)).toBeNull();
    });
  });
});
