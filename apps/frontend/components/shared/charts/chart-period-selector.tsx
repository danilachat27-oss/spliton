"use client";



import { useI18n } from "@/components/providers/i18n-provider";

import { CHART_PERIOD_OPTIONS, type ChartPeriodId } from "@/lib/analytics/chart-period";

import { cn } from "@/lib/utils";



export function ChartPeriodSelector({

  value,

  onChange,

  className,

  size = "sm",

}: {

  value: ChartPeriodId;

  onChange: (period: ChartPeriodId) => void;

  className?: string;

  size?: "sm" | "md";

}) {

  const { t } = useI18n();



  return (

    <div

      className={cn("flex flex-wrap rounded-xl bg-neutral-100 p-1", className)}

      role="tablist"

      aria-label={t("charts.periodAria")}

    >

      {CHART_PERIOD_OPTIONS.map((p) => (

        <button

          key={p.id}

          type="button"

          role="tab"

          aria-selected={value === p.id}

          onClick={() => onChange(p.id)}

          className={cn(

            "rounded-lg font-semibold transition-colors",

            size === "sm" ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-2 text-[11px]",

            value === p.id

              ? "bg-white text-neutral-900 ring-1 ring-neutral-200/80"

              : "text-neutral-500 hover:text-neutral-800",

          )}

        >

          {t(`charts.period.${p.id}`)}

        </button>

      ))}

    </div>

  );

}


