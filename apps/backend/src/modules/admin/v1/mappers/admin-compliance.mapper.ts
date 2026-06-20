export type RiskRuleDefinition = {
  code: string;
  title: string;
  description: string;
  defaultSeverity: string;
  entityType: string;
  enabled: boolean;
};

export const COMPLIANCE_RISK_RULES: RiskRuleDefinition[] = [
  {
    code: 'wd_velocity',
    title: 'Частые выводы',
    description: 'Несколько выводов за короткий период (velocity check).',
    defaultSeverity: 'high',
    entityType: 'withdrawal',
    enabled: true,
  },
  {
    code: 'first_wd_large',
    title: 'Первый крупный вывод',
    description:
      'Первый вывод существенно превышает средний депозит пользователя.',
    defaultSeverity: 'high',
    entityType: 'withdrawal',
    enabled: true,
  },
  {
    code: 'multi_address',
    title: 'Несколько адресов',
    description: 'Выводы на разные TRC20 адреса от одного пользователя.',
    defaultSeverity: 'critical',
    entityType: 'user',
    enabled: true,
  },
  {
    code: 'secondary_spike',
    title: 'Всплеск на вторичном рынке',
    description: 'Резкая активность сделок на secondary market.',
    defaultSeverity: 'medium',
    entityType: 'trade',
    enabled: true,
  },
  {
    code: 'rapid_pair_trading',
    title: 'Частые сделки между одной парой',
    description: 'Повторные сделки между одними контрагентами за короткий период.',
    defaultSeverity: 'high',
    entityType: 'trade',
    enabled: true,
  },
  {
    code: 'deposit_trade_withdraw_pattern',
    title: 'Депозит → торговля → вывод',
    description: 'Быстрая цепочка пополнения, сделок и вывода.',
    defaultSeverity: 'high',
    entityType: 'user',
    enabled: true,
  },
  {
    code: 'rapid_cancel_relist',
    title: 'Частая отмена/перевыставление',
    description: 'Манипуляция стаканом через cancel/relist.',
    defaultSeverity: 'medium',
    entityType: 'listing',
    enabled: true,
  },
  {
    code: 'wash_trade_suspect',
    title: 'Подозрение на wash trading',
    description: 'Сделки между связанными аккаунтами.',
    defaultSeverity: 'critical',
    entityType: 'trade',
    enabled: true,
  },
  {
    code: 'price_outlier',
    title: 'Ценовой outlier',
    description: 'Цена сделки сильно отклоняется от среднерыночной.',
    defaultSeverity: 'medium',
    entityType: 'trade',
    enabled: true,
  },
  {
    code: 'kyc_mismatch',
    title: 'Несовпадение KYC',
    description: 'Данные верификации не совпадают с профилем или операциями.',
    defaultSeverity: 'medium',
    entityType: 'user',
    enabled: true,
  },
  {
    code: 'compliance_hold',
    title: 'Ручное удержание',
    description: 'Операция заморожена compliance вручную.',
    defaultSeverity: 'low',
    entityType: 'withdrawal',
    enabled: true,
  },
  {
    code: 'manual_flag',
    title: 'Ручной флаг',
    description: 'Флаг создан оператором вручную.',
    defaultSeverity: 'medium',
    entityType: 'user',
    enabled: true,
  },
  {
    code: 'SUSPICIOUS_TRADE',
    title: 'Подозрительная сделка',
    description: 'Сделка помечена как suspicious через admin secondary market.',
    defaultSeverity: 'high',
    entityType: 'trade',
    enabled: true,
  },
  {
    code: 'large_deposit',
    title: 'Крупное пополнение',
    description: 'Депозит превышает порог автоматического мониторинга.',
    defaultSeverity: 'medium',
    entityType: 'deposit',
    enabled: true,
  },
  {
    code: 'wd_failed_repeat',
    title: 'Повторные неуспешные выводы',
    description: 'Несколько failed withdrawals за короткий период.',
    defaultSeverity: 'medium',
    entityType: 'withdrawal',
    enabled: true,
  },
  {
    code: 'suspicious_address',
    title: 'Подозрительный адрес',
    description: 'TRC20 адрес ранее помечен как suspicious.',
    defaultSeverity: 'critical',
    entityType: 'withdrawal',
    enabled: true,
  },
];

const SLA_HOURS = 24;

export function getRuleByCode(code: string): RiskRuleDefinition | undefined {
  return COMPLIANCE_RISK_RULES.find((r) => r.code === code);
}

export function computeSla(
  createdAt: Date,
  status: string,
): {
  deadline: string;
  overdue: boolean;
  remainingHours: number | null;
} {
  if (
    status === 'reviewed' ||
    status === 'resolved' ||
    status === 'dismissed'
  ) {
    return { deadline: '', overdue: false, remainingHours: null };
  }
  const deadline = new Date(createdAt.getTime() + SLA_HOURS * 60 * 60 * 1000);
  const now = Date.now();
  const overdue = now > deadline.getTime();
  const remainingMs = deadline.getTime() - now;
  return {
    deadline: deadline.toISOString(),
    overdue,
    remainingHours: overdue ? 0 : Math.round(remainingMs / (60 * 60 * 1000)),
  };
}

export function buildEvidence(flag: {
  flagCode: string;
  severity: string;
  riskScore: number | null;
  note: string | null;
  entityType: string | null;
}) {
  const rule = getRuleByCode(flag.flagCode);
  return {
    ruleCode: flag.flagCode,
    ruleTitle: rule?.title ?? flag.flagCode,
    trigger: rule?.description ?? 'Rule triggered',
    threshold: rule ? `Default severity: ${rule.defaultSeverity}` : null,
    calculatedValues: {
      riskScore: flag.riskScore,
      severity: flag.severity,
      entityType: flag.entityType,
    },
    summary: flag.note,
  };
}

export function mapFlagListItem(row: {
  id: string;
  userId: string;
  flagCode: string;
  severity: string;
  isActive: boolean;
  note: string | null;
  entityType: string | null;
  entityId: string | null;
  status: string;
  riskScore: number | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: { email: string; status?: string };
  reviewedBy?: { email: string } | null;
}) {
  const sla = computeSla(row.createdAt, row.status);
  const rule = getRuleByCode(row.flagCode);
  return {
    id: row.id,
    kind: row.entityType ?? 'user',
    reference: row.entityId ?? row.userId,
    userId: row.userId,
    userEmail: row.user.email,
    userStatus: row.user.status?.toLowerCase?.() ?? 'active',
    flagCode: row.flagCode,
    title: rule?.title ?? row.flagCode,
    riskScore: row.riskScore ?? 0,
    status: row.status,
    note: row.note ?? '',
    severity: row.severity,
    isActive: row.isActive,
    assignedToEmail: null as string | null,
    slaDeadline: sla.deadline || null,
    slaOverdue: sla.overdue,
    slaRemainingHours: sla.remainingHours,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    reviewedByEmail: row.reviewedBy?.email ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    lastAction: row.reviewedAt
      ? 'reviewed'
      : row.status === 'on_hold'
        ? 'frozen'
        : 'created',
  };
}
