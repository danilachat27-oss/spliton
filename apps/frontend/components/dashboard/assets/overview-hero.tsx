"use client";

import { ChevronDown, Eye, EyeOff } from "@/lib/lucide";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { WalletBalanceBreakdownPopover } from "@/components/dashboard/assets/wallet-balance-breakdown-popover";
import { assetsCardClass, assetsPrimaryButtonClass, assetsSecondaryButtonClass } from "@/components/dashboard/assets/assets-ui";
import { tf } from "@/lib/i18n/financial-messages";
import { formatNumber, formatUsdtAmount } from "@/lib/i18n/formatters";
import { cn } from "@/lib/utils";
import type { WalletSummary } from "@/services/wallet.service";

type OverviewHeroProps = {
  live?: boolean;
  totalValueUsdt?: number;
  totalValueUnavailable?: boolean;
  change30dPct?: string | null;
  walletSummary?: WalletSummary | null;
  walletLoading?: boolean;
};

function parseMoney(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

function computeCombinedTotal(portfolioUsdt: number | undefined, wallet: WalletSummary | null | undefined): number | undefined {
  const portfolio = portfolioUsdt ?? 0;
  const available = parseMoney(wallet?.availableBalance);
  const locked = parseMoney(wallet?.lockedBalance);
  const pending = parseMoney(wallet?.pendingBalance);
  const hasWallet = available != null && locked != null && pending != null;
  const walletTotal = hasWallet ? available + locked + pending : 0;

  if (portfolioUsdt == null && !hasWallet) return undefined;
  return portfolio + walletTotal;
}

export function OverviewHero({
  live = false,
  totalValueUsdt,
  totalValueUnavailable = false,
  change30dPct,
  walletSummary,
  walletLoading = false,
}: OverviewHeroProps) {
  const { t, locale } = useI18n();
  const [hidden, setHidden] = useState(false);

  const useMockDefaults = !live;
  const combinedTotal = useMemo(
    () => computeCombinedTotal(totalValueUsdt, walletSummary),
    [totalValueUsdt, walletSummary],
  );
  const resolvedTotal =
    combinedTotal != null ? combinedTotal : useMockDefaults ? 6520 : undefined;

  const pnlLine = change30dPct != null ? tf(t("overview.pnlTodayWithChange"), { pct: change30dPct }) : t("overview.pnlTodayZero");

  const primaryActions = [
    { href: "/assets/payouts/deposit", label: t("overview.deposit"), primary: true },
    { href: "/assets/payouts/withdraw", label: t("overview.withdraw"), primary: false },
    { href: ROUTES.dashboardSecondaryMarket, label: t("overview.transfer"), primary: false },
  ] as const;

  const secondaryActions = [{ href: ROUTES.dashboardCatalog, label: t("overview.openCatalog") }] as const;

  return (
    <section className={assetsCardClass} aria-label={t("overview.summaryAria")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="text-sm text-neutral-500">{t("overview.estimatedTotal")}</p>
          <button
            type="button"
            onClick={() => setHidden((v) => !v)}
            className="inline-flex size-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            aria-label={hidden ? t("overview.showBalance") : t("overview.hideBalance")}
          >
            {hidden ? <EyeOff className="size-4" strokeWidth={1.75} aria-hidden /> : <Eye className="size-4" strokeWidth={1.75} aria-hidden />}
          </button>
        </div>
        <WalletBalanceBreakdownPopover walletSummary={walletSummary} hidden={hidden} />
      </div>

      <div className="mt-2 flex flex-wrap items-end gap-2">
        {totalValueUnavailable || resolvedTotal == null || walletLoading ? (
          <p className="font-mono text-[2rem] font-semibold tabular-nums tracking-tight text-neutral-400 sm:text-[2.35rem]">
            {walletLoading ? "…" : t("assets.overview.insufficientData")}
          </p>
        ) : (
          <>
            <p className="font-mono text-[2.35rem] font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-[2.6rem]">
              {hidden ? "••••••" : formatNumber(Math.round(resolvedTotal * 100) / 100, locale)}
            </p>
            <button
              type="button"
              className="mb-1.5 inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100"
              aria-label="USDT"
            >
              USDT
              <ChevronDown className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </>
        )}
      </div>

      <p className={cn("mt-1 text-sm tabular-nums", change30dPct != null && !hidden ? "text-neutral-600" : "text-neutral-500")}>
        {hidden ? "••••" : pnlLine}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {primaryActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "inline-flex h-10 min-w-[5.5rem] flex-1 items-center justify-center rounded-full px-4 text-sm font-semibold transition active:scale-[0.98] sm:flex-none",
              action.primary ? assetsPrimaryButtonClass : assetsSecondaryButtonClass,
            )}
          >
            {action.label}
          </Link>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {secondaryActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="inline-flex h-9 items-center rounded-full bg-neutral-100 px-4 text-sm font-medium text-neutral-800 transition hover:bg-neutral-200/80"
          >
            {action.label}
          </Link>
        ))}
        {live && walletSummary?.availableBalance ? (
          <span className="inline-flex h-9 items-center rounded-full px-1 text-xs text-neutral-500">
            {t("assets.overview.walletAvailable")}:{" "}
            <span className="ml-1 font-mono font-semibold tabular-nums text-neutral-800">
              {hidden ? "••••" : formatUsdtAmount(parseMoney(walletSummary.availableBalance) ?? 0, locale)}
            </span>
          </span>
        ) : null}
      </div>
    </section>
  );
}
