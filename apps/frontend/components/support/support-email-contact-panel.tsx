"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail, MessageSquarePlus } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { SUPPORT_HELPDESK_EMAIL } from "@/constants/support-center";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export type SupportEmailContactPanelProps = {
  className?: string;
};

/** Основной блок обращений — почта и тикет в кабинете, без чата. */
export function SupportEmailContactPanel({ className }: SupportEmailContactPanelProps) {
  const { t } = useI18n();

  return (
    <section
      id="support-contact"
      className={cn(
        "rounded-2xl bg-[#111111] p-6 sm:p-8",
        className,
      )}
      aria-labelledby="support-contact-title"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.06]">
              <Image src="/images/LOGO/mini-logo.png" alt="" width={20} height={20} className="size-5 object-contain" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {t("support.contact.label")}
            </p>
          </div>
          <h2
            id="support-contact-title"
            className="mt-4 text-xl font-semibold tracking-tight text-white sm:text-2xl"
          >
            {t("support.contact.title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">{t("support.contact.description")}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${SUPPORT_HELPDESK_EMAIL}?subject=${encodeURIComponent(t("support.contact.mailSubject"))}`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
            >
              <Mail className="size-4" aria-hidden />
              {t("support.contact.writeEmailShort")}
            </a>
            <Link
              href={ROUTES.dashboardSupport}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white/8 px-5 text-sm font-medium text-white transition hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
            >
              <MessageSquarePlus className="size-4" aria-hidden />
              {t("support.contact.createTicket")}
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-600">{t("support.contact.responseTime")}</p>
        </div>

        <Link
          href={ROUTES.systemStatus}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm text-zinc-400 transition hover:text-white lg:pt-1"
        >
          {t("support.status.pageLink")}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-6 rounded-xl bg-black/40 px-4 py-4 sm:px-5">
        <p className="text-sm leading-relaxed text-zinc-500">{t("support.contact.instructions")}</p>
      </div>
    </section>
  );
}
