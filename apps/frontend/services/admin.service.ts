import {
  ADMIN_ACCESS_LEGACY,
  ADMIN_API_PATHS,
  getAdminApiBaseUrl,
} from "@/features/admin/api/admin-api.config";
import { ApiError } from "@/services/auth.service";

function resolveUrl(path: string): string {
  return `${getAdminApiBaseUrl()}${path}`;
}

const ADMIN_ACCESS_TIMEOUT_MS = 8_000;

async function tryAccess(path: string, accessToken: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ADMIN_ACCESS_TIMEOUT_MS);
  try {
    return await fetch(resolveUrl(path), {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/** Staff portal gate — prefers `/api/admin/v1/access`, falls back to legacy `/admin/access`. */
export async function verifyAdminAccess(accessToken: string): Promise<void> {
  let res = await tryAccess(ADMIN_API_PATHS.access, accessToken);
  if (res.status === 404) {
    res = await tryAccess(ADMIN_ACCESS_LEGACY, accessToken);
  }

  if (res.status === 401 || res.status === 403) {
    throw new ApiError(res.status, "Admin access denied", "ADMIN_ACCESS_DENIED");
  }
  if (!res.ok) {
    throw new ApiError(res.status, "Admin access check failed", "ADMIN_ACCESS_CHECK_FAILED");
  }
}
