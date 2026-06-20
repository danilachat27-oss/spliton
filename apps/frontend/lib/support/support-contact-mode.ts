import { getWalletDataSource } from "@/lib/public-env";

/** Live/production support contact — email and tickets, no demo chat UI. */
export function isLiveSupportContactMode(): boolean {
  return getWalletDataSource() === "live";
}
