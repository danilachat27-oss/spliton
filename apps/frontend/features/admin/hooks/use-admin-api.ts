"use client";

import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { AdminApiClient } from "@/features/admin/api/admin-api-client";

export function useAdminApi(): AdminApiClient {
  const { authorizedFetch } = useAuth();
  return React.useMemo(() => new AdminApiClient(authorizedFetch), [authorizedFetch]);
}
