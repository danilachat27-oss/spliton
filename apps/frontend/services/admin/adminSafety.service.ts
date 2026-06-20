import type { AdminApiClient } from "@/features/admin/api/admin-api-client";

export type AdminSafetyConsole = {
  generatedAt: string;
  liveMode: Record<string, string | boolean>;
  featureFlags: Record<string, boolean>;
  dataQuality: {
    passed: boolean;
    findings: Array<{ code: string; severity: string; message: string; count: number }>;
  };
  outbox: { pending: number; processing?: number; failed?: number; deadLetter: number };
  readiness: Record<string, boolean>;
};

export async function fetchAdminSafetyConsole(
  client: AdminApiClient,
): Promise<AdminSafetyConsole> {
  return client.get<AdminSafetyConsole>("/api/admin/v1/safety/console");
}
