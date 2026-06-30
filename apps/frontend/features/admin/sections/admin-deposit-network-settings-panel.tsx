"use client";

import * as React from "react";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminBtnOutline, adminFieldInput, adminFieldTextarea } from "@/features/admin/lib/admin-ui";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { AdminFormField } from "@/features/admin/ui";
import { cn } from "@/lib/utils";

type Settings = {
  tokenContractAddress: string | null;
  minDepositAmount: string;
  minConfirmations: number;
  estimatedCreditTimeMinutes: number;
  withdrawAvailableAfterMinutes: number;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
  providerMode: string;
  providerName: string | null;
  explorerAddressUrlTemplate: string | null;
  explorerTokenUrlTemplate: string | null;
  userWarningRu: string | null;
  userWarningEn: string | null;
  userWarningKa: string | null;
  maintenanceMessageRu: string | null;
  maintenanceMessageEn: string | null;
  maintenanceMessageKa: string | null;
};

export function AdminDepositNetworkSettingsPanel({ embedded = false }: { embedded?: boolean }) {
  const a = useAdminI18n();
  const client = useAdminApi();
  const [data, setData] = React.useState<Settings | null>(null);
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    void client
      .get<Settings>(`${ADMIN_API_PATHS.treasury}/deposit-network-settings`)
      .then(setData)
      .catch(() => setData(null));
  }, [client]);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setMessage(null);
    try {
      await client.patch(`${ADMIN_API_PATHS.treasury}/deposit-network-settings`, {
        reason,
        tokenContractAddress: data.tokenContractAddress ?? "",
        minDepositAmount: data.minDepositAmount,
        minConfirmations: data.minConfirmations,
        estimatedCreditTimeMinutes: data.estimatedCreditTimeMinutes,
        withdrawAvailableAfterMinutes: data.withdrawAvailableAfterMinutes,
        depositEnabled: data.depositEnabled,
        withdrawalEnabled: data.withdrawalEnabled,
        providerMode: data.providerMode,
        providerName: data.providerName ?? "",
        explorerAddressUrlTemplate: data.explorerAddressUrlTemplate ?? "",
        explorerTokenUrlTemplate: data.explorerTokenUrlTemplate ?? "",
        userWarningRu: data.userWarningRu ?? "",
        userWarningEn: data.userWarningEn ?? "",
        userWarningKa: data.userWarningKa ?? "",
        maintenanceMessageRu: data.maintenanceMessageRu ?? "",
        maintenanceMessageEn: data.maintenanceMessageEn ?? "",
        maintenanceMessageKa: data.maintenanceMessageKa ?? "",
      });
      setMessage(a.t("admin.treasury.limits.saved"));
      load();
    } catch (e) {
      setMessage(localizedAdminError(e));
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return <p className="text-sm text-zinc-500">{a.t("admin.treasury.depositNetwork.unavailable")}</p>;
  }

  return (
    <div className={cn("space-y-4 text-sm", !embedded && ADMIN_SECTION_TILE)}>
      {!embedded ? (
        <p className="font-semibold text-zinc-100">{a.t("admin.treasury.depositNetwork.title")}</p>
      ) : null}
      <p className="text-xs text-zinc-500">
        Provider: <span className="font-mono">{data.providerMode}</span>
        {data.providerName ? ` · ${data.providerName}` : null}
      </p>
      <AdminFormField label={a.t("admin.treasury.depositNetwork.contractUsdt")} htmlFor="deposit-token-contract">
        <Input
          id="deposit-token-contract"
          className={cn(adminFieldInput, "font-mono text-xs")}
          value={data.tokenContractAddress ?? ""}
          onChange={(e) => setData({ ...data, tokenContractAddress: e.target.value })}
        />
      </AdminFormField>
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminFormField label={a.t("admin.treasury.depositNetwork.minDepositUsdt")} htmlFor="deposit-min-amount">
          <Input
            id="deposit-min-amount"
            className={adminFieldInput}
            value={data.minDepositAmount}
            onChange={(e) => setData({ ...data, minDepositAmount: e.target.value })}
          />
        </AdminFormField>
        <AdminFormField label={a.t("admin.treasury.depositNetwork.confirmations")} htmlFor="deposit-min-confirmations">
          <Input
            id="deposit-min-confirmations"
            type="number"
            className={adminFieldInput}
            value={data.minConfirmations}
            onChange={(e) =>
              setData({ ...data, minConfirmations: Number(e.target.value) || 0 })
            }
          />
        </AdminFormField>
        <AdminFormField label={a.t("admin.treasury.depositNetwork.creditMinutes")} htmlFor="deposit-credit-minutes">
          <Input
            id="deposit-credit-minutes"
            type="number"
            className={adminFieldInput}
            value={data.estimatedCreditTimeMinutes}
            onChange={(e) =>
              setData({
                ...data,
                estimatedCreditTimeMinutes: Number(e.target.value) || 0,
              })
            }
          />
        </AdminFormField>
        <AdminFormField label={a.t("admin.treasury.depositNetwork.withdrawMinutes")} htmlFor="deposit-withdraw-minutes">
          <Input
            id="deposit-withdraw-minutes"
            type="number"
            className={adminFieldInput}
            value={data.withdrawAvailableAfterMinutes}
            onChange={(e) =>
              setData({
                ...data,
                withdrawAvailableAfterMinutes: Number(e.target.value) || 0,
              })
            }
          />
        </AdminFormField>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="size-4 rounded border-zinc-700 bg-zinc-900 accent-[#B7F500]"
            checked={data.depositEnabled}
            onChange={(e) => setData({ ...data, depositEnabled: e.target.checked })}
          />
          Пополнения включены
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="size-4 rounded border-zinc-700 bg-zinc-900 accent-[#B7F500]"
            checked={data.withdrawalEnabled}
            onChange={(e) => setData({ ...data, withdrawalEnabled: e.target.checked })}
          />
          Выводы включены
        </label>
      </div>
      <AdminStyledSelectField
        label={a.t("admin.treasury.providerMode")}
        className="text-zinc-400"
        value={data.providerMode}
        options={[
          { value: "mock", label: a.t("admin.treasury.providerMode.mock") },
          { value: "tron", label: a.t("admin.treasury.providerMode.tron") },
          { value: "disabled", label: a.t("admin.treasury.providerMode.disabled") },
        ]}
        onChange={(providerMode) => setData({ ...data, providerMode })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminFormField label={a.t("admin.treasury.explorerTemplate")} htmlFor="deposit-explorer-address">
          <Input
            id="deposit-explorer-address"
            className={cn(adminFieldInput, "font-mono text-[10px]")}
            placeholder="https://tronscan.org/#/address/{address}"
            value={data.explorerAddressUrlTemplate ?? ""}
            onChange={(e) =>
              setData({ ...data, explorerAddressUrlTemplate: e.target.value })
            }
          />
        </AdminFormField>
        <AdminFormField
          label={a.t("admin.treasury.depositNetwork.explorerToken")}
          htmlFor="deposit-explorer-token"
        >
          <Input
            id="deposit-explorer-token"
            className={cn(adminFieldInput, "font-mono text-[10px]")}
            placeholder="https://tronscan.org/#/token20/{contract}"
            value={data.explorerTokenUrlTemplate ?? ""}
            onChange={(e) =>
              setData({ ...data, explorerTokenUrlTemplate: e.target.value })
            }
          />
        </AdminFormField>
      </div>
      <AdminFormField label={a.t("admin.treasury.depositNetwork.warningsRu")} htmlFor="deposit-warn-ru">
        <textarea
          id="deposit-warn-ru"
          className={adminFieldTextarea}
          rows={3}
          value={data.userWarningRu ?? ""}
          onChange={(e) => setData({ ...data, userWarningRu: e.target.value })}
        />
      </AdminFormField>
      <AdminFormField label={a.t("admin.treasury.depositNetwork.warningsEn")} htmlFor="deposit-warn-en">
        <textarea
          id="deposit-warn-en"
          className={adminFieldTextarea}
          rows={2}
          value={data.userWarningEn ?? ""}
          onChange={(e) => setData({ ...data, userWarningEn: e.target.value })}
        />
      </AdminFormField>
      <AdminFormField label={a.t("admin.treasury.depositNetwork.maintenanceRu")} htmlFor="deposit-maint-ru">
        <Input
          id="deposit-maint-ru"
          className={adminFieldInput}
          value={data.maintenanceMessageRu ?? ""}
          onChange={(e) => setData({ ...data, maintenanceMessageRu: e.target.value })}
        />
      </AdminFormField>
      <AdminFormField label={a.t("admin.treasury.maintenanceEn")} htmlFor="deposit-maint-en">
        <Input
          id="deposit-maint-en"
          className={adminFieldInput}
          value={data.maintenanceMessageEn ?? ""}
          onChange={(e) => setData({ ...data, maintenanceMessageEn: e.target.value })}
        />
      </AdminFormField>
      <AdminFormField label={a.t("admin.treasury.depositNetwork.changeReason")} htmlFor="deposit-change-reason">
        <Input
          id="deposit-change-reason"
          className={adminFieldInput}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </AdminFormField>
      <Button
        type="button"
        size="sm"
        disabled={saving}
        className="bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]"
        onClick={() => void save()}
      >
        {saving ? "Сохранение…" : "Сохранить настройки"}
      </Button>
      {message ? <p className="text-xs text-zinc-400">{message}</p> : null}
    </div>
  );
}
