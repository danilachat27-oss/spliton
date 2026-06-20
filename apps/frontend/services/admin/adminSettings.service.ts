import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";
import {
  getAdminPlatformFees,
  type AdminPlatformFees,
} from "./adminPlatformFees.service";
import { listAdminFinancialRules } from "./adminFinancialRules.service";

export type AdminSettingsSnapshot = {
  platformFeePct: string;
  withdrawalFeeUsdt: string;
  secondaryMarketFeePct: string;
  network: string;
  asset: string;
  minWithdrawalUsdt: string;
};

const MOCK_SETTINGS: AdminSettingsSnapshot = {
  platformFeePct: "10",
  withdrawalFeeUsdt: "5",
  secondaryMarketFeePct: "1",
  network: "TRC20",
  asset: "USDT",
  minWithdrawalUsdt: "50",
};

function mapLiveSettings(
  fees: AdminPlatformFees,
  rules: Awaited<ReturnType<typeof listAdminFinancialRules>>,
): AdminSettingsSnapshot {
  const minWithdrawal =
    rules.find((r) => r.code === "MIN_WITHDRAWAL_USDT")?.value ?? MOCK_SETTINGS.minWithdrawalUsdt;
  const networkRule = rules.find((r) => r.network)?.network;
  const assetRule = rules.find((r) => r.asset)?.asset;
  return {
    platformFeePct: fees.primaryPurchaseFeePct,
    withdrawalFeeUsdt: fees.withdrawalFeeUsdt,
    secondaryMarketFeePct: fees.secondaryMarketFeePct,
    network: networkRule ?? MOCK_SETTINGS.network,
    asset: assetRule ?? MOCK_SETTINGS.asset,
    minWithdrawalUsdt: minWithdrawal,
  };
}

export async function getAdminSettings(client?: AdminApiClient): Promise<AdminSettingsSnapshot> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const [fees, rules] = await Promise.all([
      getAdminPlatformFees(client),
      listAdminFinancialRules(client),
    ]);
    return mapLiveSettings(fees, rules);
  }
  await adminMockDelay(120);
  return { ...MOCK_SETTINGS };
}

export async function saveAdminSettings(
  patch: Partial<AdminSettingsSnapshot>,
  client?: AdminApiClient,
): Promise<AdminSettingsSnapshot> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    throw new Error(
      "Use patchAdminPlatformFees / patchAdminFinancialRule for live settings updates",
    );
  }
  await adminMockDelay(300);
  return { ...MOCK_SETTINGS, ...patch };
}
