"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminPermissions } from "@/features/admin/hooks/use-admin-permissions";
import { useAuth } from "@/components/providers/auth-provider";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { adminBtnOutline, adminFieldInput } from "@/features/admin/lib/admin-ui";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminFilterPills,
  AdminFilterResultCount,
  AdminReadOnlyBanner,
  AdminStatusBadge,
  type AdminStatusTone,
} from "@/features/admin/ui";
import { ROUTES } from "@/constants/routes";
import {
  approveAdminKycReview,
  listAdminKycReviews,
  rejectAdminKycReview,
  type AdminKycReview,
} from "@/services/admin/adminKyc.service";
import { cn } from "@/lib/utils";

const STATUS_FILTER_OPTIONS = [
  { value: "", filterKey: "all" as const },
  { value: "PENDING", filterKey: "pending" as const },
  { value: "IN_REVIEW", filterKey: "in_review" as const },
  { value: "MANUAL_REVIEW_REQUIRED", filterKey: "manual_review_required" as const },
] as const;

function kycReviewTone(status: string): AdminStatusTone {
  const normalized = status.toLowerCase();
  if (normalized === "approved" || normalized === "verified") return "success";
  if (normalized === "rejected") return "danger";
  if (
    normalized === "pending" ||
    normalized === "in_review" ||
    normalized === "manual_review_required"
  ) {
    return "warning";
  }
  return "neutral";
}

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

  const statusOptions = React.useMemo(
    () =>
      STATUS_FILTER_OPTIONS.map((option) => ({
        value: option.value,
        label:
          option.filterKey === "all"
            ? a.t("admin.disputes.tab.all")
            : a.adminKycStatusLabel(option.filterKey),
      })),
    [a],
  );

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
    <AdminSectionShell
      sectionId="kyc"
      title={a.adminSectionLabel("kyc")}
      infoHint="Очередь заявок на верификацию личности: проверка документов, одобрение и отклонение."
      actions={<AdminSectionRefreshButton onClick={() => void reload()} loading={loading} />}
    >
      {isReadOnly ? <AdminReadOnlyBanner area="KYC" /> : null}
      <AdminSectionPanel>
        <div className="space-y-3">
          <AdminFilterPills
            label={a.table.status}
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
          <AdminFilterResultCount label={a.t("admin.filters.foundCount")} value={rows.length} />
        </div>

        <AdminSectionDataArea loading={loading} loadingLabel={a.t("admin.loading.kycApplications")}>
          {error ? (
            <AdminErrorState message={error} onRetry={() => void reload()} />
          ) : rows.length === 0 ? (
            <AdminEmptyState
              icon={ShieldCheck}
              title={statusFilter ? "Заявок по выбранному статусу нет" : "Нет заявок в очереди"}
              description={
                statusFilter
                  ? "Сбросьте фильтр статуса или дождитесь новых заявок на верификацию."
                  : "Новые заявки на верификацию появятся здесь автоматически."
              }
              className="bg-zinc-900/40 shadow-none"
            />
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li key={row.id} className={cn(ADMIN_SECTION_TILE, "p-4 sm:p-5")}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-100">
                        {row.user?.profile?.displayName?.trim() || row.user?.email || row.userId}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                        <AdminStatusBadge
                          label={a.adminKycStatusLabel(row.status)}
                          tone={kycReviewTone(row.status)}
                        />
                        <span aria-hidden>·</span>
                        <span>{row.countryCode ?? "—"}</span>
                        <span aria-hidden>·</span>
                        <span>
                          {row.submittedAt ? new Date(row.submittedAt).toLocaleString("ru-RU") : "—"}
                        </span>
                        {(row as { documentReference?: string }).documentReference ? (
                          <>
                            <span aria-hidden>·</span>
                            <span className="font-mono text-zinc-400">
                              ref {(row as { documentReference?: string }).documentReference}
                            </span>
                          </>
                        ) : null}
                      </div>
                      <Link
                        href={ROUTES.adminUserDetail(row.userId)}
                        className="mt-2 inline-block text-xs font-medium text-[#B7F500] transition-colors hover:text-[#a8e600]"
                      >
                        Открыть профиль
                      </Link>
                    </div>
                    {canMutate ? (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]"
                          disabled={busyId === row.id}
                          onClick={() => void handleApprove(row.id)}
                        >
                          Одобрить
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className={adminBtnOutline}
                          disabled={busyId === row.id}
                          onClick={() => setRejectId(row.id)}
                        >
                          Отклонить
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  {rejectId === row.id ? (
                    <div className="mt-4 flex flex-col gap-2 border-t border-zinc-800/80 pt-4 sm:flex-row sm:items-end">
                      <Input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder={a.t("admin.placeholder.kycRejectReason")}
                        className={cn(adminFieldInput, "sm:max-w-md")}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleReject(row.id)}
                      >
                        Подтвердить отклонение
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </AdminSectionDataArea>
      </AdminSectionPanel>
    </AdminSectionShell>
  );
}
