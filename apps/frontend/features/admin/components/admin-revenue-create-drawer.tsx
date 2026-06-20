"use client";

import * as React from "react";

import {
  AdminDrawerGhostButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminFieldInput } from "@/features/admin/lib/admin-ui";
import {
  REVENUE_FIELD_TOOLTIPS,
  REVENUE_SOURCE_OPTIONS,
  revenueSourceLabel,
} from "@/features/admin/lib/admin-revenue-i18n";
import { formatUsdtAmount } from "@/features/admin/lib/admin-format";
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

type Step = 1 | 2 | 3 | 4;

type AdminRevenueCreateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: AdminApiClient;
  onCreated?: () => void;
};

export function AdminRevenueCreateDrawer({
  open,
  onOpenChange,
  client,
  onCreated,
}: AdminRevenueCreateDrawerProps) {
  const a = useAdminI18n();
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

  return (
    <>
      <AdminDetailDrawer
        open={open}
        onOpenChange={onOpenChange}
        wide
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
              ) : undefined
            }
            right={
              step === 1 ? (
                <AdminDrawerPrimaryButton disabled={!selectedTrackId} onClick={() => setStep(2)}>
                  Далее — доход
                </AdminDrawerPrimaryButton>
              ) : step === 2 ? (
                <AdminDrawerPrimaryButton disabled={submitting} onClick={() => void handleCreateDraft()}>
                  Сохранить и перейти к preview
                </AdminDrawerPrimaryButton>
              ) : step === 3 ? (
                preview ? (
                  <AdminDrawerPrimaryButton disabled={!preview.holdersCount} onClick={() => setStep(4)}>
                    Далее — подтверждение
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
        <div className="mb-4 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? "bg-zinc-900" : "bg-zinc-200"}`}
            />
          ))}
        </div>

        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        {step === 1 ? (
          <div className="space-y-4 pb-4">
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
            {tracksLoading ? <AdminLoadingState /> : null}
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {filteredTracks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selectedTrackId === t.id
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-800 hover:border-zinc-300"
                  }`}
                  onClick={() => setSelectedTrackId(t.id)}
                >
                  <p className="font-medium">{t.title}</p>
                  {t.artist ? <p className="text-xs text-zinc-500">{t.artist}</p> : null}
                </button>
              ))}
              {!tracksLoading && !filteredTracks.length ? (
                <p className="py-4 text-center text-sm text-zinc-500">Релизы не найдены</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4 pb-4">
            {selectedTrack ? (
              <p className="text-sm text-zinc-400">
                Релиз: <span className="font-medium text-zinc-100">{selectedTrack.title}</span>
              </p>
            ) : null}
            <AdminStyledSelectField
              label={a.t("admin.drawer.revenueCreate.sourceLabel")}
              id="source"
              value={form.source}
              options={REVENUE_SOURCE_OPTIONS.filter((o) => o.value !== "all").map((o) => ({
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
                className={adminFieldInput}
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
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Источник: {revenueSourceLabel(form.source)} · Gross: {form.grossRevenue || "—"} USDT
            </p>
            <p className="text-[11px] text-zinc-500">{REVENUE_FIELD_TOOLTIPS.preview}</p>
            {previewLoading ? <AdminLoadingState /> : null}
            {preview ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>Держателям: {formatUsdtAmount(preview.holdersAmount)}</div>
                  <div>Артисту: {formatUsdtAmount(preview.artistAmount)}</div>
                  <div>Платформе: {formatUsdtAmount(preview.platformAmount)}</div>
                </div>
                <AdminDataTable
                  className="border-0 shadow-none"
                  rowKey={(h) => h.userId}
                  columns={[
                    { key: "email", header: a.table.holder, render: (h) => h.userEmail },
                    { key: "units", header: a.table.units, render: (h) => h.units },
                    { key: "pct", header: "%", render: (h) => `${h.percentage}%` },
                    { key: "pay", header: "Начисление", render: (h) => formatUsdtAmount(h.payoutAmount) },
                  ]}
                  rows={preview.holders}
                />
              </>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-zinc-300">
              Запуск распределения выполняется оператором. Средства будут зачислены держателям через wallet
              ledger. Повторное начисление за один период защищено уникальным ограничением.
            </p>
            {preview ? (
              <p className="text-sm font-medium">
                К начислению: {formatUsdtAmount(preview.holdersAmount)} · {preview.holdersCount} держателей
              </p>
            ) : null}
          </div>
        ) : null}
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
