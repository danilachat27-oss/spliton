export type AdminRoundStatus = "draft" | "live" | "paused" | "completed" | "cancelled";



export type AdminRoundListItem = {

  id: string;

  name: string;

  trackId: string;

  trackTitle: string;

  trackArtist: string;

  trackCoverUrl: string | null;

  trackGenre: string;

  trackStatus: string;

  holderSharePct: string;

  releaseTotalUnits: string;

  releaseAvailableUnits: string;

  unitPriceUsdt: string;

  minPurchaseUnits: string;

  maxPurchaseUnits: string;

  status: AdminRoundStatus;

  raiseTargetUsdt: string;

  hardCapUsdt: string;

  raisedAmountUsdt: string;

  progressPct: number;

  totalUnits: string;

  soldUnits: string;

  availableUnits: string;

  fullSalePotentialUsdt: string;

  startDate: string;

  endDate: string;

  hasConflictingLiveRound: boolean;

};



export const MOCK_ADMIN_ROUNDS: AdminRoundListItem[] = [

  {

    id: "rnd-101",

    name: "Первичный раунд",

    trackId: "trk-001",

    trackTitle: "Midnight Run",

    trackArtist: "Nova Pulse",

    trackCoverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",

    trackGenre: "Electronic",

    trackStatus: "active",

    holderSharePct: "70",

    releaseTotalUnits: "10000",

    releaseAvailableUnits: "3800",

    unitPriceUsdt: "5",

    minPurchaseUnits: "1",

    maxPurchaseUnits: "1000",

    status: "live",

    raiseTargetUsdt: "50000",

    hardCapUsdt: "80000",

    raisedAmountUsdt: "38400",

    progressPct: 77,

    totalUnits: "10000",

    soldUnits: "6200",

    availableUnits: "3800",

    fullSalePotentialUsdt: "50000",

    startDate: "2026-03-01",

    endDate: "2026-08-01",

    hasConflictingLiveRound: false,

  },

  {

    id: "rnd-102",

    name: "Early access round",

    trackId: "trk-002",

    trackTitle: "Glass Horizon",

    trackArtist: "Lumen",

    trackCoverUrl: null,

    trackGenre: "Ambient",

    trackStatus: "draft",

    holderSharePct: "65",

    releaseTotalUnits: "8000",

    releaseAvailableUnits: "8000",

    unitPriceUsdt: "5",

    minPurchaseUnits: "1",

    maxPurchaseUnits: "500",

    status: "draft",

    raiseTargetUsdt: "40000",

    hardCapUsdt: "60000",

    raisedAmountUsdt: "0",

    progressPct: 0,

    totalUnits: "8000",

    soldUnits: "0",

    availableUnits: "8000",

    fullSalePotentialUsdt: "40000",

    startDate: "2026-06-01",

    endDate: "2026-11-01",

    hasConflictingLiveRound: false,

  },

  {

    id: "rnd-103",

    name: "Раунд 1",

    trackId: "trk-004",

    trackTitle: "Summer Echo",

    trackArtist: "Coastline",

    trackCoverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",

    trackGenre: "Pop",

    trackStatus: "active",

    holderSharePct: "72",

    releaseTotalUnits: "6000",

    releaseAvailableUnits: "1900",

    unitPriceUsdt: "5.5",

    minPurchaseUnits: "1",

    maxPurchaseUnits: "800",

    status: "paused",

    raiseTargetUsdt: "35000",

    hardCapUsdt: "50000",

    raisedAmountUsdt: "22550",

    progressPct: 64,

    totalUnits: "6000",

    soldUnits: "4100",

    availableUnits: "1900",

    fullSalePotentialUsdt: "33000",

    startDate: "2026-01-15",

    endDate: "2026-07-15",

    hasConflictingLiveRound: false,

  },

  {

    id: "rnd-099",

    name: "Первичный раунд",

    trackId: "trk-001",

    trackTitle: "Midnight Run",

    trackArtist: "Nova Pulse",

    trackCoverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",

    trackGenre: "Electronic",

    trackStatus: "active",

    holderSharePct: "70",

    releaseTotalUnits: "10000",

    releaseAvailableUnits: "0",

    unitPriceUsdt: "5",

    minPurchaseUnits: "1",

    maxPurchaseUnits: "1000",

    status: "completed",

    raiseTargetUsdt: "30000",

    hardCapUsdt: "45000",

    raisedAmountUsdt: "30000",

    progressPct: 100,

    totalUnits: "5000",

    soldUnits: "5000",

    availableUnits: "0",

    fullSalePotentialUsdt: "25000",

    startDate: "2025-06-01",

    endDate: "2025-12-01",

    hasConflictingLiveRound: false,

  },

];

