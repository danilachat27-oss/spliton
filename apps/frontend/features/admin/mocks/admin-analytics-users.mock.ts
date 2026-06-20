/** User analytics mocks — mock mode only (Spliton). */

function days(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const PERIODS = days(14);

function countSeries(base: number) {
  return PERIODS.map((period, i) => ({
    period,
    count: Math.max(0, base + Math.round(Math.sin(i / 1.5) * 4) + (i % 3)),
  }));
}

export const MOCK_USER_ANALYTICS_SUMMARY = {
  period: { from: PERIODS[0]!, to: PERIODS[PERIODS.length - 1]! },
  totalUsers: 2847,
  activeUsers: 1923,
  newUsers: 186,
  activeInPeriod: 412,
  dormantUsers: 318,
  usersWithRiskFlags: 14,
  usersWithPendingWithdrawals: 23,
  blockedUsers: 3,
  highRiskUsers: 6,
  withFirstDeposit: 68,
  withFirstPurchase: 41,
  withFirstPayout: 12,
  withFirstWithdrawal: 22,
  withSecondaryTrade: 35,
  balanceNoPurchase: 47,
  inactive30Plus: 412,
  returnedUsers: 18,
  deltas: { newUsersPct: 8.5, activeInPeriodPct: 4.2 },
};

export const MOCK_USER_ANALYTICS_GROWTH = {
  newUsers: countSeries(12),
  activeUsers: countSeries(28),
  cumulativeUsers: countSeries(2800).map((p, i) => ({
    ...p,
    count: 2700 + i * 12 + p.count,
  })),
};

export const MOCK_USER_ANALYTICS_FUNNEL = {
  steps: [
    { key: "registration", label: "Регистрация", count: 186, conversionFromPreviousPct: 100, conversionFromRegistrationPct: 100, dropOff: 0 },
    { key: "email_verified", label: "Email / аккаунт активен", count: 142, conversionFromPreviousPct: 76.3, conversionFromRegistrationPct: 76.3, dropOff: 44 },
    { key: "first_deposit", label: "Первый депозит", count: 68, conversionFromPreviousPct: 47.9, conversionFromRegistrationPct: 36.6, dropOff: 74 },
    { key: "first_units", label: "Первая покупка юнитов", count: 41, conversionFromPreviousPct: 60.3, conversionFromRegistrationPct: 22, dropOff: 27 },
    { key: "first_payout", label: "Первое начисление", count: 12, conversionFromPreviousPct: 29.3, conversionFromRegistrationPct: 6.5, dropOff: 29 },
    { key: "first_withdrawal", label: "Первый вывод", count: 22, conversionFromPreviousPct: 183.3, conversionFromRegistrationPct: 11.8, dropOff: 0 },
    { key: "first_secondary_trade", label: "Первая сделка на вторичном рынке", count: 35, conversionFromPreviousPct: 159.1, conversionFromRegistrationPct: 18.8, dropOff: 0 },
  ],
};

export const MOCK_USER_ANALYTICS_SEGMENTS = {
  total: 2847,
  byStatus: [
    { key: "active", label: "ACTIVE", count: 1923 },
    { key: "pending", label: "PENDING", count: 412 },
    { key: "suspended", label: "SUSPENDED", count: 3 },
  ],
  byRole: [
    { key: "user", label: "USER", count: 2410 },
    { key: "investor", label: "INVESTOR", count: 398 },
    { key: "artist", label: "ARTIST", count: 39 },
  ],
  lifecycle: [
    { key: "new", label: "Новые", count: 186, sharePct: 6.5 },
    { key: "deposited", label: "С депозитом", count: 892, sharePct: 31.3 },
    { key: "holders", label: "Держатели", count: 534, sharePct: 18.8 },
    { key: "secondary_active", label: "Вторичный рынок", count: 218, sharePct: 7.7 },
    { key: "dormant", label: "Dormant", count: 318, sharePct: 11.2 },
    { key: "high_value", label: "High value", count: 42, sharePct: 1.5 },
    { key: "risk", label: "Risk users", count: 14, sharePct: 0.5 },
    { key: "blocked", label: "Blocked", count: 3, sharePct: 0.1 },
  ],
  byBalanceBucket: [
    { key: "0", label: "0 USDT", count: 1204 },
    { key: "0-100", label: "0–100 USDT", count: 842 },
    { key: "100-1000", label: "100–1 000 USDT", count: 512 },
    { key: "1000-10000", label: "1 000–10 000 USDT", count: 218 },
    { key: "10000+", label: "10 000+ USDT", count: 71 },
  ],
};

export const MOCK_USER_FINANCIAL_SEGMENTS = {
  buckets: MOCK_USER_ANALYTICS_SEGMENTS.byBalanceBucket,
  cohorts: [
    { key: "balance_no_purchase", label: "Баланс без покупки юнитов", count: 47 },
    { key: "locked_balance", label: "С locked balance", count: 89 },
    { key: "pending_withdrawal", label: "Pending withdrawal", count: 23 },
    { key: "deposit_no_units", label: "Депозит без юнитов", count: 31 },
  ],
};

export const MOCK_USER_DORMANT = {
  dormantCount: 318,
  inactiveBuckets: [
    { key: "7", label: "7+ дней", count: 124 },
    { key: "30", label: "30+ дней", count: 318 },
    { key: "60", label: "60+ дней", count: 186 },
    { key: "90", label: "90+ дней", count: 92 },
  ],
  items: [
    { userId: "u1", email: "holder.dormant@spliton.demo", lastActivityAt: "2026-04-01T12:00:00Z", dormantDays: 60, availableBalanceUsdt: "1 240,00", holdingsUnits: "120.00" },
    { userId: "u2", email: "inactive@spliton.demo", lastActivityAt: "2026-03-15T08:00:00Z", dormantDays: 77, availableBalanceUsdt: "0,00", holdingsUnits: "0.00" },
  ],
};

export const MOCK_USER_RISK_USERS = {
  items: [
    { userId: "r1", email: "risk.high@spliton.demo", severity: "critical", ruleCode: "VELOCITY_WITHDRAWAL", entityType: "withdrawal", status: "open", updatedAt: new Date().toISOString(), userStatus: "active" },
    { userId: "r2", email: "risk.medium@spliton.demo", severity: "high", ruleCode: "REPEAT_OFFENDER", entityType: "user", status: "open", updatedAt: new Date().toISOString(), userStatus: "active" },
  ],
};

export const MOCK_USER_TOP_HOLDERS = {
  items: [
    { userId: "h1", email: "top.holder@spliton.demo", units: "4200.00", totalUnits: "4200.00", holdingsCount: 8, valueUsdt: "178 400,00", availableBalanceUsdt: "12 400,00", earnedTotalUsdt: "8 200,00", riskStatus: "none", lastActivityAt: new Date().toISOString() },
    { userId: "h2", email: "whale@spliton.demo", units: "3100.00", totalUnits: "3100.00", holdingsCount: 5, valueUsdt: "131 600,00", availableBalanceUsdt: "42 000,00", earnedTotalUsdt: "5 100,00", riskStatus: "low", lastActivityAt: new Date().toISOString() },
  ],
};
