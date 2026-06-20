"use client";

import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "@/lib/lucide";

import type { PositionPreviewItem } from "@/components/dashboard/assets/assets-mock-data";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  ROUTES,
  assetsSellUnitsPath,
  catalogBuyUnitsPath,
  catalogMarketOverviewReleaseAnalyticsPath,
  catalogMarketOverviewReleaseTablePath,
} from "@/constants/routes";
import { formatNumber } from "@/lib/i18n/formatters";
import { cn } from "@/lib/utils";

const POSITION_STATUS_KEYS: Record<PositionPreviewItem["status"], string> = {
  Active: "positions.widgets.status.active",
  "Open round": "positions.widgets.status.openRound",
  Secondary: "positions.widgets.status.secondary",
  Closed: "positions.widgets.status.closed",
};

type PositionActionsModalProps = {
  row: PositionPreviewItem;
};

export function PositionActionsModal({ row }: PositionActionsModalProps) {
  const { t, locale } = useI18n();
  const hasCatalogId = Boolean(row.catalogReleaseId);
  const catalogId = row.catalogReleaseId ?? "";
  const ownedUnits = typeof row.heldUnits === "number" && Number.isFinite(row.heldUnits)
    ? row.heldUnits
    : Number(row.units.replace(/\s/g, ""));
  const availableUnits =
    typeof row.availableUnits === "number" && Number.isFinite(row.availableUnits)
      ? row.availableUnits
      : ownedUnits;
  const canSell = row.availableToSell !== false && availableUnits > 0;

  return (
    <Dialog.Root>
      <Dialog.Trigger className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-neutral-900 px-3 text-xs font-semibold text-white transition hover:bg-neutral-800">
        {t("positions.widgets.modalActions")}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-120 bg-black/60 backdrop-blur-[2px]",
            "transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
          )}
        />

        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-121 w-[min(100vw-1.5rem,420px)] -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl bg-white p-5 md:p-6",
            "transition-[opacity,transform] duration-200",
            "data-ending-style:scale-[0.98] data-ending-style:opacity-0",
            "data-starting-style:scale-[0.98] data-starting-style:opacity-0",
          )}
        >
          <Dialog.Close
            aria-label={t("positions.widgets.modalClose")}
            className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
          >
            <X className="size-4" />
          </Dialog.Close>

          <Dialog.Title className="text-[18px] font-semibold tracking-tight text-zinc-950">{t("positions.widgets.modalTitle")}</Dialog.Title>
          <Dialog.Description className="mt-1 text-[13px] text-zinc-600">
            {row.release} · {row.artist}
          </Dialog.Description>
          <p className="mt-3 rounded-xl bg-zinc-50 px-3 py-2 text-[12px] text-zinc-600">
            {t("positions.widgets.modalYourUnits")}{" "}
            <span className="font-mono font-semibold text-zinc-900">{formatNumber(ownedUnits, locale)}</span>
            {hasCatalogId ? (
              <>
                {" "}
                · {t("positions.widgets.modalReleaseId")}{" "}
                <span className="font-mono font-semibold text-zinc-900">{catalogId}</span>
              </>
            ) : null}
          </p>
          <p className="mt-2 text-[12px] text-zinc-500">
            {canSell
              ? t("positions.availableToSell").replace("{units}", formatNumber(availableUnits, locale))
              : t("positions.notAvailableToSell")}
          </p>
          <p className="sr-only">{t(POSITION_STATUS_KEYS[row.status])}</p>

          <div className="mt-5 space-y-2">
            {hasCatalogId ? (
              <>
                {canSell ? (
                  <Link
                    href={assetsSellUnitsPath(catalogId)}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-neutral-900 px-4 text-[13px] font-semibold text-white transition hover:bg-neutral-800"
                  >
                    {t("positions.widgets.sellUnt")}
                  </Link>
                ) : (
                  <span
                    className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-xl bg-neutral-200 px-4 text-[13px] font-semibold text-neutral-500"
                    title={t("positions.notAvailableToSell")}
                  >
                    {t("positions.widgets.sellUnt")}
                  </span>
                )}
                {row.canBuyMore !== false ? (
                  <Link
                    href={catalogBuyUnitsPath(catalogId)}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-neutral-100 px-4 text-[13px] font-semibold text-neutral-800 transition hover:bg-neutral-200/80"
                  >
                    {t("positions.widgets.modalBuyMore")}
                  </Link>
                ) : (
                  <span className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-neutral-100 px-4 text-[13px] font-semibold text-neutral-500">
                    {t("positions.roundClosed")}
                  </span>
                )}
                <Link
                  href={catalogMarketOverviewReleaseAnalyticsPath(catalogId)}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-neutral-100 px-4 text-[13px] font-semibold text-neutral-800 transition hover:bg-neutral-200/80"
                >
                  {t("positions.widgets.modalAnalytics")}
                </Link>
                <Link
                  href={catalogMarketOverviewReleaseTablePath(catalogId)}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-neutral-100 px-4 text-[13px] font-semibold text-neutral-800 transition hover:bg-neutral-200/80"
                >
                  {t("positions.widgets.modalOpenMarket")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={ROUTES.dashboardCatalog}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-neutral-900 px-4 text-[13px] font-semibold text-white transition hover:bg-neutral-800"
                >
                  {t("positions.openCatalog")}
                </Link>
                <Link
                  href={ROUTES.catalogReleaseParameters}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-neutral-100 px-4 text-[13px] font-semibold text-neutral-800 transition hover:bg-neutral-200/80"
                >
                  {t("positions.widgets.modalReleaseParams")}
                </Link>
              </>
            )}
          </div>

        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
