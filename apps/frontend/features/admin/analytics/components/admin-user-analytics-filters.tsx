"use client";

import { Button } from "@/components/ui/button";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import { adminAnalyticsFilterBar } from "@/features/admin/analytics/lib/admin-analytics-theme";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { cn } from "@/lib/utils";

export type UserAnalyticsFilters = {
  status: string;
  segment: string;
  role: string;
};

type Props = {
  value: UserAnalyticsFilters;
  onChange: (next: UserAnalyticsFilters) => void;
  className?: string;
};

export function AdminUserAnalyticsFilters({ value, onChange, className }: Props) {
  const a = useAdminI18n();

  const statusOptions = [
    { id: "", label: a.t("admin.analytics.common.allStatuses") },
    { id: "active", label: a.formatAdminStatus("active") },
    { id: "suspended", label: a.formatAdminStatus("blocked") },
    { id: "pending", label: a.formatAdminStatus("pending") },
  ];

  const segmentOptions = [
    { id: "", label: a.t("admin.analytics.common.allSegments") },
    { id: "new", label: a.t("admin.analytics.filters.user.segment.new") },
    { id: "deposited", label: a.t("admin.analytics.filters.user.segment.deposited") },
    { id: "holders", label: a.t("admin.analytics.filters.user.segment.holders") },
    { id: "dormant", label: a.t("admin.analytics.filters.user.segment.dormant") },
    { id: "risk", label: a.t("admin.analytics.filters.user.segment.risk") },
  ];

  const roleOptions = [
    { id: "", label: a.t("admin.analytics.common.allRoles") },
    { id: "user", label: a.adminRoleLabel("USER") },
    { id: "investor", label: a.adminRoleLabel("INVESTOR") },
  ];

  return (
    <div
      className={cn(adminAnalyticsFilterBar, className)}
    >
      <FilterSelect
        label={a.t("admin.analytics.common.status")}
        value={value.status}
        options={statusOptions}
        onChange={(status) => onChange({ ...value, status })}
      />
      <FilterSelect
        label={a.t("admin.analytics.common.segment")}
        value={value.segment}
        options={segmentOptions}
        onChange={(segment) => onChange({ ...value, segment })}
      />
      <FilterSelect
        label={a.t("admin.analytics.common.role")}
        value={value.role}
        options={roleOptions}
        onChange={(role) => onChange({ ...value, role })}
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => onChange({ status: "", segment: "", role: "" })}
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
