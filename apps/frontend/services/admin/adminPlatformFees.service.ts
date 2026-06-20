import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";

import type { AdminApiClient } from "@/features/admin/api/admin-api-client";

import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";



export type AdminPlatformFees = {

  primaryPurchaseFeePct: string;

  withdrawalFeeUsdt: string;

  withdrawalFeePct?: string | null;

  secondaryMarketFeePct: string;

  premiumMonthlyUsdt: string;

  effectiveFrom?: string;

  updatedAt?: string;

};



const MOCK_FEES: AdminPlatformFees = {

  primaryPurchaseFeePct: "2.5",

  withdrawalFeeUsdt: "5.00",

  secondaryMarketFeePct: "1.0",

  premiumMonthlyUsdt: "0",

};



export async function getAdminPlatformFees(client?: AdminApiClient): Promise<AdminPlatformFees> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminPlatformFees>(ADMIN_API_PATHS.platformFees);

  }

  await adminMockDelay(120);

  return { ...MOCK_FEES };

}



export async function patchAdminPlatformFees(

  patch: Partial<AdminPlatformFees>,

  client?: AdminApiClient,

): Promise<AdminPlatformFees> {

  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.patch<AdminPlatformFees>(ADMIN_API_PATHS.platformFees, patch);

  }

  await adminMockDelay(300);

  return { ...MOCK_FEES, ...patch };

}


