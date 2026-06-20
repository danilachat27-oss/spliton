import { cn } from "@/lib/utils";
import {
  adminCard,
  adminMetricLabel,
  adminMetricValue,
} from "@/features/admin/lib/admin-ui";

type AdminMetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  className?: string;
};

export function AdminMetricCard({
  label,
  value,
  hint,
  trend,
  className,
}: AdminMetricCardProps) {
  return (
    <div className={cn(adminCard("p-4"), className)}>
      <p className={adminMetricLabel}>{label}</p>
      <p className={cn(adminMetricValue, "mt-1 tabular-nums")}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
      {trend ? <p className="mt-2 text-xs font-medium text-emerald-400">{trend}</p> : null}
    </div>
  );
}