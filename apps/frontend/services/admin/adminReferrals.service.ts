import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";

import type { AdminApiClient } from "@/features/admin/api/admin-api-client";



export type AdminReferralsSummary = {

  totalInvites: number;

  pendingRewards: number;

  pendingPartnerApplications: number;

  topReferrers: Array<{

    referrerUserId: string;

    rewardCount: number;

    totalAmount: string;

  }>;

};



export type AdminReferralRewardRow = {

  id: string;

  referrerUserId: string;

  referredUserId: string | null;

  eventType: string;

  amount: { toString(): string } | string;

  currency: string;

  status: string;

  createdAt: string;

  rejectedReason: string | null;

};



type AdminPartnerApiRow = {

  id?: string;

  partnerId?: string;

  userId: string;

  userEmail?: string;

  partnerType: string;

  status: string;

  statusLabel?: string;

  tier: string | null;

  commissionPercent: { toString(): string } | string | null;

  payoutMethod?: string | null;

  applicationNote: string | null;

  rejectedReason?: string | null;

  approvedAt?: string | null;

  createdAt: string;

  updatedAt?: string;

};



export type AdminPartnerRow = {

  id: string;

  userId: string;

  userEmail: string | null;

  partnerType: string;

  status: string;

  statusLabel: string | null;

  tier: string | null;

  commissionPercent: string | null;

  payoutMethod: string | null;

  applicationNote: string | null;

  rejectedReason: string | null;

  approvedAt: string | null;

  createdAt: string;

  updatedAt: string;

};



function normalizePartnerRow(row: AdminPartnerApiRow): AdminPartnerRow {

  return {

    id: row.id ?? row.partnerId ?? row.userId,

    userId: row.userId,

    userEmail: row.userEmail ?? null,

    partnerType: row.partnerType,

    status: row.status,

    statusLabel: row.statusLabel ?? null,

    tier: row.tier,

    commissionPercent:

      row.commissionPercent != null ? String(row.commissionPercent) : null,

    payoutMethod: row.payoutMethod ?? null,

    applicationNote: row.applicationNote,

    rejectedReason: row.rejectedReason ?? null,

    approvedAt: row.approvedAt ?? null,

    createdAt: row.createdAt,

    updatedAt: row.updatedAt ?? row.createdAt,

  };

}



export async function getAdminReferralsSummary(client: AdminApiClient): Promise<AdminReferralsSummary> {

  return client.get<AdminReferralsSummary>(ADMIN_API_PATHS.referralsSummary);

}



export async function listAdminReferralRewards(

  client: AdminApiClient,

  status?: string,

): Promise<{ items: AdminReferralRewardRow[] }> {

  const q = status ? `?status=${encodeURIComponent(status)}` : "";

  return client.get(`${ADMIN_API_PATHS.referralsRewards}${q}`);

}



export async function listAdminPartners(

  client: AdminApiClient,

  status?: string,

): Promise<{ items: AdminPartnerRow[] }> {

  const q = status ? `?status=${encodeURIComponent(status)}` : "";

  const res = await client.get<{ items: AdminPartnerApiRow[] }>(

    `${ADMIN_API_PATHS.referralsPartners}${q}`,

  );

  return { items: res.items.map(normalizePartnerRow) };

}



export async function approveAdminReferralReward(client: AdminApiClient, id: string) {

  return client.post(ADMIN_API_PATHS.referralRewardApprove(id));

}



export async function rejectAdminReferralReward(

  client: AdminApiClient,

  id: string,

  reason: string,

) {

  return client.post(ADMIN_API_PATHS.referralRewardReject(id), { reason });

}



export async function approveAdminPartner(

  client: AdminApiClient,

  id: string,

  body?: { tier?: string; commissionPercent?: string },

) {

  return client.post(ADMIN_API_PATHS.referralPartnerApprove(id), body ?? {});

}



export async function rejectAdminPartner(client: AdminApiClient, id: string, reason: string) {

  return client.post(ADMIN_API_PATHS.referralPartnerReject(id), { reason });

}



export async function suspendAdminPartner(client: AdminApiClient, id: string, reason: string) {

  return client.post(ADMIN_API_PATHS.referralPartnerSuspend(id), { reason });

}

