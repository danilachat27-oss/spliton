import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

export type AdminKycReview = {
  id: string;
  userId: string;
  status: string;
  level?: string | null;
  countryCode?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  user?: {
    id: string;
    email: string;
    profile?: { displayName?: string | null } | null;
  };
};

const MOCK_REVIEWS: AdminKycReview[] = [
  {
    id: "kyc-demo-1",
    userId: "user-demo-1",
    status: "PENDING",
    countryCode: "RU",
    submittedAt: new Date().toISOString(),
    user: { id: "user-demo-1", email: "demo@spliton.test", profile: { displayName: "Demo User" } },
  },
];

export async function listAdminKycReviews(
  status?: string,
  client?: AdminApiClient,
): Promise<AdminKycReview[]> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return client.get<AdminKycReview[]>(`${ADMIN_API_PATHS.kycReviews}${qs}`);
  }
  await adminMockDelay(120);
  return MOCK_REVIEWS;
}

export async function approveAdminKycReview(
  id: string,
  client?: AdminApiClient,
): Promise<void> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    await client.post(ADMIN_API_PATHS.kycReviewApprove(id), {});
    return;
  }
  await adminMockDelay(200);
}

export async function rejectAdminKycReview(
  id: string,
  reason: string,
  client?: AdminApiClient,
): Promise<void> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    await client.post(ADMIN_API_PATHS.kycReviewReject(id), { reason });
    return;
  }
  await adminMockDelay(200);
}
