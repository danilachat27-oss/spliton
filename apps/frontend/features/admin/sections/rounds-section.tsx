"use client";

import * as React from "react";
import { Layers, Plus } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminRoundDrawer,
  type AdminRoundFormBody,
} from "@/features/admin/components/admin-round-drawer";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminPaginatedList } from "@/features/admin/hooks/use-admin-paginated-list";
import { useAdminPermissions } from "@/features/admin/hooks/use-admin-permissions";
import { formatAdminDateShort, formatUnits, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { ADMIN_ROUND_SORT_OPTIONS } from "@/features/admin/lib/admin-rounds-sort";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { adminSectionCreateButton, adminSectionToolbarActions } from "@/features/admin/lib/admin-ui";
import type { AdminListQuery } from "@/features/admin/api/types";
import type { AdminRoundListItem } from "@/features/admin/mocks/admin-rounds.mock";
import type { AdminTrackListItem } from "@/features/admin/mocks/admin-tracks.mock";
import { roundFormToPayload } from "@/features/admin/lib/admin-round-form";
import {
  AdminDataTable,
  AdminFilterBar,
  AdminFilterPills,
  AdminFilterResultCount,
  AdminPagination,
  AdminRaiseProgress,
  AdminReadOnlyBanner,
  AdminStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import {
  closeAdminRound,
  createAdminRound,
  getAdminRound,
  listAdminRoundsPaginated,
  pauseAdminRound,
  publishAdminRound,
  updateAdminRound,
} from "@/services/admin/adminRounds.service";
import { getAdminTrack, listAdminTracks } from "@/services/admin/adminTracks.service";
import { cn } from "@/lib/utils";

const ROUND_STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "pending" | "danger"> = {
  draft: "neutral",
  live: "success",
  paused: "warning",
  completed: "pending",
  cancelled: "danger",
};

function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "info";
}) {
  const valueClass =
    tone === "success"
      ? "text-emerald-400"
      : tone === "warning"
        ? "text-amber-400"
        : tone === "info"
          ? "text-sky-400"
          : "text-zinc-100";
  return (
    <div className={cn(ADMIN_SECTION_TILE, "space-y-1")}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>{value}</p>
    </div>
  );
}

function parseAmount(value: string): number {
  return Number(String(value).replace(/[^\d.-]/g, "")) || 0;
}

