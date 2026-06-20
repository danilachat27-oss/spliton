"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "@/lib/lucide";

import {
  AdminDrawerGhostButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import {
  getReportCatalogEntry,
  groupReportsByDomain,
  REPORT_DOMAIN_LABELS,
  type ReportCatalogEntry,
  type ReportDomainId,
} from "@/features/admin/config/admin-reports-catalog";
import { canGenerateReportType } from "@/features/admin/config/admin-rbac";
import {
  REPORT_PERIOD_PRESETS,
  XLSX_DISABLED_MESSAGE,
} from "@/features/admin/lib/admin-reports-i18n";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { AdminDetailDrawer, AdminFormField, AdminFormFooter, AdminStatusBadge } from "@/features/admin/ui";
import { adminFieldInput } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";
import type { AdminReportType } from "@/services/admin/adminReports.service";

type Step = 1 | 2 | 3 | 4 | 5;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allowedReports: ReportCatalogEntry[];
  actorRoles?: string[];
  actorEmail?: string;
  storageMode?: string;
  initialTemplate?: AdminReportType;
  onGenerate: (payload: {
    type: AdminReportType;
    dateFrom: string;
    dateTo: string;
    format: "csv" | "xlsx" | "pdf" | "docx";
  }) => Promise<void>;
};

function applyPreset(preset: string): { from: string; to: string } {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (preset === "today") return { from: today, to: today };
  if (preset === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const d = y.toISOString().slice(0, 10);
    return { from: d, to: d };
  }
  if (preset === "7d") {
    const f = new Date(now);
    f.setDate(f.getDate() - 7);
    return { from: f.toISOString().slice(0, 10), to: today };
  }
  if (preset === "30d") {
    const f = new Date(now);
    f.setDate(f.getDate() - 30);
    return { from: f.toISOString().slice(0, 10), to: today };
  }
  if (preset === "this_month") {
    const f = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: f.toISOString().slice(0, 10), to: today };
  }
  if (preset === "last_month") {
    const f = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const t = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: f.toISOString().slice(0, 10), to: t.toISOString().slice(0, 10) };
  }
  return { from: "", to: "" };
}

