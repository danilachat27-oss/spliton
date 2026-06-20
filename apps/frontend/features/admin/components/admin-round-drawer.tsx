"use client";

import * as React from "react";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { AlertTriangle, CheckCircle2, Circle, HelpCircle, TrendingUp } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import {
  AdminDrawerCancelButton,
  AdminDrawerDangerButton,
  AdminDrawerGhostButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import { AdminRoundCatalogPreview } from "@/features/admin/components/admin-round-catalog-preview";
import type { AdminRoundListItem } from "@/features/admin/mocks/admin-rounds.mock";
import type { AdminTrackListItem } from "@/features/admin/mocks/admin-tracks.mock";
import {
  buildRoundPublishChecklist,
  emptyRoundForm,
  formatUnitsLabel,
  ROUND_BUYER_WHITELIST_TODO,
  ROUND_FIELD_TOOLTIPS,
  roundAvailableUnits,
  roundFormFromItem,
  roundFormFromTrack,
  roundFullSalePotential,
  roundProgressPct,
  roundPublishBlockedReason,
  releaseStatusLabel,
  validateRoundForm,
  type AdminRoundFormBody,
} from "@/features/admin/lib/admin-round-form";
import { formatAdminDateShort, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import {
  AdminConfirmDialog,
  AdminDetailDrawer,
  AdminFormField,
  AdminFormFooter,
  AdminLoadingState,
  AdminStatusBadge,
} from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { useAdminDrawerUnsavedGuard } from "@/features/admin/hooks/use-admin-drawer-unsaved-guard";
import { adminFieldInput } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

export type { AdminRoundFormBody };

const STATUSES = ["draft", "live", "paused", "completed", "cancelled"] as const;

type AdminRoundDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  round: AdminRoundListItem | null;
  trackOptions: AdminTrackListItem[];
  selectedRelease: AdminTrackListItem | null;
  loadingRelease?: boolean;
  mode: "create" | "edit";
  saving?: boolean;
  loading?: boolean;
  readOnly?: boolean;
  canPublish?: boolean;
  hasLiveConflict?: boolean;
  onTrackSelect: (trackId: string) => void;
  onSubmit: (body: AdminRoundFormBody, asDraft?: boolean) => Promise<void>;
  onPublish?: () => Promise<void>;
  onPause?: () => Promise<void>;
  onClose?: () => Promise<void>;
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

const ROUND_VALIDATION_FIELD: Record<string, string> = {
  "Выберите релиз": "trackId",
  "Укажите название раунда": "name",
  "Всего юнитов должно быть больше 0": "totalUnits",
  "Цена за юнит должна быть больше 0": "unitPriceUsdt",
  "Минимальная покупка должна быть больше 0": "minPurchaseUnits",
  "Максимальная покупка не может быть меньше минимальной": "maxPurchaseUnits",
  "Продано не может превышать всего юнитов": "soldUnits",
  "Максимальный лимит не может быть меньше цели раунда": "hardCapUsdt",
  "Дата окончания не может быть раньше даты начала": "endDate",
  "Активный раунд должен иметь дату начала": "startDate",
};

function roundFieldError(validationError: string | null, field: string): string | null {
  if (!validationError) return null;
  if (
    validationError === "Финансовые лимиты не могут быть отрицательными" &&
    (field === "raiseTargetUsdt" || field === "hardCapUsdt")
  ) {
    return validationError;
  }
  return ROUND_VALIDATION_FIELD[validationError] === field ? validationError : null;
}

function ReleaseSummaryCard({ release }: { release: AdminTrackListItem }) {
  const a = useAdminI18n();
  return (
    <div className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
        {release.coverUrl?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={release.coverUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-[10px] text-zinc-400">
            {a.t("admin.drawer.common.noCover")}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <AdminStatusBadge label={releaseStatusLabel(release.status)} tone="neutral" />
          <span className="text-[10px] text-zinc-500">{release.genre}</span>
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-zinc-100">{release.title}</p>
        <p className="truncate text-xs text-zinc-500">{release.artist}</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-400">
          <span>{a.t("admin.rounds.holderShare").replace("{pct}", String(release.holderSharePct))}</span>
          <span>{a.t("admin.rounds.totalUnits").replace("{units}", formatUnitsLabel(release.totalUnits))}</span>
          <span>
            {a.t("admin.rounds.availablePrimary").replace("{units}", formatUnitsLabel(release.availableUnits))}
          </span>
        </div>
        {!release.coverUrl?.trim() ? (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-amber-700">
            <AlertTriangle className="size-3" />
            {a.t("admin.rounds.noCoverWarning")}
          </p>
        ) : null}
        {!release.artist?.trim() || release.artist === "—" ? (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-700">
            <AlertTriangle className="size-3" />
            {a.t("admin.rounds.noArtistWarning")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AdminRoundDrawer({
  open,
  onOpenChange,
  round,
  trackOptions,
  selectedRelease,
  loadingRelease,
  mode,
  saving,
  loading,
  readOnly = false,
  canPublish = true,
  hasLiveConflict = false,
  onTrackSelect,
  onSubmit,
  onPublish,
  onPause,
  onClose,
}: AdminRoundDrawerProps) {
  const a = useAdminI18n();
  const [form, setForm] = React.useState<AdminRoundFormBody>(emptyRoundForm);
  const [baselineForm, setBaselineForm] = React.useState<AdminRoundFormBody>(emptyRoundForm);
  const [confirmPublish, setConfirmPublish] = React.useState(false);
  const [confirmPause, setConfirmPause] = React.useState(false);
  const [confirmClose, setConfirmClose] = React.useState(false);
  const [trackSearch, setTrackSearch] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    const next = round ? roundFormFromItem(round) : emptyRoundForm();
    setForm(next);
    setBaselineForm(next);
    setTrackSearch("");
    setConfirmPublish(false);
    setConfirmPause(false);
    setConfirmClose(false);
  }, [open, round]);

  const dirty = React.useMemo(
    () => JSON.stringify(form) !== JSON.stringify(baselineForm),
    [form, baselineForm],
  );
  const { guardedOnOpenChange, UnsavedChangesDialog } = useAdminDrawerUnsavedGuard({
    open,
    dirty: dirty && !saving,
    onOpenChange,
  });

  React.useEffect(() => {
    if (!open || mode !== "create" || !selectedRelease || round) return;
    setForm((f) => ({
      ...f,
      ...roundFormFromTrack(selectedRelease),
      trackId: selectedRelease.id,
    }));
  }, [open, mode, selectedRelease, round]);

  const release = selectedRelease;
  const hasRelease = Boolean(form.trackId.trim());
  const available = roundAvailableUnits(form);
  const progress = roundProgressPct(form);
  const potential = roundFullSalePotential(form);
  const validationError = validateRoundForm(form);
  const re = (field: string) => roundFieldError(validationError, field);
  const checklist = buildRoundPublishChecklist(form, release, round, hasLiveConflict);
  const publishBlocked = roundPublishBlockedReason(form, release, round, hasLiveConflict);
  const canPublishNow =
    canPublish && !readOnly && !publishBlocked && (round?.status === "draft" || round?.status === "paused");

  const filteredTracks = trackOptions.filter((t) => {
    const q = trackSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    );
  });

  const previewTitle = release?.title ?? round?.trackTitle ?? "";
  const previewArtist = release?.artist ?? round?.trackArtist ?? "";
  const previewCover = release?.coverUrl ?? round?.trackCoverUrl ?? null;
  const previewGenre = release?.genre ?? round?.trackGenre ?? "—";

  return (
    <>
      <AdminDetailDrawer
        open={open}
        onOpenChange={guardedOnOpenChange}
        wide
        widthClassName="w-[min(1120px,100vw)]"
        title={
          mode === "create"
            ? a.t("admin.rounds.create.title")
            : a
                .t("admin.rounds.edit.title")
                .replace("{name}", round?.name ?? round?.trackTitle ?? "")
        }
        subtitle={
          mode === "create"
            ? a.t("admin.rounds.create.subtitle")
            : round
              ? `ID ${round.id}`
              : undefined
        }
        footer={
          readOnly ? (
            <AdminFormFooter
              right={
                <AdminDrawerGhostButton onClick={() => guardedOnOpenChange(false)}>
                  {a.t("admin.drawer.common.close")}
                </AdminDrawerGhostButton>
              }
            />
          ) : (
            <AdminFormFooter
              left={
                <>
                  {mode === "edit" && round && onPublish && (round.status === "draft" || round.status === "paused") ? (
                    <AdminDrawerSecondaryButton
                      disabled={saving || !canPublishNow}
                      title={publishBlocked ?? undefined}
                      onClick={() => setConfirmPublish(true)}
                    >
                      {a.t("admin.rounds.publish")}
                    </AdminDrawerSecondaryButton>
                  ) : null}
                  {mode === "edit" && round && onPause && round.status === "live" ? (
                    <AdminDrawerSecondaryButton disabled={saving} onClick={() => setConfirmPause(true)}>
                      {a.t("admin.rounds.pause")}
                    </AdminDrawerSecondaryButton>
                  ) : null}
                  {mode === "edit" && round && onClose && (round.status === "live" || round.status === "paused") ? (
                    <AdminDrawerDangerButton disabled={saving} onClick={() => setConfirmClose(true)}>
                      {a.t("admin.rounds.close")}
                    </AdminDrawerDangerButton>
                  ) : null}
                </>
              }
              right={
                <>
                  <AdminDrawerCancelButton disabled={saving} onClick={() => guardedOnOpenChange(false)}>
                    {a.t("admin.drawer.common.cancel")}
                  </AdminDrawerCancelButton>
                  {mode === "create" ? (
                    <AdminDrawerSecondaryButton
                      disabled={saving || !hasRelease || Boolean(validationError)}
                      onClick={() => void onSubmit(form, true).then(() => setBaselineForm(form))}
                    >
                      {saving ? a.t("admin.drawer.common.saving") : a.t("admin.rounds.saveDraft")}
                    </AdminDrawerSecondaryButton>
                  ) : null}
                  <AdminDrawerPrimaryButton
                    disabled={saving || !hasRelease || Boolean(validationError)}
                    title={validationError ?? undefined}
                    onClick={() => void onSubmit(form, false).then(() => setBaselineForm(form))}
                  >
                    {saving
                      ? a.t("admin.drawer.common.saving")
                      : mode === "create"
                        ? a.t("admin.rounds.createBtn")
                        : a.t("admin.rounds.saveChanges")}
                  </AdminDrawerPrimaryButton>
                </>
              }
            />
          )
        }
      >
        {loading || saving ? (
          <AdminLoadingState
            label={loading ? a.t("admin.rounds.loading") : a.t("admin.rounds.saving")}
          />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5 pb-4">
            {round ? (
              <p className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">
                {round.id}
                <AdminCopyButton value={round.id} />
              </p>
            ) : null}

            <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
                <TrendingUp className="size-[18px]" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-100">
                  {hasRelease ? previewTitle : a.t("admin.rounds.selectRelease")}
                </p>
                <p className="text-xs text-zinc-500">
                  {hasRelease
                    ? a
                        .t("admin.rounds.raisedProgress")
                        .replace("{raised}", formatUsdtAmount(form.raisedAmountUsdt))
                        .replace("{progress}", String(progress))
                        .replace("{available}", formatUnitsLabel(available))
                    : a.t("admin.rounds.paramsAfterSelect")}
                </p>
              </div>
              {round || form.status ? (
                <AdminStatusBadge label={a.formatRoundStatus(form.status)} tone="success" />
              ) : null}
            </div>

            <Section
              title={a.t("admin.rounds.section.release")}
              description={a.t("admin.rounds.section.releaseDesc")}
            >
              <AdminFormField label={a.t("admin.rounds.searchRelease")} htmlFor="rnd-track-search">
                <Input
                  id="rnd-track-search"
                  className={adminFieldInput}
                  placeholder={a.t("admin.rounds.searchPlaceholder")}
                  value={trackSearch}
                  disabled={readOnly || mode === "edit"}
                  onChange={(e) => setTrackSearch(e.target.value)}
                />
              </AdminFormField>
              <AdminStyledSelectField
                label={a.t("admin.rounds.releaseLabel")}
                id="rnd-track"
                value={form.trackId}
                disabled={readOnly || mode === "edit"}
                placeholder={a.t("admin.rounds.selectReleasePlaceholder")}
                hint={a.t("admin.rounds.releaseHint")}
                error={re("trackId")}
                options={[
                  { value: "", label: a.t("admin.rounds.selectReleasePlaceholder") },
                  ...filteredTracks.map((t) => ({
                    value: t.id,
                    label: `${t.title} · ${t.artist} (${releaseStatusLabel(t.status)})`,
                  })),
                ]}
                onChange={(id) => {
                  setForm((f) => ({ ...f, trackId: id }));
                  onTrackSelect(id);
                }}
              />
              {loadingRelease ? (
                <p className="flex items-center gap-2 text-xs text-zinc-500">
                  <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
                  {a.t("admin.rounds.loadingRelease")}
                </p>
              ) : release ? (
                <ReleaseSummaryCard release={release} />
              ) : hasRelease ? (
                <p className="text-xs text-zinc-500">{a.t("admin.rounds.releaseLoading")}</p>
              ) : null}
            </Section>

            {hasRelease ? (
              <>
                <Section
                  title={a.t("admin.rounds.section.params")}
                  description={a.t("admin.rounds.section.paramsDesc")}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AdminFormField
                      label={a.t("admin.rounds.nameLabel")}
                      htmlFor="rnd-name"
                      hint={ROUND_FIELD_TOOLTIPS.name}
                      error={re("name")}
                      className="sm:col-span-2"
                    >
                      <Input
                        id="rnd-name"
                        className={adminFieldInput}
                        placeholder={a.t("admin.rounds.namePlaceholder")}
                        value={form.name}
                        disabled={readOnly}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        aria-invalid={Boolean(re("name"))}
                      />
                    </AdminFormField>
                    <AdminStyledSelectField
                      label={a.t("admin.drawer.common.status")}
                      id="rnd-status"
                      value={form.status}
                      disabled
                      hint={a.t("admin.rounds.statusHint")}
                      options={STATUSES.map((s) => ({
                        value: s,
                        label: a.formatRoundStatus(s),
                      }))}
                      onChange={() => undefined}
                    />
                    <AdminFormField label={a.t("admin.rounds.startDate")} htmlFor="rnd-start" error={re("startDate")}>
                      <Input
                        id="rnd-start"
                        type="date"
                        className={adminFieldInput}
                        value={form.startDate}
                        disabled={readOnly}
                        onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                        aria-invalid={Boolean(re("startDate"))}
                      />
                    </AdminFormField>
                    <AdminFormField
                      label={a.t("admin.rounds.endDate")}
                      htmlFor="rnd-end"
                      hint={a.t("admin.rounds.endDateHint")}
                      error={re("endDate")}
                    >
                      <Input
                        id="rnd-end"
                        type="date"
                        className={adminFieldInput}
                        value={form.endDate}
                        disabled={readOnly}
                        min={form.startDate || undefined}
                        onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                        aria-invalid={Boolean(re("endDate"))}
                      />
                    </AdminFormField>
                  </div>
                </Section>

                <Section title={a.t("admin.rounds.section.units")} description={a.t("admin.rounds.section.unitsDesc")}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AdminFormField
                      label={a.t("admin.rounds.totalUnitsLabel")}
                      htmlFor="rnd-total"
                      error={re("totalUnits")}
                    >
                      <Input
                        id="rnd-total"
                        className={cn("tabular-nums", adminFieldInput)}
                        value={form.totalUnits}
                        disabled={readOnly}
                        onChange={(e) => setForm((f) => ({ ...f, totalUnits: e.target.value }))}
                        aria-invalid={Boolean(re("totalUnits"))}
                      />
                    </AdminFormField>
                    <AdminFormField
                      label={a.t("admin.rounds.availableForSale")}
                      hint={a.t("admin.rounds.availableCalcHint")}
                    >
                      <Input
                        className={cn("tabular-nums opacity-70", adminFieldInput)}
                        value={String(available)}
                        readOnly
                      />
                    </AdminFormField>
                    <AdminFormField
                      label={a.t("admin.rounds.alreadySold")}
                      htmlFor="rnd-sold"
                      hint={a.t("admin.rounds.soldHint")}
                      error={re("soldUnits")}
                    >
                      <Input
                        id="rnd-sold"
                        className={cn("tabular-nums opacity-70", adminFieldInput)}
                        value={form.soldUnits}
                        readOnly={readOnly || parseInt(form.soldUnits, 10) > 0}
                        disabled={readOnly}
                        onChange={(e) => setForm((f) => ({ ...f, soldUnits: e.target.value }))}
                        aria-invalid={Boolean(re("soldUnits"))}
                      />
                    </AdminFormField>
                    <AdminFormField
                      label={a.t("admin.rounds.unitPrice")}
                      htmlFor="rnd-price"
                      hint={ROUND_FIELD_TOOLTIPS.unitPrice}
                      error={re("unitPriceUsdt")}
                    >
                      <Input
                        id="rnd-price"
                        className={cn("tabular-nums", adminFieldInput)}
                        value={form.unitPriceUsdt}
                        disabled={readOnly}
                        onChange={(e) => setForm((f) => ({ ...f, unitPriceUsdt: e.target.value }))}
                        aria-invalid={Boolean(re("unitPriceUsdt"))}
                      />
                    </AdminFormField>
                    <AdminFormField
                      label={a.t("admin.rounds.minPurchase")}
                      htmlFor="rnd-min"
                      hint={ROUND_FIELD_TOOLTIPS.minPurchase}
                      error={re("minPurchaseUnits")}
                    >
                      <Input
                        id="rnd-min"
                        className={cn("tabular-nums", adminFieldInput)}
                        value={form.minPurchaseUnits}
                        disabled={readOnly}
                        onChange={(e) => setForm((f) => ({ ...f, minPurchaseUnits: e.target.value }))}
                        aria-invalid={Boolean(re("minPurchaseUnits"))}
                      />
                    </AdminFormField>
                    <AdminFormField
                      label={a.t("admin.rounds.maxPurchase")}
                      htmlFor="rnd-max"
                      hint={ROUND_FIELD_TOOLTIPS.maxPurchase}
                      error={re("maxPurchaseUnits")}
                    >
                      <Input
                        id="rnd-max"
                        className={cn("tabular-nums", adminFieldInput)}
                        placeholder={a.t("admin.rounds.noLimit")}
                        value={form.maxPurchaseUnits}
                        disabled={readOnly}
                        onChange={(e) => setForm((f) => ({ ...f, maxPurchaseUnits: e.target.value }))}
                        aria-invalid={Boolean(re("maxPurchaseUnits"))}
                      />
                    </AdminFormField>
                  </div>
                </Section>

                <Section
                  title={a.t("admin.rounds.section.limits")}
                  description={a.t("admin.rounds.section.limitsDesc")}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AdminFormField
                      label={a.t("admin.rounds.raiseTarget")}
                      htmlFor="rnd-raise"
                      hint={ROUND_FIELD_TOOLTIPS.raiseTarget}
                      error={re("raiseTargetUsdt")}
                    >
                      <Input
                        id="rnd-raise"
                        className={cn("tabular-nums", adminFieldInput)}
                        value={form.raiseTargetUsdt}
                        disabled={readOnly}
                        onChange={(e) => setForm((f) => ({ ...f, raiseTargetUsdt: e.target.value }))}
                        aria-invalid={Boolean(re("raiseTargetUsdt"))}
                      />
                    </AdminFormField>
                    <AdminFormField
                      label={a.t("admin.rounds.hardCap")}
                      htmlFor="rnd-cap"
                      hint={ROUND_FIELD_TOOLTIPS.hardCap}
                      error={re("hardCapUsdt")}
                    >
                      <Input
                        id="rnd-cap"
                        className={cn("tabular-nums", adminFieldInput)}
                        value={form.hardCapUsdt}
                        disabled={readOnly}
                        onChange={(e) => setForm((f) => ({ ...f, hardCapUsdt: e.target.value }))}
                        aria-invalid={Boolean(re("hardCapUsdt"))}
                      />
                    </AdminFormField>
                    <AdminFormField label={a.t("admin.rounds.alreadyRaised")} hint={ROUND_FIELD_TOOLTIPS.raised}>
                      <Input
                        className={cn("tabular-nums opacity-70", adminFieldInput)}
                        value={formatUsdtAmount(form.raisedAmountUsdt)}
                        readOnly
                      />
                    </AdminFormField>
                    <AdminFormField label={a.t("admin.rounds.progress")}>
                      <div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                          <div
                            className="h-full rounded-full bg-neutral-900 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs tabular-nums text-zinc-500">{progress}%</p>
                      </div>
                    </AdminFormField>
                    <div className="sm:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                        {a.t("admin.rounds.fullSalePotential")}
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-100">
                        {formatUsdtAmount(potential)}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {formatUnitsLabel(form.totalUnits)} × {formatUsdtAmount(form.unitPriceUsdt || "0")}
                      </p>
                    </div>
                  </div>
                </Section>

                <Section title={a.t("admin.rounds.section.userTerms")}>
                  <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-sm text-zinc-300">
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-500">{a.t("admin.rounds.minPurchaseTerm")}</span>
                      <span className="font-medium tabular-nums">{formatUnitsLabel(form.minPurchaseUnits)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-500">{a.t("admin.rounds.maxPurchaseTerm")}</span>
                      <span className="font-medium tabular-nums">
                        {form.maxPurchaseUnits.trim() ? formatUnitsLabel(form.maxPurchaseUnits) : a.t("admin.rounds.noLimit")}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-500">{a.t("admin.rounds.platformFee")}</span>
                      <span className="font-medium">{a.t("admin.rounds.platformFeeValue")}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-500">{a.t("admin.rounds.whoCanBuy")}</span>
                      <span className="font-medium">{a.t("admin.rounds.allUsers")}</span>
                    </div>
                  </div>
                  <FieldHint text={`${ROUND_FIELD_TOOLTIPS.buyers} ${ROUND_BUYER_WHITELIST_TODO}`} />
                </Section>

                <Section title={a.t("admin.rounds.section.checklist")}>
                  <ul className="space-y-2">
                    {checklist.map((item) => (
                      <li key={item.id} className="flex items-start gap-2 text-sm">
                        {item.ok ? (
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                        ) : (
                          <Circle className="mt-0.5 size-4 shrink-0 text-zinc-300" />
                        )}
                        <span className={cn(item.ok ? "text-zinc-300" : "text-zinc-500")}>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                  {publishBlocked && canPublish ? (
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                      Опубликовать нельзя: {publishBlocked}
                    </p>
                  ) : null}
                </Section>
              </>
            ) : (
              <Section title={a.t("admin.rounds.section.paramsEmpty")}>
                <p className="text-sm text-zinc-500">{a.t("admin.rounds.paramsEmptyDesc")}</p>
              </Section>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-4 space-y-4">
              <AdminRoundCatalogPreview
                form={form}
                releaseTitle={previewTitle}
                releaseArtist={previewArtist}
                releaseCoverUrl={previewCover}
                releaseGenre={previewGenre}
              />
              {form.endDate ? (
                <p className="text-center text-[11px] text-zinc-500">
                  Окончание: {formatAdminDateShort(form.endDate)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </AdminDetailDrawer>

      <AdminConfirmDialog
        open={confirmPublish}
        onOpenChange={setConfirmPublish}
        title={a.t("admin.rounds.confirm.publishTitle")}
        description={a.t("admin.rounds.confirm.publishDesc")}
        confirmLabel={a.t("admin.rounds.publish")}
        onConfirm={() => void onPublish?.()}
      />

      <AdminConfirmDialog
        open={confirmPause}
        onOpenChange={setConfirmPause}
        title={a.t("admin.rounds.confirm.pauseTitle")}
        description={a.t("admin.rounds.confirm.pauseDesc")}
        confirmLabel={a.t("admin.rounds.pause")}
        onConfirm={() => void onPause?.()}
      />

      <AdminConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title={a.t("admin.rounds.confirm.closeTitle")}
        description={a.t("admin.rounds.confirm.closeDesc")}
        confirmLabel={a.t("admin.rounds.close")}
        variant="destructive"
        onConfirm={() => void onClose?.()}
      />
      {UnsavedChangesDialog}
    </>
  );
}
