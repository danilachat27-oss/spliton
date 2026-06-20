import {
  PayoutFrequency,
  Prisma,
  ReleaseStatus,
  type Release,
} from '@prisma/client';
import type { SecondaryMarketLiquidityTag } from './secondary-market-rich.types';

export const PUBLIC_RELEASE_STATUSES: ReleaseStatus[] = [
  ReleaseStatus.ACTIVE,
  ReleaseStatus.PAUSED,
  ReleaseStatus.SOLD_OUT,
];

export function isPublicReleaseStatus(status: ReleaseStatus): boolean {
  return PUBLIC_RELEASE_STATUSES.includes(status);
}

export function decToMoney(value: Prisma.Decimal | number): string {
  return new Prisma.Decimal(value).toFixed(2);
}

export function artistName(
  release: Release & {
    releaseArtists?: { artist: { name: string } }[];
  },
): string {
  return (
    release.releaseArtists?.[0]?.artist.name ??
    release.copyrightOwner ??
    release.symbol
  );
}

export function mapStatusRu(
  status: ReleaseStatus,
): 'Активен' | 'Пауза' | 'Закрыт' | 'Новый' {
  if (status === ReleaseStatus.ACTIVE) return 'Активен';
  if (status === ReleaseStatus.PAUSED) return 'Пауза';
  if (status === ReleaseStatus.SOLD_OUT) return 'Закрыт';
  return 'Новый';
}

export function mapPayoutFreq(freq: PayoutFrequency): 'monthly' | 'biweekly' {
  return freq === PayoutFrequency.WEEKLY ? 'biweekly' : 'monthly';
}

export function liquidityLabel(
  tag: SecondaryMarketLiquidityTag,
): 'Deep' | 'Mid' | 'Thin' {
  if (tag === 'high') return 'Deep';
  if (tag === 'med') return 'Mid';
  return 'Thin';
}

export function secondaryLabel(
  deals7d: number,
  volume24h: Prisma.Decimal,
): string {
  if (deals7d >= 8 || Number(volume24h) >= 5000) return 'Высокий';
  if (deals7d >= 2 || Number(volume24h) >= 500) return 'Средний';
  if (deals7d > 0 || Number(volume24h) > 0) return 'Низкий';
  return '—';
}

export function trendFromChange(changePct: number): 'up' | 'down' | 'flat' {
  if (changePct > 0.5) return 'up';
  if (changePct < -0.5) return 'down';
  return 'flat';
}

export function segmentSlug(
  segment: string | null,
  genre: string | null,
): string {
  const raw = (genre ?? segment ?? '').toLowerCase();
  if (raw.includes('hip')) return 'hiphop';
  if (raw.includes('lo-fi') || raw === 'lofi') return 'lofi';
  if (raw.includes('pop')) return 'pop';
  if (raw.includes('electronic') || raw.includes('edm')) return 'electronic';
  if (raw.includes('indie')) return 'indie';
  return genre ?? segment ?? 'Electronic';
}

export function deriveCategories(input: {
  status: ReleaseStatus;
  yieldPct: number;
  activityScore: number;
  deals7d: number;
  volume24h: number;
  createdAt: Date;
}): string[] {
  const cats: string[] = ['all'];
  const ageDays =
    (Date.now() - input.createdAt.getTime()) / (24 * 60 * 60 * 1000);
  if (ageDays <= 45) cats.push('new');
  if (input.yieldPct >= 12) cats.push('yield');
  if (input.yieldPct >= 8 && input.yieldPct < 12) cats.push('stable');
  if (input.activityScore >= 50 || input.deals7d >= 5) cats.push('demand');
  if (input.deals7d >= 2 || input.volume24h > 0) cats.push('secondary');
  if (input.yieldPct >= 10 && input.volume24h >= 500) cats.push('premium');
  if (
    input.status === ReleaseStatus.SOLD_OUT ||
    input.status === ReleaseStatus.PAUSED
  ) {
    cats.push('archive');
  }
  return [...new Set(cats)];
}
