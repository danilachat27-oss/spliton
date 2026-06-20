import { parseApiClientError } from "@/lib/api/api-client-error";
import {
  getSystemStatusPageData,
  type IncidentRow,
  type OverallTone,
  type ServiceHealthStatus,
  type ServiceStatusRow,
  type SystemStatusPageData,
} from "@/constants/system-status-mock";
import { PUBLIC_STATUS_COMPONENTS } from "@/constants/system-status-components";
import { isLiveStatusEnabled, resolveApiUrl } from "@/lib/public-env";

const COMPONENT_NOTES = Object.fromEntries(
  PUBLIC_STATUS_COMPONENTS.map((component) => [component.code, component.note]),
) as Record<string, string>;

const COMPONENT_NAMES = Object.fromEntries(
  PUBLIC_STATUS_COMPONENTS.map((component) => [component.code, component.name]),
) as Record<string, string>;

const COMPONENT_ORDER = Object.fromEntries(
  PUBLIC_STATUS_COMPONENTS.map((component, index) => [component.code, index]),
) as Record<string, number>;

function sortServicesByCatalog(services: ServiceStatusRow[]): ServiceStatusRow[] {
  return [...services].sort((left, right) => {
    const leftOrder = COMPONENT_ORDER[left.id] ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = COMPONENT_ORDER[right.id] ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.name.localeCompare(right.name, "ru");
  });
}

type ApiSnapshot = {
  overall: string;
  components: Array<{
    code: string;
    name: string;
    status: string;
    message: string | null;
    updatedAt: string;
  }>;
  activeIncidents: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    affectedComponents: string[];
    startedAt: string;
    resolvedAt?: string | null;
    updates: Array<{ body: string; status: string | null; createdAt: string }>;
  }>;
  incidents?: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    affectedComponents: string[];
    startedAt: string;
    resolvedAt?: string | null;
    updates: Array<{ body: string; status: string | null; createdAt: string }>;
  }>;
};

const STATUS_LABELS: Record<ServiceHealthStatus, string> = {
  operational: "Работает штатно",
  degraded: "Пониженная производительность",
  delayed: "Задержки",
  maintenance: "Техработы",
  incident: "Инцидент",
};

function mapComponentStatus(raw: string): ServiceHealthStatus {
  switch (raw) {
    case "partial_outage":
      return "delayed";
    case "degraded":
      return "degraded";
    case "major_outage":
      return "incident";
    case "maintenance":
      return "maintenance";
    default:
      return "operational";
  }
}

function mapOverallTone(raw: string): OverallTone {
  switch (raw) {
    case "major_outage":
      return "danger";
    case "degraded":
      return "warning";
    case "maintenance":
      return "maintenance";
    default:
      return "success";
  }
}

function overallCopy(tone: OverallTone): Pick<SystemStatusPageData["overall"], "headline" | "subline" | "explanation"> {
  switch (tone) {
    case "danger":
      return {
        headline: "Серьёзный сбой",
        subline: "Часть сервисов недоступна или работает с ограничениями.",
        explanation: "Команда расследует инцидент. Следите за обновлениями ниже.",
      };
    case "warning":
      return {
        headline: "Пониженная доступность",
        subline: "Сервисы доступны, возможны задержки.",
        explanation: "Операции продолжаются; время отклика может быть выше обычного.",
      };
    case "maintenance":
      return {
        headline: "Плановые работы",
        subline: "Часть операций может быть временно недоступна.",
        explanation: "Окно обслуживания отражено в статусах компонентов.",
      };
    default:
      return {
        headline: "Все системы работают",
        subline: "Пользовательский контур Spliton в штатном режиме.",
        explanation: "Критичных инцидентов нет. Данные обновляются в реальном времени.",
      };
  }
}

function mapIncidentState(raw: string): IncidentRow["state"] {
  if (raw === "resolved") return "resolved";
  if (raw === "monitoring") return "monitoring";
  if (raw === "identified") return "monitoring";
  return "investigating";
}

function incidentStateLabel(state: IncidentRow["state"]): string {
  switch (state) {
    case "resolved":
      return "Закрыто";
    case "monitoring":
      return "Наблюдение";
    default:
      return "Расследование";
  }
}

function formatUpdatedLabel(iso: string): string {
  const d = new Date(iso);
  return `Обновлено: ${d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} UTC`;
}

function mapSnapshot(body: ApiSnapshot): SystemStatusPageData {
  const tone = mapOverallTone(body.overall);
  const copy = overallCopy(tone);
  const latestUpdate = body.components.reduce<string | null>((max, c) => {
    if (!max || c.updatedAt > max) return c.updatedAt;
    return max;
  }, null);

  const services: ServiceStatusRow[] = sortServicesByCatalog(
    body.components.map((c) => {
    const status = mapComponentStatus(c.status);
    const apiMessage = c.message?.trim();
    const note =
      apiMessage && !/^[\x00-\x7F]+$/.test(apiMessage)
        ? apiMessage
        : COMPONENT_NOTES[c.code] ?? apiMessage ?? STATUS_LABELS[status];
      return {
        id: c.code,
        name: c.name,
        status,
        statusLabel: STATUS_LABELS[status],
        note,
        lastUpdatedLabel: formatUpdatedLabel(c.updatedAt),
      };
    }),
  );

  const maintenanceComponents = body.components.filter((c) => c.status === "maintenance");
  const maintenance =
    maintenanceComponents.length > 0
      ? {
          title: "Плановое обслуживание",
          affectedServices: maintenanceComponents.map((c) => c.name),
          windowLabel: "См. статусы компонентов",
          impactNote:
            maintenanceComponents[0]?.message?.trim() ||
            "Часть операций может быть недоступна в окне профилактики.",
        }
      : null;

  const incidentSource = body.incidents ?? body.activeIncidents;
  const incidents: IncidentRow[] = incidentSource.map((inc) => {
    const state = mapIncidentState(inc.status);
    const service =
      inc.affectedComponents.length > 0
        ? inc.affectedComponents.map((code) => COMPONENT_NAMES[code] ?? code).join(" · ")
        : inc.title;
    const latest = inc.updates[0]?.body;
    return {
      id: inc.id,
      date: new Date(inc.resolvedAt ?? inc.startedAt).toISOString().slice(0, 10),
      service,
      state,
      stateLabel: incidentStateLabel(state),
      summary: latest?.trim() || inc.description,
    };
  });

  return {
    overall: {
      tone,
      headline: copy.headline,
      subline: copy.subline,
      explanation: copy.explanation,
      lastUpdatedLabel: latestUpdate ? formatUpdatedLabel(latestUpdate) : formatUpdatedLabel(new Date().toISOString()),
    },
    services,
    maintenance,
    incidents,
  };
}

export async function fetchSystemStatusPageData(): Promise<SystemStatusPageData> {
  if (!isLiveStatusEnabled()) {
    return getSystemStatusPageData();
  }

  const res = await fetch(resolveApiUrl("/api/v1/system-status"), { cache: "no-store" });
  if (!res.ok) {
    throw await parseApiClientError(res);
  }
  const body = (await res.json()) as ApiSnapshot;
  return mapSnapshot(body);
}
