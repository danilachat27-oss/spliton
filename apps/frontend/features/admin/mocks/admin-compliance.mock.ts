/** Admin compliance — mock data (mock mode only, Spliton). */



export type AdminComplianceItem = {

  id: string;

  kind: "user" | "withdrawal" | "trade" | "listing" | "wallet" | "deposit";

  reference: string;

  userId?: string;

  userEmail?: string;

  userStatus?: string;

  flagCode?: string;

  title?: string;

  severity?: string;

  riskScore: number;

  status: "open" | "reviewed" | "blocked" | "on_hold";

  note: string;

  updatedAt: string;

  createdAt?: string;

  reviewedByEmail?: string | null;

  reviewedAt?: string | null;

  assignedToEmail?: string | null;

  slaDeadline?: string | null;

  slaOverdue?: boolean;

  slaRemainingHours?: number | null;

  lastAction?: string;

  isActive?: boolean;

};



export type AdminComplianceSummary = {

  openCount: number;

  criticalCount: number;

  highCount: number;

  onHoldCount: number;

  blockedUsersCount: number;

  frozenOpsCount: number;

  avgReviewHours: number | null;

  overdueCount: number;

  new24hCount: number;

  repeatOffendersCount: number;

  blockedCount: number;

  frozenCount: number;

  usersCount: number;

  withdrawalsCount: number;

  tradesCount: number;

  bySeverity?: Array<{ severity: string; count: number }>;

  byEntityType?: Array<{ entityType: string; count: number }>;

};



export type AdminComplianceEvidence = {

  ruleCode: string;

  ruleTitle: string;

  trigger: string;

  threshold: string | null;

  calculatedValues: Record<string, unknown>;

  summary: string | null;

};



export type AdminComplianceTimelineItem = {

  action: string;

  actorEmail: string | null;

  createdAt: string;

  detail?: unknown;

};



export type AdminComplianceAuditItem = {

  id: string;

  action: string;

  actorEmail: string | null;

  before?: unknown;

  after?: unknown;

  createdAt: string;

};



export type AdminComplianceRelatedActivity = {

  withdrawals: Array<{ id: string; amount: string; status: string; at: string }>;

  trades: Array<{ id: string; amount: string; status: string; at: string }>;

  deposits: Array<{ id: string; amount: string; status: string; at: string }>;

};



export type AdminComplianceRelatedObject = Record<string, unknown>;



export type AdminComplianceDetail = AdminComplianceItem & {

  evidence?: AdminComplianceEvidence;

  timeline?: AdminComplianceTimelineItem[];

  relatedActivity?: AdminComplianceRelatedActivity;

  audit?: AdminComplianceAuditItem[];

  relatedObject?: AdminComplianceRelatedObject | null;

};



export type AdminRiskRule = {

  code: string;

  title: string;

  description: string;

  defaultSeverity: string;

  entityType: string;

  enabled: boolean;

  lastTriggered?: string | null;

  countLast30Days?: number;

};



export type AdminComplianceHistoryItem = {

  id: string;

  action: string;

  entityType: string;

  entityId: string;

  actorEmail: string | null;

  before?: unknown;

  after?: unknown;

  createdAt: string;

};



export const MOCK_ADMIN_COMPLIANCE_SUMMARY: AdminComplianceSummary = {

  openCount: 4,

  criticalCount: 2,

  highCount: 3,

  onHoldCount: 2,

  blockedUsersCount: 1,

  frozenOpsCount: 3,

  avgReviewHours: 6.5,

  overdueCount: 1,

  new24hCount: 2,

  repeatOffendersCount: 1,

  blockedCount: 1,

  frozenCount: 3,

  usersCount: 2,

  withdrawalsCount: 3,

  tradesCount: 3,

  bySeverity: [

    { severity: "critical", count: 2 },

    { severity: "high", count: 3 },

    { severity: "medium", count: 2 },

    { severity: "low", count: 1 },

  ],

  byEntityType: [

    { entityType: "withdrawal", count: 3 },

    { entityType: "trade", count: 3 },

    { entityType: "user", count: 2 },

  ],

};



