"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import {
  okxTextareaClass,
  shortSupportTicketId,
  SupportTicketStatusBadge,
} from "@/components/dashboard/support/dashboard-support-shared";
import { DashboardAppShell } from "@/components/layout/dashboard-app-shell";
import { ProfileSectionSkeleton } from "@/components/dashboard/profile/profile-section-skeleton";
import {
  profileCardClass,
  profileOutlineButtonClass,
  profilePrimaryButtonClass,
} from "@/components/dashboard/profile/profile-ui";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { formatDateTime } from "@/lib/i18n/formatters";
import { supportTicketCategoryLabel } from "@/lib/i18n/support-messages";
import { cn } from "@/lib/utils";
import {
  addUserSupportMessage,
  closeUserSupportTicket,
  getUserSupportDataSource,
  getUserSupportTicket,
  type UserSupportTicket,
} from "@/services/user/userSupport.service";

export function DashboardSupportTicketContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { authorizedFetch, user } = useAuth();
  const { t, locale } = useI18n();
  const { messageFor } = useApiErrorMessage();
  const live = getUserSupportDataSource() === "live";

  const [ticket, setTicket] = React.useState<UserSupportTicket | null>(null);
  const [reply, setReply] = React.useState("");
  const [loading, setLoading] = React.useState(Boolean(live && id));
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    if (!live || !id) return;
    setLoading(true);
    setError(null);
    void getUserSupportTicket(id, authorizedFetch)
      .then(setTicket)
      .catch(() => setError(t("support.tickets.detail.loadError")))
      .finally(() => setLoading(false));
  }, [authorizedFetch, id, live, t]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleReply() {
    if (!reply.trim() || !id) return;
    setSending(true);
    try {
      const updated = await addUserSupportMessage(id, reply.trim(), authorizedFetch);
      setTicket(updated);
      setReply("");
    } catch (err: unknown) {
      setError(messageFor(err) || t("support.tickets.detail.loadError"));
    } finally {
      setSending(false);
    }
  }

  async function handleClose() {
    if (!id) return;
    setSending(true);
    try {
      const updated = await closeUserSupportTicket(id, authorizedFetch);
      setTicket(updated);
    } catch (err: unknown) {
      setError(messageFor(err) || t("support.tickets.detail.loadError"));
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return (
      <DashboardAppShell contentClassName="max-w-2xl pb-8">
        <p className="text-sm text-neutral-600">{t("support.tickets.signInPrompt")}</p>
        <Link href={ROUTES.login} className="mt-4 inline-flex text-sm font-semibold text-neutral-900 underline">
          {t("auth.login.submit")}
        </Link>
      </DashboardAppShell>
    );
  }

  if (!live) {
    return (
      <DashboardAppShell contentClassName="max-w-2xl pb-8">
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("support.tickets.detail.liveRequired")}
        </p>
      </DashboardAppShell>
    );
  }

  return (
    <DashboardAppShell contentClassName="max-w-[900px] pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-8">
      <Link
        href={ROUTES.dashboardSupport}
        className="inline-flex text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
      >
        {t("support.tickets.detail.back")}
      </Link>

      {loading ? <ProfileSectionSkeleton variant="form" className="mt-6" /> : null}

      {error ? (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && ticket ? (
        <div className="mt-6 space-y-6">
          <header className={profileCardClass}>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              {shortSupportTicketId(ticket.id)}
            </p>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <h1 className="min-w-0 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                {ticket.subject}
              </h1>
              <SupportTicketStatusBadge status={ticket.status} locale={locale} />
            </div>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-neutral-500">{t("support.tickets.detail.categoryLabel")}</dt>
                <dd className="mt-0.5 font-medium text-neutral-900">
                  {supportTicketCategoryLabel(ticket.category, locale)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">{t("support.tickets.detail.updatedLabel")}</dt>
                <dd className="mt-0.5 font-medium text-neutral-900">
                  {formatDateTime(ticket.updatedAt, locale, { dateStyle: "medium", timeStyle: "short" })}
                </dd>
              </div>
            </dl>
          </header>

          <section className={profileCardClass}>
            <h2 className="text-base font-semibold text-neutral-900">{t("support.tickets.detail.conversation")}</h2>
            <div className="mt-4 space-y-3">
              {ticket.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-2xl px-4 py-3",
                    message.isStaff ? "bg-sky-50" : "bg-neutral-50",
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                    {message.isStaff ? t("support.tickets.detail.authorSupport") : t("support.tickets.detail.authorYou")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-800">
                    {message.body}
                  </p>
                  <p className="mt-2 text-[11px] text-neutral-400">
                    {formatDateTime(message.createdAt, locale, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {ticket.status !== "closed" ? (
            <section className={profileCardClass}>
              <label htmlFor="support-ticket-reply" className="mb-1.5 block text-xs font-medium text-neutral-700">
                {t("support.tickets.messagePlaceholder")}
              </label>
              <textarea
                id="support-ticket-reply"
                className={okxTextareaClass}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={sending || !reply.trim()}
                  onClick={() => void handleReply()}
                  className={cn(profilePrimaryButtonClass, "h-10 disabled:opacity-60")}
                >
                  {sending ? (
                    <>
                      <SplitonLoader size="xxs" variant="dark" className="mr-2 inline" />
                      {t("support.tickets.detail.sending")}
                    </>
                  ) : (
                    t("support.tickets.detail.reply")
                  )}
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void handleClose()}
                  className={cn(profileOutlineButtonClass, "disabled:opacity-60")}
                >
                  {t("support.tickets.detail.close")}
                </button>
              </div>
            </section>
          ) : (
            <p className="rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-600">
              {t("support.tickets.detail.closedNote")}
            </p>
          )}
        </div>
      ) : null}
    </DashboardAppShell>
  );
}
