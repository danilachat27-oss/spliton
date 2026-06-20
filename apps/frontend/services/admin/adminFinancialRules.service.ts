import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

export type AdminFinancialRule = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  category: string;
  valueType: string;
  value: string;
  minValue?: string | null;
  maxValue?: string | null;
  asset?: string | null;
  network?: string | null;
  effectiveFrom?: string;
  isActive?: boolean;
};

const MOCK_RULES: AdminFinancialRule[] = [
  {
    id: "rule-min-withdraw",
    code: "MIN_WITHDRAWAL_USDT",
    title: "Минимальный вывод USDT",
    category: "withdrawal",
    valueType: "amount_usdt",
    value: "50",
  },
  {
    id: "rule-max-withdraw-daily",
    code: "MAX_WITHDRAWAL_DAILY_USDT",
    title: "Лимит вывода за сутки",
    category: "withdrawal",
    valueType: "amount_usdt",
    value: "10000",
  },
];

export async function listAdminFinancialRules(
  client?: AdminApiClient,
): Promise<AdminFinancialRule[]> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const res = await client.get<{ items?: AdminFinancialRule[] } | AdminFinancialRule[]>(
      ADMIN_API_PATHS.financialRules,
    );
    return Array.isArray(res) ? res : (res.items ?? []);
  }
  await adminMockDelay(120);
  return MOCK_RULES;
}

export async function patchAdminFinancialRule(
  id: string,
  patch: { value: string; reason: string },
  client?: AdminApiClient,
): Promise<AdminFinancialRule> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.patch<AdminFinancialRule>(ADMIN_API_PATHS.financialRule(id), patch);
  }
  await adminMockDelay(200);
  const row = MOCK_RULES.find((r) => r.id === id);
  if (!row) throw new Error("Rule not found");
  return { ...row, value: patch.value };
}
