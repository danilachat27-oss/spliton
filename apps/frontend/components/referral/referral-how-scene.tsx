"use client";

import "./referral-how-scene.css";

import { Check, Copy, Gift, Link2, UserCheck, UserPlus, Wallet } from "@/lib/lucide";
import { useMemo } from "react";

import { PartnerLogoMark, PartnerSurface } from "@/components/partner-program/partner-surface";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

function MiniChrome() {
  const { t } = useI18n();
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 bg-black/40 px-3 backdrop-blur-sm">
      <span className="size-2 rounded-full bg-red-400/90" aria-hidden />
      <span className="size-2 rounded-full bg-amber-400/90" aria-hidden />
      <span className="size-2 rounded-full bg-emerald-400/90" aria-hidden />
      <span className="ml-1 truncate text-[10px] font-medium text-zinc-400">{t("referral.how.chrome")}</span>
      <span className="ml-auto size-1.5 rounded-full bg-[#B7F500]" aria-hidden />
    </div>
  );
}

function SceneToast({
  step,
  title,
  subtitle,
  tone = "lime",
}: {
  step: "invite" | "register" | "qualify" | "reward";
  title: string;
  subtitle: string;
  tone?: "lime" | "amber" | "emerald";
}) {
  const toneCls =
    tone === "emerald" ? "bg-emerald-500/10" : tone === "amber" ? "bg-amber-500/10" : "bg-[#B7F500]/10";

  return (
    <div
      className={cn(
        "referral-how-toast referral-how-toast--" + step,
        "pointer-events-none absolute right-3 top-3 z-20 flex items-start gap-2 rounded-xl px-3 py-2 shadow-lg sm:right-4",
        toneCls,
      )}
      aria-hidden
    >
      <span className="mt-0.5 size-2 shrink-0 rounded-full bg-[#B7F500]" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-white">{title}</p>
        <p className="text-[9px] leading-snug text-zinc-400">{subtitle}</p>
      </div>
    </div>
  );
}