export function AdminReportCreateDrawer({
  open,
  onOpenChange,
  allowedReports,
  actorRoles,
  actorEmail,
  storageMode = "db",
  initialTemplate,
  onGenerate,
}: Props) {
  const a = useAdminI18n();
  const [step, setStep] = React.useState<Step>(1);
  const [domainFilter, setDomainFilter] = React.useState<ReportDomainId | "all">("all");
  const [reportType, setReportType] = React.useState<AdminReportType>(
    initialTemplate ?? allowedReports[0]?.value ?? "withdrawals",
  );
  const [preset, setPreset] = React.useState("30d");
  const [range, setRange] = React.useState({ from: "", to: "" });
  const [format, setFormat] = React.useState<"csv" | "xlsx" | "pdf" | "docx">("csv");
  const [submitting, setSubmitting] = React.useState(false);

  const entry = getReportCatalogEntry(reportType);
  const byDomain = groupReportsByDomain(allowedReports);

  React.useEffect(() => {
    if (open) {
      setStep(1);
      setReportType(initialTemplate ?? allowedReports[0]?.value ?? "withdrawals");
      setPreset("30d");
      const r = applyPreset("30d");
      setRange(r);
      setFormat("csv");
    }
  }, [open, allowedReports, initialTemplate]);

  React.useEffect(() => {
    if (preset !== "custom") setRange(applyPreset(preset));
  }, [preset]);

  async function submit() {
    setSubmitting(true);
    try {
      await onGenerate({
        type: reportType,
        dateFrom: range.from,
        dateTo: range.to,
        format,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  const templates =
    domainFilter === "all"
      ? allowedReports
      : byDomain[domainFilter] ?? [];

  return (
    <AdminDetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      wide
      title={a.t("admin.drawer.reportCreate.title")}
      subtitle={a.t("admin.reports.exportCenter")}
      footer={
        <AdminFormFooter
          left={
            <AdminDrawerSecondaryButton
              disabled={step === 1}
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              <ChevronLeft className="size-4" />
              Назад
            </AdminDrawerSecondaryButton>
          }
          right={
            step < 5 ? (
              <AdminDrawerPrimaryButton onClick={() => setStep((s) => (s + 1) as Step)}>
                Далее
                <ChevronRight className="size-4" />
              </AdminDrawerPrimaryButton>
            ) : (
              <AdminDrawerPrimaryButton disabled={submitting} onClick={() => void submit()}>
                {submitting ? "Формирование…" : "Сформировать отчёт"}
              </AdminDrawerPrimaryButton>
            )
          }
        />
      }
    >
      <p className="mb-4 text-xs text-zinc-500">Шаг {step} из 5</p>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium",
                domainFilter === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100",
              )}
              onClick={() => setDomainFilter("all")}
            >
              Все
            </button>
            {(Object.keys(REPORT_DOMAIN_LABELS) as ReportDomainId[]).map((d) => (
              <button
                key={d}
                type="button"
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-medium",
                  domainFilter === d ? "bg-zinc-900 text-white" : "bg-zinc-100",
                )}
                onClick={() => setDomainFilter(d)}
              >
                {REPORT_DOMAIN_LABELS[d]}
              </button>
            ))}
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {templates.map((t) => {
              const allowed = canGenerateReportType(actorRoles, t.value);
              return (
                <li key={t.value}>
                  <button
                    type="button"
                    disabled={!allowed}
                    onClick={() => allowed && setReportType(t.value)}
                    className={cn(
                      "h-full w-full rounded-xl border p-3 text-left text-sm transition-colors",
                      reportType === t.value ? "border-zinc-900 bg-zinc-50" : "border-zinc-800",
                      !allowed && "opacity-50",
                    )}
                  >
                    <span className="font-semibold">{t.label}</span>
                    <p className="mt-1 text-xs text-zinc-500">{t.description}</p>
                    {t.sensitive ? (
                      <AdminStatusBadge label="sensitive" tone="warning" className="mt-2" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {entry ? (
            <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-400">
              <p className="font-medium text-zinc-200">{entry.longDescription}</p>
              <p className="mt-2">Поля: {entry.fields.join(", ")}</p>
              <p className="mt-1">Роли: {entry.roles.join(", ")}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {REPORT_PERIOD_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium",
                  preset === p.id ? "bg-zinc-900 text-white" : "bg-zinc-100",
                )}
                onClick={() => setPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminFormField label={a.t("admin.drawer.reportCreate.dateFrom")} htmlFor="rpt-from">
              <Input
                id="rpt-from"
                type="date"
                value={range.from}
                onChange={(e) => {
                  setPreset("custom");
                  setRange((r) => ({ ...r, from: e.target.value }));
                }}
                className={adminFieldInput}
              />
            </AdminFormField>
            <AdminFormField label={a.t("admin.drawer.reportCreate.dateTo")} htmlFor="rpt-to">
              <Input
                id="rpt-to"
                type="date"
                value={range.to}
                onChange={(e) => {
                  setPreset("custom");
                  setRange((r) => ({ ...r, to: e.target.value }));
                }}
                className={adminFieldInput}
              />
            </AdminFormField>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <p className="text-sm text-zinc-400">
          Дополнительные фильтры (статус, user, release) будут доступны в следующей версии. Сейчас
          экспорт формируется по периоду и типу отчёта.
        </p>
      ) : null}

      {step === 4 ? (
        <div className="space-y-3">
          {(["csv", "xlsx", "pdf", "docx"] as const).map((f) => {
            const complianceOnly = f === "docx";
            const disabled =
              complianceOnly &&
              !["risk_flags", "audit_logs", "revenue_distributions"].includes(reportType);
            return (
              <button
                key={f}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setFormat(f)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm",
                  format === f && !disabled ? "border-zinc-900 bg-zinc-50" : "border-zinc-800",
                  disabled && "opacity-50",
                )}
              >
                <span className="font-medium uppercase">{f}</span>
                {disabled ? (
                  <span className="text-xs text-zinc-500">Только compliance/finance отчёты</span>
                ) : (
                  <span className="text-xs text-emerald-700">Доступен</span>
                )}
              </button>
            );
          })}
        </div>
      ) : null}

      {step === 5 ? (
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-zinc-500">Тип</dt>
            <dd className="font-medium">{entry?.label ?? reportType}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Период</dt>
            <dd>
              {range.from || "—"} — {range.to || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Формат</dt>
            <dd className="uppercase">{format}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Объём</dt>
            <dd>{entry?.estimatedVolume ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Создаёт</dt>
            <dd>{actorEmail ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Storage</dt>
            <dd>{storageMode}</dd>
          </div>
        </dl>
      ) : null}
    </AdminDetailDrawer>
  );
}
