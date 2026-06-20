import { parseApiClientError } from "@/lib/api/api-client-error";
import {
  getPublicApiBaseUrl,
  getSupportDataSource,
  type DataSourceMode,
} from "@/lib/public-env";

export type UserSupportDataSource = DataSourceMode;

export function getUserSupportDataSource(): UserSupportDataSource {
  return getSupportDataSource();
}
export type UserSupportTicket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    body: string;
    isStaff: boolean;
    authorEmail: string;
    createdAt: string;
  }>;
};

const BASE = "/api/v1/support/tickets";

function supportApiUrl(path: string) {
  return `${getPublicApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

async function supportFetch<T>(
  path: string,
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
  init?: RequestInit,
): Promise<T> {
  const res = await authorizedFetch(supportApiUrl(path), init);
  if (!res.ok) {
    throw await parseApiClientError(res);
  }
  return res.json() as Promise<T>;
}

const MOCK_TICKETS: UserSupportTicket[] = [];

export async function listUserSupportTickets(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
  page = 1,
  pageSize = 20,
) {
  if (getUserSupportDataSource() !== "live") {
    return { items: MOCK_TICKETS, total: 0, page, pageSize };
  }
  return supportFetch<{ items: UserSupportTicket[]; total: number; page: number; pageSize: number }>(
    `${BASE}?page=${page}&pageSize=${pageSize}`,
    authorizedFetch,
  );
}

export async function getUserSupportTicket(
  id: string,
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
) {
  if (getUserSupportDataSource() !== "live") {
    throw new Error("Ticket not found");
  }
  return supportFetch<UserSupportTicket>(`${BASE}/${id}`, authorizedFetch);
}

export async function createUserSupportTicket(
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
  body: {
    category: string;
    subject: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  },
) {
  if (getUserSupportDataSource() !== "live") {
    throw new Error("Support API available only in live mode");
  }
  return supportFetch<UserSupportTicket>(BASE, authorizedFetch, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function addUserSupportMessage(
  id: string,
  body: string,
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
) {
  return supportFetch<UserSupportTicket>(`${BASE}/${id}/messages`, authorizedFetch, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
}

export async function closeUserSupportTicket(
  id: string,
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>,
) {
  return supportFetch<UserSupportTicket>(`${BASE}/${id}/close`, authorizedFetch, {
    method: "PATCH",
  });
}
