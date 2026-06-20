"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "@/lib/lucide";

import {
  AdminDrawerGhostButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
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
} from "@/features/admin/lib/admin-reports-i18n";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { ADMIN_METRIC_NA_LABEL } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_NOTICE, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { AdminDetailDrawer, AdminDatePicker, AdminFormField, AdminFormFooter, AdminStatusBadge } from "@/features/admin/ui";
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

function reportDomainChip(active: boolean) {
  return cn(
    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
    active
      ? "bg-zinc-800 text-zinc-100 ring-1 ring-[#B7F500]/40"
      : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200",
  );
}

function reportTypeCard(active: boolean, disabled: boolean) {
  return cn(
    ADMIN_SECTION_TILE,
    "h-full w-full p-3 text-left text-sm transition-colors",
    active && "ring-1 ring-[#B7F500]/40",
    !active && "hover:bg-zinc-900/70",
    disabled && "cursor-not-allowed opacity-50",
  );
}

function reportFormatCard(active: boolean, disabled: boolean) {
  return cn(
    ADMIN_SECTION_TILE,
    "flex w-full items-center justify-between px-4 py-3 text-sm transition-colors",
    active && !disabled && "ring-1 ring-[#B7F500]/40",
    !active && !disabled && "hover:bg-zinc-900/70",
    disabled && "cursor-not-allowed opacity-50",
  );
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
      borderless
      widthClassName="w-[min(720px,100vw)]"
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
      <p className={cn(ADMIN_SECTION_NOTICE, "mb-4 text-xs text-zinc-500")}>Шаг {step} из 5</p>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={reportDomainChip(domainFilter === "all")}
              onClick={() => setDomainFilter("all")}
            >
              Все
            </button>
            {(Object.keys(REPORT_DOMAIN_LABELS) as ReportDomainId[]).map((d) => (
              <button
                key={d}
                type="button"
                className={reportDomainChip(domainFilter === d)}
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
                    className={reportTypeCard(reportType === t.value, !allowed)}
                  >
                    <span className="font-semibold text-zinc-100">{t.label}</span>
                    <p className="mt-1 text-xs text-zinc-500">{t.description}</p>
                    {t.sensitive ? (
                      <AdminStatusBadge
                        label={a.t("admin.reports.sensitive")}
                        tone="warning"
                        className="mt-2"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {entry ? (
            <div className={cn(ADMIN_SECTION_TILE, "space-y-2 text-xs")}>
              <p className="font-medium text-zinc-200">{entry.longDescription}</p>
              <p className="text-zinc-500">Поля: {entry.fields.join(", ")}</p>
              <p className="text-zinc-500">Роли: {entry.roles.join(", ")}</p>
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
                className={reportDomainChip(preset === p.id)}
                onClick={() => setPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminFormField label={a.t("admin.drawer.reportCreate.dateFrom")} htmlFor="rpt-from">
              <AdminDatePicker
                id="rpt-from"
                value={range.from}
                onChange={(from) => {
                  setPreset("custom");
                  setRange((r) => ({ ...r, from }));
                }}
              />
            </AdminFormField>
            <AdminFormField label={a.t("admin.drawer.reportCreate.dateTo")} htmlFor="rpt-to">
              <AdminDatePicker
                id="rpt-to"
                value={range.to}
                onChange={(to) => {
                  setPreset("custom");
                  setRange((r) => ({ ...r, to }));
                }}
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
                className={reportFormatCard(format === f, disabled)}
              >
                <span className="font-medium uppercase text-zinc-100">{f}</span>
                {disabled ? (
                  <span className="text-xs text-zinc-500">Только compliance/finance отчёты</span>
                ) : (
                  <span className="text-xs text-emerald-400">Доступен</span>
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
            <dd className="text-zinc-200">
              {range.from || ADMIN_METRIC_NA_LABEL} · {range.to || ADMIN_METRIC_NA_LABEL}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Формат</dt>
            <dd className="uppercase">{format}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Объём</dt>
            <dd className="text-zinc-200">{entry?.estimatedVolume ?? ADMIN_METRIC_NA_LABEL}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Создаёт</dt>
            <dd className="text-zinc-200">{actorEmail ?? ADMIN_METRIC_NA_LABEL}</dd>
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
