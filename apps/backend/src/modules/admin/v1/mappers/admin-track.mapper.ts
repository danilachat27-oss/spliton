import { Prisma, ReleaseStatus } from '@prisma/client';

export type AdminTrackListItemDto = {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  coverUrl?: string;
  audioPreviewUrl?: string;
  status: string;
  releaseType?: string;
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
  /** @deprecated aliases for legacy UI */
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
  updatedAt: string;
};

const STATUS_TO_API: Record<ReleaseStatus, string> = {
  DRAFT: 'draft',
  REVIEW: 'review',
  ACTIVE: 'active',
  PAUSED: 'paused',
  SOLD_OUT: 'completed',
  ARCHIVED: 'archived',
};

const API_TO_STATUS: Record<string, ReleaseStatus> = {
  draft: ReleaseStatus.DRAFT,
  review: ReleaseStatus.REVIEW,
  published: ReleaseStatus.ACTIVE,
  active: ReleaseStatus.ACTIVE,
  paused: ReleaseStatus.PAUSED,
  completed: ReleaseStatus.SOLD_OUT,
  archived: ReleaseStatus.ARCHIVED,
};

type ReleaseRow = {
  id: string;
  title: string;
  status: ReleaseStatus;
  coverUrl: string | null;
  audioPreviewUrl?: string | null;
  genre: string | null;
  description?: string | null;
  shortDescription?: string | null;
  riskDisclosureText?: string | null;
  legalDisclaimer?: string | null;
  secondaryEnabled?: boolean;
  releaseDate?: Date | null;
  releaseType?: string | null;
  copyrightOwner?: string | null;
  isrc?: string | null;
  upc?: string | null;
  spotifyUrl?: string | null;
  appleMusicUrl?: string | null;
  youtubeUrl?: string | null;
  yandexMusicUrl?: string | null;
  platformSharePct: Prisma.Decimal | null;
  artistSharePct: Prisma.Decimal | null;
  holderSharePct: Prisma.Decimal | null;
  totalUnits: Prisma.Decimal;
  unitsAvailablePrimary: Prisma.Decimal;
  primaryUnitPrice: Prisma.Decimal;
  minPurchaseUnits?: Prisma.Decimal | null;
  maxPurchaseUnits?: Prisma.Decimal | null;
  raiseTargetUsdt: Prisma.Decimal | null;
  hardCapUsdt: Prisma.Decimal | null;
  promoBudgetUsdt: Prisma.Decimal | null;
  artistUpfrontUsdt: Prisma.Decimal | null;
  platformUpfrontUsdt: Prisma.Decimal | null;
  distributionNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  label?: { name: string } | null;
  releaseArtists: Array<{ artistId: string; artist: { name: string } }>;
};

function dec(v: Prisma.Decimal | null | undefined, fallback = '0'): string {
  if (!v) return fallback;
  return Number(v.toString()).toFixed(2).replace(/\.00$/, '');
}

function units(v: Prisma.Decimal | null | undefined, fallback = '0'): string {
  if (!v) return fallback;
  return Number(v.toString()).toFixed(0);
}

export function releaseStatusToApi(status: ReleaseStatus): string {
  return STATUS_TO_API[status] ?? 'draft';
}

export function apiReleaseStatusToDb(status: string): ReleaseStatus {
  return API_TO_STATUS[status] ?? ReleaseStatus.DRAFT;
}

export function mapTrack(row: ReleaseRow): AdminTrackListItemDto {
  const total = Number(row.totalUnits.toString());
  const available = Number(row.unitsAvailablePrimary.toString());
  const sold = Math.max(0, total - available);
  const holder = row.holderSharePct ? Number(row.holderSharePct.toString()) : 0;
  const platform = row.platformSharePct
    ? Number(row.platformSharePct.toString())
    : 0;
  const artist = row.artistSharePct ? Number(row.artistSharePct.toString()) : 0;
  const mainArtist = row.releaseArtists[0];

  return {
    id: row.id,
    title: row.title,
    artist: mainArtist?.artist.name ?? '',
    artistId: mainArtist?.artistId,
    coverUrl: row.coverUrl ?? undefined,
    audioPreviewUrl: row.audioPreviewUrl ?? undefined,
    status: releaseStatusToApi(row.status),
    releaseType: row.releaseType ?? undefined,
    genre: row.genre?.trim() ?? '',
    description: row.description ?? undefined,
    shortDescription: row.shortDescription ?? undefined,
    riskDisclosureText: row.riskDisclosureText ?? undefined,
    legalDisclaimer: row.legalDisclaimer ?? undefined,
    secondaryEnabled: row.secondaryEnabled ?? true,
    releaseDate: row.releaseDate
      ? row.releaseDate.toISOString().slice(0, 10)
      : undefined,
    labelName: row.label?.name ?? undefined,
    copyrightOwner: row.copyrightOwner ?? undefined,
    isrc: row.isrc ?? undefined,
    upc: row.upc ?? undefined,
    spotifyUrl: row.spotifyUrl ?? undefined,
    appleMusicUrl: row.appleMusicUrl ?? undefined,
    youtubeUrl: row.youtubeUrl ?? undefined,
    yandexMusicUrl: row.yandexMusicUrl ?? undefined,
    holderSharePct: holder.toFixed(0),
    artistSharePct: artist.toFixed(0),
    platformSharePct: platform.toFixed(0),
    revenueSharePoolPct: holder.toFixed(0),
    distributionSharePct: platform.toFixed(0),
    totalUnits: total.toFixed(0),
    soldUnits: sold.toFixed(0),
    availableUnits: available.toFixed(0),
    primaryUnitPrice: dec(row.primaryUnitPrice, '0'),
    minPurchaseUnits: row.minPurchaseUnits
      ? units(row.minPurchaseUnits)
      : undefined,
    maxPurchaseUnits: row.maxPurchaseUnits
      ? units(row.maxPurchaseUnits)
      : undefined,
    raiseTargetUsdt: row.raiseTargetUsdt != null ? dec(row.raiseTargetUsdt) : '',
    hardCapUsdt: row.hardCapUsdt != null ? dec(row.hardCapUsdt) : '',
    promoBudgetUsdt: row.promoBudgetUsdt != null ? dec(row.promoBudgetUsdt) : '',
    artistUpfrontUsdt: row.artistUpfrontUsdt != null ? dec(row.artistUpfrontUsdt) : '',
    platformUpfrontUsdt: row.platformUpfrontUsdt != null ? dec(row.platformUpfrontUsdt) : '',
    distributionNotes: row.distributionNotes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
