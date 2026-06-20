"use client";

import {
  Check,
  Copy,
  Share2,
} from "@/lib/lucide";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

import { ReferralFaqList } from "@/components/referral/referral-faq-list";
import { ReferralHowScene } from "@/components/referral/referral-how-scene";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  buildReferralLink,
  getReferralRewardsHistory,
  referralFaqItems,
  referralProgramStats,
  REFERRAL_CODE,
  type ReferralRewardStatus,
} from "@/components/referral/referral-mock-data";
import { Button } from "@/components/ui/button";
import type { ReferralProgramTabId } from "@/constants/dashboard/referral-program";
import { cn } from "@/lib/utils";

const usdt = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const REWARD_FILTER_IDS = ["all", "pending", "available", "paid", "rejected", "cancelled"] as const;
type RewardFilterId = (typeof REWARD_FILTER_IDS)[number];

function statusPillClass(s: ReferralRewardStatus) {
  const map: Record<ReferralRewardStatus, string> = {
    pending: "border-white/10 bg-white/5 text-zinc-200",
    available: "border-white/10 bg-white/5 text-zinc-100",
    paid: "border-white/10 bg-white/5 text-white",
    rejected: "border-white/10 bg-white/5 text-zinc-300",
    cancelled: "border-white/10 bg-white/5 text-zinc-400",
  };
  return map[s];
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
}: {
  label: string;
  value: string;
  copyId: string;
  copiedKey: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const { t } = useI18n();
  const done = copiedKey === copyId;
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 rounded-xl bg-black px-3 py-2.5 font-mono text-xs text-zinc-200 ring-1 ring-white/10 sm:text-sm">
          <span className="break-all">{value}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onCopy(value, copyId)}
          className="h-9 shrink-0 border-white/12 bg-[#0a0a0a] text-zinc-100 ring-1 ring-white/10 hover:bg-white/6"
        >
          {done ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          <span className="ml-1.5">{done ? t("referral.program.copy.copied") : t("referral.program.copy.copy")}</span>
        </Button>
      </div>
    </div>
  );
}

export type ReferralProgramPageContentProps = {
  activeTab: ReferralProgramTabId;
  onRequestProgramTab?: () => void;
};

