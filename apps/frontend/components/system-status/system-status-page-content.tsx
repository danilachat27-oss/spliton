"use client";

import * as React from "react";
import { ArrowRight, LifeBuoy, Search } from "@/lib/lucide";
import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { buttonVariants } from "@/components/ui/button";
import {
  StatusPill,
  UptimeBars,
  getIncidentStateTone,
  getServiceStatusTone,
  getUptimeBars,
} from "@/components/system-status/system-status-indicators";
import { SystemStatusOverallHero } from "@/components/system-status/system-status-overall-hero";
import {
  type IncidentRow,
  type ServiceStatusRow,
  type SystemStatusPageData,
} from "@/constants/system-status-mock";
import { isLiveStatusEnabled } from "@/lib/public-env";
import { ProductDemoBanner } from "@/components/shared/product-demo-banner";
import { fetchSystemStatusPageData } from "@/services/system-status.service";
import { ROUTES } from "@/constants/routes";
import { tf } from "@/lib/i18n/financial-messages";
import { getLegendItems, systemStatusLabel } from "@/lib/i18n/system-status-messages";
import { cn } from "@/lib/utils";

function ServiceTableRow({
  service,
  maintenanceLabel,
  locale,
}: {
  service: ServiceStatusRow;
  maintenanceLabel: string | null;
  locale: ReturnType<typeof useI18n>["locale"];
}) {
  const tone = getServiceStatusTone(service.status);
  const uptime = getUptimeBars(service.id, service.status);
  const isOk = service.status === "operational";

  return (
    <tr className="border-b border-white/[0.06] last:border-b-0">
      <td className="py-4 pr-4 align-top sm:py-5">
        <div className="flex gap-3">
          <span
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-zinc-600"
            aria-hidden
          >
            <span className="size-3.5 rounded-full border border-zinc-600" />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-white">{service.name}</p>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-zinc-500">{service.note}</p>
          </div>
        </div>
      </td>
      <td className="py-4 pr-4 align-middle sm:py-5">
        <StatusPill tone={tone} ok={isOk}>
          {systemStatusLabel("service", service.status, locale)}
        </StatusPill>
      </td>
      <td className="py-4 pr-4 align-middle sm:py-5">
        <UptimeBars bars={uptime} />
      </td>
      <td className="py-4 align-middle text-sm text-zinc-500 sm:py-5">
        {maintenanceLabel ?? "—"}
      </td>
    </tr>
  );
}

function IncidentRowItem({
  incident,
  locale,
}: {
  incident: IncidentRow;
  locale: ReturnType<typeof useI18n>["locale"];
}) {
  const tone = getIncidentStateTone(incident.state);
  const isOk = incident.state === "resolved";

  return (
    <tr className="border-b border-white/[0.06] last:border-b-0">
      <td className="py-4 pr-4 align-top sm:py-5">
        <p className="font-medium text-white">{incident.service}</p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">{incident.summary}</p>
      </td>
      <td className="py-4 pr-4 align-middle sm:py-5">
        <StatusPill tone={tone} ok={isOk}>
          {systemStatusLabel("incident", incident.state, locale)}
        </StatusPill>
      </td>
      <td className="py-4 pr-4 align-middle sm:py-5">
        <span className="font-mono text-xs text-zinc-500">{incident.date}</span>
      </td>
    </tr>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="h-64 animate-pulse bg-zinc-900/40" />
      <div className="space-y-0 divide-y divide-white/[0.06]">
        {Array.from({ length: 20 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse bg-transparent" />
        ))}
      </div>
    </div>
  );
}

const LIVE_REFRESH_MS = 30_000;

