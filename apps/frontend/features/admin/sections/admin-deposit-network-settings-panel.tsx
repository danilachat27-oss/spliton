"use client";

import * as React from "react";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";

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

export function AdminDepositNetworkSettingsPanel() {
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
      setMessage("Сохранено");
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return <p className="text-sm text-zinc-500">Настройки TRC20 недоступны (нет доступа или API).</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 p-4 text-sm">
      <p className="font-semibold text-zinc-100">USDT · TRC20 — сеть пополнения</p>
      <p className="text-xs text-zinc-500">
        Provider: <span className="font-mono">{data.providerMode}</span>
        {data.providerName ? ` · ${data.providerName}` : null}
      </p>
      <label className="block">
        <span className="text-zinc-400">Контракт USDT</span>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5 font-mono text-xs"
          value={data.tokenContractAddress ?? ""}
          onChange={(e) => setData({ ...data, tokenContractAddress: e.target.value })}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-zinc-400">Мин. депозит (USDT)</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5"
            value={data.minDepositAmount}
            onChange={(e) => setData({ ...data, minDepositAmount: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-zinc-400">Подтверждения</span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5"
            value={data.minConfirmations}
            onChange={(e) =>
              setData({ ...data, minConfirmations: Number(e.target.value) || 0 })
            }
          />
        </label>
        <label className="block">
          <span className="text-zinc-400">Зачисление (мин)</span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5"
            value={data.estimatedCreditTimeMinutes}
            onChange={(e) =>
              setData({
                ...data,
                estimatedCreditTimeMinutes: Number(e.target.value) || 0,
              })
            }
          />
        </label>
        <label className="block">
          <span className="text-zinc-400">Вывод доступен через (мин)</span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5"
            value={data.withdrawAvailableAfterMinutes}
            onChange={(e) =>
              setData({
                ...data,
                withdrawAvailableAfterMinutes: Number(e.target.value) || 0,
              })
            }
          />
        </label>
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={data.depositEnabled}
          onChange={(e) => setData({ ...data, depositEnabled: e.target.checked })}
        />
        Пополнения включены
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={data.withdrawalEnabled}
          onChange={(e) => setData({ ...data, withdrawalEnabled: e.target.checked })}
        />
        Выводы включены
      </label>
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
        <label className="block">
          <span className="text-zinc-400">{a.t("admin.treasury.explorerTemplate")}</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5 font-mono text-[10px]"
            placeholder="https://tronscan.org/#/address/{address}"
            value={data.explorerAddressUrlTemplate ?? ""}
            onChange={(e) =>
              setData({ ...data, explorerAddressUrlTemplate: e.target.value })
            }
          />
        </label>
        <label className="block">
          <span className="text-zinc-400">Explorer token template</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5 font-mono text-[10px]"
            placeholder="https://tronscan.org/#/token20/{contract}"
            value={data.explorerTokenUrlTemplate ?? ""}
            onChange={(e) =>
              setData({ ...data, explorerTokenUrlTemplate: e.target.value })
            }
          />
        </label>
      </div>
      <label className="block">
        <span className="text-zinc-400">Предупреждения (RU, по строке)</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5 text-xs"
          rows={3}
          value={data.userWarningRu ?? ""}
          onChange={(e) => setData({ ...data, userWarningRu: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="text-zinc-400">Предупреждения EN</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5 text-xs"
          rows={2}
          value={data.userWarningEn ?? ""}
          onChange={(e) => setData({ ...data, userWarningEn: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="text-zinc-400">Maintenance (RU)</span>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5 text-xs"
          value={data.maintenanceMessageRu ?? ""}
          onChange={(e) => setData({ ...data, maintenanceMessageRu: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="text-zinc-400">Maintenance EN</span>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5 text-xs"
          value={data.maintenanceMessageEn ?? ""}
          onChange={(e) => setData({ ...data, maintenanceMessageEn: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="text-zinc-400">Причина изменения (обязательна для опасных полей)</span>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Сохранение…" : "Сохранить настройки"}
      </button>
      {message ? <p className="text-xs text-zinc-400">{message}</p> : null}
    </div>
  );
}
