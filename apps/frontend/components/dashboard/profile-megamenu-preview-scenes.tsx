"use client";

import "./profile-megamenu-preview.css";

import { UserRound } from "@/lib/lucide";

import { VERIFICATION_STEPS } from "@/constants/dashboard/profile-verification";
import { BlockCursor } from "@/components/dashboard/megamenu-preview-blocks";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

function ProfileCursor({ step, hint, className }: { step: string; hint: string; className?: string }) {
  return <BlockCursor step={step} hint={hint} className={className} />;
}

function MiniSecurityRing({ score, label }: { score: number; label: string }) {
  const deg = (score / 100) * 360;

  return (
    <div
      className="relative grid size-10 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(#B7F500 0deg ${deg}deg, #e5e7eb ${deg}deg 360deg)` }}
      aria-hidden
    >
      <div className="flex size-8 flex-col items-center justify-center rounded-full bg-white">
        <span className="text-[6px] font-bold tabular-nums leading-none text-neutral-900">{score}</span>
        <span className="mt-px text-[2.5px] font-semibold uppercase tracking-wider text-neutral-400">{label}</span>
      </div>
    </div>
  );
}

export function ProfileOverviewScene() {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="shrink-0">
        <p className="text-[4.5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {t("navigation.profile.overview.label")}
        </p>
        <h1 className="mt-0.5 text-[7px] font-semibold leading-none tracking-tight text-neutral-900">
          {t("profile.overview.accountLabel")}
        </h1>
      </div>

      <section className="shrink-0 overflow-visible rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        <div className="flex items-center gap-1">
          <div className="grid size-5 shrink-0 place-items-center rounded-full bg-neutral-100">
            <UserRound className="size-3 text-neutral-500" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[6px] font-semibold text-neutral-900">Spliton User</p>
            <p className="font-mono text-[4px] text-neutral-500">UID: a1b2c3d4…</p>
          </div>
        </div>
      </section>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        <p className="text-[5px] text-neutral-500">{t("profile.overview.valuationLabel")}</p>
        <p className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums leading-none text-neutral-900">6 520 USDT</p>
        <p className="mt-0.5 text-[4.5px] tabular-nums text-neutral-500">{t("profile.overview.dailyPnl")}</p>
        <div className="relative mt-1.5 flex flex-wrap gap-1 overflow-visible">
          <span className="relative inline-flex overflow-visible">
            <span className="preview-prof-deposit preview-megamenu-target rounded-md bg-neutral-900 px-1.5 py-0.5 text-[5px] font-semibold text-white">
              {t("profile.overview.quickActions.deposit")}
            </span>
            <ProfileCursor
              step="prof-overview-deposit"
              hint={t("preview.megamenu.profile.cursorDeposit")}
              className="absolute left-[48%] top-[78%]"
            />
          </span>
          <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[5px] font-semibold text-neutral-800">
            {t("profile.overview.withdraw")}
          </span>
        </div>
      </section>
    </div>
  );
}

