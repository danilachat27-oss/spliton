"use client";



import * as React from "react";



import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {

  AdminSectionPanel,

  AdminSectionShell,

  AdminSectionTabBar,

} from "@/features/admin/components/admin-section-layout";

import { DANGEROUS_ACTION_PHRASES } from "@/features/admin/config/admin-role-matrix";

import { canPatchPlatformFees } from "@/features/admin/config/admin-rbac";

import { useAdminApi } from "@/features/admin/hooks/use-admin-api";

import { useAdminSectionTab } from "@/features/admin/hooks/use-admin-section-tab";

import { useAuth } from "@/components/providers/auth-provider";


import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";

import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";

import { AdminPhraseConfirmDialog, AdminReadOnlyBanner } from "@/features/admin/ui";

import {

  getAdminPlatformFees,

  patchAdminPlatformFees,

  type AdminPlatformFees,

} from "@/services/admin/adminPlatformFees.service";

import {

  listAdminFinancialRules,

  patchAdminFinancialRule,

  type AdminFinancialRule,

} from "@/services/admin/adminFinancialRules.service";

import { cn } from "@/lib/utils";



const SETTINGS_TABS = [
  { id: "fees", label: "Комиссии" },
  { id: "limits", label: "Лимиты и правила" },
] as const;



type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];



const FEE_FIELDS: Array<{

  key: keyof Pick<

    AdminPlatformFees,

    "primaryPurchaseFeePct" | "withdrawalFeeUsdt" | "secondaryMarketFeePct"

  >;

  label: string;

  unit: string;

}> = [

  { key: "primaryPurchaseFeePct", label: "Комиссия первичной покупки", unit: "%" },

  { key: "withdrawalFeeUsdt", label: "Комиссия вывода", unit: "USDT" },

  { key: "secondaryMarketFeePct", label: "Комиссия вторичного рынка", unit: "%" },

];



function FeeChangeSummary({

  before,

  after,

}: {

  before: AdminPlatformFees | null;

  after: AdminPlatformFees | null;

}) {

  if (!before || !after) return null;

  const rows = FEE_FIELDS.filter(({ key }) => before[key] !== after[key]);

  if (rows.length === 0) {

    return <p className="text-sm text-zinc-500">Изменений нет.</p>;

  }

  return (

    <ul className="space-y-2 text-sm">

      {rows.map(({ key, label, unit }) => (

        <li key={key} className="rounded-lg border border-zinc-800 bg-zinc-50 px-3 py-2">

          <p className="font-medium text-zinc-200">{label}</p>

          <p className="text-zinc-400">

            {before[key] ?? "—"} {unit} → <span className="font-semibold">{after[key] ?? "—"}</span> {unit}

          </p>

        </li>

      ))}

      {after.effectiveFrom ? (

        <li className="text-xs text-zinc-500">

          Текущая версия действует с {new Date(after.effectiveFrom).toLocaleString("ru-RU")}

        </li>

      ) : null}

    </ul>

  );

}



