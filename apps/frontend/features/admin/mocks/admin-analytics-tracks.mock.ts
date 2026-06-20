/** Track & round analytics mocks — mock mode only (Spliton). */

export const MOCK_TRACK_ANALYTICS_SUMMARY = {
  period: { from: "2026-05-01T00:00:00.000Z", to: "2026-05-31T23:59:59.999Z" },
  totalReleases: 48,
  publishedReleases: 32,
  draftReleases: 9,
  reviewReleases: 4,
  incompleteReleases: 6,
  liveRounds: 7,
  completedRounds: 18,
  roundsWithoutSales: 3,
  averageRoundProgressPct: 42,
  totalUnits: 480000,
  soldUnits: 186400,
  availableUnits: 293600,
  totalRaisedUsdt: "1 240 800,00",
  activeListings: 24,
  secondaryTrades: 156,
  secondaryVolumeUsdt: "89 420,50",
  activeReleases: 28,
  totalTracks: 48,
  activeTracks: 28,
  liveRoundsLegacy: 7,
  byStatus: [
    { status: "active", count: 28 },
    { status: "draft", count: 9 },
    { status: "review", count: 4 },
    { status: "sold_out", count: 4 },
  ],
  deltas: { raisedPct: 12.4 },
};

const ROUNDS = [
  { roundId: "r1", trackId: "t1", trackTitle: "Midnight Drive", artistName: "Nova Pulse", status: "live", raisedUsdt: "84 200,00", targetUsdt: "120 000,00", hardCapUsdt: "150 000,00", progressPct: 70, soldUnits: "4200", availableUnits: "1800", totalUnits: "6000", holdersCount: 312, daysLeft: 14, warnings: [] as string[] },
  { roundId: "r2", trackId: "t2", trackTitle: "Echo Chamber", artistName: "Lumen", status: "live", raisedUsdt: "12 400,00", targetUsdt: "80 000,00", hardCapUsdt: "100 000,00", progressPct: 16, soldUnits: "620", availableUnits: "3380", totalUnits: "4000", holdersCount: 48, daysLeft: 5, warnings: ["low_progress", "ending_soon"] },
  { roundId: "r3", trackId: "t3", trackTitle: "Static Bloom", artistName: "Kira V", status: "live", raisedUsdt: "0,00", targetUsdt: "50 000,00", hardCapUsdt: "60 000,00", progressPct: 0, soldUnits: "0", availableUnits: "5000", totalUnits: "5000", holdersCount: 0, daysLeft: 21, warnings: ["no_sales", "missing_cover"] },
  { roundId: "r4", trackId: "t4", trackTitle: "Glass Horizon", artistName: "Arctic Line", status: "completed", raisedUsdt: "200 000,00", targetUsdt: "200 000,00", hardCapUsdt: "220 000,00", progressPct: 100, soldUnits: "10000", availableUnits: "0", totalUnits: "10000", holdersCount: 890, daysLeft: null, warnings: ["sold_out"] },
];

export const MOCK_TRACK_ANALYTICS_ROUND_PROGRESS = { items: ROUNDS };

export const MOCK_TRACK_ANALYTICS_UNITS = {
  soldUnits: 186400,
  availableUnits: 293600,
  lockedInListings: 12400,
  byRelease: [
    { trackId: "t4", trackTitle: "Glass Horizon", soldUnits: "10000", availableUnits: "0" },
    { trackId: "t1", trackTitle: "Midnight Drive", soldUnits: "4200", availableUnits: "1800" },
    { trackId: "t2", trackTitle: "Echo Chamber", soldUnits: "620", availableUnits: "3380" },
  ],
};

export const MOCK_TRACK_ANALYTICS_HOLDERS = {
  items: [
    { trackId: "t4", trackTitle: "Glass Horizon", holdersCount: 890, totalUnits: "10000", averageUnitsPerHolder: "11.24", topHolderSharePct: 8.2, highConcentration: false },
    { trackId: "t1", trackTitle: "Midnight Drive", holdersCount: 312, totalUnits: "4200", averageUnitsPerHolder: "13.46", topHolderSharePct: 22.1, highConcentration: false },
    { trackId: "t5", trackTitle: "Deep Signal", holdersCount: 42, totalUnits: "800", averageUnitsPerHolder: "19.05", topHolderSharePct: 61.5, highConcentration: true },
  ],
};

export const MOCK_TRACK_ANALYTICS_REVENUE = {
  items: [
    { trackId: "t4", trackTitle: "Glass Horizon", grossRevenueUsdt: "48 200,00", distributedUsdt: "38 560,00", platformShareUsdt: "4 820,00" },
    { trackId: "t1", trackTitle: "Midnight Drive", grossRevenueUsdt: "18 400,00", distributedUsdt: "12 100,00", platformShareUsdt: "1 840,00" },
  ],
};

export const MOCK_TRACK_ANALYTICS_SECONDARY = {
  items: [
    { trackId: "t4", trackTitle: "Glass Horizon", listingsCount: 8, tradesCount: 92, volumeUsdt: "52 100,00", averagePriceUsdt: "12,40", primaryPriceUsdt: "10,00", priceVsPrimaryPct: 24 },
    { trackId: "t1", trackTitle: "Midnight Drive", listingsCount: 5, tradesCount: 41, volumeUsdt: "21 300,00", averagePriceUsdt: "11,80", primaryPriceUsdt: "10,00", priceVsPrimaryPct: 18 },
  ],
};

export const MOCK_TRACK_ANALYTICS_READINESS = {
  items: [
    { trackId: "t3", trackTitle: "Static Bloom", status: "draft", readinessScore: 35, missingFields: ["cover", "live_round", "audio_preview"] },
    { trackId: "t6", trackTitle: "Untitled Demo", status: "review", readinessScore: 55, missingFields: ["description", "revenue_shares"] },
    { trackId: "t1", trackTitle: "Midnight Drive", status: "active", readinessScore: 100, missingFields: [] },
  ],
};

export const MOCK_TRACK_ANALYTICS_TOP = {
  topByRaised: [
    { trackId: "t4", trackTitle: "Glass Horizon", valueUsdt: "200 000,00", metric: 200000 },
    { trackId: "t1", trackTitle: "Midnight Drive", valueUsdt: "84 200,00", metric: 84200 },
  ],
  topByHolders: [
    { trackId: "t4", trackTitle: "Glass Horizon", holdersCount: 890 },
    { trackId: "t1", trackTitle: "Midnight Drive", holdersCount: 312 },
  ],
  attention: [
    { trackId: "t3", trackTitle: "Static Bloom", reason: "live_round_no_sales", label: "Live раунд без продаж" },
    { trackId: "t3", trackTitle: "Static Bloom", reason: "missing_cover", label: "Нет обложки" },
    { trackId: "t5", trackTitle: "Deep Signal", reason: "high_concentration", label: "Высокая концентрация держателей" },
  ],
};
