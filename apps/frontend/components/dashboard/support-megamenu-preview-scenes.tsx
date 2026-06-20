"use client";

import "./support-megamenu-preview.css";

import { Activity, MessageSquarePlus, Search, Shield } from "@/lib/lucide";

import { BlockCursor } from "@/components/dashboard/megamenu-preview-blocks";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";

function SupportCursor({ step, hint, className }: { step: string; hint: string; className?: string }) {
  return <BlockCursor step={step} hint={hint} className={className} />;
}

export function SupportHubScene() {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="shrink-0">
        <p className="text-[4.5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {t("support.hero.eyebrow")}
        </p>
        <h1 className="mt-0.5 text-[7px] font-semibold leading-none tracking-tight text-neutral-900">
          {t("support.hero.title")}
        </h1>
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        <div className="preview-sup-search preview-megamenu-target relative overflow-visible rounded-md bg-neutral-100 px-1 py-0.5">
          <div className="flex items-center gap-0.5">
            <Search className="size-2 text-neutral-400" strokeWidth={2} aria-hidden />
            <span className="text-[4.5px] text-neutral-500">{t("support.hero.searchPlaceholder")}</span>
          </div>
          <SupportCursor
            step="sup-hub-search"
            hint={t("preview.megamenu.support.cursorSearch")}
            className="absolute left-[12%] top-[58%]"
          />
        </div>

        <div className="mt-1 space-y-0.5">
          {[
            t("support.categories.getting-started.title"),
            t("support.categories.payouts.title"),
          ].map((label) => (
            <div key={label} className="rounded-md bg-neutral-50 px-1 py-0.5 ring-1 ring-neutral-200/50">
              <p className="truncate text-[5px] font-semibold text-neutral-900">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function SupportTicketScene() {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="shrink-0">
        <p className="text-[4.5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Ticket</p>
        <h1 className="mt-0.5 text-[7px] font-semibold leading-none tracking-tight text-neutral-900">
          {t("support.quick.openTicket.title")}
        </h1>
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        <p className="text-[5px] font-semibold text-neutral-900">{t("support.tickets.subjectPlaceholder")}</p>
        <div className="mt-0.5 rounded-md bg-neutral-50 px-1 py-0.5 text-[4px] text-neutral-500">
          {t("support.tickets.messagePlaceholder")}
        </div>
        <div className="relative mt-1.5 overflow-visible">
          <span className="preview-sup-ticket preview-megamenu-target relative inline-flex overflow-visible">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-neutral-900 px-1.5 py-0.5 text-[5px] font-semibold text-white">
              <MessageSquarePlus className="size-2" strokeWidth={2} aria-hidden />
              {t("support.tickets.submit")}
            </span>
            <SupportCursor
              step="sup-ticket-send"
              hint={t("preview.megamenu.support.cursorTicket")}
              className="absolute left-[42%] top-[78%]"
            />
          </span>
        </div>
      </section>
    </div>
  );
}

export function SupportStatusScene() {
  const { t } = useI18n();
  const rows = [
    t("support.status.operational"),
    t("support.status.operational"),
    t("support.status.delayed"),
  ];

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="shrink-0">
        <p className="text-[4.5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Status</p>
        <h1 className="mt-0.5 text-[7px] font-semibold leading-none tracking-tight text-neutral-900">
          {t("support.quick.systemStatus.title")}
        </h1>
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        <div className="preview-sup-status preview-megamenu-target relative space-y-0.5 overflow-visible">
          {rows.map((label, index) => (
            <div key={`${label}-${index}`} className="flex items-center justify-between gap-1 rounded-md bg-neutral-50 px-1 py-0.5">
              <div className="flex min-w-0 items-center gap-0.5">
                <Activity className="size-2 shrink-0 text-neutral-400" strokeWidth={2} aria-hidden />
                <span className="truncate text-[4.5px] font-medium text-neutral-800">API · {index + 1}</span>
              </div>
              <span className="shrink-0 rounded-full bg-[#B7F500]/15 px-1 py-px text-[3.5px] font-semibold text-[#84cc16]">
                {label}
              </span>
            </div>
          ))}
          <SupportCursor
            step="sup-status-row"
            hint={t("preview.megamenu.support.cursorStatus")}
            className="absolute left-[8%] top-[52%]"
          />
        </div>
      </section>
    </div>
  );
}

export function SupportSecurityScene() {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="shrink-0">
        <p className="text-[4.5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {t("navigation.profile.security.label")}
        </p>
        <h1 className="mt-0.5 text-[7px] font-semibold leading-none tracking-tight text-neutral-900">
          {t("support.quick.security.title")}
        </h1>
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        <div className="preview-sup-security preview-megamenu-target relative overflow-visible rounded-lg bg-neutral-50 px-1 py-1">
          <div className="flex items-center justify-between gap-1">
            <div className="flex min-w-0 items-center gap-0.5">
              <Shield className="size-2 shrink-0 text-neutral-500" strokeWidth={2} aria-hidden />
              <p className="text-[5px] font-semibold text-neutral-900">{t("profile.security.twoFa.title")}</p>
            </div>
            <span className="shrink-0 rounded-full bg-neutral-200 px-1 py-px text-[3.5px] font-semibold text-neutral-600">
              OFF
            </span>
          </div>
          <SupportCursor
            step="sup-security-twofa"
            hint={t("preview.megamenu.support.cursorSecurity")}
            className="absolute left-[10%] top-[62%]"
          />
        </div>
      </section>
    </div>
  );
}

export const SUPPORT_MEGAMENU_PREVIEW_HREFS = [
  ROUTES.support,
  ROUTES.dashboardSupport,
  ROUTES.systemStatus,
  `${ROUTES.dashboardProfile}?tab=security`,
] as const;
