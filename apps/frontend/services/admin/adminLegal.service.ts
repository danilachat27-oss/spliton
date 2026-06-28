import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";

export type AdminLegalPolicyRow = {
  id: string;
  type: string;
  version: string;
  title: string;
  content: string;
  contentFormat?: string;
  contentHash?: string | null;
  status: string;
  requiresUserConsent: boolean;
  publishedAt: string | null;
  effectiveAt?: string | null;
  updatedAt: string;
  createdAt?: string;
  consentsCount?: number;
  createdBy?: { id: string; email: string } | null;
  updatedBy?: { id: string; email: string } | null;
  approvedBy?: { id: string; email: string } | null;
};

export type AdminLegalPolicySummary = {
  id: string;
  type: string;
  version: string;
  title: string;
  status: string;
  requiresUserConsent: boolean;
  publishedAt: string | null;
  effectiveAt: string | null;
  updatedAt: string;
  consentsCount: number;
};

export type AdminLegalPolicyGroup = {
  type: string;
  versionCount: number;
  activePolicy: AdminLegalPolicySummary | null;
  latestDraft: AdminLegalPolicySummary | null;
  versions: AdminLegalPolicySummary[];
};

export type AdminLegalPolicyDraftBody = {
  type: string;
  version: string;
  title: string;
  content: string;
  contentFormat?: string;
  requiresUserConsent?: boolean;
  effectiveAt?: string | null;
};

export type AdminLegalPolicyUpdateBody = {
  title?: string;
  content?: string;
  version?: string;
  contentFormat?: string;
  requiresUserConsent?: boolean;
  effectiveAt?: string | null;
};

export async function listAdminLegalPoliciesGrouped(
  client: AdminApiClient,
): Promise<AdminLegalPolicyGroup[]> {
  const items = await client.get<AdminLegalPolicyGroup[]>(ADMIN_API_PATHS.legalPoliciesGrouped);
  return Array.isArray(items) ? items : [];
}

export async function listAdminLegalPolicyVersions(
  client: AdminApiClient,
  type: string,
): Promise<AdminLegalPolicyRow[]> {
  const items = await client.get<AdminLegalPolicyRow[]>(ADMIN_API_PATHS.legalPolicyVersions(type));
  return Array.isArray(items) ? items : [];
}

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

export async function submitAdminLegalPolicyReview(
  client: AdminApiClient,
  id: string,
): Promise<AdminLegalPolicyRow> {
  return client.post<AdminLegalPolicyRow>(ADMIN_API_PATHS.legalPolicySubmitReview(id), {});
}

export async function publishAdminLegalPolicy(client: AdminApiClient, id: string): Promise<AdminLegalPolicyRow> {
  return client.post<AdminLegalPolicyRow>(ADMIN_API_PATHS.legalPolicyPublish(id), {});
}

export async function archiveAdminLegalPolicy(client: AdminApiClient, id: string): Promise<AdminLegalPolicyRow> {
  return client.post<AdminLegalPolicyRow>(ADMIN_API_PATHS.legalPolicyArchive(id), {});
}

export async function getAdminLegalPolicyConsentsCount(client: AdminApiClient, id: string): Promise<number> {
  const result = await client.get<number | { count?: number }>(ADMIN_API_PATHS.legalPolicyConsentsCount(id));
  return typeof result === "number" ? result : (result.count ?? 0);
}
