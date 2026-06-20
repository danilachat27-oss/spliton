"use client";

import "./disputes-page.css";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, RefreshCw, Scale } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { DashboardAppShell } from "@/components/layout/dashboard-app-shell";
import { profileCardClass } from "@/components/dashboard/profile/profile-ui";
import { FeesPageTabs } from "@/components/fees/fees-page-tabs";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { StyledSelectField } from "@/components/ui/styled-select";
import { ROUTES } from "@/constants/routes";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { DISPUTE_TYPE_VALUES, disputeTypeLabel } from "@/lib/i18n/disputes-messages";
import { formatDate } from "@/lib/i18n/formatters";
import { statusLabel } from "@/lib/i18n/status-labels";
import { resolveApiUrl } from "@/lib/public-env";
import { cn } from "@/lib/utils";

type DisputeRow = {
  id: string;
  subject: string;
  status: string;
  type: string;
  description?: string;
  createdAt: string;
  dueAt?: string | null;
};

type PageTab = "list" | "create";

const STATUS_TONE: Record<string, "amber" | "emerald" | "neutral" | "red"> = {
  open: "amber",
  in_review: "amber",
  waiting_for_user: "neutral",
  waiting_for_admin: "amber",
  escalated: "amber",
  resolved: "emerald",
  rejected: "red",
  closed: "neutral",
};

const PAGE_TABS: { id: PageTab; labelKey: string }[] = [
  { id: "list", labelKey: "disputes.tab.list" },
  { id: "create", labelKey: "disputes.tab.create" },
];

const okxFieldClass =
  "h-11 w-full rounded-lg border-0 bg-[#F5F5F5] px-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:bg-white focus:shadow-[0_6px_28px_-12px_rgba(0,0,0,0.08)]";

const okxTextareaClass =
  "min-h-32 w-full rounded-lg border-0 bg-[#F5F5F5] px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:bg-white focus:shadow-[0_6px_28px_-12px_rgba(0,0,0,0.08)]";

function shortTicketId(id: string) {
  return id.length > 8 ? `DS-${id.slice(0, 8).toUpperCase()}` : `DS-${id.toUpperCase()}`;
}

function StatusBadge({ status, locale }: { status: string; locale: ReturnType<typeof useI18n>["locale"] }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold",
        tone === "amber" && "bg-amber-100 text-amber-900",
        tone === "emerald" && "bg-emerald-100 text-emerald-800",
        tone === "red" && "bg-red-100 text-red-800",
        tone === "neutral" && "bg-neutral-100 text-neutral-700",
      )}
    >
      {statusLabel("dispute", status, locale)}
    </span>
  );
}

