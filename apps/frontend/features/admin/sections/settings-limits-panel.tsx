"use client";

import * as React from "react";
import { ChevronRight } from "@/lib/lucide";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AdminDrawerPrimaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { DANGEROUS_ACTION_PHRASES } from "@/features/admin/config/admin-role-matrix";
import {
  adminFieldInput,
  adminHeroCard,
  adminHighlightRing,
  adminListRow,
} from "@/features/admin/lib/admin-ui";
import type { AdminFinancialRule } from "@/services/admin/adminFinancialRules.service";
import { cn } from "@/lib/utils";

type SettingsLimitsPanelProps = {
  rules: AdminFinancialRule[];
  ruleDrafts: Record<string, string>;
  onDraftChange: (ruleId: string, value: string) => void;
  selectedRuleId: string | null;
  onSelectRule: (ruleId: string) => void;
  canEdit: boolean;
  saving: boolean;
  ruleReason: string;
  onRuleReasonChange: (value: string) => void;
  confirmPhrase: string;
  onConfirmPhraseChange: (value: string) => void;
  onSave: (rule: AdminFinancialRule) => void;
  reasonPlaceholder: string;
  loading: boolean;
};

export function SettingsLimitsPanel({
  rules,
  ruleDrafts,
  onDraftChange,
  selectedRuleId,
  onSelectRule,
  canEdit,
  saving,
  ruleReason,
  onRuleReasonChange,
  confirmPhrase,
  onConfirmPhraseChange,
  onSave,
  reasonPlaceholder,
  loading,
}: SettingsLimitsPanelProps) {
  const selectedRule = rules.find((r) => r.id === selectedRuleId) ?? null;
  const selectedDraft = selectedRule ? (ruleDrafts[selectedRule.id] ?? selectedRule.value) : "";
  const selectedChanged = selectedRule ? selectedDraft.trim() !== selectedRule.value : false;
  const phraseOk = confirmPhrase.trim() === DANGEROUS_ACTION_PHRASES.platformFees;
  const canSave =
    canEdit &&
    selectedRule &&
    selectedChanged &&
    ruleReason.trim().length > 0 &&
    phraseOk &&
    !saving;

  if (loading) {
    return <p className="text-sm text-zinc-500">Загрузка…</p>;
  }

  if (rules.length === 0) {
    return <p className="text-sm text-zinc-500">Правила не настроены.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start lg:gap-6">
      <ul className="space-y-1.5">
        {rules.map((rule) => {
          const draft = ruleDrafts[rule.id] ?? rule.value;
          const changed = draft !== rule.value;
          const active = rule.id === selectedRuleId;

          return (
            <li key={rule.id}>
              <button
                type="button"
                onClick={() => onSelectRule(rule.id)}
                className={cn(
                  adminListRow(),
                  "flex w-full items-center gap-3 text-left transition-all",
                  active && "bg-zinc-800/55 ring-1 ring-[#B7F500]/35",
                  !active && changed && adminHighlightRing("warning"),
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-100">{rule.title}</span>
                  <span className="mt-0.5 block font-mono text-[11px] text-zinc-600">{rule.code}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums text-zinc-200">{rule.value}</span>
                  {changed ? (
                    <span className="mt-0.5 block text-[10px] font-medium text-amber-400">черновик</span>
                  ) : null}
                </span>
                <ChevronRight
                  className={cn("size-4 shrink-0 text-zinc-600", active && "text-[#B7F500]")}
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>

      <aside
        className={cn(
          adminHeroCard("lg:sticky lg:top-4"),
          selectedChanged && "ring-1 ring-amber-500/30",
        )}
      >
        {!selectedRule ? (
          <p className="text-sm text-zinc-500">Выберите правило слева для редактирования.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                Редактирование
              </p>
              <h3 className="mt-1 text-base font-semibold text-zinc-100">{selectedRule.title}</h3>
              {selectedRule.description ? (
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{selectedRule.description}</p>
              ) : null}
              <p className="mt-2 font-mono text-[11px] text-zinc-600">{selectedRule.code}</p>
            </div>

            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-zinc-950/40 px-2.5 py-2">
                <dt className="text-zinc-600">Текущее</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-zinc-200">{selectedRule.value}</dd>
              </div>
              <div className="rounded-lg bg-zinc-950/40 px-2.5 py-2">
                <dt className="text-zinc-600">Черновик</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-zinc-200">
                  {selectedDraft.trim() || "—"}
                </dd>
              </div>
            </dl>

            <label className="block text-sm">
              <span className="text-zinc-400">Новое значение</span>
              <Input
                className={cn("mt-1.5 rounded-xl", adminFieldInput)}
                value={selectedDraft}
                disabled={!canEdit || saving}
                onChange={(e) => onDraftChange(selectedRule.id, e.target.value)}
              />
            </label>

            {canEdit ? (
              <>
                <label className="block text-sm">
                  <span className="text-zinc-400">Причина изменения</span>
                  <Input
                    className={cn("mt-1.5 rounded-xl", adminFieldInput)}
                    value={ruleReason}
                    disabled={saving}
                    onChange={(e) => onRuleReasonChange(e.target.value)}
                    placeholder={reasonPlaceholder}
                  />
                </label>

                <div className="space-y-2">
                  <Label className="text-xs text-zinc-500">
                    Подтверждение: введите «{DANGEROUS_ACTION_PHRASES.platformFees}»
                  </Label>
                  <Input
                    value={confirmPhrase}
                    onChange={(e) => onConfirmPhraseChange(e.target.value)}
                    disabled={saving}
                    className={cn("font-mono text-sm", adminFieldInput)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <AdminDrawerPrimaryButton
                  className="w-full justify-center"
                  disabled={!canSave}
                  onClick={() => onSave(selectedRule)}
                >
                  {saving ? "Сохранение…" : "Сохранить правило"}
                </AdminDrawerPrimaryButton>
              </>
            ) : (
              <p className="text-xs text-zinc-600">Редактирование доступно только SUPER_ADMIN.</p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
