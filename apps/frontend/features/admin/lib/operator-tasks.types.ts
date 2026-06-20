export type OperatorTaskCategory =
  | "finance"
  | "support"
  | "compliance"
  | "content"
  | "market"
  | "operations";

export type AdminOperatorTask = {
  id: string;
  label: string;
  description: string;
  category: OperatorTaskCategory;
  count: number;
  href: string;
  priority?: "high" | "normal";
};

export type AdminOperatorAlert = {
  id: string;
  level: "warning" | "danger" | "info";
  message: string;
  href?: string;
  createdAt: string;
};

export const OPERATOR_TASK_CATEGORY_LABELS: Record<OperatorTaskCategory, string> = {
  finance: "Казначейство",
  support: "Поддержка",
  compliance: "Риски и контроль",
  content: "Контент и раунды",
  market: "Вторичный рынок",
  operations: "Операции и отчёты",
};

export const OPERATOR_TASK_CATEGORY_ORDER: OperatorTaskCategory[] = [
  "finance",
  "compliance",
  "support",
  "content",
  "market",
  "operations",
];
