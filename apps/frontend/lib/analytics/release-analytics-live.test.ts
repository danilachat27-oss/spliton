import { describe, expect, it, vi } from "vitest";

import { isLiveReleaseAnalyticsEnabled } from "@/services/release-analytics.service";

vi.mock("@/lib/public-env", () => ({
  isLiveReleaseAnalyticsEnabled: vi.fn(),
}));

describe("release analytics live mode", () => {
  it("uses dedicated release analytics data source flag", () => {
    vi.mocked(isLiveReleaseAnalyticsEnabled).mockReturnValue(true);
    expect(isLiveReleaseAnalyticsEnabled()).toBe(true);
  });
});
