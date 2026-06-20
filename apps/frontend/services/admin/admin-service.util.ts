import {
  getAdminDataSource,
  type AdminDataSource,
} from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import { adminMockDelay } from "./admin-api.util";

export function adminDataSource(): AdminDataSource {
  return getAdminDataSource();
}

export function isAdminLiveMode(): boolean {
  return getAdminDataSource() === "live";
}

/** Mock fallback only when admin data source is explicitly mock. */
export function isAdminMockFallbackAllowed(): boolean {
  return !isAdminLiveMode();
}

export async function withMockDelay<T>(fn: () => T | Promise<T>, ms?: number): Promise<T> {
  if (isAdminLiveMode()) {
    throw new Error("withMockDelay must not run in admin live mode");
  }
  await adminMockDelay(ms);
  return fn();
}

export function requireAdminClient(
  client: AdminApiClient | undefined,
): asserts client is AdminApiClient {
  if (!client) {
    throw new Error("AdminApiClient required when NEXT_PUBLIC_ADMIN_DATA_SOURCE=live");
  }
}

/**
 * In live mode: require API client — never fall back to mock when client is missing.
 * In mock mode: no-op (caller continues to mock path).
 */
export function requireAdminLiveClient(
  client: AdminApiClient | undefined,
): asserts client is AdminApiClient {
  if (!isAdminLiveMode()) {
    return;
  }
  requireAdminClient(client);
}

/** @deprecated use requireAdminLiveClient */
export function assertLiveAdminClient(
  client: AdminApiClient | undefined,
): asserts client is AdminApiClient {
  if (!isAdminLiveMode()) {
    throw new Error("Content admin requires NEXT_PUBLIC_ADMIN_DATA_SOURCE=live");
  }
  requireAdminClient(client);
}

/**
 * Live API call or explicit mock path — no silent mock when live is configured.
 */
export async function adminLiveOrMock<T>(
  client: AdminApiClient | undefined,
  liveFn: (api: AdminApiClient) => Promise<T>,
  mockFn: () => Promise<T>,
): Promise<T> {
  if (isAdminLiveMode()) {
    requireAdminClient(client);
    return liveFn(client);
  }
  return mockFn();
}
