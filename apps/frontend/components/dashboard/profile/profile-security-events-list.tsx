"use client";

import Link from "next/link";
import { ChevronRight } from "@/lib/lucide";

import { ROUTES } from "@/constants/routes";
import { useI18n } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/i18n/formatters";
import {
  parseUserAgentShort,
  securityEventLabel,
} from "@/lib/profile/security-labels";
import type { SecurityEventItem } from "@/services/user-me.service";

export function ProfileSecurityEventsList({
  events,
}: {
  events: SecurityEventItem[];
  timeZone?: string | null;
}) {
  const { locale, t } = useI18n();

  if (events.length === 0) {
    return (
      <p className="mt-3 text-sm text-neutral-500">{t("profile.security.events.empty")}</p>
    );
  }

  return (
    <>
      <ul className="mt-4 divide-y divide-neutral-100">
        {events.slice(0, 5).map((ev) => (
          <li key={ev.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900">
                {securityEventLabel(ev.action, locale)}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {formatDate(new Date(ev.createdAt), locale, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {ev.ip ? ` · ${ev.ip}` : ""}
              </p>
              {ev.userAgent ? (
                <p className="mt-0.5 truncate text-xs text-neutral-400">
                  {parseUserAgentShort(ev.userAgent, locale)}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <Link
        href={ROUTES.dashboardActivity}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 hover:text-neutral-950"
      >
        {t("profile.security.events.viewHistory")}
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </>
  );
}
