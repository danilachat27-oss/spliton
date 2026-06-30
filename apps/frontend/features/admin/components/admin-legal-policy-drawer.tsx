"use client";

import * as React from "react";
import { Eye } from "@/lib/lucide";

import {
  AdminDrawerCancelButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { adminFieldInput, adminFieldTextarea } from "@/features/admin/lib/admin-ui";
import {
  AdminCheckboxRow,
  AdminConfirmDialog,
  AdminDetailDrawer,
  AdminFormField,
  AdminFormFooter,
  AdminLocalizedStatusBadge,
  AdminLoadingState,
} from "@/features/admin/ui";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import {
  createAdminLegalPolicyDraft,
  getAdminLegalPolicy,
  publishAdminLegalPolicy,
  updateAdminLegalPolicyDraft,
  type AdminLegalPolicyRow,
} from "@/services/admin/adminLegal.service";
import { cn } from "@/lib/utils";

export const LEGAL_POLICY_TYPE_VALUES = [
  "TERMS_OF_SERVICE",
  "PRIVACY_POLICY",
  "RISK_DISCLOSURE",
  "MARKET_RULES",
  "FEE_POLICY",
  "AML_POLICY",
  "KYC_POLICY",
  "COOKIE_POLICY",
  "INVESTOR_AGREEMENT",
  "ROYALTY_RIGHTS_DISCLOSURE",
  "SECONDARY_MARKET_RULES",
  "WITHDRAWAL_POLICY",
] as const;

export const LEGAL_CONTENT_FORMAT_VALUES = ["MARKDOWN", "PLAIN", "HTML"] as const;

export type LegalPolicyFormBody = {
  type: string;
  version: string;
  title: string;
  content: string;
  contentFormat: string;
  requiresUserConsent: boolean;
  effectiveAt: string;
};

export function emptyLegalPolicyForm(type = "TERMS_OF_SERVICE"): LegalPolicyFormBody {
  const d = new Date();
  return {
    type,
    version: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.1`,
    title: "",
    content: "",
    contentFormat: "MARKDOWN",
    requiresUserConsent: true,
    effectiveAt: "",
  };
}

export function legalPolicyFormFromRow(row: AdminLegalPolicyRow): LegalPolicyFormBody {
  return {
    type: row.type,
    version: row.version,
    title: row.title,
    content: row.content,
    contentFormat: row.contentFormat ?? "MARKDOWN",
    requiresUserConsent: row.requiresUserConsent,
    effectiveAt: row.effectiveAt ? row.effectiveAt.slice(0, 16) : "",
  };
}

export function suggestNextVersion(current?: string): string {
  if (!current) return emptyLegalPolicyForm().version;
  const match = current.match(/^(\d{4})\.(\d{2})\.(\d+)$/);
  if (match) return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
  return `${current}.1`;
}

export function legalPolicyFormForNewVersion(source: AdminLegalPolicyRow): LegalPolicyFormBody {
  return {
    type: source.type,
    version: suggestNextVersion(source.version),
    title: source.title,
    content: source.content,
    contentFormat: source.contentFormat ?? "MARKDOWN",
    requiresUserConsent: source.requiresUserConsent,
    effectiveAt: "",
  };
}

type AdminLegalPolicyDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  policyId: string | null;
  initialForm?: LegalPolicyFormBody | null;
  initialType?: string;
  client: AdminApiClient;
  canMutate: boolean;
  onSaved: () => void | Promise<void>;
  onPreview: (payload: { title: string; version: string; content: string; contentFormat?: string }) => void;
};

const drawerPanel = "rounded-2xl bg-zinc-900/40 p-4";

export function AdminLegalPolicyDrawer({
  open,
  onOpenChange,
  mode,
  policyId,
  initialForm,
  initialType,
  client,
  canMutate,
  onSaved,
  onPreview,
}: AdminLegalPolicyDrawerProps) {
  const a = useAdminI18n();
  const [form, setForm] = React.useState<LegalPolicyFormBody>(emptyLegalPolicyForm());
  const [policy, setPolicy] = React.useState<AdminLegalPolicyRow | null>(null);
  const [loadingPolicy, setLoadingPolicy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmPublishOpen, setConfirmPublishOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && policyId) {
      setLoadingPolicy(true);
      void getAdminLegalPolicy(client, policyId)
        .then((row) => {
          setPolicy(row);
          setForm(legalPolicyFormFromRow(row));
        })
        .catch((e) => setError(localizedAdminError(e)))
        .finally(() => setLoadingPolicy(false));
      return;
    }
    setPolicy(null);
    setForm(initialForm ?? emptyLegalPolicyForm(initialType ?? "TERMS_OF_SERVICE"));
  }, [open, mode, policyId, initialForm, initialType, client]);

  const typeOptions = React.useMemo(
    () =>
      LEGAL_POLICY_TYPE_VALUES.map((value) => ({
        value,
        label: a.adminLegalPolicyTypeLabel(value),
      })),
    [a],
  );

  const formatOptions = React.useMemo(
    () =>
      LEGAL_CONTENT_FORMAT_VALUES.map((value) => ({
        value,
        label: value,
      })),
    [],
  );

  const readOnly = !canMutate || (mode === "edit" && policy?.status === "ACTIVE");

  async function handleSave() {
    if (readOnly) return;
    if (!form.title.trim() || !form.version.trim() || !form.content.trim()) {
      setError("Заполните тип, версию, заголовок и текст документа.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        title: form.title.trim(),
        version: form.version.trim(),
        content: form.content,
        contentFormat: form.contentFormat,
        requiresUserConsent: form.requiresUserConsent,
        effectiveAt: form.effectiveAt ? new Date(form.effectiveAt).toISOString() : null,
      };
      if (mode === "edit" && policy) {
        await updateAdminLegalPolicyDraft(client, policy.id, body);
      } else {
        await createAdminLegalPolicyDraft(client, {
          type: form.type,
          ...body,
        });
      }
      await onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublish() {
    if (!policy || readOnly) return;
    setSubmitting(true);
    setError(null);
    try {
      if (policy.status === "DRAFT") {
        await updateAdminLegalPolicyDraft(client, policy.id, {
          title: form.title.trim(),
          version: form.version.trim(),
          content: form.content,
          contentFormat: form.contentFormat,
          requiresUserConsent: form.requiresUserConsent,
          effectiveAt: form.effectiveAt ? new Date(form.effectiveAt).toISOString() : null,
        });
      }
      await publishAdminLegalPolicy(client, policy.id);
      await onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setSubmitting(false);
      setConfirmPublishOpen(false);
    }
  }

  return (
    <>
      <AdminDetailDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={mode === "edit" ? "Редактирование политики" : "Новая версия политики"}
        subtitle={
          mode === "edit" && policy?.status === "ACTIVE"
            ? "Активная версия не редактируется. Создайте новую версию и опубликуйте её."
            : "Черновик сохраняется в БД. Публикация заменяет текущую активную версию этого типа."
        }
        wide
        borderless
        widthClassName="w-[min(820px,100vw)]"
        footer={
          <AdminFormFooter
            left={
              <AdminDrawerSecondaryButton
                type="button"
                disabled={!form.content.trim()}
                onClick={() =>
                  onPreview({
                    title: form.title || "Preview",
                    version: form.version,
                    content: form.content,
                    contentFormat: form.contentFormat,
                  })
                }
              >
                <Eye className="mr-1.5 size-3.5" aria-hidden />
                Preview
              </AdminDrawerSecondaryButton>
            }
            right={
              !readOnly ? (
                <>
                  <AdminDrawerCancelButton onClick={() => onOpenChange(false)} disabled={submitting} />
                  {mode === "edit" && policy && policy.status !== "ACTIVE" ? (
                    <AdminDrawerSecondaryButton
                      disabled={submitting}
                      onClick={() => void handleSave()}
                    >
                      {submitting ? "Сохранение…" : "Сохранить черновик"}
                    </AdminDrawerSecondaryButton>
                  ) : null}
                  {mode === "edit" && policy && (policy.status === "DRAFT" || policy.status === "REVIEW") ? (
                    <AdminDrawerPrimaryButton
                      disabled={submitting}
                      onClick={() => setConfirmPublishOpen(true)}
                    >
                      Опубликовать
                    </AdminDrawerPrimaryButton>
                  ) : mode === "create" ? (
                    <AdminDrawerPrimaryButton disabled={submitting} onClick={() => void handleSave()}>
                      {submitting ? "Сохранение…" : "Создать черновик"}
                    </AdminDrawerPrimaryButton>
                  ) : null}
                </>
              ) : (
                <AdminDrawerSecondaryButton onClick={() => onOpenChange(false)}>{a.t("admin.actions.close")}</AdminDrawerSecondaryButton>
              )
            }
          />
        }
      >
        {loadingPolicy ? (
          <AdminLoadingState label={a.t("admin.legal.drawer.loading")} />
        ) : (
          <div className="space-y-4">
            {policy ? (
              <div className={cn(drawerPanel, "flex flex-wrap items-center gap-2 text-sm")}>
                <AdminLocalizedStatusBadge status={policy.status} />
                {policy.publishedAt ? (
                  <span className="text-xs text-zinc-500">
                    Опубликовано: {new Date(policy.publishedAt).toLocaleString("ru-RU")}
                  </span>
                ) : null}
                {policy.status === "ACTIVE" ? (
                  <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-200">
                    ACTIVE нельзя редактировать — создайте новую версию
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className={drawerPanel}>
              <AdminStyledSelectField
                id="legal-policy-type"
                label={a.table.type}
                value={form.type}
                options={typeOptions}
                onChange={(value) => setForm((prev) => ({ ...prev, type: value }))}
                disabled={mode === "edit" || readOnly}
                info="Тип документа фиксируется при создании версии."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className={drawerPanel}>
                <AdminFormField label={a.t("admin.legal.field.version")} htmlFor="legal-policy-version" info={a.t("admin.legal.field.versionInfo")}>
                  <Input
                    id="legal-policy-version"
                    value={form.version}
                    onChange={(e) => setForm((prev) => ({ ...prev, version: e.target.value }))}
                    className={adminFieldInput}
                    disabled={readOnly}
                    placeholder="2026.06.1"
                  />
                </AdminFormField>
              </div>
              <div className={drawerPanel}>
                <AdminStyledSelectField
                  id="legal-policy-format"
                  label={a.t("admin.legal.field.format")}
                  value={form.contentFormat}
                  options={formatOptions}
                  onChange={(value) => setForm((prev) => ({ ...prev, contentFormat: value }))}
                  disabled={readOnly}
                  info={a.t("admin.legal.field.formatInfo")}
                />
              </div>
            </div>

            <div className={drawerPanel}>
              <AdminFormField label={a.table.name} htmlFor="legal-policy-title">
                <Input
                  id="legal-policy-title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className={adminFieldInput}
                  disabled={readOnly}
                  placeholder={a.t("admin.legal.field.titlePlaceholder")}
                />
              </AdminFormField>
            </div>

            <div className={drawerPanel}>
              <AdminFormField
                label={a.t("admin.legal.field.effectiveAt")}
                htmlFor="legal-policy-effective"
                info={a.t("admin.legal.field.effectiveAtInfo")}
              >
                <Input
                  id="legal-policy-effective"
                  type="datetime-local"
                  value={form.effectiveAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, effectiveAt: e.target.value }))}
                  className={adminFieldInput}
                  disabled={readOnly}
                />
              </AdminFormField>
            </div>

            <div className={drawerPanel}>
              <AdminFormField
                label={a.t("admin.legal.field.content")}
                htmlFor="legal-policy-content"
                info={a.t("admin.legal.field.contentInfo")}
              >
                <textarea
                  id="legal-policy-content"
                  value={form.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                  className={cn(adminFieldTextarea, "min-h-[360px] font-mono text-xs leading-relaxed")}
                  disabled={readOnly}
                  placeholder={a.t("admin.legal.field.contentPlaceholder")}
                />
              </AdminFormField>
            </div>

            <div className={drawerPanel}>
              <AdminCheckboxRow
                id="legal-policy-consent"
                checked={form.requiresUserConsent}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, requiresUserConsent: Boolean(checked) }))
                }
                disabled={readOnly}
                label={a.t("admin.legal.requiresConsent")}
                info="Если включено — пользователь должен принять документ для операций платформы."
              />
            </div>

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          </div>
        )}
      </AdminDetailDrawer>

      <AdminConfirmDialog
        open={confirmPublishOpen}
        onOpenChange={setConfirmPublishOpen}
        title={a.t("admin.legal.confirm.publishFromEditorTitle")}
        description={a.t("admin.legal.confirm.publishFromEditorDesc")}
        confirmLabel={a.t("admin.legal.confirm.publishLabel")}
        confirming={submitting}
        onConfirm={() => void handlePublish()}
      />
    </>
  );
}