export function SystemStatusPageContent() {
  const { t, locale } = useI18n();
  const [data, setData] = React.useState<SystemStatusPageData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const live = isLiveStatusEnabled();

  const legendItems = React.useMemo(() => getLegendItems(locale), [locale]);

  const load = React.useCallback((options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(false);
    return fetchSystemStatusPageData()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => {
        if (!options?.silent) {
          setLoading(false);
        }
      });
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!live) return undefined;
    const timer = window.setInterval(() => {
      void load({ silent: true });
    }, LIVE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [live, load]);

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="space-y-4 px-6 py-10 text-center">
        <p className="text-sm text-red-200">
          {live ? t("systemStatus.error.live") : t("systemStatus.error.demo")}
        </p>
        <button
          type="button"
          className="text-sm font-medium text-zinc-300 underline-offset-2 hover:underline"
          onClick={() => void load()}
        >
          {t("systemStatus.retry")}
        </button>
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const filteredServices = data.services.filter((service) => {
    if (!query) return true;
    const statusText = systemStatusLabel("service", service.status, locale).toLowerCase();
    return (
      service.name.toLowerCase().includes(query) ||
      service.note.toLowerCase().includes(query) ||
      statusText.includes(query)
    );
  });

  const maintenanceByService = new Map<string, string>();
  if (data.maintenance) {
    for (const name of data.maintenance.affectedServices) {
      maintenanceByService.set(name, data.maintenance.windowLabel);
    }
  }

  return (
    <div className="space-y-10 sm:space-y-12">
      {!live ? (
        <ProductDemoBanner
          messageKey="systemStatus.demoBanner"
          className="bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-zinc-300"
        />
      ) : null}

      <SystemStatusOverallHero
        tone={data.overall.tone}
        headline={data.overall.headline}
        subline={data.overall.subline}
        explanation={data.overall.explanation}
        lastUpdatedLabel={data.overall.lastUpdatedLabel}
        flyLabels={data.services.map((service) => service.name)}
      />

      <section aria-labelledby="services-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="services-title" className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {t("systemStatus.services.title")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {live
                ? tf(t("systemStatus.services.liveMeta"), { count: String(data.services.length) })
                : t("systemStatus.services.demoMeta")}
            </p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("systemStatus.services.searchPlaceholder")}
              className="h-10 w-full rounded-lg bg-zinc-900/50 pl-9 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:bg-zinc-900/70"
            />
          </label>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-left text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                <th className="pb-3 pr-4 font-medium">{t("systemStatus.services.col.service")}</th>
                <th className="pb-3 pr-4 font-medium">{t("systemStatus.services.col.status")}</th>
                <th className="pb-3 pr-4 font-medium">{t("systemStatus.services.col.uptime")}</th>
                <th className="pb-3 font-medium">{t("systemStatus.services.col.maintenance")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-zinc-500">
                    {tf(t("systemStatus.services.emptySearch"), { query: search.trim() })}
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <ServiceTableRow
                    key={service.id}
                    service={service}
                    locale={locale}
                    maintenanceLabel={
                      service.status === "maintenance"
                        ? (maintenanceByService.get(service.name) ?? t("systemStatus.services.maintenanceScheduled"))
                        : (maintenanceByService.get(service.name) ?? null)
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="maintenance-title">
        <h2 id="maintenance-title" className="text-lg font-semibold tracking-tight text-white">
          {t("systemStatus.maintenance.title")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">{t("systemStatus.maintenance.subtitle")}</p>
        {data.maintenance ? (
          <div className="mt-4 border-b border-white/[0.06] pb-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
              <StatusPill tone={getServiceStatusTone("maintenance")} ok={false} className="shrink-0">
                {t("systemStatus.maintenance.badge")}
              </StatusPill>
              <h3 className="text-base font-medium text-white">{data.maintenance.title}</h3>
            </div>
            <p className="mt-2 font-mono text-sm text-zinc-400">{data.maintenance.windowLabel}</p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-500">{data.maintenance.impactNote}</p>
            <p className="mt-4 text-xs text-zinc-600">
              {tf(t("systemStatus.maintenance.affected"), {
                services: data.maintenance.affectedServices.join(" · "),
              })}
            </p>
          </div>
        ) : (
          <p className="mt-4 border-b border-white/[0.06] pb-6 text-sm text-zinc-500">
            {t("systemStatus.maintenance.none")}
          </p>
        )}
      </section>

      <section aria-labelledby="incidents-title">
        <h2 id="incidents-title" className="text-lg font-semibold tracking-tight text-white">
          {t("systemStatus.incidents.title")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">{t("systemStatus.incidents.subtitle")}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-left text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                <th className="pb-3 pr-4 font-medium">{t("systemStatus.incidents.col.event")}</th>
                <th className="pb-3 pr-4 font-medium">{t("systemStatus.incidents.col.status")}</th>
                <th className="pb-3 font-medium">{t("systemStatus.incidents.col.date")}</th>
              </tr>
            </thead>
            <tbody>
              {data.incidents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-sm text-zinc-500">
                    {live ? t("systemStatus.incidents.emptyLive") : t("systemStatus.incidents.emptyDemo")}
                  </td>
                </tr>
              ) : (
                data.incidents.map((incident) => (
                  <IncidentRowItem key={incident.id} incident={incident} locale={locale} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="legend-title">
        <h2 id="legend-title" className="text-sm font-semibold text-white">
          {t("systemStatus.legend.title")}
        </h2>
        <ul className="mt-4 divide-y divide-white/[0.06]">
          {legendItems.map((item) => {
            const tone = getServiceStatusTone(item.status);
            return (
              <li key={item.status} className="flex gap-3 py-3 text-sm leading-relaxed text-zinc-500 first:pt-0">
                <StatusPill tone={tone} ok={item.status === "operational"} className="shrink-0">
                  {item.title}
                </StatusPill>
                <span className="min-w-0 pt-0.5">{item.description}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-t border-white/[0.06] pt-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center text-zinc-400">
              <LifeBuoy className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">{t("systemStatus.help.title")}</h2>
              <p className="mt-1 max-w-xl text-sm text-zinc-500">{t("systemStatus.help.body")}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              href={ROUTES.support}
              className={cn(
                buttonVariants({ size: "lg" }),
                "inline-flex h-10 border-0 bg-white px-6 text-sm font-semibold text-neutral-950 hover:bg-zinc-200",
              )}
            >
              {t("systemStatus.help.cta")}
              <ArrowRight className="ml-1.5 size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
