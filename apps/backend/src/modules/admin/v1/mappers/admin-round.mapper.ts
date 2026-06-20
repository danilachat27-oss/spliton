import { Prisma, PrimaryRaiseRoundStatus, ReleaseStatus } from '@prisma/client';
import { releaseStatusToApi } from './admin-track.mapper';

export type AdminRoundListItemDto = {
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
  status: string;
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

const STATUS_TO_API: Record<PrimaryRaiseRoundStatus, string> = {
  DRAFT: 'draft',
  LIVE: 'live',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const API_TO_STATUS: Record<string, PrimaryRaiseRoundStatus> = {
  draft: PrimaryRaiseRoundStatus.DRAFT,
  live: PrimaryRaiseRoundStatus.LIVE,
  paused: PrimaryRaiseRoundStatus.PAUSED,
  completed: PrimaryRaiseRoundStatus.COMPLETED,
  cancelled: PrimaryRaiseRoundStatus.CANCELLED,
};

type RoundReleaseRow = {
  id: string;
  title: string;
  status: ReleaseStatus;
  coverUrl: string | null;
  genre: string | null;
  holderSharePct: Prisma.Decimal | null;
  totalUnits: Prisma.Decimal;
  unitsAvailablePrimary: Prisma.Decimal;
  primaryUnitPrice: Prisma.Decimal;
  minPurchaseUnits: Prisma.Decimal | null;
  maxPurchaseUnits: Prisma.Decimal | null;
  releaseArtists: Array<{ artist: { name: string } }>;
  primaryRaiseRounds?: Array<{ id: string; status: PrimaryRaiseRoundStatus }>;
};

type RoundRow = {
  id: string;
  releaseId: string;
  name: string | null;
  status: PrimaryRaiseRoundStatus;
  raiseTargetUsdt: Prisma.Decimal;
  hardCapUsdt: Prisma.Decimal;
  raisedAmountUsdt: Prisma.Decimal;
  totalUnits: Prisma.Decimal;
  soldUnits: Prisma.Decimal;
  startDate: Date | null;
  endDate: Date | null;
  release: RoundReleaseRow;
};

function decMoney(v: Prisma.Decimal): string {
  return Number(v.toString()).toFixed(2).replace(/\.00$/, '');
}

function decUnits(v: Prisma.Decimal): string {
  return Number(v.toString()).toFixed(0);
}

function releaseArtist(release: RoundReleaseRow): string {
  return release.releaseArtists[0]?.artist.name ?? '—';
}

export function roundStatusToApi(status: PrimaryRaiseRoundStatus): string {
  return STATUS_TO_API[status] ?? 'draft';
}

export function apiRoundStatusToDb(status: string): PrimaryRaiseRoundStatus {
  return API_TO_STATUS[status] ?? PrimaryRaiseRoundStatus.DRAFT;
}

export function mapRound(
  row: RoundRow,
  currentRoundId?: string,
): AdminRoundListItemDto {
  const target = Number(row.raiseTargetUsdt.toString());
  const raised = Number(row.raisedAmountUsdt.toString());
  const total = Number(row.totalUnits.toString());
  const sold = Number(row.soldUnits.toString());
  const unitPrice = Number(row.release.primaryUnitPrice.toString());
  const release = row.release;

  const liveOthers =
    release.primaryRaiseRounds?.filter(
      (r) =>
        r.status === PrimaryRaiseRoundStatus.LIVE && r.id !== currentRoundId,
    ) ?? [];

  return {
    id: row.id,
    name: row.name?.trim() || 'Первичный раунд',
    trackId: row.releaseId,
    trackTitle: release.title,
    trackArtist: releaseArtist(release),
    trackCoverUrl: release.coverUrl,
    trackGenre: release.genre?.trim() || '—',
    trackStatus: releaseStatusToApi(release.status),
    holderSharePct: decMoney(release.holderSharePct ?? new Prisma.Decimal(0)),
    releaseTotalUnits: decUnits(release.totalUnits),
    releaseAvailableUnits: decUnits(release.unitsAvailablePrimary),
    unitPriceUsdt: decMoney(release.primaryUnitPrice),
    minPurchaseUnits: release.minPurchaseUnits
      ? decUnits(release.minPurchaseUnits)
      : '1',
    maxPurchaseUnits: release.maxPurchaseUnits
      ? decUnits(release.maxPurchaseUnits)
      : '',
    status: roundStatusToApi(row.status),
    raiseTargetUsdt: decMoney(row.raiseTargetUsdt),
    hardCapUsdt: decMoney(row.hardCapUsdt),
    raisedAmountUsdt: decMoney(row.raisedAmountUsdt),
    progressPct:
      target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0,
    totalUnits: decUnits(row.totalUnits),
    soldUnits: decUnits(row.soldUnits),
    availableUnits: Math.max(0, total - sold).toFixed(0),
    fullSalePotentialUsdt: decMoney(new Prisma.Decimal(total * unitPrice)),
    startDate: row.startDate?.toISOString().slice(0, 10) ?? '',
    endDate: row.endDate?.toISOString().slice(0, 10) ?? '',
    hasConflictingLiveRound: liveOthers.length > 0,
  };
}

export function snapRoundAudit(row: AdminRoundListItemDto) {
  return {
    status: row.status,
    name: row.name,
    totalUnits: row.totalUnits,
    availableUnits: row.availableUnits,
    soldUnits: row.soldUnits,
    unitPriceUsdt: row.unitPriceUsdt,
    raiseTargetUsdt: row.raiseTargetUsdt,
    hardCapUsdt: row.hardCapUsdt,
    raisedAmountUsdt: row.raisedAmountUsdt,
    startDate: row.startDate,
    endDate: row.endDate,
  };
}
