"use client";

import * as React from "react";
import { Layers, Music2 } from "@/lib/lucide";

import {
  AdminDrawerGhostButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminFieldInput, adminMetricLabel } from "@/features/admin/lib/admin-ui";
import {
  revenueFieldTooltip,
  revenueSourceLabel,
  revenueSourceOptions,
} from "@/features/admin/lib/admin-revenue-i18n";
import { formatUsdtAmount, isAdminMetricEmpty } from "@/features/admin/lib/admin-format";
import type { AdminRevenuePreview } from "@/features/admin/mocks/admin-revenue.mock";
import {
  AdminConfirmDialog,
  AdminDataTable,
  AdminDatePicker,
  AdminDetailDrawer,
  AdminFormField,
  AdminFormFooter,
  AdminLoadingState,
} from "@/features/admin/ui";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { listAdminTracks } from "@/services/admin/adminTracks.service";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import {
  approveAdminRevenueDistribution,
  createAdminRevenueEvent,
  previewAdminDistribution,
  runAdminDistribution,
  saveAdminDistributionPreview,
  submitAdminRevenueForReview,
} from "@/services/admin/adminRevenue.service";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

type AdminRevenueCreateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: AdminApiClient;
  onCreated?: () => void;
};

const drawerPanel = "rounded-2xl bg-zinc-900/40 p-4";
const STEP_LABELS = ["Релиз", "Доход", "Preview", "Запуск"] as const;