export const MOCK_ADMIN_COMPLIANCE: AdminComplianceItem[] = [

  {

    id: "cmp-demo-001",

    kind: "withdrawal",

    reference: "wd-demo-001",

    userId: "usr-demo-trader",

    userEmail: "trader@spliton.demo",

    userStatus: "active",

    flagCode: "wd_velocity",

    title: "Частые выводы",

    severity: "high",

    riskScore: 72,

    status: "open",

    note: "Крупный вывод после недавнего пополнения",

    createdAt: "2026-05-30T08:00:00Z",

    updatedAt: "2026-05-30T10:00:00Z",

    assignedToEmail: "compliance@spliton.demo",

    slaDeadline: "2026-05-31T08:00:00Z",

    slaOverdue: false,

    slaRemainingHours: 8,

    lastAction: "created",

  },

  {

    id: "cmp-demo-002",

    kind: "user",

    reference: "usr-demo-risk",

    userId: "usr-demo-risk",

    userEmail: "risk@spliton.demo",

    userStatus: "suspended",

    flagCode: "multi_address",

    title: "Несколько адресов",

    severity: "critical",

    riskScore: 85,

    status: "blocked",

    note: "Повторные попытки вывода с разных адресов",

    createdAt: "2026-05-29T14:00:00Z",

    updatedAt: "2026-05-29T18:00:00Z",

    slaOverdue: true,

    lastAction: "blocked",

  },

  {

    id: "cmp-demo-003",

    kind: "trade",

    reference: "trd-demo-002",

    userId: "usr-demo-whale",

    userEmail: "whale@spliton.demo",

    userStatus: "active",

    flagCode: "secondary_spike",

    title: "Всплеск на вторичном рынке",

    severity: "medium",

    riskScore: 64,

    status: "on_hold",

    note: "Подозрительная сделка на вторичном рынке",

    createdAt: "2026-05-28T11:00:00Z",

    updatedAt: "2026-05-28T16:00:00Z",

    lastAction: "frozen",

  },

  {

    id: "cmp-demo-004",

    kind: "withdrawal",

    reference: "wd-demo-002",

    userId: "usr-demo-new",

    userEmail: "newuser@spliton.demo",

    userStatus: "active",

    flagCode: "first_wd_large",

    title: "Первый крупный вывод",

    severity: "high",

    riskScore: 78,

    status: "open",

    note: "Первый вывод превышает средний депозит в 5 раз",

    createdAt: "2026-05-30T06:30:00Z",

    updatedAt: "2026-05-30T09:15:00Z",

    slaOverdue: false,

    slaRemainingHours: 5,

    lastAction: "created",

  },

  {

    id: "cmp-demo-005",

    kind: "user",

    reference: "usr-demo-kyc",

    userId: "usr-demo-kyc",

    userEmail: "kyc@spliton.demo",

    userStatus: "active",

    flagCode: "kyc_mismatch",

    title: "Несовпадение KYC",

    severity: "medium",

    riskScore: 55,

    status: "open",

    note: "Несовпадение данных верификации",

    createdAt: "2026-05-27T09:00:00Z",

    updatedAt: "2026-05-30T07:00:00Z",

    slaOverdue: true,

    lastAction: "created",

  },

  {

    id: "cmp-demo-006",

    kind: "trade",

    reference: "trd-demo-002",

    userId: "usr-demo-whale",

    userEmail: "whale@spliton.demo",

    userStatus: "active",

    flagCode: "wash_trade_suspect",

    title: "Подозрение на wash trading",

    severity: "critical",

    riskScore: 91,

    status: "open",

    note: "Серия сделок между связанными аккаунтами",

    createdAt: "2026-05-30T04:00:00Z",

    updatedAt: "2026-05-30T08:45:00Z",

    lastAction: "created",

  },

  {

    id: "cmp-demo-007",

    kind: "withdrawal",

    reference: "wd-demo-003",

    userId: "usr-demo-hold",

    userEmail: "hold@spliton.demo",

    userStatus: "active",

    flagCode: "compliance_hold",

    title: "Ручное удержание",

    severity: "low",

    riskScore: 42,

    status: "on_hold",

    note: "Ручная заморозка до проверки compliance",

    createdAt: "2026-05-26T12:00:00Z",

    updatedAt: "2026-05-29T10:00:00Z",

    lastAction: "frozen",

  },

  {

    id: "cmp-demo-008",

    kind: "trade",

    reference: "trd-demo-001",

    userId: "usr-demo-seller",

    userEmail: "seller@spliton.demo",

    userStatus: "active",

    flagCode: "price_outlier",

    title: "Ценовой outlier",

    severity: "medium",

    riskScore: 48,

    status: "reviewed",

    note: "Проверено: цена в пределах волатильности релиза",

    createdAt: "2026-05-25T15:00:00Z",

    updatedAt: "2026-05-28T11:00:00Z",

    reviewedByEmail: "compliance@spliton.demo",

    reviewedAt: "2026-05-28T11:00:00Z",

    lastAction: "reviewed",

  },

];



