import { cn } from "@/lib/utils";

export type RiskLevel = "low" | "medium" | "high" | "critical";

const STYLES: Record<RiskLevel, string> = {
  low: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
  medium: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
  high: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/25",
  critical: "bg-red-500/15 text-red-300 ring-1 ring-red-500/25",
};

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

type AdminRiskBadgeProps = {
  score: number;
  className?: string;
};

export function AdminRiskBadge({ score, className }: AdminRiskBadgeProps) {
  const level = riskLevelFromScore(score);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
        STYLES[level],
        className,
      )}
    >
      Risk {score} · {level}
    </span>
  );
}
