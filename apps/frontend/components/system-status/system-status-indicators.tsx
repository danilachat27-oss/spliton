import { Check, Minus } from "@/lib/lucide";
import type { ReactNode } from "react";

import type { IncidentRow, ServiceHealthStatus } from "@/constants/system-status-mock";
import { cn } from "@/lib/utils";

export type StatusTone = {
  dotBgClass: string;
  iconClass: string;
  textClass: string;
  barClass: string;
};

export const SERVICE_STATUS_TONE: Record<ServiceHealthStatus, StatusTone> = {
  operational: {
    dotBgClass: "bg-emerald-500/15",
    iconClass: "text-emerald-400",
    textClass: "text-emerald-400",
    barClass: "bg-emerald-500",
  },
  degraded: {
    dotBgClass: "bg-amber-500/15",
    iconClass: "text-amber-400",
    textClass: "text-amber-400",
    barClass: "bg-amber-400",
  },
  delayed: {
    dotBgClass: "bg-orange-500/15",
    iconClass: "text-orange-400",
    textClass: "text-orange-400",
    barClass: "bg-orange-400",
  },
  maintenance: {
    dotBgClass: "bg-sky-500/15",
    iconClass: "text-sky-400",
    textClass: "text-sky-400",
    barClass: "bg-sky-400",
  },
  incident: {
    dotBgClass: "bg-rose-500/15",
    iconClass: "text-rose-400",
    textClass: "text-rose-400",
    barClass: "bg-rose-400",
  },
};

export const INCIDENT_STATE_TONE: Record<IncidentRow["state"], StatusTone> = {
  resolved: {
    dotBgClass: "bg-emerald-500/15",
    iconClass: "text-emerald-400",
    textClass: "text-emerald-400",
    barClass: "bg-emerald-500",
  },
  monitoring: {
    dotBgClass: "bg-amber-500/15",
    iconClass: "text-amber-400",
    textClass: "text-amber-400",
    barClass: "bg-amber-400",
  },
  investigating: {
    dotBgClass: "bg-rose-500/15",
    iconClass: "text-rose-400",
    textClass: "text-rose-400",
    barClass: "bg-rose-400",
  },
};

export function getServiceStatusTone(status: ServiceHealthStatus): StatusTone {
  return SERVICE_STATUS_TONE[status];
}

export function getIncidentStateTone(state: IncidentRow["state"]): StatusTone {
  return INCIDENT_STATE_TONE[state];
}

const UPTIME_BAR_COUNT = 10;

export function getUptimeBars(serviceId: string, status: ServiceHealthStatus): ServiceHealthStatus[] {
  const offset = serviceId.charCodeAt(0) % 2;

  if (status === "operational") {
    return Array.from({ length: UPTIME_BAR_COUNT }, () => "operational");
  }

  if (status === "maintenance") {
    return Array.from({ length: UPTIME_BAR_COUNT }, () => "maintenance");
  }

  return Array.from({ length: UPTIME_BAR_COUNT }, (_, index) => {
    const tailStart =
      status === "incident" ? UPTIME_BAR_COUNT - 4 - offset : status === "delayed" ? UPTIME_BAR_COUNT - 3 : UPTIME_BAR_COUNT - 2 - offset;
    return index >= tailStart ? status : "operational";
  });
}

type StatusDotProps = {
  tone: StatusTone;
  ok?: boolean;
  className?: string;
};

export function StatusDot({ tone, ok = true, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-flex size-[18px] shrink-0 items-center justify-center rounded-full",
        tone.dotBgClass,
        className,
      )}
      aria-hidden
    >
      {ok ? (
        <Check className={cn("size-3", tone.iconClass)} strokeWidth={2.5} />
      ) : (
        <Minus className={cn("size-3", tone.iconClass)} strokeWidth={2.5} />
      )}
    </span>
  );
}

type StatusLabelProps = {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
};

export function StatusLabel({ tone, children, className }: StatusLabelProps) {
  return (
    <span className={cn("text-sm font-medium", tone.textClass, className)}>
      {children}
    </span>
  );
}

type StatusPillProps = {
  tone: StatusTone;
  children: ReactNode;
  ok?: boolean;
  className?: string;
};

export function StatusPill({ tone, children, ok = true, className }: StatusPillProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <StatusDot tone={tone} ok={ok} />
      <StatusLabel tone={tone}>{children}</StatusLabel>
    </span>
  );
}

type UptimeBarsProps = {
  bars: ServiceHealthStatus[];
  className?: string;
};

export function UptimeBars({ bars, className }: UptimeBarsProps) {
  return (
    <div className={cn("flex items-end gap-[3px]", className)} aria-hidden>
      {bars.map((level, index) => (
        <span
          key={index}
          className={cn("h-5 w-[5px] rounded-[2px] sm:h-6 sm:w-1.5", SERVICE_STATUS_TONE[level].barClass)}
        />
      ))}
    </div>
  );
}
