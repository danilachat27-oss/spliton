"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, MessageSquarePlus, RefreshCw } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import {
  okxFieldClass,
  okxTextareaClass,
  shortSupportTicketId,
  SupportTicketStatusBadge,
} from "@/components/dashboard/support/dashboard-support-shared";
import { DashboardAppShell } from "@/components/layout/dashboard-app-shell";
import { profileCardClass } from "@/components/dashboard/profile/profile-ui";
import { FeesPageTabs } from "@/components/fees/fees-page-tabs";
import { ProductDemoBanner } from "@/components/shared/product-demo-banner";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { StyledSelectField } from "@/components/ui/styled-select";
import { SUPPORT_HELPDESK_EMAIL } from "@/constants/support-center";
import { ROUTES } from "@/constants/routes";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { formatDateTime } from "@/lib/i18n/formatters";
import {
  SUPPORT_TICKET_CATEGORY_VALUES,
  supportTicketCategoryLabel,
} from "@/lib/i18n/support-messages";
import { cn } from "@/lib/utils";
import {
  createUserSupportTicket,
  getUserSupportDataSource,
  listUserSupportTickets,
  type UserSupportTicket,
} from "@/services/user/userSupport.service";

type PageTab = "create" | "list";

const PAGE_TABS: { id: PageTab; labelKey: string }[] = [
  { id: "create", labelKey: "support.tickets.tab.create" },
  { id: "list", labelKey: "support.tickets.tab.list" },
];

