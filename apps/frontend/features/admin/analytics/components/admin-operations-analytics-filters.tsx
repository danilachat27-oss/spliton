"use client";

import { Button } from "@/components/ui/button";
import { AdminResponsiveFilters } from "@/features/admin/ui/admin-responsive-filters";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import {
  adminAnalyticsFilterBar,
  adminAnalyticsFilterField,
} from "@/features/admin/analytics/lib/admin-analytics-theme";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { cn } from "@/lib/utils";

export type OperationsAnalyticsFilters = {
  status: string;
  category: string;
  priority: string;
  team: string;
  managerId: string;
  groupBy: string;
  onlyEscalated: boolean;
  onlyFinance: boolean;
  onlyOverdue: boolean;
  onlyUnassigned: boolean;
  onlyHighPriority: boolean;
};

type Props = {
  value: OperationsAnalyticsFilters;
  onChange: (next: OperationsAnalyticsFilters) => void;
  managerOptions?: Array<{ id: string; label: string }>;
  className?: string;
};

export function AdminOperationsAnalyticsFilters({
  value,
  onChange,
  managerOptions = [],
  className,
}: Props) {
  const a = useAdminI18n();

  const statusOptions = [
    { id: "", label: a.t("admin.analytics.common.allStatuses") },
    { id: "open", label: a.formatAdminStatus("open") },
    { id: "in_progress", label: a.formatAdminStatus("in_progress") },
    { id: "waiting_user", label: a.formatAdminStatus("waiting_user") },
    { id: "escalated", label: a.formatAdminStatus("escalated") },
    { id: "closed", label: a.formatAdminStatus("closed") },
  ];

  const categoryOptions = [
    { id: "", label: a.t("admin.analytics.common.allCategories") },
    { id: "deposit", label: a.t("admin.analytics.filters.ops.category.deposit") },
    { id: "withdrawal", label: a.t("admin.analytics.filters.ops.category.withdrawal") },
    { id: "wallet", label: a.t("admin.analytics.filters.ops.category.wallet") },
    { id: "primary_purchase", label: a.t("admin.analytics.filters.ops.category.primary_purchase") },
    { id: "secondary_market", label: a.t("admin.analytics.filters.ops.category.secondary_market") },
    { id: "revenue_distribution", label: a.t("admin.analytics.filters.ops.category.revenue_distribution") },
    { id: "account", label: a.t("admin.analytics.filters.ops.category.account") },
    { id: "technical", label: a.t("admin.analytics.filters.ops.category.technical") },
    { id: "other", label: a.t("admin.analytics.filters.ops.category.other") },
  ];

  const priorityOptions = [
    { id: "", label: a.t("admin.analytics.common.allPriorities") },
    { id: "low", label: a.formatAdminStatus("low") },
    { id: "medium", label: a.formatAdminStatus("medium") },
    { id: "high", label: a.formatAdminStatus("high") },
    { id: "critical", label: a.complianceSeverityLabel("critical") },
  ];

  const teamOptions = [
    { id: "", label: a.t("admin.analytics.common.allTeams") },
    { id: "support", label: a.adminRoleLabel("SUPPORT") },
    { id: "finance", label: a.t("admin.navGroup.finance") },
    { id: "compliance", label: a.t("admin.section.compliance") },
    { id: "technical", label: a.t("admin.analytics.filters.ops.category.technical") },
  ];

  const groupByOptions = [
    { id: "", label: a.t("admin.analytics.period.byDay") },
    { id: "day", label: a.t("admin.analytics.period.day") },
    { id: "week", label: a.t("admin.analytics.period.week") },
    { id: "month", label: a.t("admin.analytics.period.month") },
  ];

  const emptyFilters: OperationsAnalyticsFilters = {
    status: "",
    category: "",
    priority: "",
    team: "",
    managerId: "",
    groupBy: "",
    onlyEscalated: false,
    onlyFinance: false,
    onlyOverdue: false,
    onlyUnassigned: false,
    onlyHighPriority: false,
  };

  const activeCount =
    (value.status ? 1 : 0) +
    (value.category ? 1 : 0) +
    (value.priority ? 1 : 0) +
    (value.team ? 1 : 0) +
    (value.managerId ? 1 : 0) +
    (value.groupBy ? 1 : 0) +
    (value.onlyEscalated ? 1 : 0) +
    (value.onlyFinance ? 1 : 0) +
    (value.onlyOverdue ? 1 : 0) +
    (value.onlyUnassigned ? 1 : 0) +
    (value.onlyHighPriority ? 1 : 0);

  return (
    <AdminResponsiveFilters
      activeCount={activeCount}
      onReset={activeCount > 0 ? () => onChange(emptyFilters) : undefined}
      panelClassName={cn(adminAnalyticsFilterBar, className)}
    >
      <FilterSelect
        label={a.t("admin.analytics.common.status")}
        value={value.status}
        options={statusOptions}
        onChange={(status) => onChange({ ...value, status })}
      />
      <FilterSelect
        label={a.t("admin.analytics.common.category")}
        value={value.category}
        options={categoryOptions}
        onChange={(category) => onChange({ ...value, category })}
      />
      <FilterSelect
        label={a.t("admin.analytics.common.priority")}
        value={value.priority}
        options={priorityOptions}
        onChange={(priority) => onChange({ ...value, priority })}
      />
      <FilterSelect
        label={a.t("admin.analytics.common.team")}
        value={value.team}
        options={teamOptions}
        onChange={(team) => onChange({ ...value, team })}
      />
      {managerOptions.length > 0 ? (
        <FilterSelect
          label={a.t("admin.analytics.common.manager")}
          value={value.managerId}
          options={[
            { id: "", label: a.t("admin.analytics.common.all") },
            ...managerOptions.map((m) => ({ id: m.id, label: m.label })),
          ]}
          onChange={(managerId) => onChange({ ...value, managerId })}
        />
      ) : null}
      <FilterSelect
        label={a.t("admin.analytics.common.groupBy")}
        value={value.groupBy}
        options={groupByOptions}
        onChange={(groupBy) => onChange({ ...value, groupBy })}
      />
      <div className="flex flex-wrap gap-3 pb-1.5">
        <Toggle
          checked={value.onlyEscalated}
          label={a.t("admin.analytics.filters.ops.toggle.escalated")}
          onChange={(onlyEscalated) => onChange({ ...value, onlyEscalated })}
        />
        <Toggle checked={value.onlyFinance} label="Finance" onChange={(onlyFinance) => onChange({ ...value, onlyFinance })} />
        <Toggle checked={value.onlyOverdue} label="SLA overdue" onChange={(onlyOverdue) => onChange({ ...value, onlyOverdue })} />
        <Toggle
          checked={value.onlyUnassigned}
          label={a.t("admin.analytics.filters.ops.toggle.unassigned")}
          onChange={(onlyUnassigned) => onChange({ ...value, onlyUnassigned })}
        />
        <Toggle checked={value.onlyHighPriority} label="High+" onChange={(onlyHighPriority) => onChange({ ...value, onlyHighPriority })} />
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="hidden md:inline-flex"
        onClick={() => onChange(emptyFilters)}
      >
        {a.t("admin.analytics.common.reset")}
      </Button>
    </AdminResponsiveFilters>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-zinc-400">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
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
      className={cn(adminAnalyticsFilterField, "text-zinc-500")}
    />
  );
}
