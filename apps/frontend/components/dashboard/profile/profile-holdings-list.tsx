"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import type { UserHoldingItem } from "@/services/wallet.service";
import { cn } from "@/lib/utils";

type DemoRow = {
  name: string;
  sub: string;
  price: string;
  change: string;
  up: boolean;
};

export function ProfileHoldingsList({
  liveWallet,
  holdings,
  demoRows,
}: {
  liveWallet: boolean;
  holdings: UserHoldingItem[];
  demoRows: readonly DemoRow[];
}) {
  const { t } = useI18n();
  const showLive = liveWallet && holdings.length > 0;
  const showDemo = !liveWallet;

  if (!showLive && !showDemo) return null;

  return (
    <>
      <ul className="divide-y divide-neutral-100 md:hidden">
        {showLive
          ? holdings.map((row) => (
              <li key={row.releaseId} className="flex items-center justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-neutral-900">{row.trackTitle}</p>
                  <p className="mt-0.5 text-[12px] text-neutral-500">
                    {row.symbol} · {t("profile.holdings.revenueShare")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[14px] font-semibold tabular-nums text-neutral-900">{row.unitsTotal}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">
                    {t("profile.holdings.available").replace("{count}", String(row.unitsAvailable))}
                  </p>
                </div>
              </li>
            ))
          : demoRows.map((row) => (
              <li key={row.name} className="flex items-center justify-between gap-3 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-100" />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-neutral-900">{row.name}</p>
                    <p className="mt-0.5 text-[12px] text-neutral-500">
                      {row.sub} · {t("profile.holdings.demo")}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[14px] font-semibold tabular-nums text-neutral-800">{row.price}</p>
                  <p className={cn("mt-0.5 text-[12px] font-medium tabular-nums", row.up ? "text-blue-800" : "text-neutral-600")}>
                    {row.change}
                  </p>
                </div>
              </li>
            ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl bg-neutral-50/80 md:block">
        <table className="w-full min-w-[480px] table-auto text-left text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              <th className="px-3 py-3 pl-4 font-medium">{t("profile.holdings.release")}</th>
              <th className="px-3 py-3 font-medium">
                {liveWallet ? t("profile.holdings.units") : t("profile.holdings.price")}
              </th>
              <th className="px-3 py-3 pr-4 text-right font-medium">
                {liveWallet ? t("profile.holdings.availableHeader") : t("profile.holdings.change")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {showLive
              ? holdings.map((row, i) => (
                  <tr
                    key={row.releaseId}
                    className={cn(
                      "transition-colors hover:bg-neutral-50/90",
                      i !== holdings.length - 1 && "border-b border-neutral-100",
                    )}
                  >
                    <td className="px-3 py-3 pl-4">
                      <p className="font-medium text-neutral-900">{row.trackTitle}</p>
                      <p className="text-xs text-neutral-500">
                        {row.symbol} · {t("profile.holdings.revenueShare")}
                      </p>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-neutral-700">{row.unitsTotal}</td>
                    <td className="px-3 py-3 pr-4 text-right tabular-nums font-medium text-neutral-800">
                      {row.unitsAvailable}
                    </td>
                  </tr>
                ))
              : demoRows.map((row, i) => (
                  <tr
                    key={row.name}
                    className={cn(
                      "transition-colors hover:bg-neutral-50/90",
                      i !== demoRows.length - 1 && "border-b border-neutral-100",
                    )}
                  >
                    <td className="px-3 py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-100" />
                        <div>
                          <p className="font-medium text-neutral-900">{row.name}</p>
                          <p className="text-xs text-neutral-500">
                            {row.sub} · {t("profile.holdings.demo")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-neutral-700">{row.price}</td>
                    <td
                      className={cn(
                        "px-3 py-3 pr-4 text-right tabular-nums font-medium",
                        row.up ? "text-blue-800" : "text-neutral-600",
                      )}
                    >
                      {row.change}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ProfileHoldingsEmpty({ liveWallet }: { liveWallet: boolean }) {
  const { t } = useI18n();
  if (!liveWallet) return null;
  return (
    <p className="rounded-2xl bg-neutral-50/80 px-4 py-8 text-center text-sm text-neutral-500">
      {t("profile.holdings.emptyBefore")}{" "}
      <Link href={ROUTES.dashboardCatalog} className="font-medium text-neutral-800 underline">
        {t("profile.holdings.emptyCatalog")}
      </Link>
      .
    </p>
  );
}
