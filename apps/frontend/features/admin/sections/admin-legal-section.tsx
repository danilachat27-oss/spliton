"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { AdminDataTable, AdminLocalizedStatusBadge, type AdminColumn } from "@/features/admin/ui";

type LegalPolicyRow = {
  id: string;
  type: string;
  version: string;
  title: string;
  status: string;
  requiresUserConsent: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

export function AdminLegalSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const [rows, setRows] = React.useState<LegalPolicyRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    void client
      .get<LegalPolicyRow[]>(ADMIN_API_PATHS.legalPolicies)
      .then((items) => setRows(Array.isArray(items) ? items : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [client]);

  React.useEffect(() => {
    load();
  }, [load]);

  const columns: AdminColumn<LegalPolicyRow>[] = [
    { key: "type", header: a.table.type, render: (r) => a.adminLegalPolicyTypeLabel(r.type) },
    { key: "version", header: a.table.period, render: (r) => r.version },
    { key: "title", header: a.table.name, render: (r) => r.title },
    { key: "st", header: a.table.status, render: (policyRow) => <AdminLocalizedStatusBadge status={policyRow.status} /> },
    {
      key: "consent",
      header: a.t("admin.legal.requiresConsent"),
      render: (r) => (r.requiresUserConsent ? a.t("admin.legal.required") : a.t("admin.legal.optional")),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.status !== "ACTIVE" ? (
            <Button
              type="button"
              size="sm"
              variant="ghost" className={adminBtnOutline}
              onClick={() =>
                void client.post(ADMIN_API_PATHS.legalPolicyPublish(r.id), {}).then(load)
              }
            >
              Опубликовать
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost" className={adminBtnOutline}
              onClick={() =>
                void client.post(ADMIN_API_PATHS.legalPolicyArchive(r.id), {}).then(load)
              }
            >
              В архив
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminSectionShell sectionId="legal" title={a.adminSectionLabel("legal")}>
      <AdminSectionPanel>
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Тексты политик в БД — черновики. Перед production обязательна проверка юристом. Для seed на
          staging: <code className="font-mono">SEED_LEGAL_POLICIES_ON_BOOT=true</code>.
        </p>
        <AdminSectionDataArea loading={loading} error={error} onRetry={load}>
          <AdminDataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
        </AdminSectionDataArea>
      </AdminSectionPanel>
    </AdminSectionShell>
  );
}
