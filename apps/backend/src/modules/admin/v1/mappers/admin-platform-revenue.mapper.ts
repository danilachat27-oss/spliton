import { Prisma } from '@prisma/client';
import { formatMoneyRu, pctChange } from '../../common/admin-analytics.util';

export const PLATFORM_FEE_SOURCES = [
  'primary_purchase_fee',
  'withdrawal_fee',
  'secondary_market_fee',
  'premium',
  'private_deals',
  'manual',
  'other',
] as const;

export type AdminPlatformRevenueSourceDto = {
  source: string;
  amountUsdt: string;
  sharePct: string;
  operationCount: number;
  avgAmountUsdt: string;
  deltaPct: number | null;
};

export type AdminPlatformRevenueSummaryDto = {
  totalUsdt: string;
  periodUsdt: string;
  previousPeriodUsdt: string;
  deltaPct: number | null;
  transactionCount: number;
  avgFeeUsdt: string | null;
  pendingCount: number;
  failedCount: number;
  bySource: AdminPlatformRevenueSourceDto[];
  lastUpdatedAt: string | null;
};

export type AdminPlatformRevenuePeriodPointDto = {
  period: string;
  amountUsdt: string;
  count: number;
  bySource?: Record<string, string>;
};

export type AdminPlatformRevenueTransactionDto = {
  id: string;
  source: string;
  amountUsdt: string;
  asset: string;
  period: string;
  createdAt: string;
  status: string;
  userId: string | null;
  userEmail: string | null;
  subjectType: string;
  subjectId: string | null;
  releaseId: string | null;
  releaseTitle: string | null;
  walletTxId: string | null;
};

export type AdminPlatformRevenueReleaseRowDto = {
  releaseId: string;
  releaseTitle: string;
  artistName: string | null;
  roundId: string | null;
  primaryFeeUsdt: string;
  secondaryFeeUsdt: string;
  withdrawalFeeUsdt: string;
  totalFeeUsdt: string;
  purchaseCount: number;
  tradeCount: number;
};

export type AdminPlatformFeeSettingsDto = {
  primaryPurchaseFeePct: string;
  withdrawalFeeUsdt: string;
  withdrawalFeePct: string | null;
  secondaryMarketFeePct: string;
  premiumMonthlyUsdt: string;
  effectiveFrom: string;
  updatedAt?: string;
};

export type AdminPlatformFeeHistoryRowDto = {
  id: string;
  primaryPurchaseFeePct: string;
  withdrawalFeeUsdt: string;
  secondaryMarketFeePct: string;
  premiumMonthlyUsdt: string;
  effectiveFrom: string;
  isActive: boolean;
  createdByEmail: string | null;
  updatedByEmail: string | null;
  createdAt: string;
};

type FeeRow = {
  id: string;
  feeCode: string;
  subjectType: string;
  subjectId: string | null;
  amountCharged: Prisma.Decimal;
  currency: string;
  createdAt: Date;
  walletTransactionId: string | null;
  walletTransaction?: {
    id: string;
    status: string;
    wallet?: { userId: string; user?: { email: string } };
  } | null;
};

export function sumFees(
  fees: Array<{ amountCharged: Prisma.Decimal }>,
): number {
  return fees.reduce((s, f) => s + Number(f.amountCharged.toString()), 0);
}

export function buildSourceBreakdown(
  current: Array<{
    feeCode: string;
    _sum: { amountCharged: Prisma.Decimal | null };
    _count: { id: number };
  }>,
  previous: Array<{
    feeCode: string;
    _sum: { amountCharged: Prisma.Decimal | null };
  }>,
  totalCurrent: number,
): AdminPlatformRevenueSourceDto[] {
  const prevMap = new Map(
    previous.map((p) => [
      p.feeCode,
      Number((p._sum.amountCharged ?? 0).toString()),
    ]),
  );

  return current
    .map((g) => {
      const amount = Number((g._sum.amountCharged ?? 0).toString());
      const prev = prevMap.get(g.feeCode) ?? 0;
      const count = g._count.id;
      return {
        source: g.feeCode,
        amountUsdt: formatMoneyRu(amount),
        sharePct:
          totalCurrent > 0 ? ((amount / totalCurrent) * 100).toFixed(1) : '0',
        operationCount: count,
        avgAmountUsdt: count > 0 ? formatMoneyRu(amount / count) : '0',
        deltaPct: pctChange(amount, prev),
      };
    })
    .sort(
      (a, b) =>
        Number(b.amountUsdt.replace(/\s/g, '').replace(',', '.')) -
        Number(a.amountUsdt.replace(/\s/g, '').replace(',', '.')),
    );
}

export function mapFeeTransaction(
  row: FeeRow,
): AdminPlatformRevenueTransactionDto {
  const user = row.walletTransaction?.wallet?.user;
  return {
    id: row.id,
    source: row.feeCode,
    amountUsdt: formatMoneyRu(row.amountCharged.toString()),
    asset: row.currency,
    period: row.createdAt.toISOString().slice(0, 10),
    createdAt: row.createdAt.toISOString(),
    status: row.walletTransaction?.status?.toLowerCase() ?? 'completed',
    userId: row.walletTransaction?.wallet?.userId ?? null,
    userEmail: user?.email ?? null,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    releaseId: null,
    releaseTitle: null,
    walletTxId: row.walletTransactionId,
  };
}

export function periodBucketKey(
  date: Date,
  groupBy: 'day' | 'week' | 'month',
): string {
  if (groupBy === 'month') return date.toISOString().slice(0, 7);
  if (groupBy === 'week') {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }
  return date.toISOString().slice(0, 10);
}
