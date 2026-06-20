import { ROUTES } from "@/constants/routes";
import type { AnalyticsInsightItem } from "@/features/admin/analytics/components/admin-analytics-insights-panel";

export type UserChartEmptyVariant = "growth" | "funnel" | "roles" | "balance" | "holders" | "risk";

export const USER_CHART_EMPTY: Record<UserChartEmptyVariant, { title: string; description: string }> = {
  growth: {
    title: "Регистраций за период нет",
    description: "Попробуйте выбрать 30 или 90 дней.",
  },
  funnel: {
    title: "Недостаточно данных для воронки",
    description: "Воронка появится после депозитов, покупок юнитов и первых начислений.",
  },
  roles: {
    title: "Нет данных по ролям",
    description: "Проверьте, что seed ролей применён и live API доступен.",
  },
  balance: {
    title: "Финансовых сегментов пока нет",
    description: "Данные появятся после пополнений и покупок юнитов.",
  },
  holders: {
    title: "Держателей пока нет",
    description: "Пользователи появятся здесь после покупки юнитов.",
  },
  risk: {
    title: "Пользователей с активными risk flags нет",
    description: "Это нормальное состояние, если подозрительных операций не найдено.",
  },
};

export const USER_KPI_TOOLTIPS = {
  totalUsers: "Все end-user аккаунты Spliton (без staff).",
  newUsers: "Регистрации за выбранный период.",
  activeInPeriod: "Пользователи с завершённой wallet-активностью за период.",
  growthPct: "Изменение новых регистраций к прошлому периоду.",
  firstDeposit: "Когорта периода с первым подтверждённым депозитом.",
  firstPurchase: "Пользователи с позицией (юниты) за период.",
  firstPayout: "Пользователи с начислением за период.",
  firstWithdrawal: "Пользователи с завершённым выводом за период.",
  secondaryTrade: "Покупатели или продавцы на вторичном рынке за период.",
  dormant: "Без wallet-активности 30+ дней.",
  inactive30: "Без активности более 30 дней.",
  riskFlags: "Пользователи с активным risk flag.",
  blocked: "Заблокированные (suspended) аккаунты.",
  highRisk: "Пользователи с high/critical flags.",
  balanceNoPurchase: "Есть баланс и депозит, но нет юнитов.",
} as const;

export function buildUserHealthSummary(input: {
  hasActivity: boolean;
  newUsers: number;
  withFirstDeposit: number;
  withFirstPurchase: number;
  funnelSteps?: Array<{ key: string; label?: string; count: number; dropOff?: number }>;
}): { tone: "neutral" | "positive" | "warning"; title: string; body: string } {
  if (!input.hasActivity) {
    return {
      tone: "neutral",
      title: "Состояние пользовательской базы",
      body: "За выбранный период пользовательской активности нет. Проверьте live-режим данных или выберите более широкий период.",
    };
  }

  const steps = input.funnelSteps ?? [];
  const maxDrop = steps.slice(1).reduce(
    (best, s) => ((s.dropOff ?? 0) > (best?.dropOff ?? 0) ? s : best),
    steps[1],
  );
  const dropLabel = maxDrop?.label ?? maxDrop?.key ?? "активации";

  return {
    tone: input.withFirstPurchase < input.withFirstDeposit * 0.5 ? "warning" : "positive",
    title: "Состояние пользовательской базы",
    body: `За период зарегистрировано ${input.newUsers} пользователей, ${input.withFirstDeposit} дошли до первого депозита, ${input.withFirstPurchase} купили юниты.${
      maxDrop && (maxDrop.dropOff ?? 0) > 0
        ? ` Основная точка потери — этап ${dropLabel}.`
        : ""
    }`,
  };
}

export function buildUserInsights(input: {
  summary: {
    newUsers?: number;
    balanceNoPurchase?: number;
    usersWithPendingWithdrawals?: number;
    dormantUsers?: number;
    highRiskUsers?: number;
    usersWithRiskFlags?: number;
  } | null;
}): AnalyticsInsightItem[] {
  const items: AnalyticsInsightItem[] = [];
  const s = input.summary;
  if ((s?.balanceNoPurchase ?? 0) > 0) {
    items.push({
      id: "deposit-no-units",
      label: "Есть пользователи с депозитом, но без покупки юнитов",
      count: s!.balanceNoPurchase,
      href: ROUTES.adminUsers,
      priority: "high",
    });
  }
  if ((s?.usersWithPendingWithdrawals ?? 0) > 0) {
    items.push({
      id: "pending-wd-users",
      label: "Pending withdrawals у пользователей",
      count: s!.usersWithPendingWithdrawals,
      href: ROUTES.adminWithdrawals,
      priority: "medium",
    });
  }
  if ((s?.dormantUsers ?? 0) > 0) {
    items.push({
      id: "dormant-balance",
      label: "Dormant users с балансом или юнитами",
      count: s!.dormantUsers,
      href: ROUTES.adminUsers,
      priority: "medium",
    });
  }
  if ((s?.highRiskUsers ?? 0) > 0) {
    items.push({
      id: "high-risk-users",
      label: "Пользователи с high/critical risk",
      count: s!.highRiskUsers,
      href: ROUTES.adminCompliance,
      priority: "high",
    });
  }
  if ((s?.newUsers ?? 0) === 0) {
    items.push({
      id: "no-registrations",
      label: "Нет новых регистраций за период",
      href: ROUTES.adminAnalyticsUsers,
      priority: "medium",
    });
  }
  return items;
}

export function usersFilterHref(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return s ? `${ROUTES.adminUsers}?${s}` : ROUTES.adminUsers;
}
