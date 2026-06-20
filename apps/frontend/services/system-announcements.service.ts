import { resolveApiUrl } from "@/lib/public-env";
import type { AppLocale } from "@/lib/i18n/types";

export type ActiveAnnouncement = {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  shortMessage: string | null;
  actionLabel: string | null;
  actionUrl: string | null;
  dismissible: boolean;
  sticky: boolean;
};

export async function fetchActiveAnnouncements(params: {
  locale: AppLocale;
  surface?: "public" | "app" | "admin";
  accessToken?: string | null;
}): Promise<ActiveAnnouncement[]> {
  const query = new URLSearchParams({
    locale: params.locale,
    surface: params.surface ?? "app",
  });
  const headers: HeadersInit = {};
  if (params.accessToken) {
    headers.Authorization = `Bearer ${params.accessToken}`;
  }
  try {
    const response = await fetch(resolveApiUrl(`/api/v1/system-announcements/active?${query}`), {
      credentials: "include",
      headers,
      cache: "no-store",
    });
    if (!response.ok) return [];
    const body = (await response.json()) as { items?: ActiveAnnouncement[] };
    return body.items ?? [];
  } catch {
    return [];
  }
}

export async function dismissAnnouncement(id: string, accessToken: string): Promise<void> {
  await fetch(resolveApiUrl(`/api/v1/system-announcements/${id}/dismiss`), {
    method: "POST",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
}

export async function updateUserLocale(
  accessToken: string,
  preferredLocale: AppLocale,
): Promise<void> {
  await fetch(resolveApiUrl("/users/me/preferences"), {
    method: "PATCH",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ preferredLocale }),
  });
}
