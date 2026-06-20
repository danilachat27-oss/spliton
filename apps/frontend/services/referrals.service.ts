import { parseApiClientError } from "@/lib/api/api-client-error";
import { getPublicApiBaseUrl } from "@/lib/public-env";
import type { ReferralRewardStatus } from "@/components/referral/referral-mock-data";

export const REFERRALS_API_PATHS = {
  me: "/api/v1/referrals/me",
  applyCode: "/api/v1/referrals/apply-code",
  invites: "/api/v1/referrals/invites",
  rewards: "/api/v1/referrals/rewards",
  statement: "/api/v1/referrals/statement",
} as const;

export type ReferralMe = {
  referralCode: string;
  referralLink: string;
  invitedUsersCount: number;
  activeInvitedUsersCount: number;
  pendingRewards: string;
  approvedRewards: string;
  paidRewards: string;
  rejectedRewards: string;
  createdAt: string;
  conversionRatePct: string;
};

export type ReferralInviteRow = {
  id: string;
  referredUserId: string;
  maskedEmail: string;
  status: string;
  emailVerified: boolean;
  attributedAt: string;
  utmSource: string | null;
  utmCampaign: string | null;
};

export type ReferralRewardRow = {
  id: string;
  eventType: string;
  amountUsdt: number;
  currency: string;
  status: ReferralRewardStatus;
  statusLabel: string;
  createdAt: string;
  paidAt: string | null;
  rejectedReason: string | null;
};

type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

function url(path: string) {
  return `${getPublicApiBaseUrl()}${path}`;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw await parseApiClientError(res);
  return res.json() as Promise<T>;
}

export async function fetchReferralMe(fetcher: AuthorizedFetch): Promise<ReferralMe> {
  const res = await fetcher(url(REFERRALS_API_PATHS.me));
  return parseJson(res);
}

export async function fetchReferralInvites(
  fetcher: AuthorizedFetch,
  page = 1,
  pageSize = 20,
): Promise<{ items: ReferralInviteRow[]; total: number; hasMore: boolean }> {
  const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const res = await fetcher(`${url(REFERRALS_API_PATHS.invites)}?${q}`);
  return parseJson(res);
}

export async function fetchReferralRewards(
  fetcher: AuthorizedFetch,
  params?: { status?: string; page?: number; pageSize?: number },
): Promise<{ items: ReferralRewardRow[]; total: number; hasMore: boolean }> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.pageSize) q.set("pageSize", String(params.pageSize));
  if (params?.status) q.set("status", params.status);
  const suffix = q.size ? `?${q}` : "";
  const res = await fetcher(`${url(REFERRALS_API_PATHS.rewards)}${suffix}`);
  return parseJson(res);
}

export async function fetchReferralStatement(fetcher: AuthorizedFetch) {
  const res = await fetcher(url(REFERRALS_API_PATHS.statement));
  return parseJson<{
    generatedAt: string;
    summary: ReferralMe;
    rewards: ReferralRewardRow[];
  }>(res);
}

export async function applyReferralCode(
  fetcher: AuthorizedFetch,
  code: string,
  meta?: { utmSource?: string; utmCampaign?: string },
) {
  const res = await fetcher(url(REFERRALS_API_PATHS.applyCode), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, ...meta }),
  });
  return parseJson(res);
}

export const REFERRAL_EVENT_LABELS: Record<string, string> = {
  EMAIL_VERIFIED: "Подтверждение email",
  FIRST_DEPOSIT: "Первое пополнение USDT",
  FIRST_PRIMARY_PURCHASE: "Первая покупка на первичном рынке",
  SECONDARY_TRADE_FEE: "Комиссия вторичного рынка",
  KYC_COMPLETED: "Пройден KYC",
  USER_REGISTERED: "Регистрация",
};

export function referralEventLabel(eventType: string): string {
  return REFERRAL_EVENT_LABELS[eventType] ?? eventType;
}
