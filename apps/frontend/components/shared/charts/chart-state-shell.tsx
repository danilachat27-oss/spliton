"use client";



import type { ReactNode } from "react";



import { useI18n } from "@/components/providers/i18n-provider";

import { formatDateTime } from "@/lib/i18n/formatters";

import { tf } from "@/lib/i18n/widget-messages";

import { cn } from "@/lib/utils";



export function ChartStateShell({

  title,

  description,

  loading,

  error,

  empty,

  emptyMessage,

  lastUpdated,

  dataSourceLabel,

  periodSelector,

  children,

  className,

}: {

  title: string;

  description?: string;

  loading?: boolean;

  error?: string | null;

  empty?: boolean;

  emptyMessage?: string;

  lastUpdated?: string;

  dataSourceLabel?: string;

  periodSelector?: ReactNode;

  children?: ReactNode;

  className?: string;

}) {

  const { t, locale } = useI18n();

  const resolvedEmptyMessage = emptyMessage ?? t("charts.emptyInsufficientData");



  return (

    <section className={cn("space-y-4", className)} aria-label={title}>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

        <div className="min-w-0 space-y-1">

          <h3 className="text-lg font-semibold tracking-tight text-inherit">{title}</h3>

          {description ? <p className="text-sm opacity-70">{description}</p> : null}

          {dataSourceLabel ? (

            <p className="text-[10px] uppercase tracking-wide opacity-50">{dataSourceLabel}</p>

          ) : null}

        </div>

        {periodSelector}

      </div>

      {loading ? (

        <div className="animate-pulse rounded-2xl bg-neutral-100/10 py-16 ring-1 ring-neutral-200/20" />

      ) : error ? (

        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">

          {error}

        </p>

      ) : empty ? (

        <p className="rounded-xl bg-neutral-50/90 px-4 py-8 text-center text-sm text-neutral-500 ring-1 ring-neutral-100">

          {resolvedEmptyMessage}

        </p>

      ) : (

        children

      )}

      {lastUpdated && !loading && !error ? (

        <p className="text-[10px] opacity-50">

          {tf(t("charts.updatedAt"), {

            date: formatDateTime(lastUpdated, locale),

          })}

        </p>

      ) : null}

    </section>

  );

}