export function ReferralProgramPageContent({ activeTab, onRequestProgramTab }: ReferralProgramPageContentProps) {
  const { t } = useI18n();
  const [rewardFilter, setRewardFilter] = useState<RewardFilterId>("all");
  const { key: copiedKey, flash } = useCopyFeedback();

  const rewards = useMemo(() => getReferralRewardsHistory(), []);

  const rewardSummary = useMemo(() => {
    let total = 0;
    let pending = 0;
    let available = 0;
    let paid = 0;
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

  const referralLink = buildReferralLink();
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}`;

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(id);
    } catch {
      flash(id);
    }
  }, [flash]);

  const handleShare = useCallback(async () => {
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
      /* user cancelled or share failed */
    }
    await handleCopy(referralLink, "share-fallback");
  }, [handleCopy, referralLink, t]);

  const surfaceCard = "rounded-2xl bg-[#111111]";

  return (
    <div className="space-y-8 pb-12">
      {activeTab === "program" ? (
        <div className="space-y-10">
          <section className="relative overflow-hidden rounded-3xl px-6 py-8 sm:px-8 sm:py-10">
            <Image
              src="/images/partner-programtab=about/back.jpg"
              alt=""
              fill
              className="object-cover object-center opacity-42"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/56" aria-hidden />
            <div className="relative mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t("referral.program.hero.title")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                {t("referral.program.hero.subtitle")}
              </p>

              <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- внешний QR без next/image remote config */}
                <img src={qrSrc} alt="" width={176} height={176} className="size-44 rounded-lg" />
              </div>

              <div className="mt-7 space-y-4 text-left">
                <CopyField label={t("referral.program.copy.link")} value={referralLink} copyId="link" copiedKey={copiedKey} onCopy={handleCopy} />
                <CopyField label={t("referral.program.copy.code")} value={REFERRAL_CODE} copyId="code" copiedKey={copiedKey} onCopy={handleCopy} />
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleShare}
                  className="border-white/15 bg-black/55 text-zinc-100 hover:bg-white/10"
                >
                  {copiedKey === "share-fallback" ? <Check className="size-3.5" aria-hidden /> : <Share2 className="size-3.5" aria-hidden />}
                  <span className="ml-1.5">{copiedKey === "share-fallback" ? t("referral.program.shareCopied") : t("referral.program.share")}</span>
                </Button>
              </div>
            </div>
          </section>

          <ReferralHowScene />

          <section className="rounded-3xl bg-[#121212] p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{t("referral.invites.summary.title")}</h2>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">{t("referral.invites.summary.subtitle")}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: t("referral.summary.invited"), value: String(referralProgramStats.invitedUsers) },
                { label: t("referral.summary.activeReferrals"), value: String(referralProgramStats.activeReferrals) },
                {
                  label: t("referral.summary.pendingRewards"),
                  value: `${usdt.format(referralProgramStats.pendingRewardsUsdt)} USDT`,
                  mono: true,
                },
                {
                  label: t("referral.summary.earnedTotal"),
                  value: `${usdt.format(referralProgramStats.earnedRewardsTotalUsdt)} USDT`,
                  mono: true,
                  accent: true,
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className={cn(
                    "rounded-2xl bg-zinc-900/55 px-4 py-4 sm:px-5 sm:py-5",
                    c.accent && "bg-white/10",
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{c.label}</p>
                  <p
                    className={cn(
                      "mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl",
                      c.mono && "font-mono text-lg sm:text-xl",
                      c.accent && "text-white",
                    )}
                  >
                    {c.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className={cn("p-6 sm:p-8", surfaceCard)}>
            <h2 className="text-lg font-semibold text-white">{t("referral.faq.sectionTitle")}</h2>
            <p className="mt-1 text-sm text-zinc-500">{t("referral.faq.subtitle")}</p>
            <ReferralFaqList items={referralFaqItems} defaultOpenId={referralFaqItems[0]?.id ?? null} />
          </section>
        </div>
      ) : null}

      {activeTab === "rewards" ? (
        <div className="space-y-8">
          <section className="rounded-3xl bg-[#121212] p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{t("referral.rewards.summary.title")}</h2>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">{t("referral.rewards.summary.subtitle")}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: t("referral.rewards.summary.totalRows"), value: `${usdt.format(rewardSummary.total)} USDT`, mono: true },
                { label: t("referral.rewards.summary.pending"), value: `${usdt.format(rewardSummary.pending)} USDT`, mono: true },
                { label: t("referral.rewards.summary.available"), value: `${usdt.format(rewardSummary.available)} USDT`, mono: true },
                { label: t("referral.rewards.summary.paid"), value: `${usdt.format(rewardSummary.paid)} USDT`, mono: true, accent: true },
              ].map((c) => (
                <div
                  key={c.label}
                  className={cn(
                    "rounded-2xl bg-zinc-900/55 px-4 py-4 sm:px-5 sm:py-5",
                    c.accent && "bg-white/10",
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{c.label}</p>
                  <p
                    className={cn(
                      "mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl",
                      c.mono && "font-mono text-lg sm:text-xl",
                      c.accent && "text-white",
                    )}
                  >
                    {c.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-[#121212] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{t("referral.rewards.history.title")}</h2>
                <p className="mt-2 text-sm text-zinc-300">{t("referral.rewards.history.subtitle")}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label={t("referral.rewards.filter.aria")}>
              {REWARD_FILTER_IDS.map((id) => {
                const active = rewardFilter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setRewardFilter(id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors",
                      active
                        ? "bg-white/14 text-white ring-white/22"
                        : "bg-transparent text-zinc-400 ring-white/10 hover:bg-white/4 hover:text-zinc-200",
                    )}
                  >
                    {t(`referral.rewards.filter.${id}`)}
                  </button>
                );
              })}
            </div>

            {rewards.length === 0 ? (
              <div className="mt-10 flex flex-col items-center rounded-2xl bg-zinc-900/55 px-6 py-14 text-center">
                <p className="text-lg font-semibold text-white">{t("referral.rewards.empty.title")}</p>
                <p className="mt-2 max-w-md text-sm text-zinc-500">{t("referral.rewards.empty.text")}</p>
                <Button
                  type="button"
                  className="mt-6 bg-white text-black hover:bg-zinc-200"
                  onClick={() => onRequestProgramTab?.()}
                >
                  {t("referral.rewards.inviteFriends")}
                </Button>
              </div>
            ) : filteredRewards.length === 0 ? (
              <div className="mt-10 flex flex-col items-center rounded-2xl bg-zinc-900/55 px-6 py-12 text-center">
                <p className="font-medium text-white">{t("referral.rewards.emptyFiltered.title")}</p>
                <p className="mt-2 text-sm text-zinc-500">{t("referral.rewards.emptyFiltered.text")}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 border-white/12 bg-[#0a0a0a] text-zinc-100 ring-1 ring-white/10 hover:bg-white/6"
                  onClick={() => setRewardFilter("all")}
                >
                  {t("referral.rewards.emptyFiltered.showAll")}
                </Button>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-2xl bg-zinc-900/45">
                <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/8 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      <th className="px-4 py-3 font-medium">{t("referral.rewards.table.date")}</th>
                      <th className="px-4 py-3 font-medium">{t("referral.rewards.table.invitee")}</th>
                      <th className="px-4 py-3 font-medium">{t("referral.rewards.table.type")}</th>
                      <th className="px-4 py-3 font-medium">{t("referral.rewards.table.status")}</th>
                      <th className="px-4 py-3 font-medium text-right">{t("referral.rewards.table.amount")}</th>
                      <th className="px-4 py-3 font-medium">{t("referral.rewards.table.comment")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRewards.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-white/6 transition-colors hover:bg-white/4 last:border-0"
                      >
                        <td className="px-4 py-3.5 font-mono text-xs text-zinc-300">{row.date}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-zinc-300">{row.inviteeMasked}</td>
                        <td className="px-4 py-3.5 text-zinc-200">{row.rewardType}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                              statusPillClass(row.status),
                            )}
                          >
                            {t(`referral.status.${row.status}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-zinc-100">
                          {usdt.format(row.amountUsdt)} USDT
                        </td>
                        <td className="max-w-[220px] px-4 py-3.5 text-xs text-zinc-400">{row.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
