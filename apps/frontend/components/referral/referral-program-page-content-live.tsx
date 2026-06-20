"use client";

import { Check, Copy, Download, Share2 } from "@/lib/lucide";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ReferralFaqList } from "@/components/referral/referral-faq-list";
import { ReferralHowScene } from "@/components/referral/referral-how-scene";
import { referralFaqItems, type ReferralRewardStatus } from "@/components/referral/referral-mock-data";
import { useReferralProgramData } from "@/components/referral/use-referral-program-data";
import { Button } from "@/components/ui/button";
import type { ReferralProgramTabId } from "@/constants/dashboard/referral-program";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { fetchReferralStatement, applyReferralCode } from "@/services/referrals.service";

export type ReferralProgramPageContentProps = {
  activeTab: ReferralProgramTabId;
  onRequestProgramTab?: () => void;
};

const usdt = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const REFERRAL_BTN_SECONDARY =
  "border-0 bg-white/[0.08] text-zinc-100 hover:bg-white/[0.14] disabled:opacity-50";
const REFERRAL_BTN_PRIMARY = "border-0 bg-[#B7F500] text-black hover:bg-[#c8ff3d] disabled:opacity-50";

const REWARD_FILTER_IDS = ["all", "pending", "available", "paid", "rejected", "cancelled"] as const;

function statusPillClass(s: ReferralRewardStatus) {
  return "border-white/10 bg-white/5 text-zinc-200";
}

function useCopyFeedback() {
  const [key, setKey] = useState<string | null>(null);
  const flash = useCallback((id: string) => {
    setKey(id);
    window.setTimeout(() => setKey((k) => (k === id ? null : k)), 2000);
  }, []);
  return { key, flash };
}

function CopyField({
  label,
  value,
  copyId,
  copiedKey,
  onCopy,
  copiedLabel,
  copyLabel,
}: {
  label: string;
  value: string;
  copyId: string;
  copiedKey: string | null;
  onCopy: (text: string, id: string) => void;
  copiedLabel: string;
  copyLabel: string;
}) {
  const done = copiedKey === copyId;
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 rounded-xl bg-black/40 px-3 py-2.5 font-mono text-xs text-zinc-200 sm:text-sm">
          <span className="break-all">{value}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onCopy(value, copyId)}
          className={cn("h-9 shrink-0", REFERRAL_BTN_SECONDARY)}
        >
          {done ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          <span className="ml-1.5">{done ? copiedLabel : copyLabel}</span>
        </Button>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ru-RU");
  } catch {
    return iso;
  }
}