export const MOCK_RISK_RULES: AdminRiskRule[] = [

  {

    code: "wd_velocity",

    title: "Частые выводы",

    description: "Несколько выводов за короткий период.",

    defaultSeverity: "high",

    entityType: "withdrawal",

    enabled: true,

    lastTriggered: "2026-05-30T08:00:00Z",

    countLast30Days: 12,

  },

  {

    code: "first_wd_large",

    title: "Первый крупный вывод",

    description: "Первый вывод > 5× среднего депозита.",

    defaultSeverity: "high",

    entityType: "withdrawal",

    enabled: true,

    countLast30Days: 8,

  },

  {

    code: "multi_address",

    title: "Несколько адресов",

    description: "Выводы на разные TRC20 адреса.",

    defaultSeverity: "critical",

    entityType: "user",

    enabled: true,

    countLast30Days: 3,

  },

  {

    code: "wash_trade_suspect",

    title: "Wash trading",

    description: "Сделки между связанными аккаунтами.",

    defaultSeverity: "critical",

    entityType: "trade",

    enabled: true,

    countLast30Days: 5,

  },

  {

    code: "price_outlier",

    title: "Ценовой outlier",

    description: "Цена сильно отклоняется от рынка.",

    defaultSeverity: "medium",

    entityType: "trade",

    enabled: true,

    countLast30Days: 14,

  },

  {

    code: "kyc_mismatch",

    title: "KYC mismatch",

    description: "Несовпадение данных верификации.",

    defaultSeverity: "medium",

    entityType: "user",

    enabled: true,

    countLast30Days: 2,

  },

  {

    code: "manual_flag",

    title: "Ручной флаг",

    description: "Создан оператором вручную.",

    defaultSeverity: "medium",

    entityType: "user",

    enabled: true,

    countLast30Days: 1,

  },

];



export const MOCK_COMPLIANCE_HISTORY: AdminComplianceHistoryItem[] = [

  {

    id: "hist-001",

    action: "compliance.risk_flag.status_change",

    entityType: "compliance_risk",

    entityId: "cmp-demo-008",

    actorEmail: "compliance@spliton.demo",

    after: { status: "reviewed" },

    createdAt: "2026-05-28T11:00:00Z",

  },

  {

    id: "hist-002",

    action: "compliance.operation.freeze",

    entityType: "compliance_freeze",

    entityId: "wd-demo-003",

    actorEmail: "compliance@spliton.demo",

    after: { operationType: "withdrawal" },

    createdAt: "2026-05-29T10:00:00Z",

  },

  {

    id: "hist-003",

    action: "compliance.user.block",

    entityType: "user",

    entityId: "usr-demo-risk",

    actorEmail: "compliance@spliton.demo",

    after: { note: "Multi-address abuse" },

    createdAt: "2026-05-29T18:00:00Z",

  },

];



function mockEvidence(item: AdminComplianceItem): AdminComplianceEvidence {

  return {

    ruleCode: item.flagCode ?? "manual_flag",

    ruleTitle: item.title ?? item.flagCode ?? "—",

    trigger: "Rule triggered by Spliton risk engine",

    threshold: item.flagCode === "first_wd_large" ? "Первый вывод > 5× среднего депозита" : null,

    calculatedValues: {

      riskScore: item.riskScore,

      severity: item.severity,

      userAvgDeposit: item.flagCode === "first_wd_large" ? "200 USDT" : undefined,

      withdrawalAmount: item.flagCode === "first_wd_large" ? "1 200 USDT" : undefined,

    },

    summary: item.note,

  };

}



export function mockComplianceDetail(id: string, include?: string): AdminComplianceDetail | null {

  const base = MOCK_ADMIN_COMPLIANCE.find((x) => x.id === id);

  if (!base) return null;

  const parts = new Set((include ?? "evidence,timeline,activity,audit,object").split(","));

  const detail: AdminComplianceDetail = { ...base };

  if (parts.has("evidence")) detail.evidence = mockEvidence(base);

  if (parts.has("timeline")) {

    detail.timeline = [

      { action: "compliance.flag.create", actorEmail: null, createdAt: base.createdAt ?? base.updatedAt, detail: base.flagCode },

      ...(base.reviewedByEmail

        ? [{ action: "compliance.flag.reviewed", actorEmail: base.reviewedByEmail, createdAt: base.updatedAt }]

        : []),

    ];

  }

  if (parts.has("activity")) {

    detail.relatedActivity = {

      withdrawals: [{ id: "wd-demo-001", amount: "1200", status: "pending", at: "2026-05-30T08:00:00Z" }],

      trades: [{ id: "trd-demo-002", amount: "450", status: "settled", at: "2026-05-28T11:00:00Z" }],

      deposits: [{ id: "dep-demo-001", amount: "500", status: "confirmed", at: "2026-05-29T12:00:00Z" }],

    };

  }

  if (parts.has("audit")) {

    detail.audit = MOCK_COMPLIANCE_HISTORY.filter((h) => h.entityId === id || h.entityId === base.reference);

  }

  if (parts.has("object") && base.kind === "withdrawal") {

    detail.relatedObject = {

      type: "withdrawal",

      id: base.reference,

      amountUsdt: "1200",

      feeUsdt: "12",

      netUsdt: "1188",

      trc20Address: "TXyzSplitonDemoAddress",

      status: "pending",

      requestedAt: base.createdAt,

    };

  }

  return detail;

}

