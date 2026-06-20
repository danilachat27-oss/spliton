/** Risk analytics mocks — mock mode only (Spliton). */

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

export const MOCK_RISK_ANALYTICS_SUMMARY = {
  period: { from: PERIODS[0]!, to: PERIODS[PERIODS.length - 1]! },
  openFlags: 14,
  highCriticalOpen: 5,
  highSeverity: 5,
  unassignedOpen: 4,
  overdueSla: 3,
  blockedUsers: 2,
  frozenOperations: 6,
  frozenVolumeUsdt: "48 200,00",
  highValuePendingWithdrawals: 4,
  flagsInPeriod: 28,
  suspiciousTrades: 2,
  frozenListings: 2,
  reviewedCases: 12,
  dismissedCases: 8,
  averageReviewHours: 5.2,
  criticalCount: 2,
  highCount: 3,
  deltas: { flagsPct: 6.5 },
};

export const MOCK_RISK_ANALYTICS_BY_SEVERITY = {
  items: [
    { severity: "critical", count: 2 },
    { severity: "high", count: 5 },
    { severity: "medium", count: 12 },
    { severity: "low", count: 9 },
  ],
  byStatus: [
    { status: "open", count: 14 },
    { status: "reviewed", count: 12 },
    { status: "on_hold", count: 2 },
  ],
  trend: PERIODS.map((period, i) => ({ period, count: 1 + (i % 4) })),
};

export const MOCK_RISK_ANALYTICS_BY_TYPE = {
  items: [
    { type: "withdrawal", count: 10 },
    { type: "trade", count: 6 },
    { type: "user", count: 5 },
    { type: "deposit", count: 4 },
  ],
  byRule: [
    { ruleCode: "wd_velocity", count: 8 },
    { ruleCode: "first_wd_large", count: 5 },
    { ruleCode: "price_outlier", count: 4 },
  ],
};

export const MOCK_RISK_ANALYTICS_QUEUE_AGING = {
  items: [
    { label: "0–2 ч", key: "0-2h", count: 4, overdue: 0 },
    { label: "2–8 ч", key: "2-8h", count: 5, overdue: 1 },
    { label: "8–24 ч", key: "8-24h", count: 3, overdue: 1 },
    { label: "24–72 ч", key: "24-72h", count: 1, overdue: 1 },
    { label: "72 ч+", key: "72h+", count: 1, overdue: 0 },
  ],
  buckets: [
    { label: "0–2 ч", key: "0-2h", count: 4, overdue: 0 },
    { label: "2–8 ч", key: "2-8h", count: 5, overdue: 1 },
    { label: "8–24 ч", key: "8-24h", count: 3, overdue: 1 },
    { label: "24–72 ч", key: "24-72h", count: 1, overdue: 1 },
    { label: "72 ч+", key: "72h+", count: 1, overdue: 0 },
  ],
  averageAgeHours: 9,
  oldestOpenHours: 86,
  overdueTotal: 3,
};

export const MOCK_RISK_ANALYTICS_HIGH_VALUE = {
  thresholdUsdt: "5 000,00",
  items: [
    {
      id: "wd-1",
      operationId: "wd-1",
      type: "withdrawal",
      userId: "u1",
      userEmail: "trader@spliton.test",
      amountUsdt: "24 000,00",
      status: "on_hold",
      riskScore: 75,
      createdAt: new Date().toISOString(),
    },
  ],
};

export const MOCK_RISK_ANALYTICS_QUEUE = {
  items: [
    {
      riskId: "rf-1",
      ruleCode: "wd_velocity",
      severity: "critical",
      riskScore: 88,
      entityType: "withdrawal",
      entityId: "wd-1",
      userId: "u1",
      userEmail: "trader@spliton.test",
      amountUsdt: "24 000,00",
      status: "open",
      assignedTo: null,
      slaOverdue: true,
      slaHoursRemaining: 0,
      updatedAt: new Date().toISOString(),
    },
  ],
};

export const MOCK_RISK_ANALYTICS_RULES = {
  items: [
    {
      ruleCode: "wd_velocity",
      label: "wd velocity",
      entityType: "withdrawal",
      triggeredCount: 8,
      highCriticalCount: 3,
      reviewedCount: 6,
      falsePositiveCount: 2,
      falsePositiveRatePct: 33.3,
      avgRiskScore: 72,
      avgResolutionHours: 4,
      lastTriggeredAt: new Date().toISOString(),
    },
    {
      ruleCode: "price_outlier",
      label: "price outlier",
      entityType: "trade",
      triggeredCount: 4,
      highCriticalCount: 1,
      reviewedCount: 3,
      falsePositiveCount: 2,
      falsePositiveRatePct: 66.7,
      avgRiskScore: 58,
      avgResolutionHours: 8,
      lastTriggeredAt: new Date().toISOString(),
    },
  ],
};

export const MOCK_RISK_ANALYTICS_REPEAT = {
  items: [
    {
      userId: "u1",
      email: "repeat@spliton.test",
      flagsCount: 5,
      criticalCount: 2,
      blocked: false,
      lastFlagCode: "wd_velocity",
      lastFlagAt: new Date().toISOString(),
    },
  ],
};

export const MOCK_RISK_ANALYTICS_FREEZE = {
  frozenWithdrawals: 4,
  frozenListings: 2,
  blockedUsers: 2,
  activeFreezes: 6,
  frozenAmountUsdt: "48 200,00",
};

export const MOCK_RISK_ANALYTICS_RESOLUTION = {
  reviewedCases: 12,
  openCases: 14,
  dismissedApprox: 8,
  falsePositiveRatePct: 66.7,
  resolutionRatePct: 42.9,
  avgResolutionHours: 5,
  note: "False positive approximated via REVIEWED status.",
};