export function ProfileVerificationScene() {
  const { t } = useI18n();
  const steps = VERIFICATION_STEPS.slice(0, 2);

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="shrink-0">
        <p className="text-[4.5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">KYC</p>
        <h1 className="mt-0.5 text-[7px] font-semibold leading-none tracking-tight text-neutral-900">
          {t("verification.title")}
        </h1>
      </div>

      <section className="shrink-0 overflow-visible rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        <p className="text-[4px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
          {t("verification.statusLabel")}
        </p>
        <span className="mt-0.5 inline-flex rounded-full bg-amber-50 px-1.5 py-0.5 text-[4.5px] font-semibold text-amber-900">
          {t("verification.status.inProgress")}
        </span>
      </section>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        <p className="text-[5.5px] font-semibold text-neutral-900">{t("verification.stepsTitle")}</p>
        <ol className="relative mt-1 space-y-1 overflow-visible">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className={cn(
                "relative flex items-start gap-1 overflow-visible",
                index === 0 && "preview-prof-verify-step preview-megamenu-target rounded-md px-0.5 py-0.5",
              )}
            >
              <span className="flex size-3 shrink-0 items-center justify-center rounded-full border border-[#B7F500]/35 bg-[#B7F500]/10 font-mono text-[3px] font-semibold text-[#84cc16]">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[5px] font-semibold text-neutral-900">{step.title}</p>
                <p className="line-clamp-2 text-[4px] leading-snug text-neutral-500">{step.description}</p>
              </div>
              {index === 0 ? (
                <ProfileCursor
                  step="prof-verify-step"
                  hint={t("preview.megamenu.profile.cursorVerify")}
                  className="absolute left-[10%] top-[58%]"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function ProfileSecurityScene() {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="shrink-0">
        <p className="text-[4.5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {t("navigation.profile.security.label")}
        </p>
        <h1 className="mt-0.5 text-[7px] font-semibold leading-none tracking-tight text-neutral-900">
          {t("profile.overview.securityLabel")}
        </h1>
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        <div className="flex items-center gap-1.5">
          <MiniSecurityRing score={78} label={t("profile.security.score.ringOf")} />
          <div className="min-w-0">
            <p className="text-[5.5px] font-semibold text-neutral-900">{t("profile.security.score.good.title")}</p>
            <p className="mt-0.5 line-clamp-2 text-[4px] leading-snug text-neutral-500">
              {t("profile.security.score.good.sub")}
            </p>
          </div>
        </div>

        <div className="preview-prof-twofa preview-megamenu-target relative mt-1.5 overflow-visible rounded-lg bg-neutral-50 px-1 py-1">
          <div className="flex items-center justify-between gap-1">
            <div className="min-w-0">
              <p className="text-[5px] font-semibold text-neutral-900">{t("profile.security.twoFa.title")}</p>
              <p className="text-[4px] text-neutral-500">{t("profile.overview.badge.twoFa.off")}</p>
            </div>
            <span className="shrink-0 rounded-full bg-neutral-200 px-1.5 py-0.5 text-[3.5px] font-semibold text-neutral-600">
              OFF
            </span>
          </div>
          <ProfileCursor
            step="prof-security-twofa"
            hint={t("preview.megamenu.profile.cursorSecurity")}
            className="absolute left-[12%] top-[62%]"
          />
        </div>
      </section>
    </div>
  );
}

export function ProfileSettingsScene() {
  const { t } = useI18n();
  const rows = [
    { label: t("profile.settings.displayName.label"), value: "Spliton User" },
    { label: t("profile.settings.timezone.label"), value: "Europe/Moscow" },
  ];

  return (
    <div className="flex h-full flex-col gap-1 overflow-visible bg-[#f6f7f9] p-1">
      <div className="shrink-0">
        <p className="text-[4.5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {t("navigation.profile.settings.label")}
        </p>
        <h1 className="mt-0.5 text-[7px] font-semibold leading-none tracking-tight text-neutral-900">
          {t("profile.overview.profileSettings")}
        </h1>
      </div>

      <section className="relative min-h-0 flex-1 overflow-visible rounded-lg bg-white px-1.5 py-1 ring-1 ring-neutral-200/60">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={cn(
              "relative flex items-center justify-between gap-1 border-t border-neutral-100 py-1 first:border-t-0 first:pt-0",
              index === 1 && "preview-prof-settings-row preview-megamenu-target",
            )}
          >
            <div className="min-w-0">
              <p className="text-[5px] font-semibold text-neutral-900">{row.label}</p>
              <p className="text-[4px] text-neutral-500">{row.value}</p>
            </div>
            <span className="text-[4px] font-medium text-neutral-400">›</span>
            {index === 1 ? (
              <ProfileCursor
                step="prof-settings-row"
                hint={t("preview.megamenu.profile.cursorSettings")}
                className="absolute left-[8%] top-[52%]"
              />
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}
