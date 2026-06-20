import { ListingStatus, TradeSettlementStatus } from '@prisma/client';
import { formatMoneyRu, pctChange } from '../../common/admin-analytics.util';

export type AdminSecondaryMarketSummaryDto = {
  activeListingsCount: number;
  unitsListed: string;
  lockedUnits: string;
  tradeVolumeUsdt: string;
  completedTradesCount: number;
  avgPricePerUnitUsdt: string | null;
  avgTradeSizeUsdt: string | null;
  platformFeesUsdt: string;
  suspiciousCount: number;
  frozenListingsCount: number;
  cancelledListingsCount: number;
  deltaVolumePct: number | null;
  topReleases: Array<{
    releaseId: string;
    releaseTitle: string;
    tradeCount: number;
    volumeUsdt: string;
  }>;
};

export function listingStatusToApi(status: ListingStatus): string {
  const map: Record<ListingStatus, string> = {
    ACTIVE: 'active',
    PAUSED: 'frozen',
    SOLD_OUT: 'completed',
    CANCELLED: 'cancelled',
    EXPIRED: 'cancelled',
  };
  return map[status] ?? status.toLowerCase();
}

export function apiListingStatusToDb(
  status: string,
): ListingStatus | undefined {
  const map: Record<string, ListingStatus> = {
    active: ListingStatus.ACTIVE,
    frozen: ListingStatus.PAUSED,
    paused: ListingStatus.PAUSED,
    cancelled: ListingStatus.CANCELLED,
    completed: ListingStatus.SOLD_OUT,
  };
  return map[status];
}

export function tradeStatusToApi(
  status: TradeSettlementStatus,
  suspicious = false,
): string {
  if (suspicious) return 'suspicious';
  const map: Record<TradeSettlementStatus, string> = {
    PENDING: 'pending',
    SETTLED: 'completed',
    FAILED: 'failed',
    REVERSED: 'cancelled',
  };
  return map[status] ?? status.toLowerCase();
}

type ListingRow = {
  id: string;
  sellerUserId: string;
  releaseId: string;
  pricePerUnit: { toString(): string };
  unitsTotal: { toString(): string };
  unitsAvailable: { toString(): string };
  status: ListingStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  seller: { id: string; email: string; status: string };
  release: {
    title: string;
    status: string;
    coverUrl: string | null;
    releaseArtists?: Array<{ artist: { name: string } }>;
  };
};

export function mapListingListItem(
  row: ListingRow,
  meta?: {
    platformFeeEstimate?: string;
    hasRisk?: boolean;
    lockedUnits?: string;
  },
) {
  const units = row.unitsAvailable.toString();
  const ppu = row.pricePerUnit.toString();
  const total = Number(units) * Number(ppu);
  const locked =
    meta?.lockedUnits ??
    (Number(row.unitsTotal) - Number(row.unitsAvailable)).toString();
  const artistName = row.release.releaseArtists?.[0]?.artist.name ?? null;

  return {
    id: row.id,
    sellerId: row.sellerUserId,
    sellerEmail: row.seller.email,
    sellerStatus: row.seller.status.toLowerCase(),
    releaseId: row.releaseId,
    trackTitle: row.release.title,
    artistName,
    coverUrl: row.release.coverUrl,
    releaseStatus: row.release.status.toLowerCase(),
    units,
    unitsTotal: row.unitsTotal.toString(),
    lockedUnits: locked,
    pricePerUnitUsdt: formatMoneyRu(ppu),
    totalPriceUsdt: formatMoneyRu(total),
    platformFeeEstimateUsdt:
      meta?.platformFeeEstimate ?? formatMoneyRu(total * 0.01),
    status: listingStatusToApi(row.status),
    hasRisk: meta?.hasRisk ?? false,
    isLocked: Number(locked) > 0 || row.status === ListingStatus.PAUSED,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
  };
}

type TradeRow = {
  id: string;
  releaseId: string;
  buyerUserId: string;
  sellerUserId: string;
  listingId?: string | null;
  price: { toString(): string };
  units: { toString(): string };
  grossAmount: { toString(): string };
  feeTotal: { toString(): string };
  settlementStatus: TradeSettlementStatus;
  executedAt: Date;
  buyer: { id: string; email: string };
  seller: { id: string; email: string };
  release: {
    title: string;
    coverUrl: string | null;
    releaseArtists?: Array<{ artist: { name: string } }>;
  };
  buyOrder?: { listingId: string | null } | null;
};

export function mapTradeListItem(row: TradeRow, suspicious = false) {
  const artistName = row.release.releaseArtists?.[0]?.artist.name ?? null;
  return {
    id: row.id,
    listingId: row.buyOrder?.listingId ?? row.listingId ?? null,
    sellerId: row.sellerUserId,
    sellerEmail: row.seller.email,
    buyerId: row.buyerUserId,
    buyerEmail: row.buyer.email,
    releaseId: row.releaseId,
    trackTitle: row.release.title,
    artistName,
    coverUrl: row.release.coverUrl,
    units: row.units.toString(),
    pricePerUnitUsdt: formatMoneyRu(row.price.toString()),
    priceUsdt: formatMoneyRu(row.grossAmount.toString()),
    feeUsdt: formatMoneyRu(row.feeTotal.toString()),
    status: tradeStatusToApi(row.settlementStatus, suspicious),
    settlementStatus: row.settlementStatus.toLowerCase(),
    suspicious,
    completedAt: row.executedAt.toISOString(),
    createdAt: row.executedAt.toISOString(),
  };
}

export function buildSummaryMetrics(
  currentVolume: number,
  previousVolume: number,
): { deltaVolumePct: number | null } {
  return { deltaVolumePct: pctChange(currentVolume, previousVolume) };
}
