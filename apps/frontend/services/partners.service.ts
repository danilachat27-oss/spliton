import { parseApiClientError } from "@/lib/api/api-client-error";
import { getPublicApiBaseUrl } from "@/lib/public-env";

export const PARTNERS_API_PATHS = {
  apply: "/api/v1/partners/apply",
  me: "/api/v1/partners/me",
  performance: "/api/v1/partners/performance",
} as const;

export type PartnerType =
  | "AFFILIATE"
  | "INFLUENCER"
  | "AGENCY"
  | "ARTIST_MANAGER"
  | "STRATEGIC_PARTNER";

export type PartnerStatus =
  | "APPLIED"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | null;

export type PartnerTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "CUSTOM" | null;

export type PartnerMe =
  | { status: null; canApply: true }
  | {
      partnerId: string;
      userId: string;
      partnerType: PartnerType;
      status: PartnerStatus;
      tier: PartnerTier;
      partnerCode: string | null;
      partnerLink: string | null;
      commissionPercent: string | null;
      payoutMethod: string | null;
      applicationNote: string | null;
      approvedAt: string | null;
      rejectedReason: string | null;
      statusLabel?: string;
      canApply: boolean;
    };

export type PartnerPerformance = {
  partner: PartnerMe & { status: PartnerStatus };
  referral: {
    invitedUsersCount: number;
    activeInvitedUsersCount: number;
    paidRewards: string;
    pendingRewards: string;
  };
  commissions: Array<{
    id: string;
    eventType: string;
    amountUsdt: number;
    status: string;
    createdAt: string;
  }>;
  totals: { paidUsdt: string };
};

type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

function url(path: string) {
  return `${getPublicApiBaseUrl()}${path}`;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw await parseApiClientError(res);
  return res.json() as Promise<T>;
}

export async function fetchPartnerMe(fetcher: AuthorizedFetch): Promise<PartnerMe> {
  const res = await fetcher(url(PARTNERS_API_PATHS.me));
  return parseJson(res);
}

export async function fetchPartnerPerformance(fetcher: AuthorizedFetch): Promise<PartnerPerformance> {
  const res = await fetcher(url(PARTNERS_API_PATHS.performance));
  return parseJson(res);
}

export async function applyPartner(
  fetcher: AuthorizedFetch,
  payload: {
    partnerType: PartnerType;
    applicationNote?: string;
    payoutMethod?: string;
  },
): Promise<PartnerMe> {
  const res = await fetcher(url(PARTNERS_API_PATHS.apply), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export const PARTNER_TYPE_OPTIONS: { value: PartnerType; label: string }[] = [
  { value: "AFFILIATE", label: "Affiliate / медиа" },
  { value: "INFLUENCER", label: "Инфлюенсер" },
  { value: "AGENCY", label: "Агентство" },
  { value: "ARTIST_MANAGER", label: "Менеджмент артистов" },
  { value: "STRATEGIC_PARTNER", label: "Стратегический партнёр" },
];

export const PARTNER_STATUS_LABELS: Record<string, string> = {
  APPLIED: "Заявка отправлена",
  IN_REVIEW: "На рассмотрении",
  APPROVED: "Одобрен",
  REJECTED: "Отклонён",
  SUSPENDED: "Приостановлен",
};
