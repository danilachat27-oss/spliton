"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { Input } from "@/components/ui/input";
import { AdminStyledSelect } from "@/features/admin/ui/admin-styled-select";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminPermissions } from "@/features/admin/hooks/use-admin-permissions";
import { useAuth } from "@/components/providers/auth-provider";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { AdminErrorState, AdminLoadingState, AdminReadOnlyBanner } from "@/features/admin/ui";
import { ROUTES } from "@/constants/routes";
import {
  approveAdminKycReview,
  listAdminKycReviews,
  rejectAdminKycReview,
  type AdminKycReview,
} from "@/services/admin/adminKyc.service";
import { cn } from "@/lib/utils";

export function KycSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const { user } = useAuth();
  const { readOnly } = useAdminPermissions();
  const canMutate =
    user?.roles?.some((r) => ["SUPER_ADMIN", "COMPLIANCE"].includes(r)) ?? false;
  const isReadOnly = readOnly("Compliance") || !canMutate;
  const [rows, setRows] = React.useState<AdminKycReview[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [rejectId, setRejectId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listAdminKycReviews(statusFilter || undefined, client));
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setLoading(false);
    }
  }, [client, statusFilter]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  async function handleApprove(id: string) {
    setBusyId(id);
    try {
      await approveAdminKycReview(id, client);
      await reload();
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) return;
    setBusyId(id);
    try {
      await rejectAdminKycReview(id, rejectReason.trim(), client);
      setRejectId(null);
      setRejectReason("");
      await reload();
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminSectionShell sectionId="kyc" title={a.adminSectionLabel("kyc")}>
      {isReadOnly ? <AdminReadOnlyBanner area="KYC" /> : null}
      <AdminSectionPanel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">Очередь заявок на верификацию личности.</p>
          <div className="flex items-center gap-2">
            <AdminStyledSelect
              value={statusFilter}
              options={[
                { value: "", label: a.t("admin.disputes.tab.all") },
                { value: "PENDING", label: a.adminKycStatusLabel("pending") },
                { value: "IN_REVIEW", label: a.adminKycStatusLabel("in_review") },
                { value: "MANUAL_REVIEW_REQUIRED", label: a.adminKycStatusLabel("manual_review_required") },
              ]}
              onChange={setStatusFilter}
              aria-label={a.t("admin.kyc.filterAria")}
            />
            <AdminSectionRefreshButton onClick={() => void reload()} />
          </div>
        </div>
        {loading ? <AdminLoadingState label={a.t("admin.loading.kycApplications")} /> : null}
        {error ? <AdminErrorState message={error} onRetry={() => void reload()} /> : null}
        {!loading && !error && rows.length === 0 ? (
          <p className="text-sm text-zinc-500">Нет заявок в очереди.</p>
        ) : null}
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className={cn(ADMIN_SECTION_TILE, "p-4")}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-zinc-100">
                    {row.user?.profile?.displayName?.trim() || row.user?.email || row.userId}
                  </p>
                  <p className="text-xs text-zinc-500">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-200">
                      {a.adminKycStatusLabel(row.status)}
                    </span>
                    {" · "}
                    {row.countryCode ?? "—"} ·{" "}
                    {row.submittedAt ? new Date(row.submittedAt).toLocaleString("ru-RU") : "—"}
                    {(row as { documentReference?: string }).documentReference
                      ? ` · ref ${(row as { documentReference?: string }).documentReference}`
                      : ""}
                  </p>
                  <Link
                    href={ROUTES.adminUserDetail(row.userId)}
                    className="mt-1 inline-block text-xs font-medium text-blue-700 hover:underline"
                  >
                    Открыть профиль
                  </Link>
                </div>
                {canMutate ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyId === row.id}
                      onClick={() => void handleApprove(row.id)}
                    >
                      Одобрить
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost" className={adminBtnOutline}
                      disabled={busyId === row.id}
                      onClick={() => setRejectId(row.id)}
                    >
                      Отклонить
                    </Button>
                  </div>
                ) : null}
              </div>
              {rejectId === row.id ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={a.t("admin.placeholder.kycRejectReason")}
                    className="sm:max-w-md"
                  />
                  <Button type="button" size="sm" variant="destructive" onClick={() => void handleReject(row.id)}>
                    Подтвердить отклонение
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </AdminSectionPanel>
    </AdminSectionShell>
  );
}
