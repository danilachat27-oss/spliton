import type { AdminApiClient } from "@/features/admin/api/admin-api-client";

export type AdminOperatorSlaTask = {
  id: string;
  taskType: string;
  status: string;
  title: string;
  dueAt: string;
  breachedAt: string | null;
  href: string | null;
  priority: string;
  escalationLevel: number;
};

export async function fetchAdminOperatorSlaTasks(
  client: AdminApiClient,
  params?: { overdueOnly?: boolean },
): Promise<AdminOperatorSlaTask[]> {
  const query = params?.overdueOnly ? "?overdueOnly=true" : "";
  const res = await client.get<{ items: AdminOperatorSlaTask[] }>(
    `/api/admin/v1/operator-sla/tasks${query}`,
  );
  return res.items ?? [];
}
