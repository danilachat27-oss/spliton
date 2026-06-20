import { AdminMetricCard } from "./admin-metric-card";

type AdminStatCardProps = {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  className?: string;
};

/** @deprecated prefer AdminMetricCard */
export function AdminStatCard(props: AdminStatCardProps) {
  return <AdminMetricCard {...props} />;
}
