/** UI-мок: ссылка, код, статистика и история наград. Подключение API заменит источник данных. */

export const REFERRAL_APP_ORIGIN = "https://spliton.app";

export const REFERRAL_CODE = "RS7K2M";

export function buildReferralLink(code: string = REFERRAL_CODE) {
  return `${REFERRAL_APP_ORIGIN}/r/${code}`;
}

export const referralProgramStats = {
  invitedUsers: 24,
  activeReferrals: 8,
  pendingRewardsUsdt: 120.5,
  earnedRewardsTotalUsdt: 892.4,
} as const;

export type ReferralRewardStatus = "pending" | "available" | "paid" | "rejected" | "cancelled";

export type ReferralRewardRow = {
  id: string;
  date: string;
  inviteeMasked: string;
  rewardType: string;
  status: ReferralRewardStatus;
  amountUsdt: number;
  note?: string;
};

export const referralRewardsHistory: ReferralRewardRow[] = [
  {
    id: "rw-1",
    date: "2026-04-14",
    inviteeMasked: "user_••••82a1",
    rewardType: "Первое пополнение USDT",
    status: "paid",
    amountUsdt: 25,
    note: "TRC20 · заявка закрыта",
  },
  {
    id: "rw-2",
    date: "2026-04-12",
    inviteeMasked: "user_••••91c0",
    rewardType: "Покупка UNT",
    status: "available",
    amountUsdt: 48.75,
    note: "Secondary · исполнен ордер",
  },
  {
    id: "rw-3",
    date: "2026-04-09",
    inviteeMasked: "user_••••03ff",
    rewardType: "Регистрация",
    status: "pending",
    amountUsdt: 5,
    note: "Ожидается KYC друга",
  },
  {
    id: "rw-4",
    date: "2026-03-28",
    inviteeMasked: "user_••••44de",
    rewardType: "Покупка UNT",
    status: "paid",
    amountUsdt: 120,
    note: "Первичный раунд",
  },
  {
    id: "rw-5",
    date: "2026-03-20",
    inviteeMasked: "user_••••77ab",
    rewardType: "Бонус за активность",
    status: "cancelled",
    amountUsdt: 0,
    note: "Дубль аккаунта · начисление отменено",
  },
  {
    id: "rw-6",
    date: "2026-03-15",
    inviteeMasked: "user_••••aa12",
    rewardType: "Первое пополнение USDT",
    status: "rejected",
    amountUsdt: 15,
    note: "Не прошла проверка источника средств",
  },
];

/** Включите `true`, чтобы увидеть глобальный empty state на вкладке «Награды». */
export const REFERRAL_MOCK_USE_EMPTY_REWARDS = false;

export function getReferralRewardsHistory(): ReferralRewardRow[] {
  return REFERRAL_MOCK_USE_EMPTY_REWARDS ? [] : referralRewardsHistory;
}

export type ReferralFaqItem = { id: string; question: string; answer: string };

export const referralFaqItems: ReferralFaqItem[] = [
  {
    id: "faq-1",
    question: "Как работает реферальная программа Spliton?",
    answer:
      "Вы делитесь персональной ссылкой или кодом. Когда приглашённый пользователь регистрируется и выполняет условия программы (например, проходит верификацию или совершает квалифицирующую операцию), платформа фиксирует событие и начисляет награду согласно правилам на момент действия.",
  },
  {
    id: "faq-2",
    question: "Когда начисляется награда?",
    answer:
      "Начисление привязано к событиям в продукте: регистрация, первое пополнение баланса USDT (TRC20), покупка UNT и другие сценарии, указанные в актуальных условиях. До выполнения условий статус остаётся «В ожидании».",
  },
  {
    id: "faq-3",
    question: "Какие условия должны быть выполнены?",
    answer:
      "Условия зависят от типа награды: уникальный приглашённый, отсутствие нарушений правил, лимиты по времени и объёму операций. Подробности — в разделе «Комиссии и условия» и в уведомлениях по конкретной награде.",
  },
  {
    id: "faq-4",
    question: "Как проверить статус приглашения?",
    answer:
      "Во вкладке «Награды» отображаются строки по каждому событию: статус, сумма и комментарий. Общая статистика приглашений — на вкладке «Реферальная программа» в блоке сводки.",
  },
  {
    id: "faq-5",
    question: "Как получить награду на баланс?",
    answer:
      "Когда статус становится «Доступно», средства можно зачислить на внутренний баланс USDT по кнопке в продукте (после подключения выплат). Уже выплаченные начисления отмечены как «Выплачено».",
  },
];
