"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import { AdminSectionDataArea, AdminSectionPanel } from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { AdminLocalizedStatusBadge } from "@/features/admin/ui";
import type { SystemStatusComponentRow } from "@/features/admin/sections/admin-system-status-components-panel";

export type SystemStatusIncidentRow = {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  affectedComponentCodes: string[];
  startedAt: string;
  resolvedAt: string | null;
  visiblePublic: boolean;
  updates: Array<{
    id: string;
    body: string;
    status: string | null;
    createdAt: string;
  }>;
};

const SEVERITY_OPTIONS = [
  { value: "low", label: "Низкая" },
  { value: "medium", label: "Средняя" },
  { value: "high", label: "Высокая" },
  { value: "critical", label: "Критическая" },
] as const;

const UPDATE_STATUS_OPTIONS = [
  { value: "", label: "Без смены статуса" },
  { value: "investigating", label: "Расследование" },
  { value: "identified", label: "Причина найдена" },
  { value: "monitoring", label: "Наблюдение" },
] as const;

type AdminSystemStatusIncidentsPanelProps = {
  components: SystemStatusComponentRow[];
  incidents: SystemStatusIncidentRow[];
  loading: boolean;
  error: boolean;
  onReload: () => void;
};

export function AdminSystemStatusIncidentsPanel({
  components,
  incidents,
  loading,
  error,
  onReload,
}: AdminSystemStatusIncidentsPanelProps) {
  const a = useAdminI18n();
  const client = useAdminApi();
  const [filter, setFilter] = React.useState<"active" | "resolved" | "all">("active");
  const [creating, setCreating] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [severity, setSeverity] = React.useState("medium");
  const [visiblePublic, setVisiblePublic] = React.useState(true);
  const [affectedCodes, setAffectedCodes] = React.useState<string[]>([]);

  const [updateBodies, setUpdateBodies] = React.useState<Record<string, string>>({});
  const [updateStatuses, setUpdateStatuses] = React.useState<Record<string, string>>({});
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const componentNameByCode = React.useMemo(
    () => Object.fromEntries(components.map((row) => [row.code, row.name])),
    [components],
  );

  const filtered = incidents.filter((incident) => {
    if (filter === "active") return incident.status !== "resolved";
    if (filter === "resolved") return incident.status === "resolved";
    return true;
  });

  function toggleAffected(code: string) {
    setAffectedCodes((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  async function createIncident() {
    if (!title.trim() || !description.trim()) {
      setFeedback("Укажите заголовок и описание инцидента.");
      return;
    }
    setCreating(true);
    setFeedback(null);
    try {
      await client.post(ADMIN_API_PATHS.systemStatusIncidents, {
        title: title.trim(),
        description: description.trim(),
        severity,
        affectedComponentCodes: affectedCodes,
        visiblePublic,
      });
      setTitle("");
      setDescription("");
      setSeverity("medium");
      setAffectedCodes([]);
      setVisiblePublic(true);
      setFeedback("Инцидент создан и опубликован на /system-status.");
      onReload();
    } catch {
      setFeedback("Не удалось создать инцидент.");
    } finally {
      setCreating(false);
    }
  }

  async function resolveIncident(id: string) {
    setBusyId(id);
    setFeedback(null);
    try {
      await client.post(ADMIN_API_PATHS.systemStatusIncidentResolve(id));
      setFeedback("Инцидент закрыт. Он останется в «Недавних событиях» на публичной странице.");
      onReload();
    } catch {
      setFeedback("Не удалось закрыть инцидент.");
    } finally {
      setBusyId(null);
    }
  }

  async function postUpdate(incident: SystemStatusIncidentRow) {
    const body = (updateBodies[incident.id] ?? "").trim();
    if (!body) {
      setFeedback("Введите текст обновления.");
      return;
    }
    setBusyId(incident.id);
    setFeedback(null);
    try {
      const status = updateStatuses[incident.id];
      await client.post(ADMIN_API_PATHS.systemStatusIncidentUpdates(incident.id), {
        body,
        status: status || undefined,
      });
      setUpdateBodies((current) => ({ ...current, [incident.id]: "" }));
      setFeedback("Обновление опубликовано.");
      onReload();
    } catch {
      setFeedback("Не удалось добавить обновление.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminSectionPanel>
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">Инциденты и события</h3>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">
          Активные инциденты влияют на общий статус и блок «Недавние события». Закрытые остаются на странице
          90 дней, если включена публичная видимость.
        </p>
      </div>

      {feedback ? (
        <p className="rounded-xl bg-zinc-800/60 px-3.5 py-2.5 text-xs text-zinc-200" role="status">
          {feedback}
        </p>
      ) : null}

      <div className="rounded-2xl bg-zinc-900/50 p-4 ring-1 ring-neutral-200/70">
        <h4 className="text-sm font-semibold text-zinc-100">Создать инцидент</h4>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-xs font-medium text-zinc-400">Заголовок</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-10 w-full rounded-xl border border-neutral-200 bg-zinc-900/80 px-3 text-sm outline-none focus:border-neutral-400"
              placeholder={a.t("admin.placeholder.incidentTitle")}
            />
          </label>
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-xs font-medium text-zinc-400">Описание</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-neutral-200 bg-zinc-900/80 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              placeholder={a.t("admin.placeholder.incidentDescription")}
            />
          </label>
          <AdminStyledSelectField
            label={a.t("admin.field.severity")}
            value={severity}
            options={SEVERITY_OPTIONS}
            onChange={setSeverity}
            size="sm"
          />
          <label className="flex items-center gap-2 self-end pb-1 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={visiblePublic}
              onChange={(event) => setVisiblePublic(event.target.checked)}
              className="size-4 rounded border-neutral-300"
            />
            Показывать на /system-status
          </label>
        </div>

        <div className="mt-3">
          <p className="text-xs font-medium text-zinc-400">Затронутые компоненты</p>
          <div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto">
            {components.map((component) => (
              <label
                key={component.code}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-zinc-900/80 px-2.5 py-1 text-xs ring-1 ring-neutral-200"
              >
                <input
                  type="checkbox"
                  checked={affectedCodes.includes(component.code)}
                  onChange={() => toggleAffected(component.code)}
                  className="size-3.5 rounded border-neutral-300"
                />
                {component.name}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="button" size="sm" disabled={creating} onClick={() => void createIncident()}>
            {creating ? "Создание…" : "Создать инцидент"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["active", "Активные"],
            ["resolved", "Закрытые"],
            ["all", "Все"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={
              filter === id
                ? "rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white"
                : "rounded-xl bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-700/80"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <AdminSectionDataArea loading={loading} error={error} onRetry={onReload}>
        <ul className="divide-y divide-neutral-100">
          {filtered.length === 0 ? (
            <li className="py-8 text-center text-sm text-zinc-500">Инцидентов нет.</li>
          ) : (
            filtered.map((incident) => (
              <li key={incident.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-zinc-100">{incident.title}</p>
                      <AdminLocalizedStatusBadge status={incident.status} />
                      <AdminLocalizedStatusBadge status={incident.severity} tone="warning" />
                      {!incident.visiblePublic ? (
                        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-400">
                          Скрыт
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">{incident.description}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Начало: {new Date(incident.startedAt).toLocaleString("ru-RU")}
                      {incident.resolvedAt
                        ? ` · Закрыт: ${new Date(incident.resolvedAt).toLocaleString("ru-RU")}`
                        : null}
                    </p>
                    {incident.affectedComponentCodes.length > 0 ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        Компоненты:{" "}
                        {incident.affectedComponentCodes
                          .map((code) => componentNameByCode[code] ?? code)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>

                  {incident.status !== "resolved" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost" className={adminBtnOutline}
                      disabled={busyId === incident.id}
                      onClick={() => void resolveIncident(incident.id)}
                    >
                      Закрыть
                    </Button>
                  ) : null}
                </div>

                {incident.updates.length > 0 ? (
                  <ul className="mt-3 space-y-2 border-l border-neutral-200 pl-3">
                    {incident.updates.map((update) => (
                      <li key={update.id} className="text-xs text-zinc-400">
                        <span className="text-zinc-500">
                          {new Date(update.createdAt).toLocaleString("ru-RU")}
                        </span>
                        {update.status ? (
                          <span className="ml-2 font-medium text-zinc-300">{a.formatAdminStatus(update.status)}</span>
                        ) : null}
                        <p className="mt-0.5">{update.body}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {incident.status !== "resolved" ? (
                  <div className="mt-3 rounded-xl bg-zinc-900/50 p-3 ring-1 ring-neutral-200/60">
                    <p className="text-xs font-medium text-zinc-300">Добавить обновление</p>
                    <textarea
                      value={updateBodies[incident.id] ?? ""}
                      onChange={(event) =>
                        setUpdateBodies((current) => ({ ...current, [incident.id]: event.target.value }))
                      }
                      rows={2}
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-zinc-900/80 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                      placeholder={a.t("admin.placeholder.investigationStatus")}
                    />
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <AdminStyledSelectField
                        label={a.t("admin.field.incidentStatus")}
                        value={updateStatuses[incident.id] ?? ""}
                        options={UPDATE_STATUS_OPTIONS}
                        onChange={(value) =>
                          setUpdateStatuses((current) => ({ ...current, [incident.id]: value }))
                        }
                        size="sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={busyId === incident.id}
                        onClick={() => void postUpdate(incident)}
                      >
                        Опубликовать
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </AdminSectionDataArea>
    </AdminSectionPanel>
  );
}
