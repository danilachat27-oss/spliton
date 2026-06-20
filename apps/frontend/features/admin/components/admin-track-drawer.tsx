"use client";

import * as React from "react";
import { Archive, Check, GitCompare, Globe, HelpCircle, Pause, Plus, Save, Send, X } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import {
  AdminDrawerActionButton,
  AdminDrawerFooterToolbar,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import { AdminTrackCatalogPreview } from "@/features/admin/components/admin-track-catalog-preview";
import { AdminArtistCombobox } from "@/features/admin/components/admin-artist-combobox";
import { AdminLabelCombobox } from "@/features/admin/components/admin-label-combobox";
import { AdminReleaseFaqPanel } from "@/features/admin/components/admin-release-faq-panel";
import { AdminGenreCombobox } from "@/features/admin/components/admin-genre-combobox";
import type { AdminTrackListItem } from "@/features/admin/mocks/admin-tracks.mock";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  buildTrackPublishChecklist,
  emptyTrackForm,
  RELEASE_TYPE_LABELS,
  shareSplitTotal,
  TRACK_FIELD_TOOLTIPS,
  trackFormFromItem,
  trackStatusLabel,
  validateTrackForm,
  type AdminTrackFormBody,
  type TrackPublishChecklistItem,
} from "@/features/admin/lib/admin-track-form";
import { formatUnits } from "@/features/admin/lib/admin-format";
import {
  adminFieldInput,
} from "@/features/admin/lib/admin-ui";
import {
  AdminConfirmDialog,
  AdminDatePicker,
  AdminDetailDrawer,
  AdminFormField,
  AdminFormFooter,
  AdminLoadingState,
  AdminMediaUploadButton,
  AdminStatusBadge,
  AdminTextarea,
  AdminCheckboxRow,
} from "@/features/admin/ui";
import { useAdminDrawerUnsavedGuard } from "@/features/admin/hooks/use-admin-drawer-unsaved-guard";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { cn } from "@/lib/utils";

export type { AdminTrackFormBody };

const TRACK_CRM_PIPELINE = ["draft", "review", "published", "active"] as const;

const TRACK_STATUS_TONE: Record<
  string,
  "neutral" | "success" | "warning" | "pending" | "danger"
> = {
  draft: "neutral",
  review: "pending",
  published: "pending",
  active: "success",
  paused: "warning",
  completed: "success",
  archived: "neutral",
};

type TrackCrmStepState = "done" | "current" | "upcoming" | "paused";

function resolveTrackCrmProgress(status: string): {
  activeStep: number;
  overlay?: "paused" | "completed" | "archived";
} {
  const idx = TRACK_CRM_PIPELINE.indexOf(status as (typeof TRACK_CRM_PIPELINE)[number]);
  if (idx >= 0) return { activeStep: idx };
  if (status === "paused") return { activeStep: 3, overlay: "paused" };
  if (status === "completed") return { activeStep: 3, overlay: "completed" };
  if (status === "archived") return { activeStep: -1, overlay: "archived" };
  return { activeStep: 0 };
}

function trackCrmStepState(index: number, progress: ReturnType<typeof resolveTrackCrmProgress>): TrackCrmStepState {
  if (progress.overlay === "completed") return "done";
  if (progress.overlay === "archived") return "upcoming";
  if (progress.overlay === "paused") {
    if (index < 3) return "done";
    if (index === 3) return "paused";
    return "upcoming";
  }
  if (index < progress.activeStep) return "done";
  if (index === progress.activeStep) return "current";
  return "upcoming";
}

function trackCrmConnectorDone(index: number, progress: ReturnType<typeof resolveTrackCrmProgress>): boolean {
  if (progress.overlay === "completed") return index < TRACK_CRM_PIPELINE.length - 1;
  if (progress.overlay === "paused") return index < 3;
  if (progress.overlay === "archived") return false;
  return index < progress.activeStep;
}

function TrackCrmStepDot({ state }: { state: TrackCrmStepState }) {
  if (state === "done") {
    return (
      <span className="flex size-4 items-center justify-center rounded-full bg-[#B7F500] shadow-[0_0_8px_rgba(183,245,0,0.35)]">
        <Check className="size-2.5 text-zinc-950" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="flex size-4 items-center justify-center rounded-full bg-zinc-950 ring-2 ring-[#B7F500] shadow-[0_0_10px_rgba(183,245,0,0.25)]">
        <span className="size-1.5 rounded-full bg-[#B7F500]" aria-hidden />
      </span>
    );
  }
  if (state === "paused") {
    return (
      <span className="flex size-4 items-center justify-center rounded-full bg-amber-500/20 ring-2 ring-amber-400/70">
        <Pause className="size-2 text-amber-300" strokeWidth={2.5} aria-hidden />
      </span>
    );
  }
  return <span className="size-3 rounded-full bg-zinc-800 ring-1 ring-zinc-700/80" aria-hidden />;
}