function StepProgress({ step }: { step: Step }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              s <= step ? "bg-[#B7F500]" : "bg-zinc-800",
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {STEP_LABELS.map((label, index) => {
          const stepNum = (index + 1) as Step;
          return (
            <span
              key={label}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
                stepNum === step
                  ? "bg-zinc-800 text-[#B7F500]"
                  : stepNum < step
                    ? "text-emerald-400"
                    : "text-zinc-500",
              )}
            >
              {stepNum}. {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

type MetricTone = "neutral" | "success" | "info" | "muted";

function PreviewMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: MetricTone;
}) {
  const valueClass =
    tone === "success"
      ? "text-emerald-400"
      : tone === "info"
        ? "text-sky-400"
        : tone === "muted"
          ? "text-zinc-500"
          : "text-zinc-100";
  const compact = value.replace(/\s/g, "").length > 14;
  return (
    <div className="flex min-h-[5.5rem] min-w-0 flex-col rounded-2xl bg-zinc-900/40 p-3.5">
      <p className={adminMetricLabel}>{label}</p>
      <p
        className={cn(
          "mt-1 font-semibold tabular-nums tracking-tight break-words",
          compact ? "text-base leading-snug sm:text-lg" : "text-lg sm:text-xl",
          valueClass,
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

export function AdminRevenueCreateDrawer({
  open,
  onOpenChange,
  client,
  onCreated,
}: AdminRevenueCreateDrawerProps) {
  const a = useAdminI18n();
  const { locale } = a;
  const sourceOptions = React.useMemo(() => revenueSourceOptions(locale), [locale]);
  const [step, setStep] = React.useState<Step>(1);
  const [trackSearch, setTrackSearch] = React.useState("");
  const [tracks, setTracks] = React.useState<Array<{ id: string; title: string; artist?: string }>>([]);
  const [tracksLoading, setTracksLoading] = React.useState(false);
  const [selectedTrackId, setSelectedTrackId] = React.useState("");
  const [form, setForm] = React.useState({
    grossRevenue: "",
    source: "streaming",
    periodFrom: "",
    periodTo: "",
    note: "",
  });
  const [revenueEventId, setRevenueEventId] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<AdminRevenuePreview | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [runConfirm, setRunConfirm] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setStep(1);
    setTrackSearch("");
    setSelectedTrackId("");
    setForm({ grossRevenue: "", source: "streaming", periodFrom: "", periodTo: "", note: "" });
    setRevenueEventId(null);
    setPreview(null);
    setError(null);
  }, [open]);

  React.useEffect(() => {
    if (!open || step !== 1) return;
    let cancelled = false;
    setTracksLoading(true);
    void listAdminTracks(client)
      .then((rows) => {
        if (!cancelled) {
          setTracks(
            rows.map((t) => ({
              id: t.id,
              title: t.title,
              artist: t.artist,
            })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setTracks([]);
      })
      .finally(() => {
        if (!cancelled) setTracksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, step, client]);

  const filteredTracks = tracks.filter((t) => {
    if (!trackSearch.trim()) return true;
    const q = trackSearch.trim().toLowerCase();
    return t.title.toLowerCase().includes(q) || (t.artist?.toLowerCase().includes(q) ?? false);
  });

  async function handleCreateDraft() {
    setError(null);
    if (!selectedTrackId || !form.grossRevenue || !form.periodFrom || !form.periodTo) {
      setError("Выберите релиз и заполните сумму и период.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createAdminRevenueEvent(
        {
          trackId: selectedTrackId,
          grossRevenue: form.grossRevenue.replace(/\s/g, "").replace(",", "."),
          source: form.source,
          periodFrom: form.periodFrom,
          periodTo: form.periodTo,
          note: form.note || undefined,
        },
        client,
      );
      setRevenueEventId(created.id);
      setStep(3);
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePreview() {
    if (!revenueEventId) return;
    setPreviewLoading(true);
    setError(null);
    try {
      const p = await previewAdminDistribution(revenueEventId, client);
      setPreview(p);
      await saveAdminDistributionPreview(revenueEventId, client);
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleRun() {
    if (!revenueEventId) return;
    setSubmitting(true);
    try {
      await submitAdminRevenueForReview(revenueEventId, client);
      await approveAdminRevenueDistribution(revenueEventId, client);
      await runAdminDistribution(revenueEventId, form.note || undefined, client);
      setRunConfirm(false);
      onOpenChange(false);
      onCreated?.();
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);
  const grossDisplay = isAdminMetricEmpty(form.grossRevenue)
    ? "0,00 USDT"
    : formatUsdtAmount(form.grossRevenue.replace(/\s/g, "").replace(",", "."));

  return (
    <>
      <AdminDetailDrawer
        open={open}
        onOpenChange={onOpenChange}
        wide
        borderless
        widthClassName="w-[min(720px,100vw)]"
        title={a.t("admin.drawer.revenueCreate.title")}
        subtitle={a.t("admin.drawer.revenueCreate.stepSubtitle").replace("{step}", String(step))}
        footer={
          <AdminFormFooter
            left={
              step > 1 ? (
                <AdminDrawerSecondaryButton onClick={() => setStep((step - 1) as Step)}>
                  Назад
                </AdminDrawerSecondaryButton>
              ) : (
                <AdminDrawerGhostButton onClick={() => onOpenChange(false)}>
                  {a.t("admin.drawer.common.close")}
                </AdminDrawerGhostButton>
              )
            }
            right={
              step === 1 ? (
                <AdminDrawerPrimaryButton disabled={!selectedTrackId} onClick={() => setStep(2)}>
                  К параметрам дохода
                </AdminDrawerPrimaryButton>
              ) : step === 2 ? (
                <AdminDrawerPrimaryButton disabled={submitting} onClick={() => void handleCreateDraft()}>
                  {submitting ? a.t("admin.drawer.common.saving") : a.t("admin.drawer.revenueCreate.saveAndPreview")}
                </AdminDrawerPrimaryButton>
              ) : step === 3 ? (
                preview ? (
                  <AdminDrawerPrimaryButton disabled={!preview.holdersCount} onClick={() => setStep(4)}>
                    К подтверждению
                  </AdminDrawerPrimaryButton>
                ) : (
                  <AdminDrawerPrimaryButton onClick={() => void handlePreview()} disabled={previewLoading}>
                    Рассчитать начисления
                  </AdminDrawerPrimaryButton>
                )
              ) : (
                <AdminDrawerPrimaryButton disabled={submitting || !preview} onClick={() => setRunConfirm(true)}>
                  Запустить начисление
                </AdminDrawerPrimaryButton>
              )
            }
          />
        }
      >
        <div className="space-y-5 pb-4">
          <StepProgress step={step} />

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          {step === 1 ? (
            <div className={cn(drawerPanel, "space-y-4")}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Выбор релиза</p>
              <AdminFormField
                label={a.t("admin.drawer.revenueCreate.searchRelease")}
                htmlFor="track-search"
              >
                <Input
                  id="track-search"
                  value={trackSearch}
                  onChange={(e) => setTrackSearch(e.target.value)}
                  placeholder={a.t("admin.drawer.revenueCreate.searchPlaceholder")}
                  className={adminFieldInput}
                />
              </AdminFormField>
              {tracksLoading ? (
                <AdminLoadingState
                  label={a.t("admin.empty.loading")}
                  className="border-0 bg-transparent py-8 shadow-none"
                />
              ) : null}
              <div className="max-h-72 space-y-2 overflow-y-auto revshare-scrollbar">
                {filteredTracks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm transition-colors",
                      selectedTrackId === t.id
                        ? "bg-zinc-800/80 ring-1 ring-[#B7F500]/35"
                        : "bg-zinc-900/35 hover:bg-zinc-800/45",
                    )}
                    onClick={() => setSelectedTrackId(t.id)}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-500">
                      <Music2 className="size-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-100">{t.title}</p>
                      {t.artist ? (
                        <p className="truncate text-xs text-zinc-500">{t.artist}</p>
                      ) : null}
                    </div>
                  </button>
                ))}
                {!tracksLoading && !filteredTracks.length ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Layers className="size-8 text-zinc-600" strokeWidth={1.5} />
                    <p className="text-sm text-zinc-500">Релизы не найдены</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              {selectedTrack ? (
                <div className={drawerPanel}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Релиз</p>
                  <p className="mt-2 font-medium text-zinc-100">{selectedTrack.title}</p>
                  {selectedTrack.artist ? (
                    <p className="mt-0.5 text-sm text-zinc-500">{selectedTrack.artist}</p>
                  ) : null}
                </div>
              ) : null}
              <div className={cn(drawerPanel, "space-y-4")}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Параметры дохода</p>
                <AdminStyledSelectField
                  label={a.t("admin.drawer.revenueCreate.sourceLabel")}
                  id="source"
                  value={form.source}
                  options={sourceOptions.filter((o) => o.value !== "all").map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  onChange={(source) => setForm({ ...form, source })}
                />
                <AdminFormField label="Gross amount (USDT)" htmlFor="gross">
                  <Input
                    id="gross"
                    value={form.grossRevenue}
                    onChange={(e) => setForm({ ...form, grossRevenue: e.target.value })}
                    placeholder="12400.00"
                    className={cn(adminFieldInput, "tabular-nums")}
                  />
                </AdminFormField>
                <div className="grid grid-cols-2 gap-3">
                  <AdminFormField label={a.t("admin.drawer.revenueCreate.periodFrom")} htmlFor="from">
                    <AdminDatePicker
                      id="from"
                      value={form.periodFrom}
                      onChange={(periodFrom) => setForm({ ...form, periodFrom })}
                    />
                  </AdminFormField>
                  <AdminFormField label={a.t("admin.drawer.revenueCreate.periodTo")} htmlFor="to">
                    <AdminDatePicker
                      id="to"
                      value={form.periodTo}
                      onChange={(periodTo) => setForm({ ...form, periodTo })}
                    />
                  </AdminFormField>
                </div>
                <AdminFormField label={a.t("admin.drawer.revenueCreate.noteOptional")} htmlFor="note">
                  <Input
                    id="note"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className={adminFieldInput}
                  />
                </AdminFormField>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className={drawerPanel}>
                <p className="text-sm text-zinc-400">
                  Источник:{" "}
                  <span className="font-medium text-zinc-200">{revenueSourceLabel(form.source, locale)}</span>
                  {" · "}
                  Gross: <span className="font-medium tabular-nums text-emerald-400">{grossDisplay}</span>
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{revenueFieldTooltip("preview", locale)}</p>
              </div>
              {previewLoading ? (
                <AdminLoadingState
                  label={a.t("admin.empty.loading")}
                  className="border-0 bg-transparent py-8 shadow-none"
                />
              ) : null}
              {preview ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <PreviewMetric
                      label="Держателям"
                      value={formatUsdtAmount(preview.holdersAmount)}
                      tone="success"
                    />
                    <PreviewMetric
                      label="Артисту"
                      value={formatUsdtAmount(preview.artistAmount)}
                      tone="info"
                    />
                    <PreviewMetric
                      label="Платформе"
                      value={formatUsdtAmount(preview.platformAmount)}
                      tone="neutral"
                    />
                  </div>
                  <AdminDataTable
                    flat
                    borderless
                    className="[&_table]:min-w-[520px]"
                    rowKey={(h) => h.userId}
                    columns={[
                      { key: "email", header: a.table.holder, render: (h) => h.userEmail },
                      { key: "units", header: a.table.units, render: (h) => h.units },
                      { key: "pct", header: "%", render: (h) => `${h.percentage}%` },
                      {
                        key: "pay",
                        header: "Начисление",
                        render: (h) => (
                          <span className="tabular-nums text-emerald-400">{formatUsdtAmount(h.payoutAmount)}</span>
                        ),
                      },
                    ]}
                    rows={preview.holders}
                  />
                </>
              ) : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className={cn(drawerPanel, "space-y-4")}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Подтверждение</p>
              <p className="text-sm leading-relaxed text-zinc-300">
                Запуск распределения выполняется оператором. Средства будут зачислены держателям через wallet
                ledger. Повторное начисление за один период защищено уникальным ограничением.
              </p>
              {preview ? (
                <div className="rounded-2xl bg-zinc-900/35 px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">К начислению</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-400">
                    {formatUsdtAmount(preview.holdersAmount)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">{preview.holdersCount} держателей</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </AdminDetailDrawer>

      <AdminConfirmDialog
        open={runConfirm}
        onOpenChange={setRunConfirm}
        title={a.t("admin.drawer.revenue.confirmRunTitle")}
        description={a.t("admin.drawer.revenue.confirmRunDesc")}
        confirmLabel={a.t("admin.drawer.revenue.confirmRunLabel")}
        onConfirm={() => void handleRun()}
      />
    </>
  );
}