export function SettingsSection() {
  const a = useAdminI18n();

  const client = useAdminApi();

  const { user } = useAuth();

  const [tab, setTab] = useAdminSectionTab<SettingsTab>(

    SETTINGS_TABS.map((t) => t.id),

    "fees",

  );

  const [liveFees, setLiveFees] = React.useState<AdminPlatformFees | null>(null);

  const [draftFees, setDraftFees] = React.useState<AdminPlatformFees | null>(null);

  const [loading, setLoading] = React.useState(true);

  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const [submitting, setSubmitting] = React.useState(false);

  const [saved, setSaved] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);

  const [rules, setRules] = React.useState<AdminFinancialRule[]>([]);

  const [ruleDrafts, setRuleDrafts] = React.useState<Record<string, string>>({});

  const [rulesLoading, setRulesLoading] = React.useState(true);

  const [ruleSavingId, setRuleSavingId] = React.useState<string | null>(null);

  const [ruleConfirm, setRuleConfirm] = React.useState<AdminFinancialRule | null>(null);

  const [ruleReason, setRuleReason] = React.useState("");

  const canEdit = canPatchPlatformFees(user?.roles);



  const reloadFees = React.useCallback(async () => {

    setLoading(true);

    setError(null);

    try {

      const data = await getAdminPlatformFees(client);

      setLiveFees(data);

      setDraftFees(data);

    } catch (e) {

      setError(localizedAdminError(e));

    } finally {

      setLoading(false);

    }

  }, [client]);



  React.useEffect(() => {

    void reloadFees();

  }, [reloadFees]);



  const reloadRules = React.useCallback(async () => {

    setRulesLoading(true);

    setError(null);

    try {

      const rows = await listAdminFinancialRules(client);

      setRules(rows);

      setRuleDrafts(Object.fromEntries(rows.map((r) => [r.id, r.value])));

    } catch (e) {

      setError(localizedAdminError(e));

    } finally {

      setRulesLoading(false);

    }

  }, [client]);



  React.useEffect(() => {

    if (tab === "limits") void reloadRules();

  }, [tab, reloadRules]);



  async function handleSaveRule(rule: AdminFinancialRule) {

    const value = ruleDrafts[rule.id]?.trim();

    if (!value || !canEdit || !ruleReason.trim()) return;

    setRuleSavingId(rule.id);

    setError(null);

    try {

      const updated = await patchAdminFinancialRule(rule.id, { value, reason: ruleReason.trim() }, client);

      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

      setRuleDrafts((prev) => ({ ...prev, [updated.id]: updated.value }));

      setRuleConfirm(null);

      setRuleReason("");

      setSaved(true);

      setTimeout(() => setSaved(false), 2500);

    } catch (e) {

      setError(localizedAdminError(e));

    } finally {

      setRuleSavingId(null);

    }

  }



  const hasChanges =

    liveFees &&

    draftFees &&

    FEE_FIELDS.some(({ key }) => liveFees[key] !== draftFees[key]);



  async function handleSave() {

    if (!draftFees || !canEdit) return;

    setSubmitting(true);

    setError(null);

    try {

      const updated = await patchAdminPlatformFees(draftFees, client);

      setLiveFees(updated);

      setDraftFees(updated);

      setSaved(true);

      setConfirmOpen(false);

      setTimeout(() => setSaved(false), 2500);

    } catch (e) {

      setError(localizedAdminError(e));

    } finally {

      setSubmitting(false);

    }

  }



  return (

    <AdminSectionShell sectionId="settings" title={a.adminSectionLabel("settings")}>

      {!canEdit ? <AdminReadOnlyBanner area={a.adminSectionLabel("settings")} /> : null}



      <AdminSectionPanel>

        <AdminSectionTabBar

          tabs={[...SETTINGS_TABS]}

          activeId={tab}

          onChange={(id) => setTab(id as SettingsTab)}

        />



        {tab === "fees" ? (

          <div className={cn(ADMIN_SECTION_TILE, "space-y-4")}>

            <h2 className="text-sm font-semibold text-zinc-100">Комиссии платформы</h2>

            {loading ? <p className="text-sm text-zinc-500">Загрузка…</p> : null}

            <div className="grid gap-4 md:grid-cols-2">

              {FEE_FIELDS.map(({ key, label, unit }) => (

                <label key={key} className="block text-sm">

                  {label}, {unit}

                  <Input

                    className="mt-1.5 rounded-xl bg-zinc-900/80"

                    value={draftFees?.[key] ?? ""}

                    disabled={!canEdit || submitting}

                    onChange={(e) =>

                      setDraftFees((f) => (f ? { ...f, [key]: e.target.value } : f))

                    }

                  />

                </label>

              ))}

            </div>

            {canEdit ? (

              <Button

                type="button"

                size="sm"

                className="rounded-xl"

                disabled={!hasChanges || submitting}

                onClick={() => setConfirmOpen(true)}

              >

                Сохранить комиссии

              </Button>

            ) : null}

          </div>

        ) : null}



        {tab === "limits" ? (

          <div className={cn(ADMIN_SECTION_TILE, "space-y-4")}>

            <h2 className="text-sm font-semibold text-zinc-100">Финансовые лимиты</h2>

            <p className="text-sm text-zinc-400">

              Минимальные суммы, суточные лимиты и другие правила операций. Изменения записываются в журнал действий.

            </p>

            {rulesLoading ? <p className="text-sm text-zinc-500">Загрузка…</p> : null}

            {!rulesLoading && rules.length === 0 ? (

              <p className="text-sm text-zinc-500">Правила не настроены.</p>

            ) : null}

            <ul className="space-y-3">

              {rules.map((rule) => {

                const draft = ruleDrafts[rule.id] ?? rule.value;

                const changed = draft !== rule.value;

                return (

                  <li key={rule.id} className="rounded-xl border border-zinc-800 bg-zinc-50/80 p-4">

                    <p className="font-medium text-zinc-100">{rule.title}</p>

                    {rule.description ? (

                      <p className="mt-1 text-xs text-zinc-500">{rule.description}</p>

                    ) : null}

                    <p className="mt-1 font-mono text-xs text-zinc-400">{rule.code}</p>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">

                      <label className="block flex-1 text-sm">

                        Значение

                        <Input

                          className="mt-1.5 rounded-xl bg-zinc-900/80"

                          value={draft}

                          disabled={!canEdit || ruleSavingId === rule.id}

                          onChange={(e) =>

                            setRuleDrafts((prev) => ({ ...prev, [rule.id]: e.target.value }))

                          }

                        />

                      </label>

                      {canEdit ? (

                        <Button

                          type="button"

                          size="sm"

                          className="rounded-xl"

                          disabled={!changed || ruleSavingId === rule.id}

                          onClick={() => setRuleConfirm(rule)}

                        >

                          Сохранить

                        </Button>

                      ) : null}

                    </div>

                  </li>

                );

              })}

            </ul>

          </div>

        ) : null}



        <p className="text-xs text-zinc-500">

          Дополнительные настройки (сети, безопасность) появятся в следующих релизах Spliton.

        </p>



        {saved ? (

          <p className="text-sm text-emerald-700">Сохранено — запись в журнале действий.</p>

        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

      </AdminSectionPanel>



      <AdminPhraseConfirmDialog

        open={confirmOpen}

        onOpenChange={(o) => {

          if (!submitting) setConfirmOpen(o);

        }}

        title={a.t("admin.title.updatePlatformFees")}

        description="Будет создана новая активная версия тарифов. Предыдущая версия сохранится в истории."

        confirmPhrase={DANGEROUS_ACTION_PHRASES.platformFees}

        confirmLabel={submitting ? "Сохранение…" : "Сохранить"}

        confirming={submitting}

        closeOnConfirm={false}

        onConfirm={handleSave}

      >

        <FeeChangeSummary before={liveFees} after={draftFees} />

      </AdminPhraseConfirmDialog>



      <AdminPhraseConfirmDialog

        open={Boolean(ruleConfirm)}

        onOpenChange={(o) => {

          if (!ruleSavingId) {

            setRuleConfirm(o ? ruleConfirm : null);

            if (!o) setRuleReason("");

          }

        }}

        title={a.t("admin.title.updateFinancialRule")}

        description={
          ruleConfirm
            ? `Будет изменено правило «${ruleConfirm.title}». Укажите причину для журнала аудита.`
            : ""
        }

        confirmPhrase={DANGEROUS_ACTION_PHRASES.platformFees}

        confirmLabel={ruleSavingId ? "Сохранение…" : "Сохранить"}

        confirming={Boolean(ruleSavingId)}

        closeOnConfirm={false}

        onConfirm={() => {

          if (ruleConfirm) void handleSaveRule(ruleConfirm);

        }}

      >

        {ruleConfirm ? (

          <div className="space-y-3 text-sm">

            <p className="text-zinc-400">

              {ruleConfirm.value} → <span className="font-semibold">{ruleDrafts[ruleConfirm.id] ?? "—"}</span>

            </p>

            <label className="block">

              Причина изменения

              <Input

                className="mt-1.5"

                value={ruleReason}

                onChange={(e) => setRuleReason(e.target.value)}

                placeholder={a.t("admin.placeholder.financialRule")}

              />

            </label>

          </div>

        ) : null}

      </AdminPhraseConfirmDialog>

    </AdminSectionShell>

  );

}