function TrackCrmStatusProcess({
  status,
  currentLabel,
  formatStatus,
}: {
  status: string;
  currentLabel: string;
  formatStatus: (status: string) => string;
}) {
  const progress = resolveTrackCrmProgress(status);
  const badgeTone = TRACK_STATUS_TONE[status] ?? "neutral";

  return (
    <div className="rounded-2xl bg-zinc-900/45 px-4 py-4">
      <ol className="flex items-start">
        {TRACK_CRM_PIPELINE.map((step, index) => {
          const state = trackCrmStepState(index, progress);
          const label = formatStatus(step);
          return (
            <li key={step} className="flex min-w-0 flex-1 items-start last:flex-none">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <TrackCrmStepDot state={state} />
                <span
                  className={cn(
                    "max-w-[4.5rem] text-center text-[10px] font-semibold uppercase leading-tight tracking-wide",
                    state === "done" && "text-[#B7F500]",
                    state === "current" && "text-zinc-100",
                    state === "paused" && "text-amber-300",
                    state === "upcoming" && "text-zinc-600",
                  )}
                >
                  {label}
                </span>
              </div>
              {index < TRACK_CRM_PIPELINE.length - 1 ? (
                <div
                  className={cn(
                    "mt-2 h-0.5 min-w-3 flex-1 rounded-full transition-colors",
                    trackCrmConnectorDone(index, progress) ? "bg-[#B7F500]/55" : "bg-zinc-800",
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-900/70 px-3 py-2.5">
        <span className="text-xs text-zinc-500">{currentLabel}</span>
        <AdminStatusBadge label={formatStatus(status)} tone={badgeTone} />
      </div>
    </div>
  );
}

type AdminTrackDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: AdminTrackListItem | null;
  mode: "create" | "edit";
  saving?: boolean;
  loading?: boolean;
  readOnly?: boolean;
  canPublish?: boolean;
  onSubmit: (body: AdminTrackFormBody) => Promise<void>;
  onSubmitReview?: () => Promise<void>;
  onPublish?: () => Promise<void>;
  onPause?: () => Promise<void>;
  onArchive?: () => Promise<void>;
  canUploadMedia?: boolean;
  mediaUploading?: "cover" | "audio" | null;
  onUploadCover?: (file: File) => Promise<void>;
  onUploadAudio?: (file: File) => Promise<void>;
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-zinc-900/40 p-4">
      <h4 className="text-sm font-semibold text-zinc-100">{title}</h4>
      {description ? <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function FieldHint({ text }: { text: string }) {
  return (
    <p className="mt-1 flex items-start gap-1 text-[11px] leading-relaxed text-zinc-500">
      <HelpCircle className="mt-0.5 size-3 shrink-0" />
      {text}
    </p>
  );
}

function resolveTrackFieldErrors(errors: string[]): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = {};
  for (const err of errors) {
    if (err === "Укажите название релиза.") out.title = err;
    else if (err === "Укажите артиста.") out.artist = err;
    else if (err === "Укажите жанр.") out.genre = err;
    else if (err === "Всего юнитов должно быть больше 0.") out.totalUnits = err;
    else if (
      err === "Цена за юнит не может быть отрицательной." ||
      err === "Для публикации укажите цену за юнит."
    ) {
      out.primaryUnitPrice = err;
    } else if (err === "Доступно юнитов не может превышать общее количество.") {
      out.availableUnits = err;
    } else if (err === "Минимальная покупка не может превышать максимальную.") {
      out.minPurchaseUnits = err;
    } else if (err.startsWith("Сумма долей") || err === "Для публикации доли должны давать ровно 100%.") {
      out.holderSharePct = err;
      out.artistSharePct = err;
      out.platformSharePct = err;
    } else if (err === "Для публикации нужна обложка." || err.startsWith("Некорректный URL: Обложка")) {
      out.coverUrl = err;
    } else if (err.startsWith("Некорректный URL: Audio preview")) out.audioPreviewUrl = err;
    else if (err.startsWith("Некорректный URL: Spotify")) out.spotifyUrl = err;
    else if (err.startsWith("Некорректный URL: Apple Music")) out.appleMusicUrl = err;
    else if (err.startsWith("Некорректный URL: YouTube")) out.youtubeUrl = err;
    else if (err.startsWith("Некорректный URL: Яндекс Музыка")) out.yandexMusicUrl = err;
  }
  return out;
}

function parseSharePct(value: string): number {
  const n = Number(String(value).trim().replace(",", "."));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function ShareBar({ form }: { form: AdminTrackFormBody }) {
  const a = useAdminI18n();
  const total = shareSplitTotal(form);
  const ok = Math.abs(total - 100) < 0.01 && total > 0;
  const barMax = ok ? 100 : Math.max(100, total);
  const remainder = !ok && total < 100 ? 100 - total : 0;
  const overflow = !ok && total > 100 ? total - 100 : 0;

  const items = [
    {
      label: a.t("admin.drawer.track.shareHolders"),
      value: parseSharePct(form.holderSharePct),
      display: form.holderSharePct,
      color: "bg-sky-400",
      glow: "shadow-[0_0_10px_rgba(56,189,248,0.35)]",
      text: "text-sky-300",
    },
    {
      label: a.t("admin.drawer.track.shareArtist"),
      value: parseSharePct(form.artistSharePct),
      display: form.artistSharePct,
      color: "bg-violet-400",
      glow: "shadow-[0_0_10px_rgba(167,139,250,0.35)]",
      text: "text-violet-300",
    },
    {
      label: a.t("admin.drawer.track.sharePlatform"),
      value: parseSharePct(form.platformSharePct),
      display: form.platformSharePct,
      color: "bg-zinc-500",
      glow: "",
      text: "text-zinc-400",
    },
  ] as const;

  const segmentWidth = (value: number) => (barMax > 0 ? (value / barMax) * 100 : 0);

  return (
    <div className="rounded-2xl bg-zinc-900/45 px-4 py-4">
      <div
        className="flex h-3 overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-zinc-700/90"
        role="progressbar"
        aria-valuenow={Math.min(100, Math.round(total * 10) / 10)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={a.t("admin.drawer.track.section.revenue")}
      >
        {items.map((item) => {
          const width = segmentWidth(item.value);
          if (width <= 0) return null;
          return (
            <div
              key={item.label}
              className={cn(
                "h-full min-w-[3px] transition-[width] duration-300 ease-out",
                item.color,
                item.glow,
              )}
              style={{ width: `${width}%` }}
              title={`${item.label}: ${item.value}%`}
            />
          );
        })}
        {remainder > 0 ? (
          <div
            className="h-full min-w-[3px] bg-zinc-800/90 transition-[width] duration-300 ease-out"
            style={{ width: `${segmentWidth(remainder)}%` }}
            title={`${remainder.toFixed(1)}%`}
          />
        ) : null}
        {overflow > 0 ? (
          <div
            className="h-full min-w-[3px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] transition-[width] duration-300 ease-out"
            style={{ width: `${segmentWidth(overflow)}%` }}
            title={`+${overflow.toFixed(1)}%`}
          />
        ) : null}
      </div>

      <div className="mt-3 flex min-w-0">
        {items.map((item) => {
          const width = segmentWidth(item.value);
          const flexBasis = width > 0 ? `${width}%` : undefined;
          return (
            <div
              key={item.label}
              className="min-w-0 shrink-0 px-0.5 first:pl-0 last:pr-0"
              style={flexBasis ? { flexBasis, maxWidth: flexBasis } : { flex: "1 1 0" }}
            >
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                {item.label}
              </p>
              <p className={cn("mt-0.5 text-xs font-semibold tabular-nums", item.text)}>
                {item.display.trim() || "0"}%
              </p>
            </div>
          );
        })}
        {remainder > 0 ? (
          <div
            className="min-w-0 shrink-0 px-0.5"
            style={{ flexBasis: `${segmentWidth(remainder)}%`, maxWidth: `${segmentWidth(remainder)}%` }}
          >
            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-600">
              {a.t("admin.drawer.track.shareRemainder")}
            </p>
            <p className="mt-0.5 text-xs font-semibold tabular-nums text-amber-400">
              {remainder.toFixed(1)}%
            </p>
          </div>
        ) : null}
        {overflow > 0 ? (
          <div
            className="min-w-0 shrink-0 px-0.5"
            style={{ flexBasis: `${segmentWidth(overflow)}%`, maxWidth: `${segmentWidth(overflow)}%` }}
          >
            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-600">
              {a.t("admin.drawer.track.shareOverflow")}
            </p>
            <p className="mt-0.5 text-xs font-semibold tabular-nums text-red-400">
              +{overflow.toFixed(1)}%
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-900/70 px-3 py-2.5">
        <span className="text-xs text-zinc-500">{a.t("admin.drawer.track.shareTotalLabel")}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums",
            ok ? "text-emerald-400" : total > 100 ? "text-red-400" : "text-amber-400",
          )}
        >
          {total.toFixed(1)}%
          {ok ? <Check className="size-3.5 shrink-0" aria-hidden /> : null}
          {!ok ? (
            <span className="font-normal text-zinc-500">{a.t("admin.drawer.track.shareMustBe100")}</span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

function parseUnitCount(value: string): number {
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function unitsSoldProgressTone(pct: number): {
  fill: string;
  glow: string;
  label: string;
} {
  if (pct >= 75) {
    return {
      fill: "bg-[#B7F500]",
      glow: "shadow-[0_0_10px_rgba(183,245,0,0.45)]",
      label: "text-[#B7F500]",
    };
  }
  if (pct >= 40) {
    return {
      fill: "bg-amber-400",
      glow: "shadow-[0_0_10px_rgba(251,191,36,0.35)]",
      label: "text-amber-400",
    };
  }
  if (pct > 0) {
    return {
      fill: "bg-red-500",
      glow: "shadow-[0_0_10px_rgba(239,68,68,0.35)]",
      label: "text-red-400",
    };
  }
  return {
    fill: "bg-zinc-600",
    glow: "",
    label: "text-zinc-500",
  };
}

function UnitsPoolBar({ form, soldUnits }: { form: AdminTrackFormBody; soldUnits: string }) {
  const a = useAdminI18n();
  const total = parseUnitCount(form.totalUnits);
  const available = parseUnitCount(form.availableUnits);
  const sold = parseUnitCount(soldUnits);
  const allocated = sold + available;
  const poolOk = total > 0 && allocated <= total;
  const barMax = total > 0 ? (poolOk ? total : Math.max(total, allocated)) : 1;
  const remainder = total > 0 && allocated < total ? total - allocated : 0;
  const overflow = total > 0 && allocated > total ? allocated - total : 0;
  const soldPct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
  const tone = unitsSoldProgressTone(soldPct);

  const segmentWidth = (value: number) => (barMax > 0 ? (value / barMax) * 100 : 0);

  const items = [
    {
      label: a.t("admin.drawer.track.field.sold"),
      value: sold,
      color: tone.fill,
      glow: tone.glow,
      text: tone.label,
    },
    {
      label: a.t("admin.drawer.track.unitsProgress.available"),
      value: available,
      color: "bg-sky-500/45",
      glow: "",
      text: "text-sky-300",
    },
    {
      label: a.t("admin.drawer.track.field.totalUnits"),
      value: total,
      color: "bg-zinc-700",
      glow: "",
      text: "text-zinc-300",
    },
  ] as const;

  return (
    <div className="rounded-2xl bg-zinc-900/45 px-4 py-4">
      <div
        className="flex h-3 overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-zinc-700/90"
        role="progressbar"
        aria-valuenow={soldPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={a.t("admin.drawer.track.unitsProgress.label")}
      >
        {sold > 0 ? (
          <div
            className={cn(
              "h-full min-w-[3px] transition-[width] duration-300 ease-out",
              tone.fill,
              tone.glow,
            )}
            style={{ width: `${segmentWidth(sold)}%` }}
            title={`${a.t("admin.drawer.track.field.sold")}: ${formatUnits(sold)}`}
          />
        ) : null}
        {available > 0 ? (
          <div
            className="h-full min-w-[3px] bg-sky-500/45 transition-[width] duration-300 ease-out"
            style={{ width: `${segmentWidth(available)}%` }}
            title={`${a.t("admin.drawer.track.unitsProgress.available")}: ${formatUnits(available)}`}
          />
        ) : null}
        {remainder > 0 ? (
          <div
            className="h-full min-w-[3px] bg-zinc-800/90 transition-[width] duration-300 ease-out"
            style={{ width: `${segmentWidth(remainder)}%` }}
            title={`${formatUnits(remainder)}`}
          />
        ) : null}
        {overflow > 0 ? (
          <div
            className="h-full min-w-[3px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] transition-[width] duration-300 ease-out"
            style={{ width: `${segmentWidth(overflow)}%` }}
            title={`+${formatUnits(overflow)}`}
          />
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {items.map((item, index) => (
          <div key={item.label} className="min-w-0">
            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-600">
              {item.label}
            </p>
            <p className={cn("mt-0.5 text-xs font-semibold tabular-nums", item.text)}>
              {formatUnits(item.value)}
              {total > 0 && index < 2 ? (
                <span className="ml-1 font-normal text-zinc-600">
                  · {Math.round((item.value / total) * 100)}%
                </span>
              ) : null}
            </p>
          </div>
        ))}
      </div>

      {remainder > 0 || overflow > 0 ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums">
          {remainder > 0 ? (
            <span className="text-zinc-500">
              {a.t("admin.drawer.track.unitsProgress.remainder")}: {formatUnits(remainder)}
            </span>
          ) : null}
          {overflow > 0 ? (
            <span className="text-red-400">
              {a.t("admin.drawer.track.unitsProgress.overflow")}: +{formatUnits(overflow)}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-900/70 px-3 py-2.5">
        <span className="text-xs text-zinc-500">{a.t("admin.drawer.track.unitsProgress.label")}</span>
        <span
          className={cn(
            "text-xs font-semibold tabular-nums",
            total <= 0 ? "text-zinc-500" : poolOk ? tone.label : "text-red-400",
          )}
        >
          {total > 0
            ? a
                .t("admin.drawer.track.unitsProgress.summary")
                .replace("{sold}", formatUnits(sold))
                .replace("{total}", formatUnits(total))
                .replace("{pct}", String(soldPct))
            : a.t("admin.drawer.track.unitsProgress.empty")}
          {!poolOk && total > 0 ? (
            <span className="ml-1.5 font-normal text-zinc-500">
              {a.t("admin.drawer.track.unitsProgress.overLimit")}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

function TrackPublishChecklistNode({ done, current }: { done: boolean; current: boolean }) {
  if (done) {
    return (
      <span className="flex size-4 items-center justify-center rounded-full bg-[#B7F500] shadow-[0_0_8px_rgba(183,245,0,0.35)]">
        <Check className="size-2.5 text-zinc-950" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (current) {
    return (
      <span className="flex size-4 items-center justify-center rounded-full bg-zinc-950 ring-2 ring-[#B7F500] shadow-[0_0_10px_rgba(183,245,0,0.25)]">
        <span className="size-1.5 rounded-full bg-[#B7F500]" aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex size-4 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-zinc-700/80">
      <span className="size-1.5 rounded-full bg-zinc-600" aria-hidden />
    </span>
  );
}

function TrackPublishChecklistBranch({
  items,
  onNavigate,
}: {
  items: TrackPublishChecklistItem[];
  onNavigate: (fieldId?: string) => void;
}) {
  const a = useAdminI18n();
  const doneCount = items.filter((item) => item.ok).length;
  const allDone = doneCount === items.length;
  const firstPendingIndex = items.findIndex((item) => !item.ok);

  return (
    <div className="rounded-2xl bg-zinc-900/45 px-4 py-4">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex min-w-0 items-center gap-2 font-mono text-[11px]">
          <GitCompare className="size-3.5 shrink-0 text-[#B7F500]" aria-hidden />
          <span className="truncate text-zinc-500">{a.t("admin.drawer.track.publishChecklist.branch")}</span>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums",
            allDone ? "bg-[#B7F500]/15 text-[#B7F500]" : "bg-zinc-800/90 text-zinc-400",
          )}
        >
          {doneCount}/{items.length}
        </span>
      </div>

      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = !item.ok && index === firstPendingIndex;

          return (
            <li key={item.id} className="relative flex gap-3">
              <div className="flex w-4 shrink-0 flex-col items-center">
                <TrackPublishChecklistNode done={item.ok} current={isCurrent} />
                {!isLast ? (
                  <span
                    className={cn(
                      "my-0.5 w-px flex-1 min-h-[18px]",
                      item.ok ? "bg-[#B7F500]/50" : "bg-zinc-700/70",
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>

              <button
                type="button"
                className={cn(
                  "group -mt-0.5 mb-3 flex min-w-0 flex-1 flex-col items-start gap-1 text-left transition",
                  item.fieldId ? "cursor-pointer" : "cursor-default",
                  isCurrent && "rounded-lg bg-zinc-800/30 px-2 py-1.5",
                )}
                onClick={() => onNavigate(item.fieldId)}
                disabled={!item.fieldId}
              >
                <span
                  className={cn(
                    "block w-full text-sm leading-snug",
                    item.ok ? "text-zinc-200" : isCurrent ? "font-medium text-zinc-100" : "text-zinc-500",
                    item.fieldId && "group-hover:text-zinc-100",
                  )}
                >
                  {item.label}
                </span>
                {isCurrent ? (
                  <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[#B7F500]">
                    {a.t("admin.drawer.track.publishChecklist.head")}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function AdminTrackDrawer({
  open,
  onOpenChange,
  track,
  mode,
  saving,
  loading,
  readOnly = false,
  canPublish = false,
  onSubmit,
  onSubmitReview,
  onPublish,
  onPause,
  onArchive,
  canUploadMedia = false,
  mediaUploading = null,
  onUploadCover,
  onUploadAudio,
}: AdminTrackDrawerProps) {
  const a = useAdminI18n();
  const [form, setForm] = React.useState<AdminTrackFormBody>(emptyTrackForm);
  const [baselineForm, setBaselineForm] = React.useState<AdminTrackFormBody>(emptyTrackForm);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [confirmAction, setConfirmAction] = React.useState<"publish" | "pause" | "archive" | null>(
    null,
  );

  React.useEffect(() => {
    if (!open) return;
    setErrors([]);
    const next = track ? trackFormFromItem(track) : emptyTrackForm();
    setForm(next);
    setBaselineForm(next);
  }, [open, track]);

  const dirty = React.useMemo(
    () => JSON.stringify(form) !== JSON.stringify(baselineForm),
    [form, baselineForm],
  );
  const { guardedOnOpenChange, UnsavedChangesDialog } = useAdminDrawerUnsavedGuard({
    open,
    dirty: dirty && !saving,
    onOpenChange,
  });

  function set<K extends keyof AdminTrackFormBody>(key: K, value: AdminTrackFormBody[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(kind: "draft" | "review" | "publish") {
    const validationKind = kind === "publish" ? "publish" : kind === "review" ? "review" : "draft";
    const errs = validateTrackForm(form, validationKind);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    await onSubmit(form);
    setBaselineForm(form);
    if (kind === "review" && onSubmitReview && mode === "edit") {
      await onSubmitReview();
    }
    if (kind === "publish" && onPublish && mode === "edit") {
      await onPublish();
    }
  }

  async function runConfirmedAction() {
    if (!confirmAction) return;
    try {
      if (confirmAction === "publish") {
        const errs = validateTrackForm(form, "publish");
        if (errs.length) {
          setErrors(errs);
          setConfirmAction(null);
          return;
        }
        await onSubmit(form);
        setBaselineForm(form);
        if (onPublish) await onPublish();
      } else if (confirmAction === "pause" && onPause) {
        await onPause();
      } else if (confirmAction === "archive" && onArchive) {
        await onArchive();
      }
      setConfirmAction(null);
      onOpenChange(false);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : a.t("admin.drawer.common.actionFailed")]);
      setConfirmAction(null);
    }
  }

  const checklist = buildTrackPublishChecklist(form);
  const publishReady = checklist.every((item) => item.ok);
  const fieldErrors = React.useMemo(() => resolveTrackFieldErrors(errors), [errors]);
  const fe = (field: string) => fieldErrors[field] ?? null;

  function scrollToField(fieldId?: string) {
    if (!fieldId) return;
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if ("focus" in el && typeof el.focus === "function") {
      window.setTimeout(() => el.focus(), 300);
    }
  }

  const confirmMeta = {
    publish: {
      title: a.t("admin.drawer.track.confirm.publishTitle"),
      description: a.t("admin.drawer.track.confirm.publishDesc"),
      label: a.t("admin.drawer.track.publish"),
    },
    pause: {
      title: a.t("admin.drawer.track.confirm.pauseTitle"),
      description: a.t("admin.drawer.track.confirm.pauseDesc"),
      label: a.t("admin.drawer.track.pause"),
    },
    archive: {
      title: a.t("admin.drawer.track.confirm.archiveTitle"),
      description: a.t("admin.drawer.track.confirm.archiveDesc"),
      label: a.t("admin.drawer.track.archive"),
      destructive: true,
    },
  } as const;

  return (
    <>
      <AdminDetailDrawer
        open={open}
        onOpenChange={guardedOnOpenChange}
        wide
        widthClassName="w-[min(1120px,100vw)]"
        title={
          readOnly
            ? track?.title ?? a.t("admin.drawer.track.view")
            : mode === "create"
              ? a.t("admin.drawer.track.create")
              : track?.title ?? a.t("admin.drawer.track.edit")
        }
        subtitle={
          mode === "create"
            ? a.t("admin.drawer.track.createSubtitle")
            : track
              ? `ID ${track.id}`
              : undefined
        }
        footer={
          readOnly ? (
            <AdminFormFooter
              right={
                <AdminDrawerFooterToolbar>
                  <AdminDrawerActionButton
                    icon={X}
                    label={a.t("admin.drawer.common.close")}
                    tone="ghost"
                    onClick={() => onOpenChange(false)}
                  />
                </AdminDrawerFooterToolbar>
              }
            />
          ) : (
            <AdminFormFooter
              left={
                errors.length > 0 ? (
                  <ul className="max-w-full rounded-xl bg-red-950/30 px-3 py-2 text-left text-xs text-red-300">
                    {errors.map((e) => (
                      <li key={e}>• {e}</li>
                    ))}
                  </ul>
                ) : undefined
              }
              right={
                <AdminDrawerFooterToolbar>
                  <AdminDrawerActionButton
                    icon={X}
                    label={a.t("admin.drawer.common.cancel")}
                    tone="cancel"
                    disabled={saving}
                    onClick={() => guardedOnOpenChange(false)}
                  />
                  <AdminDrawerActionButton
                    icon={Save}
                    label={a.t("admin.drawer.track.saveDraft")}
                    tone="secondary"
                    loading={saving}
                    onClick={() => void save("draft")}
                  />
                  {mode === "edit" && onSubmitReview ? (
                    <AdminDrawerActionButton
                      icon={Send}
                      label={a.t("admin.drawer.track.submitReview")}
                      tone="secondary"
                      loading={saving}
                      onClick={() => void save("review")}
                    />
                  ) : null}
                  {mode === "edit" && canPublish && onPublish ? (
                    <AdminDrawerActionButton
                      icon={Globe}
                      label={a.t("admin.drawer.track.publish")}
                      tone="primary"
                      disabled={!publishReady}
                      title={
                        !publishReady
                          ? "Заполните обязательные поля из чеклиста публикации"
                          : a.t("admin.drawer.track.publish")
                      }
                      onClick={() => {
                        const errs = validateTrackForm(form, "publish");
                        if (errs.length) {
                          setErrors(errs);
                          return;
                        }
                        setConfirmAction("publish");
                      }}
                    />
                  ) : null}
                  {mode === "edit" && canPublish && onPause && track?.status === "active" ? (
                    <AdminDrawerActionButton
                      icon={Pause}
                      label={a.t("admin.drawer.track.pause")}
                      tone="secondary"
                      disabled={saving}
                      onClick={() => setConfirmAction("pause")}
                    />
                  ) : null}
                  {mode === "edit" && canPublish && onArchive && track?.status !== "archived" ? (
                    <AdminDrawerActionButton
                      icon={Archive}
                      label={a.t("admin.drawer.track.archive")}
                      tone="danger"
                      disabled={saving}
                      onClick={() => setConfirmAction("archive")}
                    />
                  ) : null}
                  {mode === "create" ? (
                    <AdminDrawerActionButton
                      icon={Plus}
                      label={a.t("admin.drawer.track.create")}
                      tone="primary"
                      loading={saving}
                      onClick={() => void save("draft")}
                    />
                  ) : (
                    <AdminDrawerActionButton
                      icon={Check}
                      label={a.t("admin.drawer.track.saveChanges")}
                      tone="primary"
                      loading={saving}
                      onClick={() => void save("draft")}
                    />
                  )}
                </AdminDrawerFooterToolbar>
              }
            />
          )
        }
      >
        {loading ? (
          <AdminLoadingState label={a.t("admin.drawer.track.loading")} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5 pb-6">
              {track ? (
                <p className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">
                  {track.id}
                  <AdminCopyButton value={track.id} />
                </p>
              ) : null}

              <Section title={a.t("admin.drawer.track.section.basicInfo")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.title")}
                    htmlFor="tr-title"
                    info={a.t("admin.drawer.track.info.title")}
                    error={fe("title")}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="tr-title"
                      className={adminFieldInput}
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                      readOnly={readOnly}
                      placeholder="Midnight Run"
                      aria-invalid={Boolean(fe("title"))}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.artist")}
                    htmlFor="tr-artist"
                    info={a.t("admin.drawer.track.info.artist")}
                    error={fe("artist")}
                  >
                    <AdminArtistCombobox
                      id="tr-artist"
                      value={form.artist}
                      onChange={(v) => set("artist", v)}
                      readOnly={readOnly}
                      placeholder={a.t("admin.artists.field.name")}
                    />
                  </AdminFormField>
                  <AdminStyledSelectField
                    label={a.t("admin.drawer.track.field.releaseType")}
                    id="tr-type"
                    info={a.t("admin.drawer.track.info.releaseType")}
                    value={form.releaseType}
                    disabled={readOnly}
                    options={(Object.keys(RELEASE_TYPE_LABELS) as Array<keyof typeof RELEASE_TYPE_LABELS>).map(
                      (k) => ({
                        value: k,
                        label: RELEASE_TYPE_LABELS[k],
                      }),
                    )}
                    onChange={(value) => set("releaseType", value as AdminTrackFormBody["releaseType"])}
                  />
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.genre")}
                    htmlFor="tr-genre"
                    info={a.t("admin.drawer.track.info.genre")}
                    error={fe("genre")}
                  >
                    <AdminGenreCombobox
                      id="tr-genre"
                      value={form.genre}
                      onChange={(v) => set("genre", v)}
                      readOnly={readOnly}
                      placeholder="Electronic"
                      inputClassName={adminFieldInput}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.releaseDate")}
                    htmlFor="tr-date"
                    info={a.t("admin.drawer.track.info.releaseDate")}
                  >
                    <AdminDatePicker
                      id="tr-date"
                      value={form.releaseDate}
                      onChange={(releaseDate) => set("releaseDate", releaseDate)}
                      disabled={readOnly}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.crmStatus")}
                    info={a.t("admin.drawer.track.info.crmStatus")}
                    className="sm:col-span-2"
                  >
                    <TrackCrmStatusProcess
                      status={form.status}
                      currentLabel={a.t("admin.drawer.track.statusProcess.current")}
                      formatStatus={a.formatTrackStatus}
                    />
                  </AdminFormField>
                </div>
              </Section>

              <Section
                title={a.t("admin.drawer.track.section.media")}
                description={a.t("admin.drawer.track.section.mediaDesc")}
              >
                {mode === "create" || !track ? (
                  <p className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-3 py-2.5 text-xs leading-relaxed text-zinc-400">
                    {a.t("admin.drawer.track.media.uploadAfterDraft")}
                  </p>
                ) : canUploadMedia ? (
                  <p className="text-xs leading-relaxed text-zinc-400">{a.t("admin.drawer.track.media.uploadReady")}</p>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                    <AdminFormField
                      label={a.t("admin.drawer.track.field.uploadCover")}
                      htmlFor="tr-cover-file"
                      info={a.t("admin.drawer.track.info.coverUpload")}
                      hint={a.t("admin.drawer.track.field.coverHint")}
                    >
                      {canUploadMedia && mode === "edit" && track && onUploadCover ? (
                        <AdminMediaUploadButton
                          id="tr-cover-file"
                          accept="image/jpeg,image/png,image/webp"
                          label={a.t("admin.drawer.track.field.uploadCover")}
                          uploading={mediaUploading === "cover"}
                          uploadingLabel={a.t("admin.drawer.common.saving")}
                          disabled={readOnly}
                          onFileSelected={onUploadCover}
                        />
                      ) : null}
                    </AdminFormField>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
                      {a.t("admin.drawer.track.media.orUrl")}
                    </p>
                    <AdminFormField
                      label={a.t("admin.drawer.track.field.coverUrl")}
                      htmlFor="tr-cover"
                      info={a.t("admin.drawer.track.info.coverUrl")}
                      hint={TRACK_FIELD_TOOLTIPS.cover}
                      error={fe("coverUrl")}
                    >
                      <Input
                        id="tr-cover"
                        className={adminFieldInput}
                        value={form.coverUrl}
                        onChange={(e) => set("coverUrl", e.target.value)}
                        readOnly={readOnly}
                        placeholder="https://…"
                        aria-invalid={Boolean(fe("coverUrl"))}
                      />
                      {form.coverUrl.trim() ? (
                        <div className="mt-3 size-28 overflow-hidden rounded-xl bg-zinc-900/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={form.coverUrl.trim()} alt="" className="size-full object-cover" />
                        </div>
                      ) : null}
                    </AdminFormField>
                  </div>

                  <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                    <AdminFormField
                      label={a.t("admin.drawer.track.field.uploadAudio")}
                      htmlFor="tr-audio-file"
                      info={a.t("admin.drawer.track.info.audioUpload")}
                      hint={a.t("admin.drawer.track.field.audioHint")}
                    >
                      {canUploadMedia && mode === "edit" && track && onUploadAudio ? (
                        <AdminMediaUploadButton
                          id="tr-audio-file"
                          accept="audio/mpeg,audio/mp3,audio/wav,audio/mp4,audio/aac"
                          label={a.t("admin.drawer.track.field.uploadAudio")}
                          uploading={mediaUploading === "audio"}
                          uploadingLabel={a.t("admin.drawer.common.saving")}
                          disabled={readOnly}
                          onFileSelected={onUploadAudio}
                        />
                      ) : null}
                    </AdminFormField>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
                      {a.t("admin.drawer.track.media.orUrl")}
                    </p>
                    <AdminFormField
                      label={a.t("admin.drawer.track.field.audioPreviewUrl")}
                      htmlFor="tr-audio"
                      info={a.t("admin.drawer.track.info.audioUrl")}
                      hint={TRACK_FIELD_TOOLTIPS.audioPreview}
                      error={fe("audioPreviewUrl")}
                    >
                      <Input
                        id="tr-audio"
                        className={adminFieldInput}
                        value={form.audioPreviewUrl}
                        onChange={(e) => set("audioPreviewUrl", e.target.value)}
                        readOnly={readOnly}
                        placeholder="https://…/preview.mp3"
                        aria-invalid={Boolean(fe("audioPreviewUrl"))}
                      />
                      {form.audioPreviewUrl.trim() && !readOnly ? (
                        <audio controls className="mt-2 w-full max-w-md" src={form.audioPreviewUrl.trim()} preload="none">
                          <track kind="captions" />
                        </audio>
                      ) : null}
                    </AdminFormField>
                  </div>
                </div>
              </Section>

              <Section title={a.t("admin.drawer.track.section.rights")}>
                <AdminFormField
                  label={a.t("admin.drawer.track.field.shortDesc")}
                  htmlFor="tr-short"
                  info={a.t("admin.drawer.track.info.shortDesc")}
                >
                  <Input
                    id="tr-short"
                    className={adminFieldInput}
                    value={form.shortDescription}
                    onChange={(e) => set("shortDescription", e.target.value)}
                    readOnly={readOnly}
                    placeholder={a.t("admin.drawer.track.field.shortDescPlaceholder")}
                  />
                </AdminFormField>
                <AdminFormField
                  label={a.t("admin.drawer.track.field.fullDesc")}
                  htmlFor="tr-desc"
                  info={a.t("admin.drawer.track.info.fullDesc")}
                >
                  <AdminTextarea
                    id="tr-desc"
                    className="min-h-[88px]"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    readOnly={readOnly}
                    placeholder={a.t("admin.drawer.track.field.fullDescPlaceholder")}
                  />
                </AdminFormField>
                <AdminFormField
                  label={a.t("admin.drawer.track.field.riskDisclosure")}
                  htmlFor="tr-risk"
                  info={a.t("admin.drawer.track.info.riskDisclosure")}
                >
                  <AdminTextarea
                    id="tr-risk"
                    className="min-h-[88px]"
                    value={form.riskDisclosureText}
                    onChange={(e) => set("riskDisclosureText", e.target.value)}
                    readOnly={readOnly}
                    placeholder={a.t("admin.drawer.track.field.riskDisclosurePlaceholder")}
                  />
                </AdminFormField>
                <AdminFormField
                  label={a.t("admin.drawer.track.field.legalTerms")}
                  htmlFor="tr-legal"
                  info={a.t("admin.drawer.track.info.legalTerms")}
                >
                  <AdminTextarea
                    id="tr-legal"
                    className="min-h-[88px]"
                    value={form.legalDisclaimer}
                    onChange={(e) => set("legalDisclaimer", e.target.value)}
                    readOnly={readOnly}
                    placeholder={a.t("admin.drawer.track.field.legalTermsPlaceholder")}
                  />
                </AdminFormField>
                <AdminCheckboxRow
                  id="tr-secondary"
                  label={a.t("admin.drawer.track.field.secondaryEnabled")}
                  info={a.t("admin.drawer.track.info.secondaryEnabled")}
                  checked={form.secondaryEnabled}
                  onCheckedChange={(checked) => set("secondaryEnabled", checked)}
                  disabled={readOnly}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.labelCopyright")}
                    htmlFor="tr-label"
                    info={a.t("admin.drawer.track.info.labelCopyright")}
                  >
                    <AdminLabelCombobox
                      id="tr-label"
                      value={form.labelName}
                      onChange={(v) => set("labelName", v)}
                      readOnly={readOnly}
                      inputClassName={adminFieldInput}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.copyrightOwner")}
                    htmlFor="tr-copy"
                    info={a.t("admin.drawer.track.info.copyrightOwner")}
                  >
                    <Input
                      id="tr-copy"
                      className={adminFieldInput}
                      value={form.copyrightOwner}
                      onChange={(e) => set("copyrightOwner", e.target.value)}
                      readOnly={readOnly}
                    />
                  </AdminFormField>
                  <AdminFormField label="ISRC" htmlFor="tr-isrc" info={a.t("admin.drawer.track.info.isrc")}>
                    <Input
                      id="tr-isrc"
                      className={adminFieldInput}
                      value={form.isrc}
                      onChange={(e) => set("isrc", e.target.value)}
                      readOnly={readOnly}
                      placeholder="USRC17607839"
                    />
                  </AdminFormField>
                  <AdminFormField label="UPC" htmlFor="tr-upc" info={a.t("admin.drawer.track.info.upc")}>
                    <Input
                      id="tr-upc"
                      className={adminFieldInput}
                      value={form.upc}
                      onChange={(e) => set("upc", e.target.value)}
                      readOnly={readOnly}
                      placeholder="190295000123"
                    />
                  </AdminFormField>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminFormField
                    label="Spotify"
                    htmlFor="tr-spotify"
                    info={a.t("admin.drawer.track.info.spotifyUrl")}
                    error={fe("spotifyUrl")}
                  >
                    <Input
                      id="tr-spotify"
                      className={adminFieldInput}
                      value={form.spotifyUrl}
                      onChange={(e) => set("spotifyUrl", e.target.value)}
                      readOnly={readOnly}
                      placeholder="https://open.spotify.com/album/…"
                      aria-invalid={Boolean(fe("spotifyUrl"))}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label="Apple Music"
                    htmlFor="tr-apple"
                    info={a.t("admin.drawer.track.info.appleMusicUrl")}
                    error={fe("appleMusicUrl")}
                  >
                    <Input
                      id="tr-apple"
                      className={adminFieldInput}
                      value={form.appleMusicUrl}
                      onChange={(e) => set("appleMusicUrl", e.target.value)}
                      readOnly={readOnly}
                      placeholder="https://music.apple.com/…"
                      aria-invalid={Boolean(fe("appleMusicUrl"))}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label="YouTube"
                    htmlFor="tr-yt"
                    info={a.t("admin.drawer.track.info.youtubeUrl")}
                    error={fe("youtubeUrl")}
                  >
                    <Input
                      id="tr-yt"
                      className={adminFieldInput}
                      value={form.youtubeUrl}
                      onChange={(e) => set("youtubeUrl", e.target.value)}
                      readOnly={readOnly}
                      placeholder="https://youtube.com/watch?v=…"
                      aria-invalid={Boolean(fe("youtubeUrl"))}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.yandexMusic")}
                    htmlFor="tr-yandex"
                    info={a.t("admin.drawer.track.info.yandexMusicUrl")}
                    error={fe("yandexMusicUrl")}
                  >
                    <Input
                      id="tr-yandex"
                      className={adminFieldInput}
                      value={form.yandexMusicUrl}
                      onChange={(e) => set("yandexMusicUrl", e.target.value)}
                      readOnly={readOnly}
                      placeholder="https://music.yandex.ru/album/…"
                      aria-invalid={Boolean(fe("yandexMusicUrl"))}
                    />
                  </AdminFormField>
                </div>
              </Section>

              <Section title={a.t("admin.drawer.track.section.revenue")} description={a.t("admin.drawer.track.section.revenueDesc")}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.holderSharePct")}
                    htmlFor="tr-holder"
                    info={a.t("admin.drawer.track.info.holderSharePct")}
                    error={fe("holderSharePct")}
                  >
                    <Input
                      id="tr-holder"
                      className={cn("tabular-nums", adminFieldInput)}
                      value={form.holderSharePct}
                      onChange={(e) => set("holderSharePct", e.target.value)}
                      readOnly={readOnly}
                      aria-invalid={Boolean(fe("holderSharePct"))}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.artistSharePct")}
                    htmlFor="tr-artist-share"
                    info={a.t("admin.drawer.track.info.artistSharePct")}
                    error={fe("artistSharePct")}
                  >
                    <Input
                      id="tr-artist-share"
                      className={cn("tabular-nums", adminFieldInput)}
                      value={form.artistSharePct}
                      onChange={(e) => set("artistSharePct", e.target.value)}
                      readOnly={readOnly}
                      aria-invalid={Boolean(fe("artistSharePct"))}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.platformSharePct")}
                    htmlFor="tr-platform"
                    info={a.t("admin.drawer.track.info.platformSharePct")}
                    error={fe("platformSharePct")}
                  >
                    <Input
                      id="tr-platform"
                      className={cn("tabular-nums", adminFieldInput)}
                      value={form.platformSharePct}
                      onChange={(e) => set("platformSharePct", e.target.value)}
                      readOnly={readOnly}
                      aria-invalid={Boolean(fe("platformSharePct"))}
                    />
                  </AdminFormField>
                </div>
                <FieldHint text={TRACK_FIELD_TOOLTIPS.sharesTotal} />
                <ShareBar form={form} />
              </Section>

              <Section title={a.t("admin.drawer.track.section.units")}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.totalUnits")}
                    htmlFor="tr-total"
                    info={a.t("admin.drawer.track.info.totalUnits")}
                    error={fe("totalUnits")}
                  >
                    <Input
                      id="tr-total"
                      className={cn("tabular-nums", adminFieldInput)}
                      value={form.totalUnits}
                      onChange={(e) => set("totalUnits", e.target.value)}
                      readOnly={readOnly}
                      aria-invalid={Boolean(fe("totalUnits"))}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.availablePrimary")}
                    htmlFor="tr-avail"
                    info={a.t("admin.drawer.track.info.availablePrimary")}
                    error={fe("availableUnits")}
                  >
                    <Input
                      id="tr-avail"
                      className={cn("tabular-nums", adminFieldInput)}
                      value={form.availableUnits}
                      onChange={(e) => set("availableUnits", e.target.value)}
                      readOnly={readOnly}
                      aria-invalid={Boolean(fe("availableUnits"))}
                    />
                  </AdminFormField>
                  <AdminFormField label={a.t("admin.drawer.track.field.sold")}>
                    <Input
                      className={cn("tabular-nums opacity-70", adminFieldInput)}
                      value={track?.soldUnits ?? "0"}
                      readOnly
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.unitPrice")}
                    htmlFor="tr-price"
                    info={a.t("admin.drawer.track.info.unitPrice")}
                    error={fe("primaryUnitPrice")}
                  >
                    <Input
                      id="tr-price"
                      className={cn("tabular-nums", adminFieldInput)}
                      value={form.primaryUnitPrice}
                      onChange={(e) => set("primaryUnitPrice", e.target.value)}
                      readOnly={readOnly}
                      aria-invalid={Boolean(fe("primaryUnitPrice"))}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.minPurchase")}
                    htmlFor="tr-min"
                    info={a.t("admin.drawer.track.info.minPurchase")}
                    error={fe("minPurchaseUnits")}
                  >
                    <Input
                      id="tr-min"
                      className={cn("tabular-nums", adminFieldInput)}
                      value={form.minPurchaseUnits}
                      onChange={(e) => set("minPurchaseUnits", e.target.value)}
                      readOnly={readOnly}
                      aria-invalid={Boolean(fe("minPurchaseUnits"))}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.maxPurchase")}
                    htmlFor="tr-max"
                    info={a.t("admin.drawer.track.info.maxPurchase")}
                  >
                    <Input
                      id="tr-max"
                      className={cn("tabular-nums", adminFieldInput)}
                      value={form.maxPurchaseUnits}
                      onChange={(e) => set("maxPurchaseUnits", e.target.value)}
                      readOnly={readOnly}
                      placeholder={a.t("admin.drawer.track.field.maxPurchasePlaceholder")}
                    />
                  </AdminFormField>
                </div>
                <UnitsPoolBar form={form} soldUnits={track?.soldUnits ?? "0"} />
              </Section>

              <Section title={a.t("admin.drawer.track.section.financial")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.raiseTarget")}
                    htmlFor="tr-raise"
                    info={a.t("admin.drawer.track.info.raiseTarget")}
                  >
                    <Input
                      id="tr-raise"
                      className={cn("tabular-nums", adminFieldInput)}
                      value={form.raiseTargetUsdt}
                      onChange={(e) => set("raiseTargetUsdt", e.target.value)}
                      readOnly={readOnly}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.hardCap")}
                    htmlFor="tr-cap"
                    info={a.t("admin.drawer.track.info.hardCap")}
                  >
                    <Input
                      id="tr-cap"
                      className={cn("tabular-nums", adminFieldInput)}
                      value={form.hardCapUsdt}
                      onChange={(e) => set("hardCapUsdt", e.target.value)}
                      readOnly={readOnly}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.promoBudget")}
                    htmlFor="tr-promo"
                    info={a.t("admin.drawer.track.info.promoBudget")}
                  >
                    <Input
                      id="tr-promo"
                      className={cn("tabular-nums", adminFieldInput)}
                      value={form.promoBudgetUsdt}
                      onChange={(e) => set("promoBudgetUsdt", e.target.value)}
                      readOnly={readOnly}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.artistAdvance")}
                    htmlFor="tr-adv-a"
                    info={a.t("admin.drawer.track.info.artistAdvance")}
                  >
                    <Input
                      id="tr-adv-a"
                      className={cn("tabular-nums", adminFieldInput)}
                      value={form.artistUpfrontUsdt}
                      onChange={(e) => set("artistUpfrontUsdt", e.target.value)}
                      readOnly={readOnly}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.platformAdvance")}
                    htmlFor="tr-adv-p"
                    info={a.t("admin.drawer.track.info.platformAdvance")}
                  >
                    <Input
                      id="tr-adv-p"
                      className={cn("tabular-nums", adminFieldInput)}
                      value={form.platformUpfrontUsdt}
                      onChange={(e) => set("platformUpfrontUsdt", e.target.value)}
                      readOnly={readOnly}
                    />
                  </AdminFormField>
                  <AdminFormField
                    label={a.t("admin.drawer.track.field.distributionNotes")}
                    htmlFor="tr-notes"
                    info={a.t("admin.drawer.track.info.distributionNotes")}
                    className="sm:col-span-2"
                  >
                    <AdminTextarea
                      id="tr-notes"
                      className="min-h-[88px]"
                      value={form.distributionNotes}
                      onChange={(e) => set("distributionNotes", e.target.value)}
                      readOnly={readOnly}
                      placeholder={a.t("admin.drawer.track.field.distributionNotesPlaceholder")}
                    />
                  </AdminFormField>
                </div>
              </Section>

              <Section title={a.t("admin.faq.sectionTitle")} description={a.t("admin.faq.sectionDesc")}>
                <AdminReleaseFaqPanel releaseId={track?.id ?? null} readOnly={readOnly} />
              </Section>

              <Section title={a.t("admin.drawer.track.section.publish")}>
                <TrackPublishChecklistBranch items={checklist} onNavigate={scrollToField} />
                <FieldHint text={TRACK_FIELD_TOOLTIPS.primaryRound} />
              </Section>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
              <AdminTrackCatalogPreview form={form} />
              {saving ? (
                <p className="flex items-center gap-2 text-xs text-zinc-500">
                  <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
                  Сохранение…
                </p>
              ) : null}
            </aside>
          </div>
        )}
      </AdminDetailDrawer>

      {confirmAction ? (
        <AdminConfirmDialog
          open
          onOpenChange={(o) => !o && setConfirmAction(null)}
          title={confirmMeta[confirmAction].title}
          description={confirmMeta[confirmAction].description}
          confirmLabel={confirmMeta[confirmAction].label}
          variant={confirmAction === "archive" ? "destructive" : "default"}
          onConfirm={() => void runConfirmedAction()}
        />
      ) : null}
      {UnsavedChangesDialog}
    </>
  );
}
