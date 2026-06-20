"use client";

import * as React from "react";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_METRIC_NA_LABEL } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { adminBtnOutline, adminFieldInput } from "@/features/admin/lib/admin-ui";
import { AdminDataTable, AdminEmptyState, AdminFormField, type AdminColumn } from "@/features/admin/ui";
import { cn } from "@/lib/utils";

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

export function AdminDepositAddressPoolPanel({ embedded = false }: { embedded?: boolean }) {
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
      setMessage(a.t("admin.treasury.addressPool.added"));
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка добавления");
    }
  };

  const disableAddress = async (id: string, compromised: boolean) => {
    const r = reason.trim();
    if (!r) {
      setMessage(a.t("admin.treasury.addressPool.disableReason"));
      return;
    }
    setMessage(null);
    try {
      await client.post(`${ADMIN_API_PATHS.treasury}/deposit-address-pool/${id}/disable`, {
        reason: r,
        compromised,
      });
      setMessage(
        compromised
          ? a.t("admin.treasury.addressPool.compromisedMarked")
          : a.t("admin.treasury.addressPool.disabled"),
      );
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const poolColumns: AdminColumn<PoolRow>[] = [
    {
      key: "address",
      header: "Адрес",
      render: (row) => <span className="font-mono text-[11px] text-zinc-300">{row.address}</span>,
    },
    {
      key: "status",
      header: a.table.status,
      render: (row) => STATUS_LABEL[row.status] ?? row.status,
    },
    {
      key: "user",
      header: a.t("admin.treasury.pool.user"),
      render: (row) => (
        <span className="font-mono text-[10px] text-zinc-500">
          {row.assignedUserId ? `${row.assignedUserId.slice(0, 8)}…` : ADMIN_METRIC_NA_LABEL}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "AVAILABLE" || row.status === "ASSIGNED" ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              className={adminBtnOutline}
              onClick={() => void disableAddress(row.id, false)}
            >
              {a.t("admin.treasury.pool.off")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-400 hover:text-rose-300"
              onClick={() => void disableAddress(row.id, true)}
            >
              {a.t("admin.treasury.pool.compromised")}
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className={cn("space-y-4 text-sm", !embedded && ADMIN_SECTION_TILE)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!embedded ? (
          <p className="font-semibold text-zinc-100">{a.t("admin.treasury.addressPool.title")}</p>
        ) : null}
        {data ? (
          <p className="text-xs text-zinc-500">
            {a
              .t("admin.treasury.addressPool.available")
              .replace("{available}", String(data.availableCount))
              .replace("{total}", String(data.total))}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          className={cn(adminFieldInput, "font-mono text-xs")}
          placeholder={a.t("admin.placeholder.depositAddress")}
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value)}
        />
        <Button
          type="button"
          className="bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]"
          onClick={() => void addAddress()}
        >
          Добавить
        </Button>
      </div>

      <AdminFormField label={a.t("admin.treasury.addressPool.reason")} htmlFor="pool-reason">
        <Input
          id="pool-reason"
          className={adminFieldInput}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </AdminFormField>

      {loading ? <p className="text-xs text-zinc-500">Загрузка пула…</p> : null}
      {!loading && !data ? (
        <p className="text-xs text-amber-300">{a.t("admin.treasury.addressPool.unavailable")}</p>
      ) : null}

      {data && data.items.length === 0 ? (
        <AdminEmptyState title={a.t("admin.treasury.addressPool.empty")} className="bg-zinc-900/40 shadow-none" />
      ) : null}

      {data && data.items.length > 0 ? (
        <AdminDataTable
          flat
          borderless
          className="[&_table]:min-w-[640px]"
          columns={poolColumns}
          rows={data.items}
          rowKey={(row) => row.id}
        />
      ) : null}

      {message ? <p className="text-xs text-zinc-400">{message}</p> : null}
    </div>
  );
}
