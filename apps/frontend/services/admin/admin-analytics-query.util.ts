import type { AnalyticsQuery } from "@/features/admin/analytics/types";

export function buildAnalyticsQueryString(query?: AnalyticsQuery): string {
  if (!query) return "";
  const params = new URLSearchParams();
  if (query.period) params.set("period", query.period);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  if (query.granularity) params.set("granularity", query.granularity);
  if (query.status) params.set("status", query.status);
  if (query.trackId) params.set("trackId", query.trackId);
  if (query.source) params.set("source", query.source);
  if (query.segment) params.set("segment", query.segment);
  if (query.role) params.set("role", query.role);
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.hasDeposit) params.set("hasDeposit", query.hasDeposit);
  if (query.hasRisk) params.set("hasRisk", query.hasRisk);
  if (query.managerId) params.set("managerId", query.managerId);
  const s = params.toString();
  return s ? `?${s}` : "";
}
