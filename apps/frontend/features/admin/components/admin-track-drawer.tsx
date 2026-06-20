"use client";

import * as React from "react";
import { CheckCircle2, Circle, HelpCircle } from "@/lib/lucide";
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
} from "@/features/admin/lib/admin-track-form";
import {
  adminFieldInput,
} from "@/features/admin/lib/admin-ui";
import {
  AdminConfirmDialog,
  AdminDetailDrawer,
  AdminFormField,
  AdminFormFooter,
  AdminLoadingState,
  AdminMediaUploadButton,
  AdminTextarea,
  AdminCheckboxRow,
} from "@/features/admin/ui";
import { useAdminDrawerUnsavedGuard } from "@/features/admin/hooks/use-admin-drawer-unsaved-guard";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { cn } from "@/lib/utils";

export type { AdminTrackFormBody };

const STATUSES = ["draft", "review", "published", "active", "paused", "completed", "archived"] as const;

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

function ShareBar({ form }: { form: AdminTrackFormBody }) {
  const a = useAdminI18n();
  const total = shareSplitTotal(form);
  const ok = Math.abs(total - 100) < 0.01;
  const items = [
    { label: a.t("admin.drawer.track.shareHolders"), value: form.holderSharePct, color: "bg-sky-500" },
    { label: a.t("admin.drawer.track.shareArtist"), value: form.artistSharePct, color: "bg-violet-500" },
    { label: a.t("admin.drawer.track.sharePlatform"), value: form.platformSharePct, color: "bg-zinc-500" },
  ];
  return (
    <div className="rounded-xl bg-zinc-900/60 p-3">
      <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800/70">
        {items.map((item) => {
          const pct = Math.max(0, Number(item.value) || 0);
          return (
            <div
              key={item.label}
              className={cn("h-full transition-all", item.color)}
              style={{ width: `${Math.min(100, pct)}%` }}
              title={`${item.label}: ${pct}%`}
            />
          );
        })}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="text-xs">
            <span className="text-zinc-500">{item.label}</span>
            <span className="ml-1 font-semibold tabular-nums text-zinc-200">{item.value || 0}%</span>
          </div>
        ))}
      </div>
      <p className={cn("mt-2 text-xs font-medium", ok ? "text-emerald-700" : "text-amber-700")}>
        {a
          .t("admin.drawer.track.shareTotal")
          .replace("{total}", total.toFixed(1))
          .replace("{ok}", ok ? "✓" : a.t("admin.drawer.track.shareMustBe100"))}
      </p>
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
                <AdminDrawerGhostButton onClick={() => onOpenChange(false)}>
                  {a.t("admin.drawer.common.close")}
                </AdminDrawerGhostButton>
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
                <>
                  <AdminDrawerCancelButton disabled={saving} onClick={() => guardedOnOpenChange(false)}>
                    {a.t("admin.drawer.common.cancel")}
                  </AdminDrawerCancelButton>
                  <AdminDrawerSecondaryButton disabled={saving} onClick={() => void save("draft")}>
                    {saving ? a.t("admin.drawer.common.saving") : a.t("admin.drawer.track.saveDraft")}
                  </AdminDrawerSecondaryButton>
                  {mode === "edit" && onSubmitReview ? (
                    <AdminDrawerSecondaryButton disabled={saving} onClick={() => void save("review")}>
                      {a.t("admin.drawer.track.submitReview")}
                    </AdminDrawerSecondaryButton>
                  ) : null}
                  {mode === "edit" && canPublish && onPublish ? (
                    <AdminDrawerPrimaryButton
                      disabled={saving || !publishReady}
                      title={!publishReady ? "Заполните обязательные поля из чеклиста публикации" : undefined}
                      onClick={() => {
                        const errs = validateTrackForm(form, "publish");
                        if (errs.length) {
                          setErrors(errs);
                          return;
                        }
                        setConfirmAction("publish");
                      }}
                    >
                      {a.t("admin.drawer.track.publish")}
                    </AdminDrawerPrimaryButton>
                  ) : null}
                  {mode === "edit" && canPublish && onPause && track?.status === "active" ? (
                    <AdminDrawerSecondaryButton disabled={saving} onClick={() => setConfirmAction("pause")}>
                      {a.t("admin.drawer.track.pause")}
                    </AdminDrawerSecondaryButton>
                  ) : null}
                  {mode === "edit" && canPublish && onArchive && track?.status !== "archived" ? (
                    <AdminDrawerDangerButton disabled={saving} onClick={() => setConfirmAction("archive")}>
                      {a.t("admin.drawer.track.archive")}
                    </AdminDrawerDangerButton>
                  ) : null}
                  {mode === "create" ? (
                    <AdminDrawerPrimaryButton disabled={saving} onClick={() => void save("draft")}>
                      {saving ? a.t("admin.drawer.track.creating") : a.t("admin.drawer.track.create")}
                    </AdminDrawerPrimaryButton>
                  ) : (
                    <AdminDrawerPrimaryButton disabled={saving} onClick={() => void save("draft")}>
                      {saving ? a.t("admin.drawer.common.saving") : a.t("admin.drawer.track.saveChanges")}
                    </AdminDrawerPrimaryButton>
                  )}
                </>
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
                    hint={a.t("admin.drawer.track.field.genreHint")}
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
                    <Input
                      id="tr-date"
                      type="date"
                      className={adminFieldInput}
                      value={form.releaseDate}
                      onChange={(e) => set("releaseDate", e.target.value)}
                      readOnly={readOnly}
                    />
                  </AdminFormField>
                  <AdminStyledSelectField
                    label={a.t("admin.drawer.track.field.crmStatus")}
                    id="tr-status"
                    info={a.t("admin.drawer.track.info.crmStatus")}
                    value={form.status}
                    disabled
                    hint={a.t("admin.drawer.track.field.statusHint")}
                    options={STATUSES.map((s) => ({
                      value: s,
                      label: a.formatTrackStatus(s),
                    }))}
                    onChange={() => undefined}
                  />
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
                  {track ? (
                    <AdminFormField label={a.t("admin.drawer.track.field.sold")}>
                      <Input
                        className={cn("tabular-nums opacity-70", adminFieldInput)}
                        value={track.soldUnits}
                        readOnly
                      />
                    </AdminFormField>
                  ) : null}
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
                <ul className="space-y-2">
                  {checklist.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left text-sm transition hover:bg-zinc-800/50"
                        onClick={() => scrollToField(item.fieldId)}
                        disabled={!item.fieldId}
                      >
                        {item.ok ? (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                        ) : (
                          <Circle className="size-4 shrink-0 text-zinc-300" />
                        )}
                        <span className={item.ok ? "text-zinc-300" : "text-zinc-500"}>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
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
