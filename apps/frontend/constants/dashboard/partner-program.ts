export type PartnerProgramTabId = "about" | "process" | "community" | "faq";

export const PARTNER_PROGRAM_TABS: { id: PartnerProgramTabId; label: string }[] = [
  { id: "about", label: "О программе" },
  { id: "process", label: "Процесс" },
  { id: "community", label: "Комьюнити" },
  { id: "faq", label: "FAQ" },
];

export function parsePartnerProgramTabParam(raw: string | null): PartnerProgramTabId | null {
  if (raw === "about" || raw === "process" || raw === "community" || raw === "faq") return raw;
  return null;
}

export const PARTNER_TAB_META: Record<
  PartnerProgramTabId,
  { documentTitle: string; surfaceTitle: string; surfaceSubtitle: string; zoneLabel: string }
> = {
  about: {
    documentTitle: "О программе",
    surfaceTitle: "Партнёрская программа Spliton",
    surfaceSubtitle:
      "Медиа, сообщества, лейблы и стратегические коллаборации — отдельный контур от пользовательской реферальной программы. Форматы, преимущества и зачем вступать.",
    zoneLabel: "Partners",
  },
  process: {
    documentTitle: "Процесс",
    surfaceTitle: "От заявки к сотрудничеству",
    surfaceSubtitle:
      "Пять шагов, критерии отбора и точка входа через почту партнёрской команды. Онлайн-форма в кабинете появится позже.",
    zoneLabel: "Pipeline",
  },
  community: {
    documentTitle: "Комьюнити",
    surfaceTitle: "Голоса партнёров",
    surfaceSubtitle:
      "Истории из комьюнити в тоне продукта — демонстрационные карточки до подключения реальных кейсов.",
    zoneLabel: "Trust",
  },
  faq: {
    documentTitle: "FAQ",
    surfaceTitle: "Вопросы и ответы",
    surfaceSubtitle:
      "Партнёрский контур, отличия от реферальной программы и рабочие моменты по USDT (TRC20) в продукте.",
    zoneLabel: "Help",
  },
};
