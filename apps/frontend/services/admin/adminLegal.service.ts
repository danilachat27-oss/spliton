import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";

export type AdminLegalPolicyRow = {
  id: string;
  type: string;
  version: string;
  title: string;
  content: string;
  contentFormat?: string;
  status: string;
  requiresUserConsent: boolean;
  publishedAt: string | null;
  effectiveAt?: string | null;
  updatedAt: string;
  createdAt?: string;
};

export type AdminLegalPolicyDraftBody = {
  type: string;
  version: string;
  title: string;
  content: string;
  requiresUserConsent?: boolean;
};

export type AdminLegalPolicyUpdateBody = {
  title?: string;
  content?: string;
  version?: string;
  requiresUserConsent?: boolean;
};

export async function listAdminLegalPolicies(
  client: AdminApiClient,
  query?: { status?: string; type?: string },
): Promise<AdminLegalPolicyRow[]> {
  const params = new URLSearchParams();
  if (query?.status) params.set("status", query.status);
  if (query?.type) params.set("type", query.type);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const items = await client.get<AdminLegalPolicyRow[]>(`${ADMIN_API_PATHS.legalPolicies}${suffix}`);
  return Array.isArray(items) ? items : [];
}

export async function getAdminLegalPolicy(client: AdminApiClient, id: string): Promise<AdminLegalPolicyRow> {
  return client.get<AdminLegalPolicyRow>(ADMIN_API_PATHS.legalPolicy(id));
}

export async function createAdminLegalPolicyDraft(
  client: AdminApiClient,
  body: AdminLegalPolicyDraftBody,
): Promise<AdminLegalPolicyRow> {
  return client.post<AdminLegalPolicyRow>(ADMIN_API_PATHS.legalPolicies, body);
}

export async function updateAdminLegalPolicyDraft(
  client: AdminApiClient,
  id: string,
  body: AdminLegalPolicyUpdateBody,
): Promise<AdminLegalPolicyRow> {
  return client.patch<AdminLegalPolicyRow>(ADMIN_API_PATHS.legalPolicy(id), body);
}

export async function publishAdminLegalPolicy(client: AdminApiClient, id: string): Promise<AdminLegalPolicyRow> {
  return client.post<AdminLegalPolicyRow>(ADMIN_API_PATHS.legalPolicyPublish(id), {});
}

export async function archiveAdminLegalPolicy(client: AdminApiClient, id: string): Promise<AdminLegalPolicyRow> {
  return client.post<AdminLegalPolicyRow>(ADMIN_API_PATHS.legalPolicyArchive(id), {});
}
