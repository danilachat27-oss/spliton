"use client";

import Link from "next/link";
import { ExternalLink, Mail, Shield } from "@/lib/lucide";
import { useEffect, useState } from "react";

import { SupportChatWidget } from "@/components/support/support-chat-widget";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  SUPPORT_HELPDESK_EMAIL,
  SUPPORT_SERVICE_STATUS_ROWS,
  type SupportServiceStatusKind,
} from "@/constants/support-center";
import type { ServiceHealthStatus } from "@/constants/system-status-mock";
import { ROUTES } from "@/constants/routes";
import { isLiveStatusEnabled } from "@/lib/public-env";
import { isLiveSupportContactMode } from "@/lib/support/support-contact-mode";
import { cn } from "@/lib/utils";
import { fetchSystemStatusPageData } from "@/services/system-status.service";

function statusLabel(s: SupportServiceStatusKind, t: (key: string) => string) {
  switch (s) {
    case "operational":
      return t("support.status.operational");
    case "delayed":
      return t("support.status.delayed");
    case "maintenance":
      return t("support.status.maintenance");
    default:
      return s;
  }
}

function statusPillClass(s: SupportServiceStatusKind) {
  switch (s) {
    case "operational":
      return "bg-neutral-100 text-neutral-800";
    case "delayed":
      return "bg-amber-50 text-amber-900";
    case "maintenance":
      return "bg-neutral-200/80 text-neutral-800";
    default:
      return "";
  }
}

function mapServiceHealthToSupportStatus(status: ServiceHealthStatus): SupportServiceStatusKind {
  switch (status) {
    case "maintenance":
      return "maintenance";
    case "delayed":
    case "degraded":
    case "incident":
      return "delayed";
    default:
      return "operational";
  }
}

const usefulLinkDefs = [
  { labelKey: "support.link.depositUsdt", href: `${ROUTES.dashboardPayouts}/deposit` },
  { labelKey: "support.link.withdraw", href: `${ROUTES.dashboardPayouts}/withdraw` },
  { labelKey: "support.link.payoutHistory", href: ROUTES.dashboardPayoutsHistory },
  { labelKey: "support.link.secondaryMarket", href: ROUTES.dashboardSecondaryMarket },
  { labelKey: "support.link.verification", href: `${ROUTES.dashboardProfile}?tab=verification` },
  { labelKey: "support.link.accountSecurity", href: `${ROUTES.dashboardProfile}?tab=security` },
] as const;

const cardSurface = "rounded-3xl bg-white px-5 py-5 shadow-[0_8px_30px_-14px_rgba(0,0,0,0.08)] ring-1 ring-neutral-200/70 sm:px-6 sm:py-5";

type StatusRow = {
  id: string;
  label: string;
  status: SupportServiceStatusKind;
  hint?: string;
};

