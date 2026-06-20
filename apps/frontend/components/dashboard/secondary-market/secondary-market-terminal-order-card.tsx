"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";

function formatUsdt(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

type TerminalOrderCardProps = {
  side: "buy" | "sell";
  mode: "limit" | "market";
  price: number;
  units: number;
  filled: number;
  statusLabel: string;
  createdAt: string;
  canCancel: boolean;
  onCancel: () => void;
};

export function SecondaryMarketTerminalOrderCard({
  side,
  mode,
  price,
  units,
  filled,
  statusLabel,
  createdAt,
  canCancel,
  onCancel,
}: TerminalOrderCardProps) {
  const { t } = useI18n();
  const remain = Math.max(0, units - filled);
  const createdShort = new Date(createdAt).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="border-b border-white/6 py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={cn("text-[13px] font-semibold", side === "buy" ? "text-[#B7F500]" : "text-fuchsia-300")}>
            {t(`secondaryMarket.side.${side}`)} · {t(`secondaryMarket.forms.${mode}`)}
          </p>
          <p className="mt-0.5 font-mono text-[12px] tabular-nums text-zinc-400">
            {formatUsdt(price)} USDT · {filled}/{units} UNT
          </p>
        </div>
        <span className="rounded-full bg-[#161616] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
          {statusLabel}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] text-zinc-600">
          {tf(t("secondaryMarket.terminal.remainderLine"), { remain: String(remain), created: createdShort })}
        </p>
        {canCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] font-medium text-zinc-300 transition hover:border-fuchsia-400/40 hover:text-fuchsia-200"
          >
            {t("secondaryMarket.listings.cancelListing")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
