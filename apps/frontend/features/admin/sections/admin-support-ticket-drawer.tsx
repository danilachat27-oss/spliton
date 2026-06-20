"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminFieldTextarea } from "@/features/admin/lib/admin-ui";
import {
  AdminDrawerGhostButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminDrawerUnsavedGuard } from "@/features/admin/hooks/use-admin-drawer-unsaved-guard";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { AdminDetailDrawer, AdminFormField, AdminFormFooter, AdminLocalizedStatusBadge } from "@/features/admin/ui";
import {
  addAdminTicketNote,
  escalateAdminTicket,
  getAdminTicket,
  patchAdminTicketPriority,
  patchAdminTicketStatus,
  replyAdminTicket,
  takeAdminTicket,
  type AdminTicketDetail,
} from "@/services/admin/adminSupport.service";

type Props = {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

const CATEGORY_LABELS: Record<string, string> = {
  deposit: "Пополнение",
  withdrawal: "Вывод",
  wallet: "Кошелёк",
  primary_purchase: "Покупка юнитов",
  secondary_market: "Вторичный рынок",
  payouts: "Начисления",
  account: "Аккаунт",
  technical: "Техническая проблема",
  other: "Другое",
};

export function AdminSupportTicketDrawer({ ticketId, open, onOpenChange, onUpdated }: Props) {
  const a = useAdminI18n();
  const client = useAdminApi();
  const [tab, setTab] = React.useState<"overview" | "dialog" | "notes">("overview");
  const [ticket, setTicket] = React.useState<AdminTicketDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [reply, setReply] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const dirty = Boolean(reply.trim() || note.trim());
  const { guardedOnOpenChange, UnsavedChangesDialog } = useAdminDrawerUnsavedGuard({
    open,
    dirty,
    onOpenChange,
  });

  const load = React.useCallback(() => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    void getAdminTicket(ticketId, client)
      .then(setTicket)
      .catch(() => setError("Не удалось загрузить тикет"))
      .finally(() => setLoading(false));
  }, [ticketId, client]);

  React.useEffect(() => {
    if (!open) {
      setReply("");
      setNote("");
      setTab("overview");
    }
  }, [open]);

  React.useEffect(() => {
    if (open && ticketId) load();
  }, [open, ticketId, load]);

  async function handleReply() {
    if (!ticketId || !reply.trim()) return;
    await replyAdminTicket(ticketId, reply.trim(), client);
    setReply("");
    load();
    onUpdated?.();
  }

  async function handleNote() {
    if (!ticketId || !note.trim()) return;
    await addAdminTicketNote(ticketId, note.trim(), true, client);
    setNote("");
    load();
  }

  return (
    <AdminDetailDrawer
      open={open}
      onOpenChange={guardedOnOpenChange}
      title={a.t("admin.supportOps.title")}
      subtitle={ticketId ?? undefined}
      wide
      footer={
        <AdminFormFooter
          right={
            <AdminDrawerGhostButton onClick={() => guardedOnOpenChange(false)}>
              {a.t("admin.drawer.common.close")}
            </AdminDrawerGhostButton>
          }
        />
      }
    >
      {loading ? (
        <p className="text-sm text-zinc-500">Загрузка…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : ticket ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["overview", "dialog", "notes"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant={tab === t ? "default" : "ghost"}
                className={tab === t ? undefined : adminBtnOutline}
                onClick={() => setTab(t)}
              >
                {t === "overview" ? "Обзор" : t === "dialog" ? "Диалог" : "Заметки"}
              </Button>
            ))}
          </div>

          {tab === "overview" ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase text-zinc-500">Пользователь</dt>
                <dd>{ticket.userEmail}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase text-zinc-500">Статус</dt>
                <dd>
                  <AdminLocalizedStatusBadge status={ticket.status} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase text-zinc-500">Категория</dt>
                <dd>{CATEGORY_LABELS[ticket.category] ?? ticket.category}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase text-zinc-500">Приоритет</dt>
                <dd>
                  <AdminLocalizedStatusBadge
                    status={ticket.priority}
                    tone={["high", "critical"].includes(ticket.priority) ? "danger" : "neutral"}
                  />
                </dd>
              </div>
              {ticket.slaDueAt ? (
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase text-zinc-500">SLA</dt>
                  <dd className={ticket.slaOverdue ? "text-red-700" : ""}>
                    до {formatAdminDate(ticket.slaDueAt)}
                    {ticket.slaOverdue ? " (просрочено)" : ""}
                  </dd>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <AdminDrawerSecondaryButton onClick={() => void takeAdminTicket(ticket.id, client).then(load)}>
                  Взять в работу
                </AdminDrawerSecondaryButton>
                <AdminDrawerSecondaryButton
                  onClick={() =>
                    void patchAdminTicketStatus(ticket.id, "in_progress", undefined, client).then(() => {
                      load();
                      onUpdated?.();
                    })
                  }
                >
                  В работе
                </AdminDrawerSecondaryButton>
                <AdminDrawerSecondaryButton onClick={() => void patchAdminTicketPriority(ticket.id, "high", client).then(load)}>
                  High
                </AdminDrawerSecondaryButton>
                <AdminDrawerSecondaryButton onClick={() => void escalateAdminTicket(ticket.id, "finance", undefined, client).then(load)}>
                  Эскалация finance
                </AdminDrawerSecondaryButton>
                <AdminDrawerSecondaryButton onClick={() => void patchAdminTicketStatus(ticket.id, "closed", undefined, client).then(onUpdated)}>
                  Закрыть
                </AdminDrawerSecondaryButton>
              </div>
            </dl>
          ) : null}

          {tab === "dialog" ? (
            <div className="space-y-3">
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-neutral-200 bg-zinc-900/50/80 p-3">
                {(ticket.messages ?? []).length === 0 ? (
                  <p className="text-xs text-zinc-500">Нет сообщений</p>
                ) : (
                  ticket.messages?.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-lg px-3 py-2 text-sm ${m.isStaff ? "bg-blue-50 text-blue-950" : "bg-zinc-900/80"}`}
                    >
                      <p className="text-[10px] font-semibold uppercase text-zinc-500">
                        {m.authorEmail} · {formatAdminDate(m.createdAt)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))
                )}
              </div>
              <AdminFormField label={a.t("admin.placeholder.ticketReply")} htmlFor="support-reply">
                <textarea
                  id="support-reply"
                  className={adminFieldTextarea}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={a.t("admin.placeholder.ticketReply")}
                  rows={3}
                />
              </AdminFormField>
              <AdminDrawerPrimaryButton onClick={() => void handleReply()}>
                Отправить ответ
              </AdminDrawerPrimaryButton>
            </div>
          ) : null}

          {tab === "notes" ? (
            <div className="space-y-3">
              {(ticket.notes ?? []).map((n) => (
                <div key={n.id} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                  <p className="text-[10px] text-zinc-500">
                    {n.authorEmail} · {formatAdminDate(n.createdAt)}
                    {n.isInternal ? " · internal" : ""}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
                </div>
              ))}
              <AdminFormField label={a.t("admin.placeholder.ticketInternalNote")} htmlFor="support-note">
                <textarea
                  id="support-note"
                  className={adminFieldTextarea}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={a.t("admin.placeholder.ticketInternalNote")}
                  rows={2}
                />
              </AdminFormField>
              <AdminDrawerSecondaryButton onClick={() => void handleNote()}>
                Добавить заметку
              </AdminDrawerSecondaryButton>
            </div>
          ) : null}
        </div>
      ) : null}
      {UnsavedChangesDialog}
    </AdminDetailDrawer>
  );
}
