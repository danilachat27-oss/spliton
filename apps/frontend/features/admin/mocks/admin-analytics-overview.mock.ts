/** Mock analytics overview — mock mode only (Spliton). */

import type { AnalyticsDashboardTrends } from "@/features/admin/analytics/types";

function days(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function moneySeries(periods: string[], base: number, variance: number) {
  return periods.map((period, i) => ({
    period,
    amountUsdt: String(Math.round(base + Math.sin(i / 2) * variance + i * 120)),
    count: Math.floor(3 + (i % 5)),
  }));
}

function countSeries(periods: string[], base: number) {
  return periods.map((period, i) => ({
    period,
    count: Math.max(0, base + Math.round(Math.sin(i / 1.5) * 3) + (i % 4)),
  }));
}

const PERIODS = days(14);

export const MOCK_ANALYTICS_TRENDS: AnalyticsDashboardTrends = {
  period: { from: PERIODS[0]!, to: PERIODS[PERIODS.length - 1]! },
  deposits: moneySeries(PERIODS, 42000, 8000),
  withdrawals: moneySeries(PERIODS, 28000, 5000),
  platformRevenue: moneySeries(PERIODS, 3200, 600),
  newUsers: countSeries(PERIODS, 12),
  payouts: moneySeries(PERIODS, 15000, 3000),
  marketVolume: moneySeries(PERIODS, 18500, 4000),
  marketTrades: countSeries(PERIODS, 8),
  riskFlags: countSeries(PERIODS, 2),
  supportTickets: countSeries(PERIODS, 4),
};

export const MOCK_ANALYTICS_FINANCE_SUMMARY = {
  period: MOCK_ANALYTICS_TRENDS.period,
  depositsUsdt: "428 600,00",
  withdrawalsUsdt: "312 400,00",
  netFlowUsdt: "116 200,00",
  feesUsdt: "48 920,00",
  availableBalanceUsdt: "892 100,00",
  lockedBalanceUsdt: "64 300,00",
  pendingWithdrawalsUsdt: "84 200,00",
  manualReviewDeposits: 2,
  deltas: { depositsPct: 12.4, withdrawalsPct: -3.2, netFlowPct: 18.1 },
};

export const MOCK_ANALYTICS_USERS_SUMMARY = {
  totalUsers: 2847,
  activeUsers: 1923,
  newUsers: 186,
  dormantUsers: 412,
  usersWithRiskFlags: 14,
  usersWithPendingWithdrawals: 23,
  deltas: { newUsersPct: 8.5 },
};

export const MOCK_ANALYTICS_MARKET_SUMMARY = {
  activeListings: 37,
  completedTrades: 412,
  volumeUsdt: "1 248 300,00",
  feesUsdt: "18 640,00",
  suspiciousTrades: 3,
  cancelledListings: 5,
  frozenListings: 2,
  avgPricePerUnit: "42,50",
};

export const MOCK_ANALYTICS_RISK_SUMMARY = {
  openFlags: 4,
  blockedUsers: 1,
  frozenOperations: 2,
  highValuePendingWithdrawals: 3,
  averageReviewHours: 6.5,
  criticalCount: 2,
  highCount: 3,
};

export const MOCK_ANALYTICS_SUPPORT_SUMMARY = {
  openTickets: 7,
  escalatedTickets: 1,
  financeRelatedTickets: 3,
  averageResponseHours: 2.4,
  averageResolutionHours: 18.2,
  overdueSla: 2,
};

export const MOCK_RISK_BY_SEVERITY = {
  items: [
    { severity: "critical", count: 2 },
    { severity: "high", count: 3 },
    { severity: "medium", count: 5 },
    { severity: "low", count: 2 },
  ],
};

export const MOCK_SUPPORT_BY_STATUS = {
  items: [
    { status: "open", count: 4 },
    { status: "in_progress", count: 3 },
    { status: "resolved", count: 28 },
    { status: "closed", count: 12 },
  ],
};

export const MOCK_USER_FUNNEL = {
  steps: [
    { key: "registration", label: "Регистрация", count: 186 },
    { key: "email_verified", label: "Email подтверждён", count: 142 },
    { key: "first_deposit", label: "Первое пополнение", count: 68 },
    { key: "first_units", label: "Первые юниты", count: 41 },
    { key: "first_payout", label: "Первое начисление", count: 12 },
  ],
};

export const MOCK_FINANCE_FEES = {
  items: [
    { feeCode: "PRIMARY_PURCHASE", amountUsdt: "28 400,00", count: 186 },
    { feeCode: "WITHDRAWAL", amountUsdt: "12 200,00", count: 94 },
    { feeCode: "SECONDARY_TRADE", amountUsdt: "8 320,00", count: 412 },
  ],
};
