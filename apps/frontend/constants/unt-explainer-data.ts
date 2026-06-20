export type UntSceneId = "release" | "pool" | "buy" | "payout" | "secondary";

export type UntSceneMeta = {
  id: UntSceneId;
  step: string;
  title: string;
  subtitle: string;
  description: string;
};

export const UNT_EXPLAINER_RELEASE = {
  title: "Midnight Drive",
  artist: "Luna Pulse",
  genre: "Electronic",
  status: "open",
  totalUnits: 10_000,
  availableUnits: 1_200,
  unitPriceUsdt: "50,00",
  userPoolPct: 50,
  coverUrl: "/images/catalog/1.png",
} as const;

export const UNT_SCENES: UntSceneMeta[] = [
  {
    id: "release",
    step: "01",
    title: "Что такое релиз",
    subtitle: "Музыкальный проект в каталоге Spliton",
    description:
      "Релиз — это оформленная сделка вокруг конкретного трека или альбома: параметры выплат, объём UNT, раунд сбора и статус в каталоге. У каждого релиза свой пул и свои правила.",
  },
  {
    id: "pool",
    step: "02",
    title: "UNT внутри релиза",
    subtitle: "Доли пользовательского пула",
    description:
      "У релиза есть общее количество UNT — например 10 000. Ваши 1 000 UNT = 10% пользовательского пула дохода именно этого релиза. UNT другого релиза считаются отдельно.",
  },
  {
    id: "buy",
    step: "03",
    title: "Покупка UNT",
    subtitle: "Первичный рынок",
    description:
      "На первичном рынке вы платите USDT и получаете UNT по цене релиза. Platform fee видна в превью ордера до подтверждения. UNT зачисляются в позицию по этому релизу.",
  },
  {
    id: "payout",
    step: "04",
    title: "Начисления по UNT",
    subtitle: "Пропорциональное распределение",
    description:
      "Когда релиз приносит доход, часть идёт в пользовательский пул. Система делит пул между держателями UNT пропорционально их количеству. Выплаты не гарантированы и зависят от фактического дохода.",
  },
  {
    id: "secondary",
    step: "05",
    title: "Передача UNT",
    subtitle: "Secondary market",
    description:
      "На вторичном рынке UNT можно передать другому пользователю. Вместе с единицами переходит право на будущую долю дохода по этому релизу — в рамках правил сделки и лимитов платформы.",
  },
];

export const UNT_ACTIONS = [
  { title: "Получать начисления", text: "Доход распределяется пропорционально количеству UNT по релизу." },
  { title: "Отслеживать долю", text: "UNT показывает вашу долю в пользовательском пуле конкретного релиза." },
  { title: "Передавать права", text: "UNT можно продать или купить на secondary, если рынок открыт для релиза." },
  { title: "Хранить в портфеле", text: "Позиции по UNT видны в обзоре, метриках и истории операций." },
] as const;
