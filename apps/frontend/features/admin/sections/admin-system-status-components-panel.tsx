"use client";

import * as React from "react";
import { ExternalLink, Search } from "@/lib/lucide";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import { ROUTES } from "@/constants/routes";
import { PUBLIC_STATUS_COMPONENTS } from "@/constants/system-status-components";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import { AdminSectionDataArea, AdminSectionPanel } from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { AdminLocalizedStatusBadge } from "@/features/admin/ui";

export type SystemStatusComponentRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  message: string | null;
  updatedAt: string;
};

type ComponentDraft = {
  status: string;
  message: string;
};

const STATUS_OPTIONS = [
  { value: "operational", label: "Работает штатно" },
  { value: "degraded", label: "Пониженная производительность" },
  { value: "partial_outage", label: "Частичный сбой / задержки" },
  { value: "major_outage", label: "Серьёзный сбой" },
  { value: "maintenance", label: "Техработы" },
] as const;

const COMPONENT_ORDER = Object.fromEntries(
  PUBLIC_STATUS_COMPONENTS.map((component, index) => [component.code, index]),
) as Record<string, number>;

function sortComponents(rows: SystemStatusComponentRow[]): SystemStatusComponentRow[] {
  return [...rows].sort((left, right) => {
    const leftOrder = COMPONENT_ORDER[left.code] ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = COMPONENT_ORDER[right.code] ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.name.localeCompare(right.name, "ru");
  });
}

type AdminSystemStatusComponentsPanelProps = {
  components: SystemStatusComponentRow[];
  loading: boolean;
  error: boolean;
  onReload: () => void;
};

export function AdminSystemStatusComponentsPanel({
  components,
  loading,
  error,
  onReload,
}: AdminSystemStatusComponentsPanelProps) {
  const a = useAdminI18n();
  const client = useAdminApi();
  const [search, setSearch] = React.useState("");
  const [drafts, setDrafts] = React.useState<Record<string, ComponentDraft>>({});
  const [savingCode, setSavingCode] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    const next: Record<string, ComponentDraft> = {};
    for (const row of components) {
      next[row.code] = {
        status: row.status,
        message: row.message ?? "",
      };
    }
    setDrafts(next);
  }, [components]);

  const sorted = React.useMemo(() => sortComponents(components), [components]);
  const query = search.trim().toLowerCase();
  const filtered = sorted.filter(
    (row) =>
      !query ||
      row.name.toLowerCase().includes(query) ||
      row.code.toLowerCase().includes(query) ||
      (drafts[row.code]?.message ?? "").toLowerCase().includes(query),
  );

  function isDirty(row: SystemStatusComponentRow): boolean {
    const draft = drafts[row.code];
    if (!draft) return false;
    return draft.status !== row.status || draft.message !== (row.message ?? "");
  }

  function patchDraft(code: string, patch: Partial<ComponentDraft>) {
    setDrafts((current) => ({
      ...current,
      [code]: { ...current[code]!, ...patch },
    }));
  }

  async function saveComponent(row: SystemStatusComponentRow) {
    const draft = drafts[row.code];
    if (!draft) return;
    setSavingCode(row.code);
    setFeedback(null);
    try {
      await client.patch(ADMIN_API_PATHS.systemStatusComponent(row.code), {
        status: draft.status,
        message: draft.message.trim() || undefined,
      });
      setFeedback(`«${row.name}» сохранён — изменения видны на публичной странице.`);
      onReload();
    } catch {
      setFeedback(`Не удалось сохранить «${row.name}».`);
    } finally {
      setSavingCode(null);
    }
  }

  return (
    <AdminSectionPanel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Компоненты на /system-status</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">
            Статус и сообщение каждого сервиса управляют строками таблицы, общим заголовком и блоком
            «Плановые работы» на публичной странице. После сохранения обновление на сайте — в течение 30 сек.
          </p>
        </div>
        <Link
          href={ROUTES.systemStatus}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-zinc-800/60 px-3.5 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-700/80"
        >
          Открыть страницу
          <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </div>

      {feedback ? (
        <p className="rounded-xl bg-zinc-800/60 px-3.5 py-2.5 text-xs text-zinc-200" role="status">
          {feedback}
        </p>
      ) : null}

      <label className="relative block max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={a.t("admin.placeholder.componentSearch")}
          className="h-10 w-full rounded-xl border border-neutral-200 bg-zinc-900/80 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-neutral-400"
        />
      </label>

      <AdminSectionDataArea loading={loading} error={error} onRetry={onReload}>
        <ul className="divide-y divide-neutral-100">
          {filtered.map((row) => {
            const draft = drafts[row.code];
            const dirty = isDirty(row);
            return (
              <li key={row.id} className="py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-zinc-100">{row.name}</p>
                      <AdminLocalizedStatusBadge status={draft?.status ?? row.status} />
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-zinc-500">{row.code}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Обновлено: {new Date(row.updatedAt).toLocaleString("ru-RU")}
                    </p>
                  </div>

                  <div className="w-full space-y-2 lg:max-w-md">
                    <AdminStyledSelectField
                      label={a.table.status}
                      value={draft?.status ?? row.status}
                      options={STATUS_OPTIONS}
                      onChange={(value) => patchDraft(row.code, { status: value })}
                      size="sm"
                    />
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-zinc-400">
                        Сообщение для пользователей
                      </span>
                      <textarea
                        value={draft?.message ?? ""}
                        onChange={(event) => patchDraft(row.code, { message: event.target.value })}
                        rows={2}
                        placeholder={a.t("admin.placeholder.serviceColumnHint")}
                        className="w-full resize-y rounded-xl border border-neutral-200 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-neutral-400"
                      />
                    </label>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!dirty || savingCode === row.code}
                        onClick={() => void saveComponent(row)}
                      >
                        {savingCode === row.code ? "Сохранение…" : "Сохранить"}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </AdminSectionDataArea>
    </AdminSectionPanel>
  );
}
