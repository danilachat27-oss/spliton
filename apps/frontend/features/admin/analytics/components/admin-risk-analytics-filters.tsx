"use client";

import { Button } from "@/components/ui/button";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import { adminAnalyticsFilterBar } from "@/features/admin/analytics/lib/admin-analytics-theme";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { cn } from "@/lib/utils";

export type RiskAnalyticsFilters = {
  severity: string;
  entityType: string;
  ruleCode: string;
  status: string;
};

type Props = {
  value: RiskAnalyticsFilters;
  onChange: (next: RiskAnalyticsFilters) => void;
  className?: string;
};

const RULE_CODES = [
  "wd_velocity",
  "first_wd_large",
  "multi_address",
  "wash_trade_suspect",
  "price_outlier",
  "kyc_mismatch",
  "compliance_hold",
  "manual_flag",
] as const;

export function AdminRiskAnalyticsFilters({ value, onChange, className }: Props) {
  const a = useAdminI18n();

  const severityOptions = [
    { id: "", label: a.t("admin.analytics.common.allSeverity") },
    { id: "low", label: a.complianceSeverityLabel("low") },
    { id: "medium", label: a.complianceSeverityLabel("medium") },
    { id: "high", label: a.complianceSeverityLabel("high") },
    { id: "critical", label: a.complianceSeverityLabel("critical") },
  ];

  const entityOptions = [
    { id: "", label: a.t("admin.analytics.common.allTypes") },
    { id: "user", label: a.formatAuditEntity("user") },
    { id: "withdrawal", label: a.formatAuditEntity("withdrawal") },
    { id: "deposit", label: a.formatAuditEntity("deposit") },
    { id: "trade", label: a.formatAuditEntity("trade") },
    { id: "listing", label: a.formatAuditEntity("listing") },
    { id: "wallet", label: a.formatAuditEntity("wallet") },
    { id: "order", label: a.t("admin.analytics.common.entityType") },
  ];

  const ruleOptions = [
    { id: "", label: a.t("admin.analytics.common.allRules") },
    ...RULE_CODES.map((code) => ({ id: code, label: code })),
  ];

  const statusOptions = [
    { id: "", label: a.t("admin.analytics.common.allStatuses") },
    { id: "open", label: a.formatAdminStatus("open") },
    { id: "reviewed", label: a.formatAdminStatus("reviewed") },
    { id: "on_hold", label: a.formatAdminStatus("on_hold") },
    { id: "blocked", label: a.formatAdminStatus("blocked") },
  ];

  return (
    <div
      className={cn(adminAnalyticsFilterBar, className)}
    >
      <FilterSelect
        label={a.t("admin.analytics.common.severity")}
        value={value.severity}
        options={severityOptions}
        onChange={(severity) => onChange({ ...value, severity })}
      />
      <FilterSelect
        label={a.t("admin.analytics.common.entityType")}
        value={value.entityType}
        options={entityOptions}
        onChange={(entityType) => onChange({ ...value, entityType })}
      />
      <FilterSelect
        label={a.t("admin.analytics.common.rule")}
        value={value.ruleCode}
        options={ruleOptions}
        onChange={(ruleCode) => onChange({ ...value, ruleCode })}
      />
      <FilterSelect
        label={a.t("admin.analytics.common.status")}
        value={value.status}
        options={statusOptions}
        onChange={(status) => onChange({ ...value, status })}
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => onChange({ severity: "", entityType: "", ruleCode: "", status: "" })}
      >
        {a.t("admin.analytics.common.reset")}
      </Button>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <AdminStyledSelectField
      label={label}
      value={value}
      options={options.map((o) => ({ value: o.id, label: o.label }))}
      onChange={onChange}
      className="text-zinc-500"
    />
  );
}
