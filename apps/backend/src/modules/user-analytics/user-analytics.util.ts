import { Prisma, ReleaseStatus } from '@prisma/client';
import type {
  UserAnalyticsRowStatus,
  UserAnalyticsTrend,
} from './types/user-analytics-api.types';

export function mapReleaseStatus(
  status: ReleaseStatus,
): UserAnalyticsRowStatus {
  if (status === ReleaseStatus.ACTIVE || status === ReleaseStatus.SOLD_OUT) {
    return 'Active';
  }
  if (status === ReleaseStatus.PAUSED || status === ReleaseStatus.REVIEW) {
    return 'Paused';
  }
  return 'Closed';
}

export function mapGenre(segment: string | null, genre: string | null): string {
  const raw = (genre ?? segment ?? 'indie').toLowerCase();
  if (raw.includes('hip')) return 'hiphop';
  if (raw.includes('pop')) return 'pop';
  if (raw.includes('electronic') || raw.includes('edm')) return 'electronic';
  return 'electronic';
}

export function trendFromChange(
  changePct: Prisma.Decimal | number,
): UserAnalyticsTrend {
  const n = Number(changePct);
  if (n > 0.5) return 'up';
  if (n < -0.5) return 'down';
  return 'flat';
}

export function formatPct(
  value: Prisma.Decimal | number,
  decimals = 1,
): string {
  const n = Number(value);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals).replace('.', ',')}%`;
}

export function formatUsdt(value: Prisma.Decimal | number): string {
  const n = Number(value);
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(
    Math.round(n),
  )} USDT`;
}

export function formatUnits(value: Prisma.Decimal | number): string {
  const n = Number(value);
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n);
}

export function artistNames(
  releaseArtists: { artist: { name: string } }[],
): string {
  return (
    releaseArtists
      .map((a) => a.artist.name)
      .filter(Boolean)
      .join(', ') || '—'
  );
}

export function normalizeSparkline(
  closes: Prisma.Decimal[],
  target = 12,
): number[] {
  if (closes.length === 0) {
    return Array.from({ length: target }, () => 40);
  }
  const nums = closes.map((c) => Number(c));
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const scaled = nums.map((n) => 30 + ((n - min) / span) * 50);
  if (scaled.length >= target) return scaled.slice(-target);
  const out = [...scaled];
  while (out.length < target) {
    out.unshift(out[0] ?? 40);
  }
  return out;
}

export function expandSeries(base: number[], targetLen: number): number[] {
  if (base.length === 0) {
    return Array.from({ length: targetLen }, (_, i) => 40 + i * 0.5);
  }
  const out: number[] = [];
  for (let i = 0; i < targetLen; i++) {
    out.push(base[i % base.length]);
  }
  return out;
}