export function RoundsSection() {
  const a = useAdminI18n();
  const statusFilterOptions = React.useMemo(
    () => [
      { value: "all", label: a.actions.allStatuses },
      { value: "draft", label: a.formatRoundStatus("draft") },
      { value: "live", label: a.formatRoundStatus("live") },
      { value: "paused", label: a.formatRoundStatus("paused") },
      { value: "completed", label: a.formatRoundStatus("completed") },
      { value: "cancelled", label: a.formatRoundStatus("cancelled") },
    ],
    [a],
  );
  const client = useAdminApi();
  const perms = useAdminPermissions();
  const canEdit = perms.can("Rounds", "create") || perms.can("Rounds", "update");
  const canPublish = perms.can("Rounds", "approve") || perms.can("Rounds", "update");
  const isReadOnly = perms.readOnly("Rounds");

  const loader = React.useCallback(
    (q: AdminListQuery) => listAdminRoundsPaginated(q, client),
    [client],
  );
  const { data: page, loading, error, query, setQuery, reload } = useAdminPaginatedList(loader);
  const rows = page.items;

  const [tracks, setTracks] = React.useState<AdminTrackListItem[]>([]);
  const [selectedTrackId, setSelectedTrackId] = React.useState("");
  const [selectedRelease, setSelectedRelease] = React.useState<AdminTrackListItem | null>(null);
  const [loadingRelease, setLoadingRelease] = React.useState(false);
  const [loadingRound, setLoadingRound] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("created_desc");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editRound, setEditRound] = React.useState<AdminRoundListItem | null>(null);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  function actionError(e: unknown, fallback: string) {
    setFeedback(e instanceof Error ? e.message : fallback);
  }

  React.useEffect(() => {
    void listAdminTracks(client)
      .then(setTracks)
      .catch((e) => actionError(e, "Не удалось загрузить список релизов"));
  }, [client]);

  const loadRelease = React.useCallback(
    async (trackId: string) => {
      if (!trackId) {
        setSelectedRelease(null);
        return;
      }
      setLoadingRelease(true);
      try {
        const track = await getAdminTrack(trackId, client);
        setSelectedRelease(track);
      } catch {
        const fallback = tracks.find((t) => t.id === trackId) ?? null;
        setSelectedRelease(fallback);
      } finally {
        setLoadingRelease(false);
      }
    },
    [client, tracks],
  );

  React.useEffect(() => {
    setQuery((q) => ({
      ...q,
      page: 1,
      search: search || undefined,
      status: status === "all" ? undefined : status,
      sortBy,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }));
  }, [search, status, sortBy, dateFrom, dateTo, setQuery]);

  const sortOptions = React.useMemo(
    () =>
      ADMIN_ROUND_SORT_OPTIONS.map((option) => ({
        value: option.value,
        label: a.t(option.labelKey),
      })),
    [a],
  );

  const pageStats = React.useMemo(() => {
    const live = rows.filter((r) => r.status === "live").length;
    const draft = rows.filter((r) => r.status === "draft").length;
    const raised = rows.reduce((sum, r) => sum + parseAmount(r.raisedAmountUsdt), 0);
    return { live, draft, raised };
  }, [rows]);

  const hasLiveConflict = React.useMemo(() => {
    const trackId = editRound?.trackId ?? selectedTrackId;
    if (!trackId) return false;
    return rows.some(
      (r) => r.trackId === trackId && r.status === "live" && r.id !== editRound?.id,
    );
  }, [rows, editRound, selectedTrackId]);

  const columns: AdminColumn<AdminRoundListItem>[] = [
    {
      key: "round",
      header: "Раунд",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-400">
            <Layers className="size-4" strokeWidth={2.25} />
          </div>
          <div>
            <p className="font-mono text-xs font-medium text-zinc-200">{r.id.slice(0, 8)}…</p>
            <p className="text-sm font-medium text-zinc-100">{r.trackTitle}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: a.table.status,
      render: (r) => (
        <AdminStatusBadge
          label={a.formatRoundStatus(r.status)}
          tone={ROUND_STATUS_TONE[r.status] ?? "neutral"}
        />
      ),
    },
    {
      key: "raised",
      header: "Собрано",
      render: (r) => (
        <div>
          <p className="font-medium tabular-nums text-zinc-100">
            {formatUsdtAmount(r.raisedAmountUsdt)}
          </p>
          <p className="text-xs text-zinc-500">из {formatUsdtAmount(r.raiseTargetUsdt)}</p>
        </div>
      ),
    },
    {
      key: "progress",
      header: "Прогресс",
      render: (r) => (
        <AdminRaiseProgress
          pct={r.progressPct}
          raised={r.raisedAmountUsdt}
          target={r.raiseTargetUsdt}
        />
      ),
    },
    {
      key: "units",
      header: "Юниты",
      render: (r) => (
        <span className="tabular-nums text-zinc-300">
          {formatUnits(r.soldUnits)} / {formatUnits(r.totalUnits)}
        </span>
      ),
    },
    {
      key: "dates",
      header: a.table.period,
      render: (r) => (
        <span className="whitespace-nowrap text-sm tabular-nums text-zinc-400">
          {formatAdminDateShort(r.startDate)} — {formatAdminDateShort(r.endDate)}
        </span>
      ),
    },
    {
      key: "open",
      header: "",
      render: (r) => (
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800/60"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(r);
          }}
        >
          {canEdit ? "Изменить" : "Открыть"}
        </button>
      ),
    },
  ];

  function openCreate() {
    setEditRound(null);
    setSelectedRelease(null);
    setSelectedTrackId("");
    setLoadingRound(false);
    setMode("create");
    setDrawerOpen(true);
  }

  async function openEdit(round: AdminRoundListItem) {
    setMode("edit");
    setDrawerOpen(true);
    setLoadingRound(true);
    try {
      const detail = await getAdminRound(round.id, client);
      setEditRound(detail);
      setSelectedTrackId(detail.trackId);
      await loadRelease(detail.trackId);
    } catch {
      setEditRound(round);
      setSelectedTrackId(round.trackId);
      await loadRelease(round.trackId);
    } finally {
      setLoadingRound(false);
    }
  }

  async function handleSubmit(body: AdminRoundFormBody, _asDraft?: boolean) {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = roundFormToPayload(body);
      if (mode === "create") {
        await createAdminRound(payload, client);
        setFeedback("Раунд создан");
      } else if (editRound) {
        const updated = await updateAdminRound(editRound.id, payload, client);
        setEditRound(updated);
        setFeedback("Сохранено");
      }
      setDrawerOpen(false);
      await reload();
    } catch (e) {
      actionError(e, "Ошибка сохранения раунда");
      throw e;
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminSectionShell
      sectionId="rounds"
      title={a.adminSectionLabel("rounds")}
      infoHint={a.t("admin.rounds.infoHint")}
      actions={
        <>
          <AdminSectionRefreshButton onClick={reload} />
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              className={adminSectionCreateButton}
              onClick={openCreate}
            >
              <Plus className="size-3.5" aria-hidden />
              {a.t("admin.rounds.createBtn")}
            </Button>
          ) : null}
        </>
      }
    >
      {isReadOnly || !canEdit ? <AdminReadOnlyBanner area={a.adminSectionLabel("rounds")} /> : null}
      {feedback ? (
        <p className={`text-sm ${feedback.includes("Ошиб") ? "text-red-400" : "text-zinc-400"}`}>{feedback}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={a.t("admin.kpi.rounds.total")} value={loading ? "…" : String(page.total)} />
        <StatTile
          label={a.t("admin.kpi.activeOnPage")}
          value={loading ? "…" : String(pageStats.live)}
          tone="success"
        />
        <StatTile
          label={a.t("admin.kpi.rounds.draftsOnPage")}
          value={loading ? "…" : String(pageStats.draft)}
          tone="warning"
        />
        <StatTile
          label={a.t("admin.kpi.rounds.collectedOnPage")}
          value={loading ? "…" : formatUsdtAmount(pageStats.raised)}
          tone="info"
        />
      </div>

      <AdminSectionPanel>
        <AdminFilterBar
          className="!rounded-2xl !border-0 !bg-zinc-900/40 !p-4 !shadow-none"
          panelWidthClassName="w-[min(100vw-1rem,520px)]"
          searchHint={a.t("admin.rounds.search.hint")}
          footer={
            <AdminFilterResultCount
              label={a.t("admin.filters.foundCount")}
              value={page.total}
              className="w-full"
            />
          }
          fields={[
            {
              id: "search",
              label: a.t("admin.rounds.search.label"),
              type: "search",
              value: search,
              onChange: setSearch,
              placeholder: a.t("admin.rounds.search.placeholder"),
            },
            {
              id: "status",
              label: a.table.status,
              type: "select",
              value: status,
              onChange: setStatus,
              options: statusFilterOptions,
            },
            {
              id: "sort",
              label: a.t("admin.filters.sort"),
              type: "select",
              value: sortBy,
              onChange: setSortBy,
              options: sortOptions,
            },
            {
              id: "from",
              label: a.t("admin.rounds.filters.startFrom"),
              type: "date",
              value: dateFrom,
              onChange: setDateFrom,
            },
            {
              id: "to",
              label: a.t("admin.rounds.filters.startTo"),
              type: "date",
              value: dateTo,
              onChange: setDateTo,
            },
          ]}
        />

        <div className="flex flex-col gap-3 rounded-2xl bg-zinc-900/25 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-3">
          <AdminFilterPills
            label={a.table.status}
            value={status}
            onChange={setStatus}
            options={statusFilterOptions}
          />
        </div>

        <AdminSectionDataArea
          loading={loading}
          error={error}
          onRetry={reload}
          loadingLabel="Загрузка раундов…"
        >
          <AdminDataTable
            flat
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={openEdit}
            emptyMessage={a.empty.noData}
          />
          <AdminPagination
            page={query.page ?? 1}
            pageSize={query.pageSize ?? 20}
            total={page.total}
            onPageChange={(p) => setQuery((q) => ({ ...q, page: p }))}
          />
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminRoundDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        round={editRound}
        trackOptions={tracks}
        selectedRelease={selectedRelease}
        loadingRelease={loadingRelease}
        mode={mode}
        saving={saving}
        loading={loadingRound}
        readOnly={!canEdit}
        canPublish={canPublish}
        hasLiveConflict={hasLiveConflict}
        onTrackSelect={(id) => {
          setSelectedTrackId(id);
          void loadRelease(id);
        }}
        onSubmit={handleSubmit}
        onPublish={
          editRound
            ? async () => {
                setSaving(true);
                setFeedback(null);
                try {
                  const updated = await publishAdminRound(editRound.id, client);
                  setEditRound(updated);
                  setFeedback("Раунд опубликован");
                  setDrawerOpen(false);
                  await reload();
                } catch (e) {
                  actionError(e, "Ошибка публикации раунда");
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
        onPause={
          editRound
            ? async () => {
                setSaving(true);
                setFeedback(null);
                try {
                  const updated = await pauseAdminRound(editRound.id, client);
                  setEditRound(updated);
                  setFeedback("Раунд приостановлен");
                  await reload();
                } catch (e) {
                  actionError(e, "Ошибка приостановки раунда");
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
        onClose={
          editRound
            ? async () => {
                setSaving(true);
                setFeedback(null);
                try {
                  const updated = await closeAdminRound(editRound.id, client);
                  setEditRound(updated);
                  setFeedback("Раунд завершён");
                  setDrawerOpen(false);
                  await reload();
                } catch (e) {
                  actionError(e, "Ошибка закрытия раунда");
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
      />
    </AdminSectionShell>
  );
}
