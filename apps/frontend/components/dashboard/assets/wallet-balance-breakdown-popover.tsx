"use client";

import { MoreHorizontal } from "@/lib/lucide";

import { assetsPanelClass } from "@/components/dashboard/assets/assets-ui";
import { useI18n } from "@/components/providers/i18n-provider";
import { formatUsdtAmount } from "@/lib/i18n/formatters";
import { emptyAmountLabel } from "@/lib/analytics/display-value";
import { cn } from "@/lib/utils";
import type { WalletSummary } from "@/services/wallet.service";

function parseMoney(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

function formatWalletMetric(
  raw: string | undefined | null,
  locale: Parameters<typeof formatUsdtAmount>[1],
  hidden: boolean,
): string {
  if (hidden) return "••••";
  const n = parseMoney(raw);
  if (n == null) return emptyAmountLabel(locale);
  return formatUsdtAmount(n, locale);
}

export function WalletBalanceBreakdownPopover({
  walletSummary,
  hidden = false,
  className,
}: {
  walletSummary?: WalletSummary | null;
  hidden?: boolean;
  className?: string;
}) {
  const { t, locale } = useI18n();

  const cards = [
    {
      label: t("assets.overview.walletAvailable"),
      value: formatWalletMetric(walletSummary?.availableBalance, locale, hidden),
    },
    {
      label: t("assets.overview.walletLocked"),
      value: formatWalletMetric(walletSummary?.lockedBalance, locale, hidden),
    },
    {
      label: t("assets.overview.walletEarned"),
      value: formatWalletMetric(walletSummary?.earnedTotal, locale, hidden),
    },
    {
      label: t("assets.overview.walletWithdrawn"),
      value: formatWalletMetric(walletSummary?.withdrawnTotal, locale, hidden),
    },
  ];

  return (
    <details className={cn("relative shrink-0", className)}>
      <summary
        className="inline-flex size-8 cursor-pointer list-none items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 [&::-webkit-details-marker]:hidden"
        aria-label={t("assets.overview.walletBreakdownOpen")}
      >
        <MoreHorizontal className="size-4" strokeWidth={1.75} aria-hidden />
      </summary>
      <div className="absolute right-0 top-[calc(100%+0.35rem)] z-30 w-[min(calc(100vw-2rem),17.5rem)] rounded-2xl bg-white p-2">
        <div className="space-y-2">
          {cards.map((card) => (
            <article
              key={card.label}
              className={cn(assetsPanelClass, "px-4 py-3.5")}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                {card.label}
              </p>
              <p className="mt-2 font-mono text-xl font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-2xl">
                {card.value}
              </p>
            </article>
          ))}
        </div>
      </div>
    </details>
  );
}
