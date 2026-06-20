import { resolveAdminApiUrl, resolveApiUrl } from "@/lib/public-env";

export type NotificationItem = {
  id: string;
  type: string;
  category: string;
  severity: string;
  title: string;
  message: string;
  actionUrl: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
  priority: number;
};

export type NotificationListResponse = {
  items: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type NotificationPreferences = {
  userId: string;
  emailFinance: boolean;
  emailSecurity: boolean;
  emailMarket: boolean;
  emailSupport: boolean;
  emailNews: boolean;
  inAppFinance: boolean;
  inAppMarket: boolean;
  inAppSupport: boolean;
  inAppNews: boolean;
};

function resolveNotificationsUrl(basePath: string, suffix = ""): string {
  const path = `${basePath}${suffix}`;
  return path.startsWith("/api/admin/")
    ? resolveAdminApiUrl(path)
    : resolveApiUrl(path);
}

export async function fetchNotifications(
  fetcher: (path: string, init?: RequestInit) => Promise<Response>,
  basePath: string,
  query?: { page?: number; pageSize?: number; unreadOnly?: boolean },
): Promise<NotificationListResponse> {
  const params = new URLSearchParams();
  if (query?.page) params.set("page", String(query.page));
  if (query?.pageSize) params.set("pageSize", String(query.pageSize));
  if (query?.unreadOnly) params.set("unreadOnly", "true");
  const qs = params.toString();
  const res = await fetcher(`${resolveNotificationsUrl(basePath)}${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json() as Promise<NotificationListResponse>;
}

export async function fetchUnreadCount(
  fetcher: (path: string, init?: RequestInit) => Promise<Response>,
  basePath: string,
): Promise<number> {
  const res = await fetcher(resolveNotificationsUrl(basePath, "/unread-count"));
  if (!res.ok) return 0;
  const data = (await res.json()) as { count: number };
  return data.count ?? 0;
}

export async function markNotificationRead(
  fetcher: (path: string, init?: RequestInit) => Promise<Response>,
  basePath: string,
  id: string,
) {
  const res = await fetcher(resolveNotificationsUrl(basePath, `/${id}/read`), { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to mark read");
  return res.json();
}

export async function markAllNotificationsRead(
  fetcher: (path: string, init?: RequestInit) => Promise<Response>,
  basePath: string,
) {
  const res = await fetcher(resolveNotificationsUrl(basePath, "/read-all"), { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to mark all read");
  return res.json();
}

export async function fetchNotificationPreferences(
  fetcher: (path: string, init?: RequestInit) => Promise<Response>,
): Promise<NotificationPreferences> {
  const res = await fetcher(resolveApiUrl("/api/v1/notification-preferences"));
  if (!res.ok) throw new Error("Failed to load preferences");
  return res.json() as Promise<NotificationPreferences>;
}

export async function patchNotificationPreferences(
  fetcher: (path: string, init?: RequestInit) => Promise<Response>,
  patch: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const res = await fetcher(resolveApiUrl("/api/v1/notification-preferences"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to save preferences");
  return res.json() as Promise<NotificationPreferences>;
}