export function DashboardSupportPageContent() {
  const { authorizedFetch, isAuthenticated, user } = useAuth();
  const { t, locale } = useI18n();
  const { messageFor } = useApiErrorMessage();
  const live = getUserSupportDataSource() === "live";

  const categoryOptions = React.useMemo(
    () =>
      SUPPORT_TICKET_CATEGORY_VALUES.map((value) => ({
        value,
        label: supportTicketCategoryLabel(value, locale),
      })),
    [locale],
  );

  const [tab, setTab] = React.useState<PageTab>("create");
  const [tickets, setTickets] = React.useState<UserSupportTicket[]>([]);
  const [loading, setLoading] = React.useState(Boolean(user && live));
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [category, setCategory] = React.useState<string>("other");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    if (!live || !isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    void listUserSupportTickets(authorizedFetch)
      .then((r) => setTickets(r.items))
      .catch((e: unknown) => setLoadError(messageFor(e) || t("support.error.live")))
      .finally(() => setLoading(false));
  }, [authorizedFetch, isAuthenticated, live, messageFor, t]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!live || !isAuthenticated) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await createUserSupportTicket(authorizedFetch, {
        category,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubject("");
      setMessage("");
      setCategory("other");
      load();
      setTab("list");
    } catch (err: unknown) {
      setFormError(messageFor(err) || t("support.tickets.create.error"));
    } finally {
      setSubmitting(false);
    }
  }

  const tabItems = React.useMemo(
    () => PAGE_TABS.map((item) => ({ id: item.id, label: t(item.labelKey) })),
    [t],
  );

  const subtitleParts = t("support.tickets.subtitle").split("{help}");

  return (
    <DashboardAppShell contentClassName="max-w-3xl pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          {t("support.tickets.pageTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {subtitleParts[0]}
          <Link href={ROUTES.support} className="font-medium text-neutral-900 underline-offset-2 hover:underline">
            {t("support.tickets.subtitleHelpLink")}
          </Link>
          {subtitleParts[1]}
        </p>
      </header>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={ROUTES.support}
          className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-neutral-800 ring-1 ring-neutral-200/80 transition hover:bg-neutral-50"
        >
          {t("support.tickets.link.helpCenter")}
          <ChevronRight className="size-3.5 text-neutral-400" aria-hidden />
        </Link>
        <Link
          href={ROUTES.systemStatus}
          className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-neutral-800 ring-1 ring-neutral-200/80 transition hover:bg-neutral-50"
        >
          {t("support.tickets.link.systemStatus")}
          <ChevronRight className="size-3.5 text-neutral-400" aria-hidden />
        </Link>
        <a
          href={`mailto:${SUPPORT_HELPDESK_EMAIL}?subject=${encodeURIComponent(t("support.contact.mailSubject"))}`}
          className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-neutral-800 ring-1 ring-neutral-200/80 transition hover:bg-neutral-50"
        >
          {t("support.tickets.link.email")}
          <ChevronRight className="size-3.5 text-neutral-400" aria-hidden />
        </a>
      </div>

      {!user ? (
        <section className={cn(profileCardClass, "mt-6 text-center sm:mt-8")}>
          <MessageSquarePlus className="mx-auto size-10 text-neutral-400" aria-hidden />
          <p className="mt-3 text-sm text-neutral-700">{t("support.tickets.signInPrompt")}</p>
          <Link
            href={ROUTES.login}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-neutral-900 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            {t("auth.login.submit")}
          </Link>
        </section>
      ) : (
        <div className="mt-6 sm:mt-8">
          <FeesPageTabs items={tabItems} active={tab} onChange={setTab} />

          {tab === "create" ? (
            <section className={cn(profileCardClass, "mt-5 px-5 py-6 sm:px-8 sm:py-8")}>
              {!live ? (
                <ProductDemoBanner messageKey="support.tickets.demoHint" />
              ) : (
                <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
                  <StyledSelectField
                    label={t("support.tickets.categoryLabel")}
                    id="support-ticket-category"
                    variant="okx"
                    value={category}
                    options={categoryOptions}
                    onChange={setCategory}
                  />

                  <div>
                    <label htmlFor="support-ticket-subject" className="mb-1.5 block text-xs font-medium text-neutral-700">
                      {t("support.tickets.subjectLabel")}
                    </label>
                    <input
                      id="support-ticket-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t("support.tickets.subjectPlaceholder")}
                      className={okxFieldClass}
                      required
                      minLength={3}
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label htmlFor="support-ticket-message" className="mb-1.5 block text-xs font-medium text-neutral-700">
                      {t("support.tickets.messageLabel")}
                    </label>
                    <textarea
                      id="support-ticket-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t("support.tickets.messagePlaceholder")}
                      className={okxTextareaClass}
                      required
                      minLength={1}
                      maxLength={10000}
                    />
                  </div>

                  {formError ? (
                    <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                      {formError}
                    </p>
                  ) : null}

                  <div className="space-y-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-black px-6 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {submitting ? (
                        <>
                          <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
                          {t("support.tickets.create.submitting")}
                        </>
                      ) : (
                        t("support.tickets.submit")
                      )}
                    </button>
                    <p className="text-xs text-neutral-500">{t("support.tickets.create.hint")}</p>
                  </div>
                </form>
              )}
            </section>
          ) : (
            <section className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-neutral-500">
                  {tickets.length > 0 ? `${tickets.length}` : null}
                  {tickets.length > 0 ? ` ${t("support.tickets.list.countSuffix")}` : null}
                </p>
                {live ? (
                  <button
                    type="button"
                    onClick={load}
                    disabled={loading}
                    className="inline-flex size-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200 disabled:opacity-60"
                    aria-label={t("support.tickets.list.refreshAria")}
                  >
                    <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
                  </button>
                ) : null}
              </div>

              {loadError ? (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {loadError}
                </p>
              ) : null}

              {loading ? (
                <p className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                  <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
                  {t("support.tickets.loading")}
                </p>
              ) : tickets.length === 0 ? (
                <div className={cn(profileCardClass, "mt-4 text-center")}>
                  <p className="text-sm text-neutral-600">{t("support.tickets.empty")}</p>
                  <button
                    type="button"
                    onClick={() => setTab("create")}
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-[#1a1a1a]"
                  >
                    {t("support.tickets.submit")}
                  </button>
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-neutral-200/80 overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200/80">
                  {tickets.map((ticket) => (
                    <li key={ticket.id}>
                      <Link
                        href={ROUTES.dashboardSupportTicket(ticket.id)}
                        className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-neutral-50"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                            {shortSupportTicketId(ticket.id)}
                          </p>
                          <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">{ticket.subject}</p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {supportTicketCategoryLabel(ticket.category, locale)} ·{" "}
                            {formatDateTime(ticket.updatedAt, locale, { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <SupportTicketStatusBadge status={ticket.status} locale={locale} />
                          <ChevronRight className="size-4 text-neutral-400" aria-hidden />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </DashboardAppShell>
  );
}
