"use client";

import { Music2 } from "@/lib/lucide";

import { MediaPlaceholder } from "@/components/dashboard/dashboard-media-placeholder";
import type { AdminRoundFormBody } from "@/features/admin/lib/admin-round-form";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  formatUnitsLabel,
  roundAvailableUnits,
  roundFullSalePotential,
  roundProgressPct,
} from "@/features/admin/lib/admin-round-form";
import { formatAdminDateShort, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { AdminStatusBadge, AdminRaiseProgress } from "@/features/admin/ui";
import { cn } from "@/lib/utils";

type AdminRoundCatalogPreviewProps = {
  form: AdminRoundFormBody;
  releaseTitle: string;
  releaseArtist: string;
  releaseCoverUrl: string | null;
  releaseGenre: string;
  className?: string;
};

export function AdminRoundCatalogPreview({
  form,
  releaseTitle,
  releaseArtist,
  releaseCoverUrl,
  releaseGenre,
  className,
}: AdminRoundCatalogPreviewProps) {
  const a = useAdminI18n();
  const progress = roundProgressPct(form);
  const available = roundAvailableUnits(form);
  const potential = roundFullSalePotential(form);
  const isDraft = form.status === "draft";
  const isHidden = isDraft || form.status === "cancelled";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 p-5 text-white",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {a.t("admin.rounds.catalogPreview.title")}
        </p>
        {isHidden ? (
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
            {a.t("admin.rounds.catalogPreview.hidden")}
          </span>
        ) : null}
      </div>

      <div className="flex gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
          {releaseCoverUrl?.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={releaseCoverUrl.trim()} alt="" className="size-full object-cover" />
          ) : (
            <MediaPlaceholder
              label={a.t("admin.ui.cover")}
              frameless
              aspectClassName="absolute inset-0 size-full min-h-0"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <AdminStatusBadge
            label={a.formatRoundStatus(form.status)}
            tone={
              form.status === "live"
                ? "success"
                : form.status === "paused"
                  ? "warning"
                  : form.status === "completed"
                    ? "pending"
                    : "neutral"
            }
          />
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {releaseGenre || "Жанр"}
          </p>
          <h3 className="mt-1 truncate text-lg font-semibold tracking-tight">
            {releaseTitle || "Название релиза"}
          </h3>
          <p className="truncate text-sm text-zinc-400">{releaseArtist || "Артист"}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-xl bg-white/5 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Цена за юнит</span>
          <span className="font-semibold tabular-nums">
            {form.unitPriceUsdt.trim() ? formatUsdtAmount(form.unitPriceUsdt) : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Доступно юнитов</span>
          <span className="font-semibold tabular-nums">{formatUnitsLabel(available)}</span>
        </div>
        <div>
          <AdminRaiseProgress
            variant="preview"
            pct={progress}
            raised={form.raisedAmountUsdt || "0"}
            target={form.raiseTargetUsdt || "0"}
          />
        </div>
        {form.endDate ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Окончание раунда</span>
            <span className="font-semibold tabular-nums">{formatAdminDateShort(form.endDate)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Потенциал при полной продаже</span>
          <span className="font-semibold tabular-nums">{formatUsdtAmount(potential)}</span>
        </div>
      </div>

      <button
        type="button"
        disabled
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900/80 py-2.5 text-sm font-semibold text-zinc-100 opacity-90"
      >
        <Music2 className="size-4" />
        {a.t("admin.rounds.catalogPreview.buyUnits")}
      </button>

      {!releaseCoverUrl?.trim() ? (
        <p className="mt-3 text-center text-[11px] text-amber-200/80">
          Добавьте обложку релиза перед публикацией
        </p>
      ) : null}
    </div>
  );
}