function InvitePanel() {
  const { t } = useI18n();
  return (
    <div className="referral-how-panel--invite absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="invite"
        title={t("referral.how.toast.invite.title")}
        subtitle={t("referral.how.toast.invite.subtitle")}
      />

      <div className="flex items-center gap-2">
        <PartnerLogoMark size="sm" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {t("referral.how.panel.program")}
        </p>
      </div>
      <p className="mt-1 text-sm font-semibold text-white">{t("referral.how.panel.inviteFriends")}</p>

      <div className="mt-3 space-y-2 rounded-xl bg-black/35 p-3">
        <div>
          <p className="text-[9px] text-zinc-500">{t("referral.how.panel.link")}</p>
          <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-[#d4f570]">
            <Link2 className="size-3 shrink-0" aria-hidden />
            spliton.io/r/danila
          </p>
        </div>
        <div>
          <p className="text-[9px] text-zinc-500">{t("referral.how.panel.code")}</p>
          <p className="mt-0.5 font-mono text-xs text-zinc-200">DANILA2026</p>
        </div>
      </div>

      <button
        type="button"
        className="referral-how-copy mt-auto inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#B7F500] text-xs font-semibold text-black"
      >
        <Copy className="size-3.5" aria-hidden />
        {t("referral.how.panel.copyLink")}
      </button>
    </div>
  );
}

function RegisterPanel() {
  const { t } = useI18n();
  return (
    <div className="referral-how-panel--register absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="register"
        title={t("referral.how.toast.register.title")}
        subtitle={t("referral.how.toast.register.subtitle")}
        tone="emerald"
      />

      <div className="flex items-center gap-2">
        <UserPlus className="size-4 text-[#B7F500]" aria-hidden />
        <p className="text-sm font-semibold text-white">{t("referral.how.panel.newUser")}</p>
      </div>
      <p className="mt-1 text-[10px] text-zinc-500">{t("referral.how.panel.attribution")}</p>

      <div className="mt-3 rounded-xl bg-black/35 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-300">user_8f2a…@mail.com</span>
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="size-3" strokeWidth={3} />
          </span>
        </div>
        <p className="mt-2 text-[10px] text-zinc-500">{t("referral.how.panel.registered")}</p>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2">
        <UserCheck className="size-3.5 text-emerald-400" aria-hidden />
        <span className="text-[10px] font-medium text-emerald-100">{t("referral.how.panel.linked")}</span>
      </div>
    </div>
  );
}

function QualifyPanel() {
  const { t } = useI18n();
  const rows = useMemo(
    () =>
      [
        { id: 1, label: t("referral.how.panel.qualify.deposit"), ok: true },
        { id: 2, label: t("referral.how.panel.qualify.buyUnits"), ok: true },
        { id: 3, label: t("referral.how.panel.qualify.threshold"), ok: false },
      ] as const,
    [t],
  );

  return (
    <div className="referral-how-panel--qualify absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="qualify"
        title={t("referral.how.toast.qualify.title")}
        subtitle={t("referral.how.toast.qualify.subtitle")}
        tone="amber"
      />

      <div className="flex items-center gap-2">
        <Wallet className="size-4 text-[#B7F500]" aria-hidden />
        <p className="text-sm font-semibold text-white">{t("referral.how.panel.qualify.title")}</p>
      </div>
      <p className="mt-1 text-[10px] text-zinc-500">{t("referral.how.panel.qualify.subtitle")}</p>

      <ul className="mt-3 space-y-1.5">
        {rows.map((row) => (
          <li
            key={row.id}
            className={cn(
              "referral-how-check-row referral-how-check-row--" + row.id,
              "flex items-center justify-between gap-2 rounded-xl bg-black/30 px-3 py-2.5",
            )}
          >
            <span className="text-xs text-zinc-300">{row.label}</span>
            {row.ok ? (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Check className="size-3" strokeWidth={3} />
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold text-amber-200">
                {t("referral.how.panel.inProgress")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RewardPanel() {
  const { t } = useI18n();
  return (
    <div className="referral-how-panel--reward absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="reward"
        title={t("referral.how.toast.reward.title")}
        subtitle={t("referral.how.toast.reward.subtitle")}
        tone="emerald"
      />

      <div className="flex items-center gap-2">
        <Gift className="size-4 text-[#B7F500]" aria-hidden />
        <p className="text-sm font-semibold text-white">{t("referral.how.panel.rewardsTab")}</p>
      </div>
      <p className="mt-1 text-[10px] text-zinc-500">{t("referral.how.panel.rewardsSubtitle")}</p>

      <div className="referral-how-reward-box mt-3 rounded-xl bg-black/35 px-3 py-3">
        <p className="text-[9px] text-zinc-500">{t("referral.how.panel.bonus")}</p>
        <p className="mt-1 font-mono text-lg font-semibold text-white">25,00 USDT</p>
        <p className="mt-1 text-[10px] text-[#d4f570]">{t("referral.how.panel.statusAvailable")}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-black/30 px-2 py-2 text-center">
          <p className="text-[9px] text-zinc-500">{t("referral.summary.invited")}</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-white">3</p>
        </div>
        <div className="rounded-xl bg-black/30 px-2 py-2 text-center">
          <p className="text-[9px] text-zinc-500">{t("referral.summary.paid")}</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-white">75,00</p>
        </div>
      </div>

      <p className="mt-auto text-center text-[10px] text-zinc-500">{t("referral.how.panel.footer")}</p>
    </div>
  );
}

export function ReferralHowScene() {
  const { t } = useI18n();

  const steps = useMemo(
    () =>
      [
        { id: "invite" as const, title: t("referral.how.step1.title"), text: t("referral.how.step1.text") },
        { id: "register" as const, title: t("referral.how.step2.title"), text: t("referral.how.step2.text") },
        { id: "qualify" as const, title: t("referral.how.step3.title"), text: t("referral.how.step3.text") },
        { id: "reward" as const, title: t("referral.how.step4.title"), text: t("referral.how.step4.text") },
      ] as const,
    [t],
  );

  return (
    <section aria-labelledby="referral-how-title">
      <PartnerSurface
        className="referral-how-scene"
        innerClassName="space-y-8 p-6 sm:p-8"
        imageOpacity="opacity-45"
        overlayClassName="bg-black/62"
      >
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">{t("referral.how.kicker")}</p>
          <h2 id="referral-how-title" className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {t("referral.how.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">{t("referral.how.subtitle")}</p>
        </div>

        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-black/45 backdrop-blur-[2px] sm:rounded-3xl">
          <MiniChrome />
          <div className="relative isolate aspect-[16/11] min-h-[280px] overflow-hidden bg-black/35 sm:min-h-[320px]">
            <InvitePanel />
            <RegisterPanel />
            <QualifyPanel />
            <RewardPanel />
          </div>
          <div className="h-1 bg-black/50">
            <div className="referral-how-progress h-full bg-[#B7F500]" />
          </div>
        </div>

        <div className="relative mx-auto max-w-4xl rounded-3xl bg-black/45 px-3 py-6 backdrop-blur-[1px] sm:px-6 sm:py-7">
          <div className="pointer-events-none absolute left-8 right-8 top-[1.65rem] hidden h-px bg-white/8 sm:block" aria-hidden />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {steps.map((item, i) => (
              <div key={item.id} className="flex flex-col items-center text-center">
                <span className={cn("referral-how-step-label--" + item.id, "relative min-h-8 text-[11px] sm:text-sm")}>
                  <span className="relative inline-block pb-1">
                    {item.title}
                    <span
                      className={cn(
                        "referral-how-underline--" + item.id,
                        "absolute inset-x-0 -bottom-0.5 h-0.5 origin-left bg-[#B7F500]",
                      )}
                      aria-hidden
                    />
                  </span>
                </span>
                <div
                  className={cn(
                    "referral-how-dot referral-how-dot--" + item.id,
                    "mt-2 flex size-8 items-center justify-center rounded-full bg-white/8 text-[11px] font-bold text-zinc-400 sm:size-9",
                  )}
                >
                  {i + 1}
                </div>
              </div>
            ))}
          </div>

          <div className="relative mx-auto mt-8 min-h-[7rem] max-w-2xl text-center sm:min-h-[6.5rem]">
            {steps.map((item, i) => (
              <div
                key={item.id}
                className={cn("referral-how-detail--" + item.id, "absolute inset-x-0 top-0 px-2")}
                aria-hidden={i !== 0}
              >
                <p className="font-mono text-xs text-zinc-500">0{i + 1}</p>
                <h3 className="mt-2 text-lg font-semibold text-white sm:text-xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </PartnerSurface>
    </section>
  );
}
