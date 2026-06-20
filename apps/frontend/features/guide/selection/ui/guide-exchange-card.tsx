"use client";

import type { LucideIcon } from "@/lib/lucide";
import { ArrowRight, ClipboardList, History, Layers, LayoutGrid, ShieldAlert, SlidersHorizontal } from "@/lib/lucide";
import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import type { GuideTopicIconId } from "@/constants/guide/selection";
import { cn } from "@/lib/utils";

const TOPIC_ICONS: Record<GuideTopicIconId, LucideIcon> = {
  checklist: ClipboardList,
  release: LayoutGrid,
  factors: SlidersHorizontal,
  deal: Layers,
  payouts: History,
  risks: ShieldAlert,
};

export function GuideExchangeCard({
  href,
  icon,
  title,
  description,
  className,
}: {
  href: string;
  icon: GuideTopicIconId;
  title: string;
  description: string;
  className?: string;
}) {
  const { t } = useI18n();
  const Icon = TOPIC_ICONS[icon];

  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-[168px] flex-col overflow-hidden rounded-2xl bg-[#121212] p-3 transition-colors duration-200 hover:bg-[#161616] sm:min-h-[180px] md:min-h-[200px] md:p-4",
        className,
      )}
    >
      <div className="flex w-full items-center justify-center overflow-hidden rounded-xl bg-[#0a0a0a]">
        <div className="flex aspect-[4/3] w-full max-h-[100px] items-center justify-center sm:max-h-[120px] md:max-h-[140px]">
          <Icon
            className="size-[clamp(2.5rem,9vw,3.75rem)] text-white transition-transform duration-200 ease-out group-hover:scale-[1.03]"
            strokeWidth={1.35}
            aria-hidden
          />
        </div>
      </div>

      <h3 className="mt-2.5 text-[13px] font-semibold leading-snug tracking-tight text-white sm:mt-3 sm:text-sm md:text-base">{title}</h3>
      <p className="mt-1.5 flex-1 text-[11px] leading-relaxed text-zinc-400 sm:text-[12px] md:text-[13px]">{description}</p>
      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors group-hover:text-white md:text-sm">
        <span>{t("guide.exchange.readMore")}</span>
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </div>
    </Link>
  );
}
