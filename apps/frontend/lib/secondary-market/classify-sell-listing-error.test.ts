import { describe, expect, it } from "vitest";

import {
  classifySellListingError,
  extractApiErrorCode,
} from "./classify-sell-listing-error";

describe("classifySellListingError", () => {
  it("maps insufficient units codes", () => {
    expect(classifySellListingError("INSUFFICIENT_UNITS")).toBe("insufficient_units");
    expect(classifySellListingError("WALLET_INSUFFICIENT_BALANCE")).toBe("insufficient_units");
  });

  it("maps invalid price codes", () => {
    expect(classifySellListingError("INVALID_PRICE")).toBe("invalid_price");
    expect(classifySellListingError("VALIDATION_ERROR")).toBe("invalid_price");
  });

  it("maps network codes", () => {
    expect(classifySellListingError("NETWORK_ERROR")).toBe("network");
    expect(classifySellListingError("SERVER_UNAVAILABLE")).toBe("network");
  });

  it("falls back to generic", () => {
    expect(classifySellListingError("UNKNOWN")).toBe("generic");
    expect(classifySellListingError(null)).toBe("generic");
  });
});

describe("extractApiErrorCode", () => {
  it("reads code from error object", () => {
    expect(extractApiErrorCode({ code: "INSUFFICIENT_UNITS" })).toBe("INSUFFICIENT_UNITS");
    expect(extractApiErrorCode({ errorCode: "INVALID_PRICE" })).toBe("INVALID_PRICE");
  });
});
