"use client";

import * as React from "react";

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
  AdminDetailDrawer,
  AdminFormField,
  AdminFormFooter,
  AdminLocalizedStatusBadge,
} from "@/features/admin/ui";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import {
  createAdminLegalPolicyDraft,
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

export type LegalPolicyFormBody = {
  type: string;
  version: string;
  title: string;
  content: string;
  requiresUserConsent: boolean;
};

export function emptyLegalPolicyForm(type = "TERMS_OF_SERVICE"): LegalPolicyFormBody {
  const d = new Date();
  return {
    type,
    version: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.1`,
    title: "",
    content: "",
    requiresUserConsent: true,
  };
}

export function legalPolicyFormFromRow(row: AdminLegalPolicyRow): LegalPolicyFormBody {
  return {
    type: row.type,
    version: row.version,
    title: row.title,
    content: row.content,
    requiresUserConsent: row.requiresUserConsent,
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
    requiresUserConsent: source.requiresUserConsent,
  };
}

type AdminLegalPolicyDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  policy: AdminLegalPolicyRow | null;
  initialForm?: LegalPolicyFormBody | null;
  client: AdminApiClient;
  canMutate: boolean;
  onSaved: () => void | Promise<void>;
};

const drawerPanel = "rounded-2xl bg-zinc-900/40 p-4";

export function AdminLegalPolicyDrawer({
  open,
  onOpenChange,
  mode,
  policy,
  initialForm,
  client,
  canMutate,
  onSaved,
}: AdminLegalPolicyDrawerProps) {
  const a = useAdminI18n();
  const [form, setForm] = React.useState<LegalPolicyFormBody>(emptyLegalPolicyForm());
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && policy) {
      setForm(legalPolicyFormFromRow(policy));
      return;
    }
    setForm(initialForm ?? emptyLegalPolicyForm());
  }, [open, mode, policy, initialForm]);

  const typeOptions = React.useMemo(
    () =>
      LEGAL_POLICY_TYPE_VALUES.map((value) => ({
        value,
        label: a.adminLegalPolicyTypeLabel(value),
      })),
    [a],
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
      if (mode === "edit" && policy) {
        await updateAdminLegalPolicyDraft(client, policy.id, {
          title: form.title.trim(),
          version: form.version.trim(),
          content: form.content,
          requiresUserConsent: form.requiresUserConsent,
        });
      } else {
        await createAdminLegalPolicyDraft(client, {
          type: form.type,
          version: form.version.trim(),
          title: form.title.trim(),
          content: form.content,
          requiresUserConsent: form.requiresUserConsent,
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

  return (
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
      widthClassName="w-[min(720px,100vw)]"
      footer={
        <AdminFormFooter
          right={
            !readOnly ? (
              <>
                <AdminDrawerCancelButton onClick={() => onOpenChange(false)} disabled={submitting} />
                <AdminDrawerPrimaryButton onClick={() => void handleSave()} disabled={submitting}>
                  {submitting ? "Сохранение…" : mode === "edit" ? "Сохранить черновик" : "Создать черновик"}
                </AdminDrawerPrimaryButton>
              </>
            ) : (
              <AdminDrawerSecondaryButton onClick={() => onOpenChange(false)}>Закрыть</AdminDrawerSecondaryButton>
            )
          }
        />
      }
    >
      <div className="space-y-4">
        {policy ? (
          <div className={cn(drawerPanel, "flex flex-wrap items-center gap-2 text-sm")}>
            <AdminLocalizedStatusBadge status={policy.status} />
            {policy.publishedAt ? (
              <span className="text-xs text-zinc-500">
                Опубликовано: {new Date(policy.publishedAt).toLocaleString("ru-RU")}
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

        <div className={drawerPanel}>
          <AdminFormField label="Версия" htmlFor="legal-policy-version" info="Формат YYYY.MM.N — уникален в рамках типа.">
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
          <AdminFormField label={a.table.name} htmlFor="legal-policy-title">
            <Input
              id="legal-policy-title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className={adminFieldInput}
              disabled={readOnly}
              placeholder="Условия использования Spliton"
            />
          </AdminFormField>
        </div>

        <div className={drawerPanel}>
          <AdminFormField
            label="Текст документа"
            htmlFor="legal-policy-content"
            info="Markdown. После публикации пользователям может потребоваться повторное согласие."
          >
            <textarea
              id="legal-policy-content"
              value={form.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setForm((prev) => ({ ...prev, content: e.target.value }))
              }
              className={cn(adminFieldTextarea, "min-h-[280px] font-mono text-xs leading-relaxed")}
              disabled={readOnly}
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
    </AdminDetailDrawer>
  );
}
