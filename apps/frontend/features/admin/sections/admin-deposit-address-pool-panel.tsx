"use client";

import * as React from "react";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";

type PoolRow = {
  id: string;
  address: string;
  status: string;
  source: string;
  assignedUserId: string | null;
  assignedAt: string | null;
  createdAt: string;
  disabledAt: string | null;
};

type PoolResponse = {
  items: PoolRow[];
  availableCount: number;
  total: number;
};

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Свободен",
  ASSIGNED: "Назначен",
  ACTIVE: "Активен",
  DISABLED: "Отключён",
  COMPROMISED: "Скомпрометирован",
  ROTATED: "Ротация",
};

export function AdminDepositAddressPoolPanel() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const [data, setData] = React.useState<PoolResponse | null>(null);
  const [newAddress, setNewAddress] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    void client
      .get<PoolResponse>(`${ADMIN_API_PATHS.treasury}/deposit-address-pool`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [client]);

  React.useEffect(() => {
    load();
  }, [load]);

  const addAddress = async () => {
    const address = newAddress.trim();
    if (!address) return;
    setMessage(null);
    try {
      await client.post(`${ADMIN_API_PATHS.treasury}/deposit-address-pool`, {
        address,
        asset: "USDT",
        network: "TRC20",
        reason: reason.trim() || "Добавление адреса в пул",
      });
      setNewAddress("");
      setMessage("Адрес добавлен");
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка добавления");
    }
  };

  const disableAddress = async (id: string, compromised: boolean) => {
    const r = reason.trim();
    if (!r) {
      setMessage("Укажите причину отключения");
      return;
    }
    setMessage(null);
    try {
      await client.post(`${ADMIN_API_PATHS.treasury}/deposit-address-pool/${id}/disable`, {
        reason: r,
        compromised,
      });
      setMessage(compromised ? "Адрес помечен compromised" : "Адрес отключён");
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка");
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-zinc-100">Пул адресов TRC20</p>
        {data ? (
          <p className="text-xs text-zinc-500">
            Свободно: {data.availableCount} / {data.total}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className="rounded-lg border border-zinc-800 px-2 py-1.5 font-mono text-xs"
          placeholder={a.t("admin.placeholder.depositAddress")}
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void addAddress()}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Добавить
        </button>
      </div>

      <label className="block">
        <span className="text-zinc-400">Причина (add / disable)</span>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-800 px-2 py-1.5 text-xs"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>

      {loading ? <p className="text-xs text-zinc-500">Загрузка пула…</p> : null}
      {!loading && !data ? (
        <p className="text-xs text-amber-800">Пул недоступен (нет доступа или API).</p>
      ) : null}

      {data && data.items.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Пул пуст. В production пользователи не получат адрес пополнения, пока не добавите адреса.
        </p>
      ) : null}

      {data && data.items.length > 0 ? (
        <div className="max-h-72 overflow-auto rounded-lg border border-zinc-800">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="sticky top-0 bg-zinc-50 text-[10px] uppercase text-zinc-500">
              <tr>
                <th className="px-2 py-2">Адрес</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2">{a.t("admin.treasury.pool.user")}</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id} className="border-t border-zinc-800">
                  <td className="max-w-[200px] truncate px-2 py-2 font-mono">{row.address}</td>
                  <td className="px-2 py-2">{STATUS_LABEL[row.status] ?? row.status}</td>
                  <td className="px-2 py-2 font-mono text-[10px] text-zinc-500">
                    {row.assignedUserId ? `${row.assignedUserId.slice(0, 8)}…` : "—"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {row.status === "AVAILABLE" || row.status === "ASSIGNED" ? (
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="text-[10px] text-zinc-400 underline"
                          onClick={() => void disableAddress(row.id, false)}
                        >
                          {a.t("admin.treasury.pool.off")}
                        </button>
                        <button
                          type="button"
                          className="text-[10px] text-red-700 underline"
                          onClick={() => void disableAddress(row.id, true)}
                        >
                          {a.t("admin.treasury.pool.compromised")}
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {message ? <p className="text-xs text-zinc-400">{message}</p> : null}
    </div>
  );
}
