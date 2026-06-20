export type AdminTrackStatus =
  | "draft"
  | "review"
  | "published"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type AdminTrackListItem = {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  coverUrl?: string;
  audioPreviewUrl?: string;
  status: AdminTrackStatus;
  releaseType?: "single" | "ep" | "album";
  genre: string;
  description?: string;
  shortDescription?: string;
  riskDisclosureText?: string;
  legalDisclaimer?: string;
  secondaryEnabled?: boolean;
  releaseDate?: string;
  labelName?: string;
  copyrightOwner?: string;
  isrc?: string;
  upc?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  yandexMusicUrl?: string;
  holderSharePct: string;
  artistSharePct: string;
  platformSharePct: string;
  /** @deprecated legacy aliases */
  revenueSharePoolPct: string;
  distributionSharePct: string;
  totalUnits: string;
  soldUnits: string;
  availableUnits: string;
  primaryUnitPrice: string;
  minPurchaseUnits?: string;
  maxPurchaseUnits?: string;
  raiseTargetUsdt: string;
  hardCapUsdt: string;
  promoBudgetUsdt: string;
  artistUpfrontUsdt: string;
  platformUpfrontUsdt: string;
  distributionNotes?: string;
  createdAt: string;
  updatedAt?: string;
};

export const MOCK_ADMIN_TRACKS: AdminTrackListItem[] = [
  {
    id: "trk-001",
    title: "Midnight Run",
    artist: "Nova Pulse",
    artistId: "art-001",
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop",
    audioPreviewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    status: "active",
    releaseType: "single",
    genre: "Electronic",
    description: "Электронный сингл с акцентом на ночную атмосферу и revenue share для держателей.",
    releaseDate: "2026-03-01",
    labelName: "Spliton Records",
    copyrightOwner: "Nova Pulse Publishing",
    isrc: "QZ-ABC-24-00001",
    holderSharePct: "70",
    artistSharePct: "25",
    platformSharePct: "5",
    revenueSharePoolPct: "70",
    distributionSharePct: "5",
    totalUnits: "10000",
    soldUnits: "6200",
    availableUnits: "3800",
    primaryUnitPrice: "5",
    minPurchaseUnits: "1",
    maxPurchaseUnits: "500",
    raiseTargetUsdt: "50000",
    hardCapUsdt: "80000",
    promoBudgetUsdt: "5000",
    artistUpfrontUsdt: "10000",
    platformUpfrontUsdt: "2500",
    distributionNotes: "Ежемесячные начисления после закрытия первичного раунда.",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-05-20T12:00:00Z",
  },
  {
    id: "trk-002",
    title: "Glass Horizon",
    artist: "Mira Lane",
    status: "review",
    releaseType: "ep",
    genre: "Indie Pop",
    description: "EP из четырёх треков — черновик перед проверкой контент-менеджером.",
    holderSharePct: "65",
    artistSharePct: "30",
    platformSharePct: "5",
    revenueSharePoolPct: "65",
    distributionSharePct: "5",
    totalUnits: "8000",
    soldUnits: "0",
    availableUnits: "8000",
    primaryUnitPrice: "4.5",
    minPurchaseUnits: "1",
    raiseTargetUsdt: "40000",
    hardCapUsdt: "60000",
    promoBudgetUsdt: "3000",
    artistUpfrontUsdt: "8000",
    platformUpfrontUsdt: "2000",
    createdAt: "2026-05-20T08:00:00Z",
  },
  {
    id: "trk-003",
    title: "Neon District",
    artist: "Kira Vex",
    status: "draft",
    releaseType: "album",
    genre: "Hip-Hop",
    holderSharePct: "72",
    artistSharePct: "23",
    platformSharePct: "5",
    revenueSharePoolPct: "72",
    distributionSharePct: "5",
    totalUnits: "12000",
    soldUnits: "0",
    availableUnits: "12000",
    primaryUnitPrice: "6",
    raiseTargetUsdt: "60000",
    hardCapUsdt: "90000",
    promoBudgetUsdt: "4000",
    artistUpfrontUsdt: "12000",
    platformUpfrontUsdt: "3000",
    createdAt: "2026-05-28T14:00:00Z",
  },
  {
    id: "trk-004",
    title: "Summer Echo",
    artist: "The Lumen",
    coverUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&h=600&fit=crop",
    status: "paused",
    releaseType: "single",
    genre: "Pop",
    holderSharePct: "68",
    artistSharePct: "27",
    platformSharePct: "5",
    revenueSharePoolPct: "68",
    distributionSharePct: "5",
    totalUnits: "6000",
    soldUnits: "4100",
    availableUnits: "1900",
    primaryUnitPrice: "5.5",
    raiseTargetUsdt: "35000",
    hardCapUsdt: "50000",
    promoBudgetUsdt: "2500",
    artistUpfrontUsdt: "6000",
    platformUpfrontUsdt: "1500",
    createdAt: "2026-01-15T09:00:00Z",
  },
];
