"use client";

import * as React from "react";
import Link from "next/link";
import { SplitonLoader } from "@/components/ui/spliton-loader";
import { useParams } from "next/navigation";

import { DisputeStatusSteps } from "@/components/dashboard/disputes/dispute-document-preview";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { profileCardClass } from "@/components/dashboard/profile/profile-ui";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { disputeTypeLabel } from "@/lib/i18n/disputes-messages";
import { formatDateTime } from "@/lib/i18n/formatters";
import { statusLabel } from "@/lib/i18n/status-labels";
import { resolveApiUrl } from "@/lib/public-env";
import { cn } from "@/lib/utils";

type DisputeMessage = {
  id: string;
  body: string;
  isStaff: boolean;
  createdAt: string;
};

type DisputeDetail = {
  id: string;
  subject: string;
  description: string;
  status: string;
  type: string;
  createdAt: string;
  messages: DisputeMessage[];
};

const okxTextareaClass =
  "min-h-24 w-full rounded-lg border-0 bg-[#F5F5F5] px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:bg-white focus:shadow-[0_6px_28px_-12px_rgba(0,0,0,0.08)]";

export default function DisputeDetailPage() {
  const params = useParams<{ id: string }>();
  const disputeId = params.id;
  const { accessToken, user } = useAuth();
  const { t, locale } = useI18n();
  const { messageFor } = useApiErrorMessage();
  const [detail, setDetail] = React.useState<DisputeDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reply, setReply] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const load = React.useCallback(() => {
    if (!accessToken || !disputeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void fetch(resolveApiUrl(`/api/v1/disputes/${encodeURIComponent(disputeId)}`), {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
    })
      .then(async (r) => {
        const body = (await r.json()) as DisputeDetail & { message?: string; code?: string };
        if (!r.ok) throw body;
        setDetail(body);
      })
      .catch((e: unknown) => {
        setDetail(null);
        setError(messageFor(e) || t("disputes.error.notFound"));
      })
      .finally(() => setLoading(false));
  }, [accessToken, disputeId, messageFor, t]);

  React.useEffect(() => {
    load();
  }, [load]);

  const sendReply = () => {
    if (!accessToken || !disputeId || !reply.trim()) return;
    setSubmitting(true);
    void fetch(resolveApiUrl(`/api/v1/disputes/${encodeURIComponent(disputeId)}/messages`), {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body: reply.trim() }),
    })
      .then(async (r) => {
        const body = (await r.json()) as { message?: string; code?: string };
        if (!r.ok) throw body;
        setReply("");
        load();
      })
      .catch((e: unknown) => {
        setError(messageFor(e) || t("disputes.error.messageFailed"));
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#f6f7f9]">
      <DashboardHeader />
      <main className="scheme-light flex-1 text-neutral-900">
        <div className="mx-auto w-full max-w-3xl px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] pt-4 sm:px-6 sm:pb-8 lg:px-8 lg:pt-6">
          <Link
            href={ROUTES.dashboardDisputes}
            className="text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
          >
            {t("disputes.detail.back")}
          </Link>

          {!user ? (
            <section className={cn(profileCardClass, "mt-6 text-center text-sm text-neutral-700")}>
              {t("disputes.detail.signInPrompt")}
            </section>
          ) : loading ? (
            <div className={cn(profileCardClass, "mt-6 flex items-center justify-center gap-2 py-10 text-sm text-neutral-500")}>
              <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
              {t("common.loading")}
            </div>
          ) : error || !detail ? (
            <div className={cn(profileCardClass, "mt-6 bg-red-50/80 px-4 py-8 text-center")}>
              <p className="text-sm text-red-800">{error ?? t("disputes.error.notFound")}</p>
              <button
                type="button"
                onClick={load}
                className="mt-3 text-xs font-semibold text-red-900 underline-offset-2 hover:underline"
              >
                {t("common.retry")}
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <header>
                <p className="font-mono text-xs font-semibold text-neutral-500">
                  {detail.id.length > 8 ? `DS-${detail.id.slice(0, 8).toUpperCase()}` : `DS-${detail.id.toUpperCase()}`}
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">{detail.subject}</h1>
                <p className="mt-1 text-xs text-neutral-500">
                  {disputeTypeLabel(detail.type, locale)} · {formatDateTime(detail.createdAt, locale)}
                </p>
              </header>

              <section className={cn(profileCardClass, "px-4 py-5 sm:px-6")}>
                <DisputeStatusSteps status={detail.status} />
                <p className="mt-3 text-center text-xs font-medium text-neutral-600">
                  {statusLabel("dispute", detail.status, locale)}
                </p>
              </section>

              <section className={profileCardClass}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{detail.description}</p>
              </section>

              <section className={profileCardClass}>
                <h2 className="text-sm font-semibold text-neutral-900">{t("disputes.detail.conversation")}</h2>
                {detail.messages.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-500">{t("disputes.detail.noMessages")}</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {detail.messages.map((msg) => (
                      <li
                        key={msg.id}
                        className={cn(
                          "rounded-xl px-4 py-3 text-sm",
                          msg.isStaff ? "bg-sky-50 text-sky-950" : "bg-neutral-50 text-neutral-800",
                        )}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                          {msg.isStaff ? t("disputes.detail.authorSupport") : t("disputes.detail.authorYou")} ·{" "}
                          {formatDateTime(msg.createdAt, locale)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{msg.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {!["resolved", "rejected", "closed"].includes(detail.status) ? (
                <section className={cn(profileCardClass, "space-y-3")}>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={t("disputes.detail.replyPlaceholder")}
                    className={okxTextareaClass}
                  />
                  <button
                    type="button"
                    disabled={submitting || !reply.trim()}
                    onClick={sendReply}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-black px-6 text-[13px] font-semibold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
                        {t("disputes.detail.sending")}
                      </>
                    ) : (
                      t("common.submit")
                    )}
                  </button>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