/** Сетка и карточки в духе `/fees` и `/news`: белые панели, мягкие кольца. */
export function SupportCenterPage() {
  const { t } = useI18n();
  const liveContact = isLiveSupportContactMode();
  const liveStatus = isLiveStatusEnabled();
  const [statusRows, setStatusRows] = useState<StatusRow[]>(() =>
    liveStatus ? [] : [...SUPPORT_SERVICE_STATUS_ROWS],
  );
  const [statusLoading, setStatusLoading] = useState(liveStatus);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (!liveStatus) {
      setStatusRows([...SUPPORT_SERVICE_STATUS_ROWS]);
      setStatusLoading(false);
      setStatusError(null);
      return;
    }
    setStatusLoading(true);
    setStatusError(null);
    void fetchSystemStatusPageData()
      .then((data) => {
        setStatusRows(
          data.services.map((svc) => ({
            id: svc.id,
            label: svc.name,
            status: mapServiceHealthToSupportStatus(svc.status),
            hint: svc.note !== svc.statusLabel ? svc.note : undefined,
          })),
        );
      })
      .catch(() => {
        setStatusRows([]);
        setStatusError(t("support.status.error"));
      })
      .finally(() => setStatusLoading(false));
  }, [liveStatus]);

  const statCards: {
    label: string;
    value: string;
    mono?: boolean;
    tone?: string;
  }[] = liveContact
    ? [
        { label: t("support.stat.contactChannel"), value: t("support.stat.contactChannel.live") },
        { label: t("support.stat.avgResponse"), value: t("support.stat.avgResponse.live"), mono: true, tone: "text-neutral-800" },
        { label: t("support.stat.onlineChat"), value: t("support.stat.onlineChat.live"), tone: "text-neutral-600" },
      ]
    : [
        { label: t("support.stat.contactChannel"), value: t("support.stat.contactChannel.demo") },
        { label: t("support.stat.avgResponse"), value: t("support.stat.avgResponse.demo"), mono: true, tone: "text-blue-800" },
        { label: t("support.stat.lineStatus"), value: t("support.stat.lineStatus.demo"), tone: "text-neutral-700" },
      ];

  return (
    <div className="space-y-7 pb-4 sm:space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className={cn(cardSurface)}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{card.label}</p>
            <p
              className={cn(
                "mt-2 text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl",
                card.mono && "font-mono text-base sm:text-lg",
                card.tone,
              )}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">
        {liveContact ? t("support.intro.live") : t("support.intro.demo")}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-start lg:gap-8">
        <div className="min-w-0">
          <SupportChatWidget className="lg:min-h-[min(520px,calc(100dvh-14rem))]" />
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:max-w-[360px] lg:gap-5">
          <section className={cn(cardSurface)}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{t("support.sidebar.dashboard")}</p>
            <h2 className="mt-2 text-base font-semibold tracking-tight text-neutral-900">{t("support.sidebar.quickLinks.title")}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{t("support.sidebar.quickLinks.subtitle")}</p>
            <ul className="mt-4 space-y-2.5">
              {usefulLinkDefs.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between gap-2 rounded-xl py-1 text-xs font-medium text-neutral-800 transition hover:text-neutral-950"
                  >
                    <span>{t(item.labelKey)}</span>
                    <ExternalLink className="size-3 shrink-0 opacity-0 transition group-hover:opacity-70" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={ROUTES.guideSelection}
              className="mt-5 inline-flex h-10 items-center rounded-xl bg-neutral-900 px-4 text-xs font-semibold text-white transition hover:bg-neutral-800"
            >
              {t("support.link.dealGuides")}
            </Link>
          </section>

          <section className={cn(cardSurface)}>
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-600">
                <Shield className="size-4" aria-hidden />
              </span>
              <h2 className="text-base font-semibold tracking-tight text-neutral-900">{t("support.status.title")}</h2>
            </div>
            {statusLoading ? (
              <div className="mt-4 space-y-2" aria-busy="true" aria-label={t("support.status.loadingAria")}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-2xl bg-neutral-100" />
                ))}
              </div>
            ) : statusError ? (
              <p className="mt-4 rounded-2xl bg-amber-50 px-3.5 py-3 text-xs text-amber-900" role="alert">
                {statusError}
              </p>
            ) : statusRows.length === 0 ? (
              <p className="mt-4 text-xs text-neutral-500">{t("support.status.empty")}</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {statusRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-2 rounded-2xl bg-neutral-50/95 px-3.5 py-2.5 ring-1 ring-neutral-100"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-neutral-900">{row.label}</p>
                      {row.hint ? <p className="truncate text-[10px] text-neutral-500">{row.hint}</p> : null}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        statusPillClass(row.status),
                      )}
                    >
                      {statusLabel(row.status, t)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[10px] leading-relaxed text-neutral-500">
              {liveStatus ? (
                <>
                  {t("support.status.liveSource.before")}{" "}
                  <Link href={ROUTES.systemStatus} className="font-medium text-neutral-700 underline-offset-2 hover:underline">
                    {t("support.status.liveSource.link")}
                  </Link>
                  .
                </>
              ) : (
                t("support.status.demoNote")
              )}
            </p>
          </section>

          <section className={cn(cardSurface)}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{t("support.email.label")}</p>
            <h2 className="mt-2 text-base font-semibold tracking-tight text-neutral-900">{t("support.email.title")}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{t("support.email.subtitle")}</p>
            <a
              href={`mailto:${SUPPORT_HELPDESK_EMAIL}`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200/80 px-3 py-2 transition hover:bg-neutral-50 hover:text-neutral-950"
            >
              <Mail className="size-3.5 text-neutral-500" aria-hidden />
              {SUPPORT_HELPDESK_EMAIL}
            </a>
            <p className="mt-3 text-[11px] text-neutral-500">{t("support.email.responseTime")}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
