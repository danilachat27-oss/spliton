export type WalletDataSourceMode = "mock" | "live";

export type BuyCheckoutMode = "auth_loading" | "login_required" | "live" | "mock";

/** Determines buy panel mode — single source for regression tests. */
export function resolveBuyCheckoutMode(
  walletDataSource: WalletDataSourceMode,
  isAuthenticated: boolean,
  authLoading: boolean,
): BuyCheckoutMode {
  if (walletDataSource === "live" && authLoading) return "auth_loading";
  if (walletDataSource === "live" && !isAuthenticated) return "login_required";
  if (walletDataSource === "live") return "live";
  return "mock";
}

export function canRunMockPurchase(mode: BuyCheckoutMode): boolean {
  return mode === "mock";
}

export function canRunLivePurchase(mode: BuyCheckoutMode): boolean {
  return mode === "live";
}
