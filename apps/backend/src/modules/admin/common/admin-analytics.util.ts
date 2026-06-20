import { HttpStatus } from '@nestjs/common';
import { throwAdminError } from './admin-http.util';

export type AnalyticsArea =
  | 'overview'
  | 'finance'
  | 'users'
  | 'tracks'
  | 'market'
  | 'revenue'
  | 'risk'
  | 'operations';

export type AnalyticsPeriodKey = '24h' | '7d' | '30d' | '90d' | 'custom';

export type ResolvedPeriod = {
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  key: AnalyticsPeriodKey;
};

const PERIOD_DAYS: Record<string, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export function resolveAnalyticsPeriod(
  period?: string,
  dateFrom?: string,
  dateTo?: string,
): ResolvedPeriod {
  const to = dateTo ? new Date(dateTo) : new Date();
  let from: Date;
  let key: AnalyticsPeriodKey = '30d';

  if (dateFrom && dateTo) {
    from = new Date(dateFrom);
    key = 'custom';
  } else {
    const days = PERIOD_DAYS[period ?? '30d'] ?? 30;
    key = (period as AnalyticsPeriodKey) ?? '30d';
    from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  }

  const spanMs = to.getTime() - from.getTime();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    throwAdminError(
      'ANALYTICS_INVALID_PERIOD',
      'Некорректный период аналитики',
      HttpStatus.BAD_REQUEST,
    );
  }
  const maxSpanMs = 366 * 24 * 60 * 60 * 1000;
  if (spanMs > maxSpanMs) {
    throwAdminError(
      'ANALYTICS_PERIOD_TOO_LARGE',
      'Период аналитики не может превышать 366 дней',
      HttpStatus.BAD_REQUEST,
    );
  }

  const previousTo = new Date(from.getTime());
  const previousFrom = new Date(from.getTime() - spanMs);

  return { from, to, previousFrom, previousTo, key };
}

export function formatMoneyRu(
  value: number | string | { toString(): string },
): string {
  const n = Number(String(value).replace(/\s/g, '').replace(',', '.'));
  return n.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function bucketByDay<T extends { createdAt?: Date; happenedAt?: Date }>(
  rows: T[],
  dateKey: 'createdAt' | 'happenedAt',
  amountFn: (row: T) => number,
): Array<{ period: string; amountUsdt: string; count: number }> {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const row of rows) {
    const d = row[dateKey];
    if (!d) continue;
    const key = d.toISOString().slice(0, 10);
    const prev = buckets.get(key) ?? { sum: 0, count: 0 };
    prev.sum += amountFn(row);
    prev.count += 1;
    buckets.set(key, prev);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({
      period,
      amountUsdt: formatMoneyRu(v.sum),
      count: v.count,
    }));
}

export function assertAnalyticsArea(
  roles: string[],
  area: AnalyticsArea,
): void {
  if (roles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r))) return;

  const readAll = roles.includes('BUSINESS_ANALYST');

  const ok = (() => {
    if (readAll) return true;
    switch (area) {
      case 'overview':
        return roles.some((r) =>
          [
            'ACCOUNTANT',
            'CONTENT_MANAGER',
            'SUPPORT_MANAGER',
            'COMPLIANCE',
            'SUPPORT',
          ].includes(r),
        );
      case 'finance':
      case 'revenue':
        return roles.includes('ACCOUNTANT');
      case 'tracks':
        return roles.includes('CONTENT_MANAGER');
      case 'market':
        return roles.some((r) =>
          ['ACCOUNTANT', 'COMPLIANCE', 'SUPPORT_MANAGER'].includes(r),
        );
      case 'risk':
        return roles.some((r) =>
          ['COMPLIANCE', 'ACCOUNTANT', 'SUPPORT_MANAGER'].includes(r),
        );
      case 'operations':
        return roles.some((r) =>
          ['SUPPORT_MANAGER', 'SUPPORT', 'COMPLIANCE'].includes(r),
        );
      case 'users':
        return roles.some((r) =>
          [
            'ACCOUNTANT',
            'SUPPORT_MANAGER',
            'COMPLIANCE',
            'CONTENT_MANAGER',
          ].includes(r),
        );
      default:
        return false;
    }
  })();

  if (!ok) {
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Insufficient analytics permissions',
      HttpStatus.FORBIDDEN,
    );
  }
}
