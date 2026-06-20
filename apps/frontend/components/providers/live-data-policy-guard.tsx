"use client";

import { useEffect } from "react";

import {
  enforceAdminLivePolicyAtRuntime,
  enforceFinancialLivePolicyAtRuntime,
} from "@/lib/live-data-policy";

export function LiveDataPolicyGuard() {
  useEffect(() => {
    enforceFinancialLivePolicyAtRuntime("app");
    enforceAdminLivePolicyAtRuntime("admin");
  }, []);
  return null;
}
