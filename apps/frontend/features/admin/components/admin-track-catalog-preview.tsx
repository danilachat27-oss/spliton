"use client";

import { Music2 } from "@/lib/lucide";

import { MediaPlaceholder } from "@/components/dashboard/dashboard-media-placeholder";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import type { AdminTrackFormBody } from "@/features/admin/lib/admin-track-form";
import {
  RELEASE_TYPE_LABELS,
  shareSplitTotal,
  trackStatusLabel,
  unitsProgressPct,
} from "@/features/admin/lib/admin-track-form";
import { formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { AdminStatusBadge } from "@/features/admin/ui";
import { cn } from "@/lib/utils";

type AdminTrackCatalogPreviewProps = {
  form: AdminTrackFormBody;
  className?: string;
};

export function AdminTrackCatalogPreview({ form, className }: AdminTrackCatalogPreviewProps) {
  const a = useAdminI18n();
  const progress = unitsProgressPct(form);
  const shares = shareSplitTotal(form);
  const shareOk = Math.abs(shares - 100) < 0.01;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 p-5 text-white",
        className,
      )}
    >
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        Preview · каталог Spliton
      </p>

      <div className="flex gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
          {form.coverUrl.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.coverUrl.trim()} alt="" className="size-full object-cover" />
          ) : (
            <MediaPlaceholder
              label={a.t("admin.ui.cover")}
              frameless
              aspectClassName="absolute inset-0 size-full min-h-0"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge
              label={trackStatusLabel(form.status)}
              tone={
                form.status === "active"
                  ? "success"
                  : form.status === "review"
                    ? "pending"
                    : form.status === "paused"
                      ? "warning"
                      : "neutral"
              }
            />
            {form.releaseType ? (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {RELEASE_TYPE_LABELS[form.releaseType]}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {form.genre.trim() || "Жанр"}
          </p>
          <h3 className="mt-1 truncate text-lg font-semibold tracking-tight">
            {form.title.trim() || "Название релиза"}
          </h3>
          <p className="truncate text-sm text-zinc-400">{form.artist.trim() || "Артист"}</p>
        </div>
      </div>

      {form.description.trim() ? (
        <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-zinc-400">{form.description}</p>
      ) : null}

      <div className="mt-5 space-y-3 rounded-xl bg-white/5 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Цена за юнит</span>
          <span className="font-semibold tabular-nums">
            {form.primaryUnitPrice.trim() ? formatUsdtAmount(form.primaryUnitPrice) : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Доступно юнитов</span>
          <span className="font-semibold tabular-nums">{form.availableUnits || "—"}</span>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[11px] text-zinc-500">
            <span>{a.t("admin.title.roundProgress")}</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500/90 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Доля держателей</span>
          <span className={cn("font-semibold tabular-nums", shareOk ? "text-emerald-300" : "text-amber-300")}>
            {form.holderSharePct || "0"}%
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900/80 py-2.5 text-sm font-semibold text-zinc-100 opacity-90"
      >
        <Music2 className="size-4" />
        Купить юниты (preview)
      </button>

      {!form.coverUrl.trim() ? (
        <p className="mt-3 text-center text-[11px] text-amber-200/80">
          Placeholder — добавьте обложку перед публикацией
        </p>
      ) : null}
    </div>
  );
}
