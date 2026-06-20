export type ReferralProgramTabId = "program" | "rewards";

export const REFERRAL_PROGRAM_TABS: { id: ReferralProgramTabId; label: string }[] = [
  { id: "program", label: "Программа" },
  { id: "rewards", label: "Награды" },
];

export function parseReferralProgramTabParam(raw: string | null): ReferralProgramTabId | null {
  if (raw === "program" || raw === "rewards") return raw;
  return null;
}

export const REFERRAL_TAB_META: Record<
  ReferralProgramTabId,
  { documentTitle: string; surfaceTitle: string; surfaceSubtitle: string; zoneLabel: string }
> = {
  program: {
    documentTitle: "Программа",
    surfaceTitle: "Реферальная программа",
    surfaceSubtitle:
      "Персональная ссылка и код, шаги начисления и сводка приглашений. Награды в USDT (TRC20) — во вкладке «Награды».",
    zoneLabel: "Invite",
  },
  rewards: {
    documentTitle: "Награды",
    surfaceTitle: "Награды по рефералам",
    surfaceSubtitle:
      "Сводка и история начислений из вашего реферального профиля Spliton.",
    zoneLabel: "Rewards",
  },
};
