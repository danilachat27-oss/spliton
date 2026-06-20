/**
 * Runtime policy: mock/fake financial data only when data source is explicitly mock (local dev).
 */

import {
  getAdminDataSource,
  getAppRuntimeMode,
  getWalletDataSource,
  isStrictDeployMode,
} from "./public-env";

export function isFinancialMockFallbackAllowed(): boolean {
  return getWalletDataSource() === "mock";
}

export function isAdminMockFallbackAllowed(): boolean {
  return getAdminDataSource() === "mock";
}

export function enforceFinancialLivePolicyAtRuntime(scope: string): void {
  if (typeof window === "undefined") return;
  if (!isStrictDeployMode()) return;
  if (getWalletDataSource() !== "mock") return;
  const mode = getAppRuntimeMode();
  console.error(
    "[Spliton live-policy] " +
      scope +
      ": NEXT_PUBLIC_WALLET_DATA_SOURCE=mock is not allowed in " +
      mode +
      ".",
  );
}

export function enforceAdminLivePolicyAtRuntime(scope: string): void {
  if (typeof window === "undefined") return;
  if (!isStrictDeployMode()) return;
  if (getAdminDataSource() !== "mock") return;
  const mode = getAppRuntimeMode();
  console.error(
    "[Spliton live-policy] " +
      scope +
      ": NEXT_PUBLIC_ADMIN_DATA_SOURCE=mock is not allowed in " +
      mode +
      ".",
  );
}
