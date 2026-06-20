/**
 * Демо-данные страницы статуса. Смените сценарий, чтобы проверить UI.
 * Подключение API заменит этот модуль.
 */
import { buildMockOperationalServices } from "@/constants/system-status-components";

export type SystemStatusScenario = "operational" | "partial" | "maintenance" | "incident";

/** Активный сценарий для макета страницы. */
export const SYSTEM_STATUS_SCENARIO: SystemStatusScenario = "operational";

export type ServiceHealthStatus =
  | "operational"
  | "degraded"
  | "delayed"
  | "maintenance"
  | "incident";

export type OverallTone = "success" | "warning" | "maintenance" | "danger";

export type ServiceStatusRow = {
  id: string;
  name: string;
  status: ServiceHealthStatus;
  statusLabel: string;
  note: string;
  lastUpdatedLabel: string;
};

export type MaintenanceWindow = {
  title: string;
  affectedServices: string[];
  windowLabel: string;
  impactNote: string;
};

export type IncidentRow = {
  id: string;
  date: string;
  service: string;
  state: "resolved" | "monitoring" | "investigating";
  stateLabel: string;
  summary: string;
};

export type SystemStatusPageData = {
  overall: {
    headline: string;
    subline: string;
    tone: OverallTone;
    lastUpdatedLabel: string;
    explanation: string;
  };
  services: ServiceStatusRow[];
  maintenance: MaintenanceWindow | null;
  incidents: IncidentRow[];
};

const baseLast = "Обновлено: 19.04.2026, 15:04 UTC";

const servicesAllOperational = buildMockOperationalServices(baseLast);

const resolvedIncidents: IncidentRow[] = [
  {
    id: "inc-1",
    date: "2026-04-08",
    service: "Вывод средств",
    state: "resolved",
    stateLabel: "Закрыт",
    summary: "Повышенное время обработки из-за пика заявок. Нормализовано.",
  },
  {
    id: "inc-2",
    date: "2026-03-22",
    service: "Вторичный рынок",
    state: "resolved",
    stateLabel: "Закрыт",
    summary: "Кратковременные задержки котировок. Исправлено в тот же день.",
  },
];

const scenarios: Record<SystemStatusScenario, SystemStatusPageData> = {
  operational: {
    overall: {
      headline: "Все системы работают штатно",
      subline: "Ключевые сервисы Spliton доступны. Наблюдаем штатные задержки в пределах SLA.",
      tone: "success",
      lastUpdatedLabel: baseLast,
      explanation:
        "Статус обновляется по мере поступления данных от операционных команд. При изменении ситуации заголовок и карточки сервисов обновляются автоматически.",
    },
    services: servicesAllOperational,
    maintenance: null,
    incidents: resolvedIncidents,
  },
  partial: {
    overall: {
      headline: "Часть сервисов с повышенной задержкой",
      subline:
        "Основные операции доступны; по отдельным потокам возможны увеличенные времена обработки. Команда следит за метриками.",
      tone: "warning",
      lastUpdatedLabel: baseLast,
      explanation:
        "Задержки не означают блокировку средств: заявки остаются в очереди и обрабатываются. Итоговые сроки видны в интерфейсе операции.",
    },
    services: servicesAllOperational.map((s) =>
      s.id === "revenue_payouts"
        ? {
            ...s,
            status: "delayed" as const,
            statusLabel: "Задержки",
            note: "Очередь начислений длиннее обычного на 15–30 минут.",
            lastUpdatedLabel: baseLast,
          }
        : s.id === "balance_sync"
          ? {
              ...s,
              status: "degraded" as const,
              statusLabel: "Пониженная производительность",
              note: "Обновление баланса может занимать до 2 минут после сделки.",
              lastUpdatedLabel: baseLast,
            }
          : s,
    ),
    maintenance: null,
    incidents: [
      {
        id: "inc-m",
        date: "2026-04-19",
        service: "Начисления revenue share",
        state: "monitoring",
        stateLabel: "Наблюдение",
        summary: "Задержки в потоке начислений; масштаб ограничен. Расследование активно.",
      },
      ...resolvedIncidents,
    ],
  },
  maintenance: {
    overall: {
      headline: "Запланированные технические работы",
      subline: "Часть операций с средствами временно переведена в режим обслуживания. Остальной продукт доступен.",
      tone: "maintenance",
      lastUpdatedLabel: baseLast,
      explanation:
        "В окне работ возможны отклонения заявок на вывод и задержки подтверждений депозита. Торговля на secondary может быть ограничена объявлением внутри продукта.",
    },
    services: servicesAllOperational.map((s) =>
      s.id === "deposits" || s.id === "withdrawals"
        ? {
            ...s,
            status: "maintenance" as const,
            statusLabel: "Техработы",
            note: "Приём/обработка заявок приостановлена на время окна обслуживания.",
            lastUpdatedLabel: baseLast,
          }
        : s.id === "secondary_market"
          ? {
              ...s,
              status: "degraded" as const,
              statusLabel: "Пониженная производительность",
              note: "Возможны редкие таймауты при выставлении крупных ордеров.",
              lastUpdatedLabel: baseLast,
            }
          : s,
    ),
    maintenance: {
      title: "Профилактика платёжного контура",
      affectedServices: ["Пополнение USDT (TRC20)", "Вывод средств"],
      windowLabel: "20.04.2026, 02:00–05:00 UTC",
      impactNote:
        "В этот период новые заявки на вывод не принимаются; депозиты ставятся в очередь до окончания работ. Баланс и история в кабинете доступны для просмотра.",
    },
    incidents: resolvedIncidents,
  },
  incident: {
    overall: {
      headline: "Зафиксирован активный инцидент",
      subline:
        "Команда расследует сбой в цепочке исполнения secondary. Пополнения и выводы работают в штатном режиме.",
      tone: "danger",
      lastUpdatedLabel: baseLast,
      explanation:
        "Пользователям рекомендуется временно воздержаться от крупных сделок на вторичном рынке до разрешения инцидента. Статус обновляется каждые несколько минут.",
    },
    services: servicesAllOperational.map((s) =>
      s.id === "secondary_market" || s.id === "order_matching"
        ? {
            ...s,
            status: "incident" as const,
            statusLabel: "Инцидент",
            note: "Расследование: возможны отмены части заявок на исполнении.",
            lastUpdatedLabel: baseLast,
          }
        : s.id === "balance_sync"
          ? {
              ...s,
              status: "degraded" as const,
              statusLabel: "Пониженная производительность",
              note: "Задержка отображения после сделок secondary до 5 минут.",
              lastUpdatedLabel: baseLast,
            }
          : s,
    ),
    maintenance: null,
    incidents: [
      {
        id: "inc-a",
        date: "2026-04-19",
        service: "Secondary market · исполнение",
        state: "investigating",
        stateLabel: "Расследование",
        summary: "Нетипичная ошибка при матчинге ордеров; затронута часть пользователей.",
      },
      {
        id: "inc-b",
        date: "2026-04-19",
        service: "Исполнение ордеров",
        state: "monitoring",
        stateLabel: "Наблюдение",
        summary: "Мониторинг после отката конфигурации стакана.",
      },
      ...resolvedIncidents,
    ],
  },
};

export function getSystemStatusPageData(): SystemStatusPageData {
  return scenarios[SYSTEM_STATUS_SCENARIO];
}
