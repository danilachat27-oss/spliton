"use client";

import * as React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { canMutatePaymentRequisites } from "@/features/admin/config/admin-rbac";
import {
  AdminSectionDataArea,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { AdminConfirmDialog } from "@/features/admin/ui/admin-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminBtnOutline, adminFieldInput, adminFieldTextarea } from "@/features/admin/lib/admin-ui";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { AdminFormField } from "@/features/admin/ui";
import { cn } from "@/lib/utils";
import {
  type DepositNetworkSettings,
  type DepositPreview,
  type PoolList,
  type PoolRow,
  type RequisiteHistoryItem,
  addPoolAddress,
  bulkAddPoolAddresses,
  fetchAddressPool,
  fetchDepositPreview,
  fetchPaymentRequisitesSummary,
  fetchRequisiteHistory,
  patchNetworkSettings,
  poolAction,
} from "@/services/admin/adminPaymentRequisites.service";

type TabId = "settings" | "pool" | "preview" | "history";
type LocaleTab = "ru" | "en" | "es" | "pt";

type ConfirmState = {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
};

export function PaymentRequisitesSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const { user } = useAuth();
  const canEdit = canMutatePaymentRequisites(user?.roles);

  const [tab, setTab] = React.useState<TabId>("settings");
  const [settings, setSettings] = React.useState<DepositNetworkSettings | null>(null);
  const [pool, setPool] = React.useState<PoolList | null>(null);
  const [preview, setPreview] = React.useState<DepositPreview | null>(null);
  const [history, setHistory] = React.useState<RequisiteHistoryItem[]>([]);
  const [reason, setReason] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [newAddress, setNewAddress] = React.useState("");
  const [bulkAddresses, setBulkAddresses] = React.useState("");
  const [confirm, setConfirm] = React.useState<ConfirmState | null>(null);
  const [previewLang, setPreviewLang] = React.useState<LocaleTab>("ru");
  const [poolError, setPoolError] = React.useState<string | null>(null);

  const loadSummary = React.useCallback(async () => {
    try {
      const data = await fetchPaymentRequisitesSummary(client.get.bind(client));
      setSettings(data.settings);
      setPool(data.pool);
    } catch {
      setSettings(null);
      setPool(null);
    }
  }, [client]);

  const loadPool = React.useCallback(async () => {
    try {
      setPool(await fetchAddressPool(client.get.bind(client)));
    } catch {
      setPool(null);
    }
  }, [client]);

  const loadPreview = React.useCallback(async () => {
    try {
      setPreview(await fetchDepositPreview(client.get.bind(client), previewLang));
    } catch {
      setPreview(null);
    }
  }, [client, previewLang]);

  const loadHistory = React.useCallback(async () => {
    try {
      const res = await fetchRequisiteHistory(client.get.bind(client));
      setHistory(res.items);
    } catch {
      setHistory([]);
    }
  }, [client]);

  React.useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  React.useEffect(() => {
    if (tab === "preview") void loadPreview();
    if (tab === "history") void loadHistory();
    if (tab === "pool") void loadPool();
  }, [tab, loadPreview, loadHistory, loadPool]);

  React.useEffect(() => {
    if (tab === "preview") void loadPreview();
  }, [previewLang, tab, loadPreview]);

  const saveSettings = async () => {
    if (!settings || !canEdit) return;
    setSaving(true);
    setMessage(null);
    try {
      await patchNetworkSettings({ ...settings, reason }, client.patch.bind(client));
      setMessage(a.t("admin.paymentRequisites.saved"));
      void loadSummary();
      void loadHistory();
    } catch (e) {
      setMessage(localizedAdminError(e));
    } finally {
      setSaving(false);
    }
  };

  const requestSaveSettings = () => {
    setConfirm({
      title: a.t("admin.paymentRequisites.confirm.settingsTitle"),
      description: a.t("admin.paymentRequisites.confirm.settingsDesc"),
      onConfirm: async () => {
        setConfirm(null);
        await saveSettings();
      },
    });
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "settings", label: a.t("admin.paymentRequisites.tab.settings") },
    { id: "pool", label: a.t("admin.paymentRequisites.tab.pool") },
    { id: "preview", label: a.t("admin.paymentRequisites.tab.preview") },
    { id: "history", label: a.t("admin.paymentRequisites.tab.history") },
  ];

  return (
    <AdminSectionShell title={a.t("admin.paymentRequisites.title")}>
      <AdminSectionDataArea>
        <p className="text-sm text-zinc-400">{a.t("admin.paymentRequisites.subtitle")}</p>

        <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              data-testid={`pr-tab-${t.id}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm",
                tab === t.id ? "bg-[#B7F500] text-zinc-950" : "text-zinc-400 hover:bg-zinc-800",
              )}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {pool?.poolLowWarning ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {a.t("admin.paymentRequisites.poolLowWarning")}
          </div>
        ) : null}

        {tab === "settings" && settings ? (
          <SettingsPanel
            settings={settings}
            canEdit={canEdit}
            reason={reason}
            saving={saving}
            message={message}
            onChange={setSettings}
            onReasonChange={setReason}
            onSave={requestSaveSettings}
            t={a.t}
          />
        ) : null}

        {tab === "pool" ? (
          <PoolPanel
            pool={pool}
            canEdit={canEdit}
            newAddress={newAddress}
            bulkAddresses={bulkAddresses}
            reason={reason}
            onNewAddress={setNewAddress}
            onBulk={setBulkAddresses}
            onReason={setReason}
            onAdd={() => {
              setPoolError(null);
              setConfirm({
                title: a.t("admin.paymentRequisites.confirm.addAddressTitle"),
                description: a.t("admin.paymentRequisites.confirm.addAddressDesc"),
                onConfirm: async () => {
                  setConfirm(null);
                  try {
                    await addPoolAddress(
                      { address: newAddress.trim(), reason: reason.trim() || "Add address" },
                      client.post.bind(client),
                    );
                    setNewAddress("");
                    void loadPool();
                    void loadSummary();
                    void loadHistory();
                  } catch (e) {
                    setPoolError(localizedAdminError(e));
                  }
                },
              });
            }}
            onBulkAdd={() => {
              const lines = bulkAddresses
                .split(/\r?\n/)
                .map((l) => l.trim())
                .filter(Boolean);
              setConfirm({
                title: a.t("admin.paymentRequisites.confirm.bulkTitle"),
                description: a.t("admin.paymentRequisites.confirm.bulkDesc"),
                onConfirm: async () => {
                  setConfirm(null);
                  await bulkAddPoolAddresses(
                    { addresses: lines, reason: reason.trim() || "Bulk add" },
                    client.post.bind(client),
                  );
                  setBulkAddresses("");
                  void loadPool();
                  void loadSummary();
                  void loadHistory();
                },
              });
            }}
            onAction={(row, action) => {
              setPoolError(null);
              setConfirm({
                title: a.t(`admin.paymentRequisites.confirm.${action}Title`),
                description: a.t(`admin.paymentRequisites.confirm.${action}Desc`),
                onConfirm: async () => {
                  setConfirm(null);
                  await poolAction(
                    row.id,
                    action,
                    { reason: reason.trim() || action },
                    client.post.bind(client),
                  );
                  void loadPool();
                  void loadHistory();
                },
              });
            }}
            t={a.t}
            poolError={poolError}
          />
        ) : null}

        {tab === "preview" && preview ? (
          <PreviewPanel
            preview={preview}
            previewLang={previewLang}
            onPreviewLangChange={setPreviewLang}
            t={a.t}
          />
        ) : null}

        {tab === "history" ? <HistoryPanel items={history} t={a.t} /> : null}

        <AdminConfirmDialog
          open={Boolean(confirm)}
          title={confirm?.title ?? ""}
          description={confirm?.description ?? ""}
          confirmLabel={a.t("admin.paymentRequisites.confirm.confirmLabel")}
          onConfirm={() => void confirm?.onConfirm()}
          onOpenChange={(open) => {
            if (!open) setConfirm(null);
          }}
        />
      </AdminSectionDataArea>
    </AdminSectionShell>
  );
}

function SettingsPanel({
  settings,
  canEdit,
  reason,
  saving,
  message,
  onChange,
  onReasonChange,
  onSave,
  t,
}: {
  settings: DepositNetworkSettings;
  canEdit: boolean;
  reason: string;
  saving: boolean;
  message: string | null;
  onChange: (s: DepositNetworkSettings) => void;
  onReasonChange: (v: string) => void;
  onSave: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className={cn("space-y-4 text-sm", ADMIN_SECTION_TILE)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminFormField label={t("admin.paymentRequisites.field.networkDisplay")} htmlFor="pr-network-display">
          <Input
            id="pr-network-display"
            className={adminFieldInput}
            disabled={!canEdit}
            value={settings.networkDisplayName ?? ""}
            onChange={(e) => onChange({ ...settings, networkDisplayName: e.target.value })}
          />
        </AdminFormField>
        <AdminFormField label={t("admin.paymentRequisites.field.contract")} htmlFor="pr-contract">
          <Input
            id="pr-contract"
            className={cn(adminFieldInput, "font-mono text-xs")}
            disabled={!canEdit}
            value={settings.tokenContractAddress ?? ""}
            onChange={(e) => onChange({ ...settings, tokenContractAddress: e.target.value })}
          />
        </AdminFormField>
        <AdminFormField label={t("admin.paymentRequisites.field.minAmount")} htmlFor="pr-min">
          <Input
            id="pr-min"
            className={adminFieldInput}
            disabled={!canEdit}
            value={settings.minDepositAmount}
            onChange={(e) => onChange({ ...settings, minDepositAmount: e.target.value })}
          />
        </AdminFormField>
        <AdminFormField label={t("admin.paymentRequisites.field.maxAmount")} htmlFor="pr-max">
          <Input
            id="pr-max"
            className={adminFieldInput}
            disabled={!canEdit}
            value={settings.maxDepositAmount ?? ""}
            onChange={(e) => onChange({ ...settings, maxDepositAmount: e.target.value || null })}
          />
        </AdminFormField>
        <AdminFormField label={t("admin.paymentRequisites.field.confirmations")} htmlFor="pr-conf">
          <Input
            id="pr-conf"
            type="number"
            className={adminFieldInput}
            disabled={!canEdit}
            value={settings.minConfirmations}
            onChange={(e) =>
              onChange({ ...settings, minConfirmations: Number(e.target.value) || 0 })
            }
          />
        </AdminFormField>
        <AdminFormField label={t("admin.paymentRequisites.field.poolThreshold")} htmlFor="pr-threshold">
          <Input
            id="pr-threshold"
            type="number"
            className={adminFieldInput}
            disabled={!canEdit}
            value={settings.poolLowThreshold}
            onChange={(e) =>
              onChange({ ...settings, poolLowThreshold: Number(e.target.value) || 0 })
            }
          />
        </AdminFormField>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-zinc-300">
        <input
          type="checkbox"
          disabled={!canEdit}
          checked={settings.depositEnabled}
          onChange={(e) => onChange({ ...settings, depositEnabled: e.target.checked })}
        />
        {t("admin.paymentRequisites.field.depositEnabled")}
      </label>
      <LocalizedCopyFields settings={settings} canEdit={canEdit} onChange={onChange} t={t} />
      <AdminFormField label={t("admin.paymentRequisites.field.reason")} htmlFor="pr-reason">
        <Input
          id="pr-reason"
          className={adminFieldInput}
          disabled={!canEdit}
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
        />
      </AdminFormField>
      {canEdit ? (
        <Button
          type="button"
          size="sm"
          data-testid="pr-save-btn"
          disabled={saving}
          className="bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]"
          onClick={onSave}
        >
          {saving ? t("admin.paymentRequisites.saving") : t("admin.paymentRequisites.save")}
        </Button>
      ) : (
        <p className="text-xs text-zinc-500">{t("admin.paymentRequisites.readOnly")}</p>
      )}
      {message ? <p className="text-xs text-zinc-400">{message}</p> : null}
    </div>
  );
}

function LocalizedCopyFields({
  settings,
  canEdit,
  onChange,
  t,
}: {
  settings: DepositNetworkSettings;
  canEdit: boolean;
  onChange: (s: DepositNetworkSettings) => void;
  t: (key: string) => string;
}) {
  const [localeTab, setLocaleTab] = React.useState<LocaleTab>("ru");
  const locales: LocaleTab[] = ["ru", "en", "es", "pt"];
  const warningKey = {
    ru: "userWarningRu",
    en: "userWarningEn",
    es: "userWarningEs",
    pt: "userWarningPt",
  } as const;
  const instructionKey = {
    ru: "instructionsRu",
    en: "instructionsEn",
    es: "instructionsEs",
    pt: "instructionsPt",
  } as const;
  const warningLabel = {
    ru: "admin.paymentRequisites.field.warningsRu",
    en: "admin.paymentRequisites.field.warningsEn",
    es: "admin.paymentRequisites.field.warningsEs",
    pt: "admin.paymentRequisites.field.warningsPt",
  } as const;
  const instructionLabel = {
    ru: "admin.paymentRequisites.field.instructionsRu",
    en: "admin.paymentRequisites.field.instructionsEn",
    es: "admin.paymentRequisites.field.instructionsEs",
    pt: "admin.paymentRequisites.field.instructionsPt",
  } as const;

  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {t("admin.paymentRequisites.section.localizedCopy")}
      </p>
      <div className="flex flex-wrap gap-1">
        {locales.map((loc) => (
          <button
            key={loc}
            type="button"
            data-testid={`pr-locale-${loc}`}
            className={cn(
              "rounded px-2 py-1 text-xs",
              localeTab === loc ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:bg-zinc-800",
            )}
            onClick={() => setLocaleTab(loc)}
          >
            {t(`admin.paymentRequisites.locale.${loc}`)}
          </button>
        ))}
      </div>
      <AdminFormField label={t(warningLabel[localeTab])} htmlFor={`pr-warn-${localeTab}`}>
        <textarea
          id={`pr-warn-${localeTab}`}
          className={adminFieldTextarea}
          rows={3}
          disabled={!canEdit}
          value={(settings[warningKey[localeTab]] as string | null) ?? ""}
          onChange={(e) => onChange({ ...settings, [warningKey[localeTab]]: e.target.value })}
        />
      </AdminFormField>
      <AdminFormField label={t(instructionLabel[localeTab])} htmlFor={`pr-inst-${localeTab}`}>
        <textarea
          id={`pr-inst-${localeTab}`}
          className={adminFieldTextarea}
          rows={2}
          disabled={!canEdit}
          value={(settings[instructionKey[localeTab]] as string | null) ?? ""}
          onChange={(e) => onChange({ ...settings, [instructionKey[localeTab]]: e.target.value })}
        />
      </AdminFormField>
    </div>
  );
}

function PoolPanel({
  pool,
  canEdit,
  newAddress,
  bulkAddresses,
  reason,
  poolError,
  onNewAddress,
  onBulk,
  onReason,
  onAdd,
  onBulkAdd,
  onAction,
  t,
}: {
  pool: PoolList | null;
  canEdit: boolean;
  newAddress: string;
  bulkAddresses: string;
  reason: string;
  poolError: string | null;
  onNewAddress: (v: string) => void;
  onBulk: (v: string) => void;
  onReason: (v: string) => void;
  onAdd: () => void;
  onBulkAdd: () => void;
  onAction: (row: PoolRow, action: "disable" | "enable" | "archive") => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className={cn("grid gap-3 sm:grid-cols-4 text-sm", ADMIN_SECTION_TILE)}>
        <Stat label={t("admin.paymentRequisites.pool.total")} value={pool?.total ?? 0} />
        <Stat label={t("admin.paymentRequisites.pool.available")} value={pool?.availableCount ?? 0} />
        <Stat label={t("admin.paymentRequisites.pool.assigned")} value={pool?.assignedCount ?? 0} />
        <Stat label={t("admin.paymentRequisites.pool.disabled")} value={pool?.disabledCount ?? 0} />
      </div>
      {canEdit ? (
        <div className={cn("space-y-3", ADMIN_SECTION_TILE)}>
          <AdminFormField label={t("admin.paymentRequisites.pool.addOne")} htmlFor="pr-addr">
            <Input
              id="pr-addr"
              className={cn(adminFieldInput, "font-mono text-xs")}
              value={newAddress}
              onChange={(e) => onNewAddress(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label={t("admin.paymentRequisites.pool.bulk")} htmlFor="pr-bulk">
            <textarea
              id="pr-bulk"
              className={adminFieldTextarea}
              rows={4}
              value={bulkAddresses}
              onChange={(e) => onBulk(e.target.value)}
              placeholder={t("admin.paymentRequisites.pool.bulkPlaceholder")}
            />
          </AdminFormField>
          <AdminFormField label={t("admin.paymentRequisites.field.reason")} htmlFor="pr-pool-reason">
            <Input
              id="pr-pool-reason"
              className={adminFieldInput}
              value={reason}
              onChange={(e) => onReason(e.target.value)}
            />
          </AdminFormField>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" data-testid="pr-pool-add-btn" className={adminBtnOutline} onClick={onAdd}>
              {t("admin.paymentRequisites.pool.addBtn")}
            </Button>
            <Button type="button" size="sm" className={adminBtnOutline} onClick={onBulkAdd}>
              {t("admin.paymentRequisites.pool.bulkBtn")}
            </Button>
          </div>
          {poolError ? (
            <p className="text-xs text-red-400" data-testid="pr-pool-error">
              {poolError}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className={cn("overflow-x-auto", ADMIN_SECTION_TILE)}>
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="text-zinc-500">
              <th className="px-2 py-2">{t("admin.paymentRequisites.pool.colAddress")}</th>
              <th className="px-2 py-2">{t("admin.paymentRequisites.pool.colStatus")}</th>
              <th className="px-2 py-2">{t("admin.paymentRequisites.pool.colAssigned")}</th>
              <th className="px-2 py-2">{t("admin.paymentRequisites.pool.colCreated")}</th>
              {canEdit ? <th className="px-2 py-2" /> : null}
            </tr>
          </thead>
          <tbody>
            {(pool?.items ?? []).map((row) => (
              <tr key={row.id} className="border-t border-zinc-800">
                <td className="px-2 py-2 font-mono">{row.address}</td>
                <td className="px-2 py-2">{row.status}</td>
                <td className="px-2 py-2">{row.assignedUserId ?? "—"}</td>
                <td className="px-2 py-2">{new Date(row.createdAt).toLocaleString()}</td>
                {canEdit ? (
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      {row.status === "DISABLED" || row.status === "COMPROMISED" ? (
                        <button
                          type="button"
                          className="text-[#B7F500] underline"
                          onClick={() => onAction(row, "enable")}
                        >
                          {t("admin.paymentRequisites.pool.enable")}
                        </button>
                      ) : null}
                      {row.status === "AVAILABLE" ? (
                        <>
                          <button
                            type="button"
                            className="text-amber-400 underline"
                            onClick={() => onAction(row, "disable")}
                          >
                            {t("admin.paymentRequisites.pool.disable")}
                          </button>
                          <button
                            type="button"
                            className="text-zinc-400 underline"
                            onClick={() => onAction(row, "archive")}
                          >
                            {t("admin.paymentRequisites.pool.archive")}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-zinc-500">{label}</p>
      <p className="text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function PreviewPanel({
  preview,
  previewLang,
  onPreviewLangChange,
  t,
}: {
  preview: DepositPreview;
  previewLang: LocaleTab;
  onPreviewLangChange: (lang: LocaleTab) => void;
  t: (key: string) => string;
}) {
  const locales: LocaleTab[] = ["ru", "en", "es", "pt"];
  return (
    <div className={cn("space-y-4 text-sm", ADMIN_SECTION_TILE)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500">{t("admin.paymentRequisites.preview.lang")}</span>
        {locales.map((loc) => (
          <button
            key={loc}
            type="button"
            data-testid={`pr-preview-lang-${loc}`}
            className={cn(
              "rounded px-2 py-1 text-xs",
              previewLang === loc ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:bg-zinc-800",
            )}
            onClick={() => onPreviewLangChange(loc)}
          >
            {t(`admin.paymentRequisites.locale.${loc}`)}
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-500">{t("admin.paymentRequisites.preview.note")}</p>
      {!preview.depositEnabled ? (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-red-200">
          {t("admin.paymentRequisites.preview.disabled")}
        </p>
      ) : null}
      <p className="font-semibold text-zinc-100">{preview.networkDisplayName}</p>
      <p className="font-mono text-xs break-all">{preview.address}</p>
      <p className="text-xs text-zinc-500">{preview.addressNote}</p>
      {preview.qrDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview.qrDataUrl} alt="QR preview" className="size-28 rounded bg-white p-1" />
      ) : null}
      <p>
        {t("admin.paymentRequisites.field.minAmount")}: {preview.minDepositAmount}
      </p>
      {preview.depositInstructions ? (
        <p className="text-zinc-300">{preview.depositInstructions}</p>
      ) : null}
      <ul className="list-disc space-y-1 pl-5 text-amber-200/90">
        {preview.userWarnings.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
    </div>
  );
}

function HistoryPanel({
  items,
  t,
}: {
  items: RequisiteHistoryItem[];
  t: (key: string) => string;
}) {
  if (!items.length) {
    return <p className="text-sm text-zinc-500">{t("admin.paymentRequisites.history.empty")}</p>;
  }
  return (
    <div className={cn("space-y-2 text-xs", ADMIN_SECTION_TILE)}>
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-zinc-800 px-3 py-2">
          <p className="font-medium text-zinc-200">
            {item.action} · {item.entityType}
          </p>
          <p className="text-zinc-500">
            {new Date(item.createdAt).toLocaleString()} · {item.actorRole ?? "—"}
          </p>
          {item.reason ? <p className="text-zinc-400">{item.reason}</p> : null}
        </div>
      ))}
    </div>
  );
}
