/** Почта поддержки (UI + mailto). */
export const SUPPORT_HELPDESK_EMAIL = "support@spliton.io";

export type SupportServiceStatusKind = "operational" | "delayed" | "maintenance";

/**
 * Демонстрационные строки статуса сервисов для режима без live-status.
 * В live-режиме страница получает список через `fetchSystemStatusPageData`.
 */
export const SUPPORT_SERVICE_STATUS_ROWS: Array<{
  id: string;
  label: string;
  status: SupportServiceStatusKind;
  hint?: string;
}> = [
  { id: "wallet", label: "Кошелёк", status: "operational" },
  { id: "market", label: "Рынок", status: "delayed", hint: "Возможны задержки" },
  { id: "support", label: "Поддержка", status: "maintenance", hint: "Идут работы" },
];