export function ReferralProgramPageContent({ activeTab, onRequestProgramTab }: ReferralProgramPageContentProps) {
  const { t } = useI18n();
  const { user, authorizedFetch } = useAuth();
  const { loading, error, me, invites, rewards, refresh } = useReferralProgramData();
  const [rewardFilter, setRewardFilter] = useState<(typeof REWARD_FILTER_IDS)[number]>("all");
  const [statementLoading, setStatementLoading] = useState(false);
  const [applyCode, setApplyCode] = useState("");
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyOk, setApplyOk] = useState(false);
  const [applying, setApplying] = useState(false);
  const { key: copiedKey, flash } = useCopyFeedback();

  const filterOptions = useMemo(
    () =>
      REWARD_FILTER_IDS.map((id) => ({
        id,
        label: t(id === "all" ? "referral.rewards.filter.all" : `referral.rewards.filter.${id}`),
      })),
    [t],
  );

  const statusLabel = useCallback(
    (s: ReferralRewardStatus) => t(`referral.status.${s}`),
    [t],
  );

  const eventLabel = useCallback(
    (eventType: string) => t(`referral.event.${eventType}`) || eventType,
    [t],
  );

  const rewardSummary = useMemo(() => {
    let total = 0,
      pending = 0,
      available = 0,
      paid = 0;
    for (const r of rewards) {
      total += r.amountUsdt;
      if (r.status === "pending") pending += r.amountUsdt;
      if (r.status === "available") available += r.amountUsdt;
      if (r.status === "paid") paid += r.amountUsdt;
    }
    return { total, pending, available, paid };
  }, [rewards]);

  const filteredRewards = useMemo(() => {
    if (rewardFilter === "all") return rewards;
    return rewards.filter((r) => r.status === rewardFilter);
  }, [rewards, rewardFilter]);

  const referralLink = me?.referralLink ?? "";
  const referralCode = me?.referralCode ?? "";
  const qrSrc = referralLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}`
    : "";

  const handleCopy = useCallback(
    async (text: string, id: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } finally {
        flash(id);
      }
    },
    [flash],
  );

  const handleShare = useCallback(async () => {
    if (!referralLink) return;
    const shareData = {
      title: "Spliton",
      text: t("referral.program.shareText"),
      url: referralLink,
    };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      /* cancelled */
    }
    await handleCopy(referralLink, "share-fallback");
  }, [handleCopy, referralLink, t]);

  const downloadStatement = useCallback(async () => {
    if (!user) return;
    setStatementLoading(true);
    try {
      const data = await fetchReferralStatement(authorizedFetch);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spliton-referral-statement-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setStatementLoading(false);
    }
  }, [authorizedFetch, user]);

  const downloadStatementCsv = useCallback(async () => {
    if (!user) return;
    setStatementLoading(true);
    try {
      const data = await fetchReferralStatement(authorizedFetch);
      const lines = [
        "date,event,amount_usdt,status",
        ...data.rewards.map(
          (r) =>
            `${r.createdAt},${r.eventType},${r.amountUsdt},${statusLabel(r.status)}`,
        ),
      ];
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spliton-referral-statement-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setStatementLoading(false);
    }
  }, [authorizedFetch, statusLabel, user]);

  const submitApplyCode = useCallback(async () => {
    const code = applyCode.trim();
    if (!code) return;
    setApplying(true);
    setApplyError(null);
    setApplyOk(false);
    try {
      await applyReferralCode(authorizedFetch, code);
      setApplyOk(true);
      setApplyCode("");
      refresh();
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : t("referral.applyCode.error"));
    } finally {
      setApplying(false);
    }
  }, [applyCode, authorizedFetch, refresh, t]);

  const surfaceCard = "rounded-2xl bg-[#111111]";

  return (
    <div className="space-y-8 pb-12">
      {activeTab === "program" ? (
        <div className="space-y-10">
          <section className="relative overflow-hidden rounded-3xl px-6 py-8 sm:px-8 sm:py-10">
            <Image src="/images/partner-programtab=about/back.jpg" alt="" fill className="object-cover opacity-42" sizes="1200px" />
            <div className="pointer-events-none absolute inset-0 bg-black/56" aria-hidden />
            <div className="relative mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">{t("referral.program.hero.title")}</h2>
              <p className="mt-3 text-sm text-zinc-300 sm:text-base">{t("referral.program.hero.subtitle")}</p>
              {user && qrSrc ? (
                <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrSrc} alt="" width={176} height={176} className="size-44 rounded-lg" />
                </div>
              ) : null}
              {!user ? (
                <p className="mt-6 text-sm text-zinc-300">
                  <Link href={ROUTES.login} className="text-[#d4f570] hover:underline">
                    {t("referral.program.signIn")}
                  </Link>{" "}
                  {t("referral.program.or")}{" "}
                  <Link href={ROUTES.register} className="text-[#d4f570] hover:underline">
                    {t("referral.program.register")}
                  </Link>{" "}
                  {t("referral.program.signInForLink")}
                </p>
              ) : loading ? (
                <p className="mt-6 text-sm text-zinc-400">{t("referral.program.loading")}</p>
              ) : error ? (
                <p className="mt-6 text-sm text-red-300">{error}</p>
              ) : (
                <div className="mt-7 space-y-4 text-left">
                  <CopyField
                    label={t("referral.program.copy.link")}
                    value={referralLink}
                    copyId="link"
                    copiedKey={copiedKey}
                    onCopy={handleCopy}
                    copiedLabel={t("referral.program.copy.copied")}
                    copyLabel={t("referral.program.copy.copy")}
                  />
                  <CopyField
                    label={t("referral.program.copy.code")}
                    value={referralCode}
                    copyId="code"
                    copiedKey={copiedKey}
                    onCopy={handleCopy}
                    copiedLabel={t("referral.program.copy.copied")}
                    copyLabel={t("referral.program.copy.copy")}
                  />
                </div>
              )}
              {user && referralLink && !loading && !error ? (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => void handleShare()} className={REFERRAL_BTN_SECONDARY}>
                    {copiedKey === "share-fallback" ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <Share2 className="size-3.5" aria-hidden />
                    )}
                    <span className="ml-1.5">
                      {copiedKey === "share-fallback" ? t("referral.program.shareCopied") : t("referral.program.share")}
                    </span>
                  </Button>
                </div>
              ) : null}
            </div>
          </section>

          <ReferralHowScene />

          <section className="rounded-3xl bg-[#121212] p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white">{t("referral.summary.title")}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: t("referral.summary.invited"), value: user ? String(me?.invitedUsersCount ?? 0) : t("referral.summary.empty") },
                { label: t("referral.summary.active"), value: user ? String(me?.activeInvitedUsersCount ?? 0) : t("referral.summary.empty") },
                {
                  label: t("referral.summary.pending"),
                  value: user ? `${usdt.format(Number(me?.pendingRewards ?? 0))} USDT` : t("referral.summary.empty"),
                },
                {
                  label: t("referral.summary.paid"),
                  value: user ? `${usdt.format(Number(me?.paidRewards ?? 0))} USDT` : t("referral.summary.empty"),
                },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl bg-zinc-900/55 px-4 py-4">
                  <p className="text-[10px] uppercase text-zinc-500">{c.label}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{c.value}</p>
                </div>
              ))}
            </div>
          </section>

          {user ? (
            <section className="rounded-3xl bg-[#121212] p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white">{t("referral.applyCode.title")}</h2>
              <p className="mt-1 text-xs text-zinc-500">{t("referral.applyCode.hint")}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={applyCode}
                  onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
                  placeholder={t("referral.applyCode.placeholder")}
                  className="flex-1 rounded-xl border-0 bg-black/40 px-3 py-2 font-mono text-sm text-white placeholder:text-zinc-500 focus:bg-black/55 focus:outline-none"
                />
                <Button
                  type="button"
                  disabled={applying || !applyCode.trim()}
                  onClick={() => void submitApplyCode()}
                  className={REFERRAL_BTN_PRIMARY}
                >
                  {applying ? t("referral.applyCode.submitting") : t("referral.applyCode.submit")}
                </Button>
              </div>
              {applyError ? <p className="mt-2 text-sm text-red-300">{applyError}</p> : null}
              {applyOk ? <p className="mt-2 text-sm text-[#d4f570]">{t("referral.applyCode.success")}</p> : null}
            </section>
          ) : null}

          {user ? (
            <section className="rounded-3xl bg-[#121212] p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-white">{t("referral.invites.title")}</h2>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={statementLoading}
                    onClick={() => void downloadStatementCsv()}
                    className={REFERRAL_BTN_SECONDARY}
                  >
                    <Download className="size-3.5" aria-hidden />
                    <span className="ml-1.5">{t("referral.invites.csv")}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={statementLoading}
                    onClick={() => void downloadStatement()}
                    className={REFERRAL_BTN_SECONDARY}
                  >
                    <Download className="size-3.5" aria-hidden />
                    <span className="ml-1.5">{statementLoading ? t("referral.applyCode.submitting") : t("referral.invites.json")}</span>
                  </Button>
                </div>
              </div>
              {invites.length === 0 ? (
                <div className="mt-8 flex flex-col items-center rounded-2xl bg-black/35 px-6 py-10 text-center">
                  <p className="text-sm font-medium text-zinc-300">{t("referral.invites.empty.title")}</p>
                  <p className="mt-2 max-w-sm text-xs leading-relaxed text-zinc-500">{t("referral.invites.empty.text")}</p>
                  {referralLink ? (
                    <Button
                      type="button"
                      size="sm"
                      className={cn("mt-5", REFERRAL_BTN_PRIMARY)}
                      onClick={() => void handleShare()}
                    >
                      <Share2 className="size-3.5" aria-hidden />
                      <span className="ml-1.5">{t("referral.invites.empty.share")}</span>
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto rounded-2xl bg-zinc-900/45">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase text-zinc-500">
                        <th className="px-4 py-2 text-left">{t("referral.invites.table.date")}</th>
                        <th className="px-4 py-2 text-left">{t("referral.invites.table.email")}</th>
                        <th className="px-4 py-2 text-left">{t("referral.invites.table.status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map((row) => (
                        <tr key={row.id} className="border-t border-white/6">
                          <td className="px-4 py-2 font-mono text-xs">{formatDate(row.attributedAt)}</td>
                          <td className="px-4 py-2">{row.maskedEmail}</td>
                          <td className="px-4 py-2">{statusLabel(row.status as ReferralRewardStatus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}

          <section className={cn("p-6 sm:p-8", surfaceCard)}>
            <h2 className="text-lg font-semibold text-white">{t("referral.faq.title")}</h2>
            <ReferralFaqList items={referralFaqItems} defaultOpenId={referralFaqItems[0]?.id ?? null} />
          </section>
        </div>
      ) : null}

      {activeTab === "rewards" ? (
        <div className="space-y-8">
          {!user ? (
            <p className="text-center text-sm text-zinc-400">
              <Link href={ROUTES.login} className="text-[#d4f570] hover:underline">
                {t("referral.rewards.signIn")}
              </Link>{" "}
              {t("referral.rewards.signInPrompt")}
            </p>
          ) : loading ? (
            <p className="text-sm text-zinc-400">{t("referral.rewards.loading")}</p>
          ) : (
            <>
              <section className="rounded-3xl bg-[#121212] p-6 sm:p-8">
                <h2 className="text-2xl font-semibold text-white">{t("referral.rewards.summary.title")}</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-4">
                  {[
                    { label: t("referral.rewards.summary.total"), value: rewardSummary.total },
                    { label: t("referral.rewards.summary.pending"), value: rewardSummary.pending },
                    { label: t("referral.rewards.summary.available"), value: rewardSummary.available },
                    { label: t("referral.rewards.summary.paid"), value: rewardSummary.paid },
                  ].map((c) => (
                    <div key={c.label} className="rounded-2xl bg-zinc-900/55 px-4 py-4">
                      <p className="text-[10px] uppercase text-zinc-500">{c.label}</p>
                      <p className="mt-2 font-mono text-lg text-white">{usdt.format(c.value)} USDT</p>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-3xl bg-[#121212] p-6 sm:p-8">
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setRewardFilter(f.id)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs transition-colors",
                        rewardFilter === f.id
                          ? "bg-white/14 text-white"
                          : "bg-white/[0.04] text-zinc-400 hover:bg-white/8 hover:text-zinc-200",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {filteredRewards.length === 0 ? (
                  <p className="mt-8 text-center text-sm text-zinc-500">{t("referral.rewards.empty")}</p>
                ) : (
                  <div className="mt-6 overflow-x-auto rounded-2xl bg-zinc-900/45">
                    <table className="w-full min-w-[600px] text-sm">
                      <thead>
                        <tr className="text-[10px] uppercase text-zinc-500">
                          <th className="px-4 py-2">{t("referral.rewards.table.date")}</th>
                          <th className="px-4 py-2">{t("referral.rewards.table.event")}</th>
                          <th className="px-4 py-2">{t("referral.rewards.table.status")}</th>
                          <th className="px-4 py-2 text-right">{t("referral.rewards.table.amount")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRewards.map((row) => (
                          <tr key={row.id} className="border-t border-white/6">
                            <td className="px-4 py-2 font-mono text-xs">{formatDate(row.createdAt)}</td>
                            <td className="px-4 py-2">{eventLabel(row.eventType)}</td>
                            <td className="px-4 py-2">
                              <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", statusPillClass(row.status))}>
                                {row.statusLabel || statusLabel(row.status)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right font-mono">{usdt.format(row.amountUsdt)} USDT</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {rewards.length === 0 ? (
                  <Button
                    type="button"
                    className={cn("mt-6", REFERRAL_BTN_PRIMARY)}
                    onClick={() => onRequestProgramTab?.()}
                  >
                    {t("referral.rewards.inviteFriends")}
                  </Button>
                ) : null}
              </section>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
