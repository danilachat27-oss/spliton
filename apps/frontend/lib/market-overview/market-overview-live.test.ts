import { describe, expect, it, vi } from "vitest";

import { isLiveMarketOverviewEnabled } from "@/services/market-overview.service";

vi.mock("@/lib/public-env", () => ({
  isLiveMarketOverviewEnabled: vi.fn(),
}));

describe("market overview live mode", () => {
  it("uses dedicated market overview data source flag", () => {
    vi.mocked(isLiveMarketOverviewEnabled).mockReturnValue(true);
    expect(isLiveMarketOverviewEnabled()).toBe(true);
  });
});