export function DisputesPageContent() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const { t, locale } = useI18n();
  const { messageFor } = useApiErrorMessage();

  const disputeTypeOptions = React.useMemo(
    () => DISPUTE_TYPE_VALUES.map((value) => ({ value, label: disputeTypeLabel(value, locale) })),
    [locale],
  );

  const [tab, setTab] = React.useState<PageTab>("list");
  const [items, setItems] = React.useState<DisputeRow[]>([]);
  const [loading, setLoading] = React.useState(Boolean(user));
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [type, setType] = React.useState<string>("withdrawal_not_received");
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    void fetch(resolveApiUrl("/api/v1/disputes?page=1&pageSize=50"), {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
    })
      .then(async (r) => {
        const body = (await r.json()) as { items?: DisputeRow[]; message?: string; code?: string };
        if (!r.ok) throw body;
        setItems(body.items ?? []);
      })
      .catch((e: unknown) => {
        setItems([]);
        setLoadError(messageFor(e) || t("disputes.error.loadFailed"));
      })
      .finally(() => setLoading(false));
  }, [accessToken, messageFor, t]);

  React.useEffect(() => {
    load();
  }, [load]);

  const metrics = React.useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => !["resolved", "closed", "rejected"].includes(i.status)).length;
    const resolved = items.filter((i) => i.status === "resolved" || i.status === "closed").length;
    return { total, active, resolved };
  }, [items]);

  const create = () => {
    if (!accessToken) return;
    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();
    if (!trimmedSubject || trimmedDescription.length < 10) {
      setFormError(t("disputes.error.validation"));
      return;
    }
    setSubmitting(true);
    setFormError(null);
    void fetch(resolveApiUrl("/api/v1/disputes"), {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ type, subject: trimmedSubject, description: trimmedDescription }),
    })
      .then(async (r) => {
        const body = (await r.json()) as DisputeRow & { message?: string; code?: string };
        if (!r.ok) throw body;
        setSubject("");
        setDescription("");
        setType("withdrawal_not_received");
        load();
        router.push(`${ROUTES.dashboardDisputes}/${encodeURIComponent(body.id)}`);
      })
      .catch((e: unknown) => {
        setFormError(messageFor(e) || t("disputes.error.createFailed"));
      })
      .finally(() => setSubmitting(false));
  };

  const tabItems = React.useMemo(
    () => PAGE_TABS.map((item) => ({ id: item.id, label: t(item.labelKey) })),
    [t],
  );

  return (
    <DashboardAppShell contentClassName="max-w-3xl pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{t("disputes.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {t("disputes.subtitle")}{" "}
          <Link href={ROUTES.dashboardSupport} className="font-medium text-neutral-900 underline-offset-2 hover:underline">
            {t("disputes.subtitleSupportLink")}
          </Link>
          .
        </p>
      </header>

      {!user ? (
        <section className={cn(profileCardClass, "mt-6 text-center sm:mt-8")}>
          <Scale className="mx-auto size-10 text-neutral-400" aria-hidden />
          <p className="mt-3 text-sm text-neutral-700">{t("disputes.signInPrompt")}</p>
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

          {tab === "list" ? (
            <section className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-neutral-500">
                  {t("disputes.metrics.total")}:{" "}
                  <span className="font-mono font-semibold text-neutral-800">{metrics.total}</span>
                  {" · "}
                  {t("disputes.metrics.active")}:{" "}
                  <span className="font-mono font-semibold text-neutral-800">{metrics.active}</span>
                  {" · "}
                  {t("disputes.metrics.resolved")}:{" "}
                  <span className="font-mono font-semibold text-neutral-800">{metrics.resolved}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTab("create")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-black px-3 text-xs font-semibold text-white transition hover:bg-[#1a1a1a] sm:hidden"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    {t("disputes.tab.create")}
                  </button>
                  <button
                    type="button"
                    onClick={load}
                    className="inline-flex size-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
                    aria-label={t("disputes.list.refreshAria")}
                  >
                    <RefreshCw className="size-4" />
                  </button>
                </div>
              </div>

              {loading ? (
                <p className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                  <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
                  {t("common.loading")}
                </p>
              ) : loadError ? (
                <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                  <p>{loadError}</p>
                  <button type="button" onClick={load} className="mt-2 text-xs font-semibold underline">
                    {t("common.retry")}
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className={cn(profileCardClass, "mt-4 text-center")}>
                  <p className="text-sm text-neutral-600">{t("disputes.list.empty")}</p>
                  <button
                    type="button"
                    onClick={() => setTab("create")}
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-[#1a1a1a]"
                  >
                    {t("disputes.create.submit")}
                  </button>
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-neutral-200/80 overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200/80">
                  {items.map((item) => {
                    const ticketStatus = item.status;
                    return (
                    <li key={item.id}>
                      <Link
                        href={`${ROUTES.dashboardDisputes}/${encodeURIComponent(item.id)}`}
                        className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-neutral-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-900">{item.subject}</p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {shortTicketId(item.id)} · {disputeTypeLabel(item.type, locale)} ·{" "}
                            {formatDate(item.createdAt, locale)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <StatusBadge status={ticketStatus} locale={locale} />
                          <ChevronRight className="size-4 text-neutral-400" aria-hidden />
                        </div>
                      </Link>
                    </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : (
            <section className={cn(profileCardClass, "mt-5 space-y-4 px-5 py-6 sm:px-8 sm:py-8")}>
              <StyledSelectField
                label={t("disputes.create.typeLabel")}
                id="dispute-type"
                variant="okx"
                value={type}
                options={disputeTypeOptions}
                onChange={setType}
              />

              <div>
                <label htmlFor="dispute-subject" className="mb-1.5 block text-xs font-medium text-neutral-700">
                  {t("disputes.create.subjectLabel")}
                </label>
                <input
                  id="dispute-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("disputes.create.subjectPlaceholder")}
                  className={okxFieldClass}
                />
              </div>

              <div>
                <label htmlFor="dispute-description" className="mb-1.5 block text-xs font-medium text-neutral-700">
                  {t("disputes.create.descriptionLabel")}
                </label>
                <textarea
                  id="dispute-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("disputes.create.descriptionPlaceholder")}
                  className={okxTextareaClass}
                />
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={create}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-black px-6 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
                      {t("disputes.create.submitting")}
                    </>
                  ) : (
                    t("disputes.create.submit")
                  )}
                </button>
                {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
                <p className="text-xs text-neutral-500">{t("disputes.create.hint")}</p>
              </div>
            </section>
          )}
        </div>
      )}
    </DashboardAppShell>
  );
}
