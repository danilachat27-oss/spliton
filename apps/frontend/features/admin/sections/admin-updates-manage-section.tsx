"use client";

import Link from "next/link";
import * as React from "react";
import { Plus } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { AdminSectionGuard } from "@/features/admin/components/admin-section-guard";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { canMatrixAction } from "@/features/admin/config/admin-role-matrix";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { adminBtnOutline, adminFieldInput, adminSectionCreateButton } from "@/features/admin/lib/admin-ui";
import { ADMIN_UPDATE_TYPES, adminUpdateTypeBadgeClassName } from "@/features/admin/lib/admin-update-ui";
import { AdminLocalizedStatusBadge, AdminReadOnlyBanner } from "@/features/admin/ui";
import { AdminStyledSelect } from "@/features/admin/ui/admin-styled-select";
import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/constants/routes";
import {
  archiveAdminUpdate,
  createAdminUpdate,
  listAdminUpdatesManage,
  publishAdminUpdate,
  updateAdminUpdate,
  type AdminUpdateManageRow,
  type AdminUpdateType,
} from "@/services/admin/adminUpdates.service";
import { cn } from "@/lib/utils";

const STAFF_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "COMPLIANCE",
  "BUSINESS_ANALYST",
  "CONTENT_MANAGER",
  "SUPPORT_MANAGER",
  "ACCOUNTANT",
  "NEWS_MANAGER",
  "SUPPORT",
] as const;

const UPDATE_TYPES = ADMIN_UPDATE_TYPES;

const emptyForm = {
  title: "",
  summary: "",
  content: "",
  type: "FEATURE" as AdminUpdateType,
  audienceRoles: ["SUPER_ADMIN", "ADMIN"] as string[],
};

export function AdminUpdatesManageSection() {
  const client = useAdminApi();
  const a = useAdminI18n();
  const { user } = useAuth();
  const canMutate = canMatrixAction(user?.roles, "updates", "mutate");
  const [items, setItems] = React.useState<AdminUpdateManageRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listAdminUpdatesManage(client));
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setLoading(false);
    }
  }, [client]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    if (!canMutate) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateAdminUpdate(client, editingId, form);
      } else {
        await createAdminUpdate(client, form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (row: AdminUpdateManageRow) => {
    setEditingId(row.id);
    setForm({
      title: row.title,
      summary: row.summary,
      content: row.content,
      type: row.type,
      audienceRoles: row.audienceRoles,
    });
  };

  const onPublish = async (id: string) => {
    setSaving(true);
    try {
      await publishAdminUpdate(client, id);
      await load();
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async (id: string) => {
    setSaving(true);
    try {
      await archiveAdminUpdate(client, id);
      await load();
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminSectionShell
      sectionId="updates"
      title={a.t("admin.updates.manage")}
      actions={
        <>
          <Link href={ROUTES.adminUpdates}>
            <Button type="button" variant="outline" className={adminBtnOutline}>
              {a.t("admin.updates.viewHistory")}
            </Button>
          </Link>
          <AdminSectionRefreshButton onClick={() => void load()} loading={loading} />
        </>
      }
    >
      {!canMutate ? <AdminReadOnlyBanner area={a.t("admin.updates.manage")} /> : null}
      <AdminSectionPanel>
        {canMutate ? (
          <div className={cn(ADMIN_SECTION_TILE, "mb-6 space-y-3")}>
            <h3 className="text-sm font-semibold text-zinc-100">
              {editingId ? a.t("admin.updates.edit") : a.t("admin.updates.create")}
            </h3>
            <input
              className={cn(adminFieldInput, "w-full")}
              placeholder={a.t("admin.updates.fieldTitle")}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <textarea
              className={cn(adminFieldInput, "min-h-16 w-full resize-y")}
              placeholder={a.t("admin.updates.fieldSummary")}
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            />
            <textarea
              className={cn(adminFieldInput, "min-h-32 w-full resize-y")}
              placeholder={a.t("admin.updates.fieldContent")}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
            <AdminStyledSelect
              value={form.type}
              onChange={(value: string) => setForm((f) => ({ ...f, type: value as AdminUpdateType }))}
              options={UPDATE_TYPES.map((type) => ({
                value: type,
                label: a.t(`admin.updates.type.${type}`),
              }))}
            />
            <div className="flex flex-wrap gap-2">
              {STAFF_ROLES.map((role) => {
                const checked = form.audienceRoles.includes(role);
                return (
                  <label key={role} className="flex items-center gap-1 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          audienceRoles: checked
                            ? f.audienceRoles.filter((r) => r !== role)
                            : [...f.audienceRoles, role],
                        }))
                      }
                    />
                    {role}
                  </label>
                );
              })}
            </div>
            <Button type="button" className={adminSectionCreateButton} disabled={saving} onClick={() => void onSave()}>
              <Plus className="size-4" aria-hidden />
              {a.t("admin.updates.save")}
            </Button>
          </div>
        ) : null}

        <AdminSectionDataArea loading={loading} error={error} onRetry={() => void load()}>
          <ul className="space-y-3">
            {items.map((row) => (
              <li key={row.id} className={cn(ADMIN_SECTION_TILE, "space-y-2")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-100">{row.title}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={adminUpdateTypeBadgeClassName(row.type)}>
                        {a.t(`admin.updates.type.${row.type}`)}
                      </span>
                      <AdminLocalizedStatusBadge status={row.status} domain="generic" />
                    </div>
                  </div>
                  {canMutate && row.status === "DRAFT" ? (
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" className={adminBtnOutline} onClick={() => onEdit(row)}>
                        {a.t("admin.actions.edit")}
                      </Button>
                      <Button type="button" size="sm" onClick={() => void onPublish(row.id)} disabled={saving}>
                        {a.t("admin.updates.publish")}
                      </Button>
                    </div>
                  ) : null}
                  {canMutate && row.status !== "ARCHIVED" ? (
                    <Button type="button" size="sm" variant="outline" className={adminBtnOutline} onClick={() => void onArchive(row.id)} disabled={saving}>
                      {a.t("admin.updates.archive")}
                    </Button>
                  ) : null}
                </div>
                <p className="text-sm text-zinc-400">{row.summary}</p>
              </li>
            ))}
          </ul>
        </AdminSectionDataArea>
      </AdminSectionPanel>
    </AdminSectionShell>
  );
}

export default function AdminUpdatesManagePage() {
  return (
    <AdminSectionGuard sectionId="updates">
      <AdminUpdatesManageSection />
    </AdminSectionGuard>
  );
}
