/** Operations / support analytics mocks — mock mode only (Spliton). */

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

export const MOCK_SUPPORT_ANALYTICS_SUMMARY = {
  period: { from: PERIODS[0]!, to: PERIODS[PERIODS.length - 1]! },
  openTickets: 12,
  inProgressTickets: 5,
  waitingUserTickets: 3,
  unassignedOpen: 4,
  escalatedTickets: 2,
  financeRelatedTickets: 8,
  depositTickets: 4,
  withdrawalTickets: 3,
  marketTickets: 2,
  payoutsTickets: 1,
  createdInPeriod: 34,
  closedInPeriod: 28,
  overdueSla: 3,
  oldestOpenHours: 52,
  averageFirstResponseMinutes: 18,
  averageResolutionHours: 6.5,
  slaCompliancePct: 82.5,
  activeManagers: 3,
  avgManagerLoad: 4,
  maxManagerLoad: 7,
  reopenedTickets: 1,
  deltas: { createdPct: 4.2, closedPct: 8.1 },
  slaNote: "Mock SLA",
};

export const MOCK_SUPPORT_BY_STATUS = {
  items: [
    { status: "open", count: 5 },
    { status: "in_progress", count: 5 },
    { status: "waiting_user", count: 3 },
    { status: "escalated", count: 2 },
    { status: "closed", count: 28 },
  ],
  trend: PERIODS.map((period, i) => ({ period, count: 1 + (i % 3) })),
};

export const MOCK_SUPPORT_BY_CATEGORY = {
  items: [
    { category: "deposit", label: "Пополнение", count: 10 },
    { category: "withdrawal", label: "Вывод", count: 8 },
    { category: "secondary_market", label: "Вторичный рынок", count: 5 },
    { category: "technical", label: "Техническая проблема", count: 4 },
  ],
  trend: PERIODS.map((period, i) => ({ period, count: 2 + (i % 2) })),
};

export const MOCK_SUPPORT_RESPONSE_TIME = {
  averageResolutionHours: 6.5,
  averageFirstResponseMinutes: 18,
  sampleSize: 28,
  items: PERIODS.map((period, i) => ({
    period,
    averageHours: 4 + (i % 5),
  })),
  firstResponseTrend: PERIODS.map((period, i) => ({
    period,
    averageMinutes: 12 + i * 2,
  })),
};

export const MOCK_SUPPORT_QUEUE = {
  items: [
    {
      ticketId: "t-1",
      userId: "u1",
      userEmail: "user@spliton.test",
      subject: "Депозит не зачислен",
      category: "deposit",
      categoryLabel: "Пополнение",
      priority: "high",
      status: "open",
      assignedTo: null,
      slaOverdue: true,
      relatedEntityId: null,
      lastMessagePreview: "Ожидаю зачисление USDT…",
      updatedAt: new Date().toISOString(),
    },
  ],
};

export const MOCK_SUPPORT_SLA = {
  buckets: [
    { label: "0–2 ч", key: "0-2h", count: 3, overdue: 0 },
    { label: "2–8 ч", key: "2-8h", count: 4, overdue: 1 },
    { label: "8–24 ч", key: "8-24h", count: 3, overdue: 1 },
    { label: "24–72 ч", key: "24-72h", count: 1, overdue: 1 },
    { label: "72 ч+", key: "72h+", count: 1, overdue: 0 },
  ],
  averageAgeHours: 11,
  overdueTotal: 3,
  overdueByPriority: [{ priority: "high", count: 2 }],
};

export const MOCK_SUPPORT_FINANCE = {
  items: [
    {
      ticketId: "t-f1",
      userId: "u1",
      userEmail: "finance@spliton.test",
      category: "withdrawal",
      categoryLabel: "Вывод",
      relatedEntityId: null,
      amountUsdt: null,
      status: "in_progress",
      priority: "high",
      assignedTo: "ops@spliton.test",
      slaOverdue: false,
    },
  ],
};

export const MOCK_SUPPORT_ESCALATIONS = {
  count: 2,
  items: [
    {
      ticketId: "t-e1",
      category: "withdrawal",
      categoryLabel: "Вывод",
      priority: "high",
      escalatedTo: "finance",
      reason: "Вывод задержан более 24ч",
      assignedTeam: "finance",
      assignedTo: null,
      hoursInEscalation: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

export const MOCK_SUPPORT_WORKLOAD = {
  items: [
    {
      managerId: "m1",
      managerEmail: "support@spliton.test",
      openTickets: 7,
      inProgressTickets: 4,
      closedInPeriod: 12,
      escalatedCount: 1,
      avgResolutionHours: 5,
      avgFirstResponseMinutes: 14,
      slaCompliancePct: 85,
      reopenedCount: 0,
      totalAssigned: 20,
    },
  ],
};

export const MOCK_SUPPORT_RESOLUTION = {
  closedTickets: 28,
  reopenedTickets: 0,
  repeatedUsersCount: 3,
  closedWithoutResponseCount: 2,
  avgMessagesPerTicket: 2.4,
  note: "Mock",
};

export const MOCK_SUPPORT_PAIN_POINTS = {
  items: [
    { key: "deposit", label: "Пополнение не зачислено", categoryLabel: "Пополнение", count: 10 },
    { key: "withdrawal", label: "Вывод задержан", categoryLabel: "Вывод", count: 8 },
  ],
};
