import type { PayoutFaqItem } from "@/components/dashboard/assets/payout-flow-faq";

type TFn = (key: string) => string;

/** Localized withdraw FAQ for live payout UI (replaces hardcoded mock copy). */
export function getWithdrawFaqItems(t: TFn): PayoutFaqItem[] {
  return [
    {
      id: "wd-how",
      question: t("withdraw.faq.how.question"),
      answer: t("withdraw.faq.how.answer"),
    },
    {
      id: "wd-pending",
      question: t("withdraw.faq.pending.question"),
      answer: t("withdraw.faq.pending.answer"),
    },
    {
      id: "wd-address",
      question: t("withdraw.faq.address.question"),
      answer: t("withdraw.faq.address.answer"),
    },
    {
      id: "wd-fee",
      question: t("withdraw.faq.fee.question"),
      answer: t("withdraw.faq.fee.answer"),
    },
  ];
}
