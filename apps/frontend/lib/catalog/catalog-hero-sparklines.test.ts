import { describe, expect, it } from "vitest";

import { buildCatalogHeroSparklines } from "./catalog-hero-sparklines";

describe("buildCatalogHeroSparklines", () => {
  it("renders flat zero series when listings are zero", () => {
    const { listings } = buildCatalogHeroSparklines({
      publicReleases: 3,
      livePrimaryRounds: 2,
      activeSecondaryListings: 0,
      totalVolume24hUsdt: "7200",
      totalVolume7dUsdt: "50400",
      updatedAt: new Date().toISOString(),
    });

    expect(listings.values.every((v) => v === 0)).toBe(true);
    expect(listings.trend).toBe("flat");
    expect(listings.muted).toBe(true);
  });

  it("renders flat series at current listing count when non-zero", () => {
    const { listings } = buildCatalogHeroSparklines({
      publicReleases: 3,
      livePrimaryRounds: 2,
      activeSecondaryListings: 5,
      totalVolume24hUsdt: "7200",
      updatedAt: new Date().toISOString(),
    });

    expect(listings.values.every((v) => v === 5)).toBe(true);
    expect(listings.trend).toBe("flat");
    expect(listings.muted).toBe(false);
  });

  it("builds volume ramp when 24h exceeds 7d daily average", () => {
    const { volume } = buildCatalogHeroSparklines({
      publicReleases: 3,
      livePrimaryRounds: 2,
      activeSecondaryListings: 0,
      totalVolume24hUsdt: "9000",
      totalVolume7dUsdt: "50400",
      updatedAt: new Date().toISOString(),
    });

    expect(volume.values[0]).toBeLessThan(volume.values[volume.values.length - 1]!);
    expect(volume.values[volume.values.length - 1]).toBe(9000);
    expect(volume.muted).toBe(false);
  });

  it("renders flat volume when 24h matches 7d daily average", () => {
    const { volume } = buildCatalogHeroSparklines({
      publicReleases: 3,
      livePrimaryRounds: 2,
      activeSecondaryListings: 0,
      totalVolume24hUsdt: "7200",
      totalVolume7dUsdt: "50400",
      updatedAt: new Date().toISOString(),
    });

    expect(volume.values.every((v) => v === 7200)).toBe(true);
    expect(volume.trend).toBe("flat");
  });
});
