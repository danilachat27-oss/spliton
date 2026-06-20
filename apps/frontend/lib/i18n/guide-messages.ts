import type { AppLocale } from "./types";

const RU: Record<string, string> = {
  "guide.hero.badge": "Гид · Spliton",
  "guide.hero.title": "Как выбрать релиз в Spliton",
  "guide.hero.subtitle":
    "Разберите карточку релиза, выплаты в USDT TRC20, условия сделки, вторичный рынок и риски — перед покупкой units.",
  "guide.hero.cta.catalog": "Открыть каталог",
  "guide.hero.cta.compare": "Сравнить релизы",

  "guide.nav.aria": "Навигация по разделам гида",
  "guide.nav.title": "На что смотреть",
  "guide.nav.guideTop": "Гид",
  "guide.nav.topics": "Разделы",
  "guide.nav.checklist": "Чеклист",
  "guide.nav.releaseCard": "Карточка",
  "guide.nav.factors": "5 факторов",
  "guide.nav.deal": "Сделка",
  "guide.nav.payouts": "Выплаты",
  "guide.nav.risks": "Риски",
  "guide.nav.compare": "Сравнение",
  "guide.nav.faq": "FAQ",
  "guide.nav.cta": "Дальше",

  "guide.topics.title": "Выберите раздел",
  "guide.exchange.readMore": "Подробнее",

  "guide.topic.checklist.title": "Чеклист перед входом",
  "guide.topic.checklist.desc":
    "Быстрая проверка: доходность, история выплат, доля держателей units, условия сделки, вторичный рынок и прозрачность.",
  "guide.topic.releaseCard.title": "Как читать карточку релиза",
  "guide.topic.releaseCard.desc": "Какие поля смотреть в каталоге перед покупкой units.",
  "guide.topic.factors.title": "Пять факторов выбора",
  "guide.topic.factors.desc": "Доходность, условия сделки, история выплат, спрос и ликвидность в одном каркасе.",
  "guide.topic.deal.title": "Структура сделки",
  "guide.topic.deal.desc":
    "Как доход релиза распределяется между держателями units, артистом и платформой.",
  "guide.topic.payouts.title": "Выплаты и история",
  "guide.topic.payouts.desc": "Как смотреть начисления, выплаты и регулярность периодов.",
  "guide.topic.risks.title": "Риски",
  "guide.topic.risks.desc":
    "Что важно учитывать: волатильность, ликвидность и отсутствие гарантированной доходности.",

  "guide.checklist.title": "5 шагов перед покупкой units",
  "guide.checklist.subtitle": "Короткий чеклист — можно пройти за 2 минуты.",
  "guide.checklist.step.1": "Проверьте доходность и историю выплат.",
  "guide.checklist.step.2": "Посмотрите долю держателей units и комиссии.",
  "guide.checklist.step.3": "Оцените заполнение раунда и активность вторичного рынка.",
  "guide.checklist.step.4": "Сравните релиз с 1–2 другими релизами.",
  "guide.checklist.step.5": "Учтите риски: доходность и ликвидность не гарантированы.",
  "guide.checklist.videoNote":
    "Видео-гид скоро появится. Пока используйте чеклист и разделы ниже — они покрывают основные шаги выбора.",

  "guide.releaseCard.title": "Как читать карточку релиза",
  "guide.releaseCard.subtitle":
    "Разберите ключевые поля на примере — так же выглядит карточка в каталоге.",
  "guide.releaseCard.cta": "Открыть каталог",
  "guide.releaseCard.demo.title": "Midnight Code",
  "guide.releaseCard.demo.artist": "Vera Kline",
  "guide.releaseCard.demo.genre": "POP",
  "guide.releaseCard.demo.stripLabel": "Сбор UNT",
  "guide.releaseCard.demo.stripHint": "65%",
  "guide.releaseCard.demo.yield": "10,1%",
  "guide.releaseCard.demo.collected": "143 000 / 220 000",
  "guide.releaseCard.demo.unitPrice": "22,00",
  "guide.releaseCard.demo.liquidity": "Высокая",
  "guide.releaseCard.step.status.title": "Статус раунда",
  "guide.releaseCard.step.status.body":
    "Показывает этап релиза: идёт сбор units или уже выплаты. Если раунд почти закрыт, купить на первичке может быть сложнее.",
  "guide.releaseCard.step.yield.title": "Доходность",
  "guide.releaseCard.step.yield.body":
    "Ориентир по доходности, а не гарантия. Сравните с историей выплат в аналитике релиза — там видно, как процент ведёт себя на практике.",
  "guide.releaseCard.step.progress.title": "Прогресс сбора",
  "guide.releaseCard.step.progress.body":
    "Сколько USDT уже собрано и насколько заполнен раунд. Высокий прогресс часто означает сильный спрос на units.",
  "guide.releaseCard.step.price.title": "Цена за 1 unit",
  "guide.releaseCard.step.price.body":
    "Стоимость одной доли в USDT. Умножьте на нужное количество units и сравните с ценой на вторичном рынке.",
  "guide.releaseCard.step.liquidity.title": "Ликвидность",
  "guide.releaseCard.step.liquidity.body":
    "Насколько легко продать units позже. Низкая ликвидность — дольше ждать покупателя при досрочном выходе.",

  "guide.factors.title": "Пять факторов выбора релиза",
  "guide.factors.subtitle": "Один каркас для любого релиза в каталоге — от доходности до ликвидности.",
  "guide.factors.purposeHint": "Пять вопросов, которые стоит задать любому релизу перед покупкой units.",
  "guide.factors.label.essence": "Суть",
  "guide.factors.label.watch": "Что смотреть",
  "guide.factors.label.why": "Почему важно",

  "guide.factors.yield.title": "Доходность",
  "guide.factors.yield.essence": "Ожидаемый процент дохода по релизу.",
  "guide.factors.yield.watch": "Прогноз доходности, динамику за 30/90 дней, историю выплат.",
  "guide.factors.yield.why":
    "Высокий процент без стабильной истории может быть рискованнее умеренной доходности.",

  "guide.factors.deal.title": "Условия сделки",
  "guide.factors.deal.essence": "Как делится доход между держателями units, артистом и платформой.",
  "guide.factors.deal.watch": "Долю держателей units, комиссию платформы, правила распределения.",
  "guide.factors.deal.why": "От этого напрямую зависит итоговая выплата в USDT.",

  "guide.factors.history.title": "История выплат",
  "guide.factors.history.essence": "Были ли реальные выплаты и насколько они стабильны.",
  "guide.factors.history.watch": "Периодичность, суммы, начислено и выплачено.",
  "guide.factors.history.why": "Регулярность выплат часто важнее одного высокого периода.",

  "guide.factors.demand.title": "Спрос на units",
  "guide.factors.demand.essence": "Насколько активно пользователи входят в релиз.",
  "guide.factors.demand.watch": "Прогресс раунда, активность в каталоге, повторный интерес.",
  "guide.factors.demand.why": "Спрос показывает интерес рынка к релизу.",

  "guide.factors.secondary.title": "Вторичный рынок",
  "guide.factors.secondary.essence": "Можно ли продать units другим пользователям до конца цикла выплат.",
  "guide.factors.secondary.watch": "Активные заявки, сделки за 7/30 дней, спред.",
  "guide.factors.secondary.why": "При низкой ликвидности выход может занять больше времени.",

  "guide.deal.title": "Как устроена сделка",
  "guide.deal.subtitle": "Слева — этапы сделки, справа — что они означают для оценки релиза.",
  "guide.deal.purposeHint": "Поймите, как доход релиза превращается в выплату на ваш кошелёк.",
  "guide.deal.stepsLabel": "Этапы",
  "guide.deal.contextLabel": "Контекст",
  "guide.deal.step.raiseTarget": "Цель сбора",
  "guide.deal.step.untDistribution": "Распределение units",
  "guide.deal.step.investorShare": "Доля держателей units",
  "guide.deal.step.platformFee": "Комиссия платформы",
  "guide.deal.step.netPayout": "Итоговая выплата в USDT",
  "guide.deal.context.split.title": "Прозрачность распределения",
  "guide.deal.context.split.body":
    "Чем понятнее, как делится доход между держателями units, артистом и платформой, тем проще оценить будущую выплату.",
  "guide.deal.context.fees.title": "Комиссии и удержания",
  "guide.deal.context.fees.body":
    "Комиссия платформы и другие удержания уменьшают сумму, которую получают держатели units — учитывайте их до покупки.",
  "guide.deal.context.performance.title": "Фактическая динамика",
  "guide.deal.context.performance.body":
    "Условия задают рамки, но итоговая выплата зависит от реальных результатов релиза.",

  "guide.payouts.title": "Как оценивать выплаты",
  "guide.payouts.subtitle":
    "Смотрите ритм выплат, просадки по периодам и разницу между начислением и переводом на кошелёк.",
  "guide.payouts.purposeHint": "Один красивый процент не равен стабильности — смотрите историю по периодам.",
  "guide.payouts.chartHeader": "Тренд выплат · пример",
  "guide.payouts.exampleLabel": "Пример · не данные реального релиза",
  "guide.payouts.chartAria": "Пример графика выплат по месяцам в USDT с просадкой в феврале",
  "guide.payouts.chartTitle": "Тренд выплат по месяцам (пример)",
  "guide.payouts.status.released": "выплачено",
  "guide.payouts.status.accrued": "начислено",
  "guide.payouts.month.jan": "Янв",
  "guide.payouts.month.feb": "Фев",
  "guide.payouts.month.mar": "Мар",
  "guide.payouts.month.apr": "Апр",
  "guide.payouts.amount.jan": "84.2 USDT",
  "guide.payouts.amount.feb": "79.4 USDT",
  "guide.payouts.amount.mar": "92.1 USDT",
  "guide.payouts.amount.apr": "88.3 USDT",
  "guide.payouts.table.period": "Период",
  "guide.payouts.table.amount": "Сумма",
  "guide.payouts.table.status": "Статус",
  "guide.payouts.table.unit": "USDT TRC20 · пример",
  "guide.payouts.quest.title": "Разбор примера",
  "guide.payouts.quest.step.regularity.title": "Регулярность",
  "guide.payouts.quest.step.regularity.body":
    "Ищите предсказуемый ритм начислений и небольшой разброс сумм от периода к периоду.",
  "guide.payouts.quest.step.regularity.pointer": "Смотрите: линия тренда слева",
  "guide.payouts.quest.step.accrued.title": "Начислено и выплачено",
  "guide.payouts.quest.step.accrued.body":
    "«Начислено» — сумма за период, которая ещё может быть не переведена на кошелёк. «Выплачено» — уже в USDT TRC20.",
  "guide.payouts.quest.step.accrued.pointer": "Смотрите: статус в таблице",
  "guide.payouts.quest.step.yield.title": "Умеренная доходность",
  "guide.payouts.quest.step.yield.body":
    "Стабильный умеренный процент часто предпочтительнее резких скачков и просадок.",
  "guide.payouts.quest.step.yield.pointer": "Смотрите: разброс сумм по периодам",

  "guide.risks.title": "Основные риски",
  "guide.risks.subtitle":
    "Перед покупкой units учтите: доход, сроки выплат и выход из позиции могут пойти не так, как вы ожидаете.",
  "guide.risks.purposeHint": "Пробегитесь по списку до покупки — так проще сопоставить ожидания с реальностью.",
  "guide.risks.item.1.title": "Выплаты могут проседать",
  "guide.risks.item.1.body":
    "Сумма за месяц не фиксирована: один период выше, другой ниже — это нормально для релизов.",
  "guide.risks.item.2.title": "Похожие релизы ведут себя по-разному",
  "guide.risks.item.2.body":
    "Даже в одном жанре доходность и динамика могут сильно отличаться.",
  "guide.risks.item.3.title": "Окупаемость может затянуться",
  "guide.risks.item.3.body":
    "Вернуть вложенные USDT можно раньше или позже прогноза — всё зависит от фактических результатов релиза.",
  "guide.risks.item.4.title": "Выход не всегда быстрый",
  "guide.risks.item.4.body":
    "На вторичном рынке может не быть покупателя сразу. При низкой ликвидности продажа units займёт время.",
  "guide.risks.item.5.title": "Высокий процент — не гарантия",
  "guide.risks.item.5.body":
    "Один удачный период или высокая прогнозная доходность не означает стабильные выплаты в будущем.",
  "guide.risks.footer":
    "Это не инвестиционная рекомендация. Итоговая доходность зависит от результатов релиза, условий сделки и ликвидности.",

  "guide.comparison.title": "Как сравнивать релизы между собой",
  "guide.comparison.subtitle":
    "Возьмите два релиза и пройдитесь по одним и тем же метрикам — так сравнение будет честнее.",
  "guide.comparison.purposeHint": "Не сравнивайте только по одному проценту — смотрите выплаты, долю и ликвидность вместе.",
  "guide.comparison.badge.example": "Пример · условные данные",
  "guide.comparison.metricsTitle": "Сравнение по метрикам",
  "guide.comparison.slot.a": "Релиз A",
  "guide.comparison.slot.b": "Релиз B",
  "guide.comparison.row.yield": "Ожидаемая доходность",
  "guide.comparison.row.frequency": "Периодичность выплат",
  "guide.comparison.row.holderShare": "Доля держателей units",
  "guide.comparison.row.demand": "Спрос и активность",
  "guide.comparison.row.liquidity": "Ликвидность",
  "guide.comparison.release.a": "Midnight Code",
  "guide.comparison.release.a.artist": "Vera Kline",
  "guide.comparison.release.a.genre": "POP",
  "guide.comparison.release.b": "Glass Echo",
  "guide.comparison.release.b.artist": "North Tide",
  "guide.comparison.release.b.genre": "INDIE",
  "guide.comparison.val.yield.a": "10,1%",
  "guide.comparison.val.yield.b": "8,7%",
  "guide.comparison.val.frequency.a": "ежемесячно",
  "guide.comparison.val.frequency.b": "ежемесячно",
  "guide.comparison.val.holderShare.a": "62%",
  "guide.comparison.val.holderShare.b": "58%",
  "guide.comparison.val.demand.a": "средний+",
  "guide.comparison.val.demand.b": "стабильный",
  "guide.comparison.val.liquidity.a": "высокая",
  "guide.comparison.val.liquidity.b": "низкая",
  "guide.comparison.footer":
    "Пример для обучения — не рекомендация выбрать конкретный релиз. Сравнивайте актуальные данные в каталоге и аналитике.",

  "guide.cta.title": "Готовы выбрать релиз?",
  "guide.cta.subtitle":
    "Откройте каталог, сравните релизы по единому набору метрик и переходите к покупке только после проверки условий и рисков.",
  "guide.cta.catalog": "Открыть каталог",
  "guide.cta.compare": "Сравнить релизы",

  "guide.reveal.purposeLabel": "Зачем этот блок",

  "guide.faq.title": "FAQ",
  "guide.faq.subtitle": "Ответы по выбору релиза — сгруппированы по теме.",
  "guide.faq.filter.all": "Все темы",
  "guide.faq.empty": "В этой теме пока нет вопросов.",
  "guide.faq.category.general": "Общее",
  "guide.faq.category.yield": "Доходность и выплаты",
  "guide.faq.category.deal": "Условия сделки",
  "guide.faq.category.liquidity": "Ликвидность и вторичный рынок",

  "guide.faq.what-is-unit.q": "Что такое units?",
  "guide.faq.what-is-unit.a":
    "Unit — доля в пуле дохода релиза. Чем больше units вы держите, тем больше ваша часть выплат в USDT за отчётный период.",

  "guide.faq.where-payout-history.q": "Где смотреть историю выплат?",
  "guide.faq.where-payout-history.a":
    "В аналитике релиза: откройте карточку в каталоге → «Аналитика». Там график по периодам, суммы начислений и переводы на кошелёк в USDT TRC20.",

  "guide.faq.holder-share.q": "Что значит «доля держателей units»?",
  "guide.faq.holder-share.a":
    "Это часть дохода релиза, которая распределяется между держателями units. Внутри пула выплата пропорциональна количеству ваших units.",

  "guide.faq.what-is-secondary.q": "Что такое вторичный рынок?",
  "guide.faq.what-is-secondary.a":
    "Раздел площадки, где можно купить или продать units у других пользователей до завершения цикла выплат по релизу.",

  "guide.faq.why-payouts-vary.q": "Почему выплаты могут отличаться по периодам?",
  "guide.faq.why-payouts-vary.a":
    "Доход релиза зависит от прослушиваний и отчётных периодов — суммы не фиксированы и меняются от месяца к месяцу.",

  "guide.faq.yield-vs-stability.q": "Что важнее: высокая доходность или стабильные выплаты?",
  "guide.faq.yield-vs-stability.a":
    "На длинном горизонте чаще важнее стабильная история выплат. Высокий процент без истории — повод дополнительно проверить риски и ликвидность.",

  "guide.faq.early-exit.q": "Можно ли выйти из релиза раньше?",
  "guide.faq.early-exit.a":
    "Да — через вторичный рынок, если он включён для этого релиза. Нужен покупатель и достаточная ликвидность: цена и срок продажи зависят от спроса, гарантии быстрого выхода нет.",

  "guide.faq.aggressive-deal.q": "Как понять, что условия сделки слишком агрессивные?",
  "guide.faq.aggressive-deal.a":
    "Обратите внимание, если доходность заметно выше медианы каталога, история выплат короткая или нестабильная, ликвидность низкая, а комиссии не прозрачны.",

  "guide.faq.newbie-checklist.q": "На что смотреть новичку в первую очередь?",
  "guide.faq.newbie-checklist.a":
    "История выплат, доля держателей units, условия сделки, прогресс раунда и активность вторичного рынка по этому релизу.",

  "guide.faq.why-liquidity.q": "Почему ликвидность важна?",
  "guide.faq.why-liquidity.a":
    "Ликвидность показывает, насколько легко продать units: сколько активных лотов на вторичном рынке, как быстро находится покупатель и какой разброс между заявками. Чем ниже ликвидность — тем сложнее и дольше выход.",

  "guide.faq.what-is-accrued.q": "Что означает «начислено»?",
  "guide.faq.what-is-accrued.a":
    "Сумма рассчитана за отчётный период, но ещё не переведена на ваш кошелёк в USDT TRC20.",

  "guide.faq.what-is-released.q": "Что означает «выплачено»?",
  "guide.faq.what-is-released.a":
    "Сумма уже переведена держателям units на кошелёк в USDT TRC20.",

  "guide.faq.where-risks.q": "Где смотреть риски по релизу?",
  "guide.faq.where-risks.a":
    "В карточке и аналитике релиза — условия сделки, история выплат, ликвидность вторичного рынка и раздел «Основные риски» в этом гиде.",
};

const EN: Record<string, string> = {
  "guide.hero.badge": "Guide · Spliton",
  "guide.hero.title": "How to choose a release on Spliton",
  "guide.hero.subtitle":
    "Review the release card, USDT TRC20 payouts, deal terms, secondary market, and risks — before buying units.",
  "guide.hero.cta.catalog": "Open catalog",
  "guide.hero.cta.compare": "Compare releases",

  "guide.nav.aria": "Guide section navigation",
  "guide.nav.title": "What to review",
  "guide.nav.guideTop": "Guide",
  "guide.nav.topics": "Topics",
  "guide.nav.checklist": "Checklist",
  "guide.nav.releaseCard": "Card",
  "guide.nav.factors": "5 factors",
  "guide.nav.deal": "Deal",
  "guide.nav.payouts": "Payouts",
  "guide.nav.risks": "Risks",
  "guide.nav.compare": "Compare",
  "guide.nav.faq": "FAQ",
  "guide.nav.cta": "Next",

  "guide.topics.title": "Choose a section",
  "guide.exchange.readMore": "Learn more",

  "guide.topic.checklist.title": "Pre-entry checklist",
  "guide.topic.checklist.desc":
    "Quick check: yield, payout history, holder share, deal terms, secondary market, and transparency.",
  "guide.topic.releaseCard.title": "How to read a release card",
  "guide.topic.releaseCard.desc": "Which fields to check in the catalog before buying units.",
  "guide.topic.factors.title": "Five selection factors",
  "guide.topic.factors.desc": "Yield, deal terms, payout history, demand, and liquidity in one frame.",
  "guide.topic.deal.title": "Deal structure",
  "guide.topic.deal.desc": "How release revenue is split between unit holders, artist, and platform.",
  "guide.topic.payouts.title": "Payouts & history",
  "guide.topic.payouts.desc": "How to read accruals, payouts, and period regularity.",
  "guide.topic.risks.title": "Risks",
  "guide.topic.risks.desc": "Volatility, liquidity, and the absence of guaranteed returns.",

  "guide.checklist.title": "5 steps before buying units",
  "guide.checklist.subtitle": "A short checklist — about 2 minutes.",
  "guide.checklist.step.1": "Check yield and payout history.",
  "guide.checklist.step.2": "Review holder share and platform fees.",
  "guide.checklist.step.3": "Assess round fill and secondary market activity.",
  "guide.checklist.step.4": "Compare with 1–2 other releases.",
  "guide.checklist.step.5": "Consider risks: returns and liquidity are not guaranteed.",
  "guide.checklist.videoNote":
    "Video guide coming soon. Use the checklist and sections below — they cover the main selection steps.",

  "guide.releaseCard.title": "How to read a release card",
  "guide.releaseCard.subtitle":
    "Walk through the key fields on an example — this is how cards look in the catalog.",
  "guide.releaseCard.cta": "Open catalog",
  "guide.releaseCard.demo.title": "Midnight Code",
  "guide.releaseCard.demo.artist": "Vera Kline",
  "guide.releaseCard.demo.genre": "POP",
  "guide.releaseCard.demo.stripLabel": "UNT raise",
  "guide.releaseCard.demo.stripHint": "65%",
  "guide.releaseCard.demo.yield": "10.1%",
  "guide.releaseCard.demo.collected": "143,000 / 220,000",
  "guide.releaseCard.demo.unitPrice": "22.00",
  "guide.releaseCard.demo.liquidity": "High",
  "guide.releaseCard.step.status.title": "Round status",
  "guide.releaseCard.step.status.body":
    "Shows the release stage: units are being raised or payouts are running. If the round is nearly full, primary entry may be harder.",
  "guide.releaseCard.step.yield.title": "Yield",
  "guide.releaseCard.step.yield.body":
    "An indicative yield, not a guarantee. Compare with payout history in release analytics to see how it performs in practice.",
  "guide.releaseCard.step.progress.title": "Raise progress",
  "guide.releaseCard.step.progress.body":
    "How much USDT is raised and how full the round is. High progress often signals strong demand for units.",
  "guide.releaseCard.step.price.title": "Price per 1 unit",
  "guide.releaseCard.step.price.body":
    "Cost of one share in USDT. Multiply by the units you need and compare with secondary market prices.",
  "guide.releaseCard.step.liquidity.title": "Liquidity",
  "guide.releaseCard.step.liquidity.body":
    "How easy it is to sell units later. Low liquidity means a longer wait for a buyer if you exit early.",

  "guide.factors.title": "Five factors when choosing a release",
  "guide.factors.subtitle": "One frame for any catalog release — from yield to liquidity.",
  "guide.factors.purposeHint": "Five questions to ask any release before buying units.",
  "guide.factors.label.essence": "Summary",
  "guide.factors.label.watch": "What to check",
  "guide.factors.label.why": "Why it matters",

  "guide.factors.yield.title": "Yield",
  "guide.factors.yield.essence": "Expected return percentage for the release.",
  "guide.factors.yield.watch": "Expected yield, 30/90-day trend, payout history.",
  "guide.factors.yield.why": "A high rate without stable history can be riskier than a moderate one.",

  "guide.factors.deal.title": "Deal terms",
  "guide.factors.deal.essence": "How revenue is split between unit holders, artist, and platform.",
  "guide.factors.deal.watch": "Holder share, platform fee, distribution rules.",
  "guide.factors.deal.why": "This directly affects your final USDT payout.",

  "guide.factors.history.title": "Payout history",
  "guide.factors.history.essence": "Whether real payouts happened and how stable they are.",
  "guide.factors.history.watch": "Frequency, amounts, accrued vs paid.",
  "guide.factors.history.why": "Regular payouts often matter more than one high period.",

  "guide.factors.demand.title": "Unit demand",
  "guide.factors.demand.essence": "How actively users enter the release.",
  "guide.factors.demand.watch": "Round progress, catalog activity, repeat interest.",
  "guide.factors.demand.why": "Demand reflects market interest in the release.",

  "guide.factors.secondary.title": "Secondary market",
  "guide.factors.secondary.essence": "Whether you can sell units to other users before the payout cycle ends.",
  "guide.factors.secondary.watch": "Active orders, 7/30-day trades, spread.",
  "guide.factors.secondary.why": "Low liquidity can mean a longer exit.",

  "guide.deal.title": "How a deal works",
  "guide.deal.subtitle": "Left — deal stages; right — what they mean for evaluation.",
  "guide.deal.purposeHint": "Understand how release revenue becomes a payout to your wallet.",
  "guide.deal.stepsLabel": "Stages",
  "guide.deal.contextLabel": "Context",
  "guide.deal.step.raiseTarget": "Raise target",
  "guide.deal.step.untDistribution": "Unit distribution",
  "guide.deal.step.investorShare": "Holder share",
  "guide.deal.step.platformFee": "Platform fee",
  "guide.deal.step.netPayout": "Final USDT payout",
  "guide.deal.context.split.title": "Distribution transparency",
  "guide.deal.context.split.body":
    "The clearer the split between unit holders, artist, and platform, the easier it is to estimate your payout.",
  "guide.deal.context.fees.title": "Fees and deductions",
  "guide.deal.context.fees.body":
    "Platform fee and other deductions reduce what holders receive — account for them before buying.",
  "guide.deal.context.performance.title": "Actual performance",
  "guide.deal.context.performance.body":
    "Terms set the frame, but final payout depends on the release's real results.",

  "guide.payouts.title": "How to evaluate payouts",
  "guide.payouts.subtitle":
    "Watch payout rhythm, period dips, and the gap between accrual and wallet transfer.",
  "guide.payouts.purposeHint": "One attractive rate is not stability — look at period history.",
  "guide.payouts.chartHeader": "Payout trend · example",
  "guide.payouts.exampleLabel": "Example · not a real release",
  "guide.payouts.chartAria": "Sample monthly USDT payout chart with a February dip",
  "guide.payouts.chartTitle": "Monthly payout trend (example)",
  "guide.payouts.status.released": "paid",
  "guide.payouts.status.accrued": "accrued",
  "guide.payouts.month.jan": "Jan",
  "guide.payouts.month.feb": "Feb",
  "guide.payouts.month.mar": "Mar",
  "guide.payouts.month.apr": "Apr",
  "guide.payouts.amount.jan": "84.2 USDT",
  "guide.payouts.amount.feb": "79.4 USDT",
  "guide.payouts.amount.mar": "92.1 USDT",
  "guide.payouts.amount.apr": "88.3 USDT",
  "guide.payouts.table.period": "Period",
  "guide.payouts.table.amount": "Amount",
  "guide.payouts.table.status": "Status",
  "guide.payouts.table.unit": "USDT TRC20 · example",
  "guide.payouts.quest.title": "Example walkthrough",
  "guide.payouts.quest.step.regularity.title": "Regularity",
  "guide.payouts.quest.step.regularity.body":
    "Look for a predictable accrual rhythm and a narrow range between periods.",
  "guide.payouts.quest.step.regularity.pointer": "Look left: trend line",
  "guide.payouts.quest.step.accrued.title": "Accrued and paid",
  "guide.payouts.quest.step.accrued.body":
    "Accrued — calculated for the period, not yet on your wallet. Paid — already in USDT TRC20.",
  "guide.payouts.quest.step.accrued.pointer": "Look left: status in table",
  "guide.payouts.quest.step.yield.title": "Moderate yield",
  "guide.payouts.quest.step.yield.body":
    "A stable moderate rate is often better than sharp spikes and dips.",
  "guide.payouts.quest.step.yield.pointer": "Look left: range across periods",

  "guide.risks.title": "Key risks",
  "guide.risks.subtitle":
    "Before buying units, note that income, payout timing, and exit may not match your expectations.",
  "guide.risks.purposeHint": "Review this list before you buy — it helps set realistic expectations.",
  "guide.risks.item.1.title": "Payouts can dip",
  "guide.risks.item.1.body":
    "Monthly amounts are not fixed: one period can be higher, the next lower — that is normal for releases.",
  "guide.risks.item.2.title": "Similar releases behave differently",
  "guide.risks.item.2.body":
    "Even in the same genre, yield and dynamics can vary a lot between releases.",
  "guide.risks.item.3.title": "Payback may take longer",
  "guide.risks.item.3.body":
    "Getting your USDT back can happen sooner or later than projected — it depends on actual release results.",
  "guide.risks.item.4.title": "Exit is not always quick",
  "guide.risks.item.4.body":
    "There may not be a buyer right away on the secondary market. Low liquidity means selling units takes time.",
  "guide.risks.item.5.title": "High yield is not a guarantee",
  "guide.risks.item.5.body":
    "One strong period or a high forecast does not mean stable payouts ahead.",
  "guide.risks.footer":
    "Not investment advice. Final returns depend on release results, deal terms, and liquidity.",

  "guide.comparison.title": "How to compare releases",
  "guide.comparison.subtitle":
    "Pick two releases and walk through the same metrics — that makes comparison fairer.",
  "guide.comparison.purposeHint": "Do not compare by yield alone — look at payouts, share, and liquidity together.",
  "guide.comparison.badge.example": "Example · illustrative data",
  "guide.comparison.metricsTitle": "Metric comparison",
  "guide.comparison.slot.a": "Release A",
  "guide.comparison.slot.b": "Release B",
  "guide.comparison.row.yield": "Expected yield",
  "guide.comparison.row.frequency": "Payout frequency",
  "guide.comparison.row.holderShare": "Holder share",
  "guide.comparison.row.demand": "Demand & activity",
  "guide.comparison.row.liquidity": "Liquidity",
  "guide.comparison.release.a": "Midnight Code",
  "guide.comparison.release.a.artist": "Vera Kline",
  "guide.comparison.release.a.genre": "POP",
  "guide.comparison.release.b": "Glass Echo",
  "guide.comparison.release.b.artist": "North Tide",
  "guide.comparison.release.b.genre": "INDIE",
  "guide.comparison.val.yield.a": "10.1%",
  "guide.comparison.val.yield.b": "8.7%",
  "guide.comparison.val.frequency.a": "monthly",
  "guide.comparison.val.frequency.b": "monthly",
  "guide.comparison.val.holderShare.a": "62%",
  "guide.comparison.val.holderShare.b": "58%",
  "guide.comparison.val.demand.a": "medium+",
  "guide.comparison.val.demand.b": "stable",
  "guide.comparison.val.liquidity.a": "high",
  "guide.comparison.val.liquidity.b": "low",
  "guide.comparison.footer":
    "Educational example — not a recommendation. Compare live data in the catalog and analytics.",

  "guide.cta.title": "Ready to choose a release?",
  "guide.cta.subtitle":
    "Open the catalog, compare releases on the same metrics, and buy only after checking terms and risks.",
  "guide.cta.catalog": "Open catalog",
  "guide.cta.compare": "Compare releases",

  "guide.reveal.purposeLabel": "Why this block",

  "guide.faq.title": "FAQ",
  "guide.faq.subtitle": "Answers on choosing a release — grouped by topic.",
  "guide.faq.filter.all": "All topics",
  "guide.faq.empty": "No questions in this topic yet.",
  "guide.faq.category.general": "General",
  "guide.faq.category.yield": "Yield & payouts",
  "guide.faq.category.deal": "Deal terms",
  "guide.faq.category.liquidity": "Liquidity & secondary market",

  "guide.faq.what-is-unit.q": "What are units?",
  "guide.faq.what-is-unit.a":
    "A unit is a share in the release revenue pool. More units means a larger share of USDT payouts per period.",

  "guide.faq.where-payout-history.q": "Where do I see payout history?",
  "guide.faq.where-payout-history.a":
    "In release analytics: open the release in the catalog → Analytics. There you'll find the period chart, accruals, and USDT TRC20 wallet transfers.",

  "guide.faq.holder-share.q": "What is holder share?",
  "guide.faq.holder-share.a":
    "The portion of release revenue allocated to unit holders. Inside the pool, payout is proportional to your unit count.",

  "guide.faq.what-is-secondary.q": "What is the secondary market?",
  "guide.faq.what-is-secondary.a":
    "A platform section where you can buy or sell units with other users before the release payout cycle completes.",

  "guide.faq.why-payouts-vary.q": "Why do payouts differ by period?",
  "guide.faq.why-payouts-vary.a":
    "Release income depends on streams and reporting periods — amounts are not fixed and change month to month.",

  "guide.faq.yield-vs-stability.q": "What matters more: high yield or stable payouts?",
  "guide.faq.yield-vs-stability.a":
    "Over a longer horizon, stable payout history often matters more. High yield without history warrants checking risk and liquidity.",

  "guide.faq.early-exit.q": "Can I exit a release early?",
  "guide.faq.early-exit.a":
    "Yes — via the secondary market, if enabled for that release. You need a buyer and enough liquidity: price and timing depend on demand; a quick exit is not guaranteed.",

  "guide.faq.aggressive-deal.q": "How do I spot overly aggressive deal terms?",
  "guide.faq.aggressive-deal.a":
    "Watch for yield well above the catalog median, short or unstable payout history, low liquidity, and opaque fees.",

  "guide.faq.newbie-checklist.q": "What should a beginner check first?",
  "guide.faq.newbie-checklist.a":
    "Payout history, holder share, deal terms, round progress, and secondary market activity for that release.",

  "guide.faq.why-liquidity.q": "Why does liquidity matter?",
  "guide.faq.why-liquidity.a":
    "Liquidity shows how easy it is to sell units: active listings on the secondary market, time to find a buyer, and bid-ask spread. Lower liquidity means a harder, slower exit.",

  "guide.faq.what-is-accrued.q": "What does accrued mean?",
  "guide.faq.what-is-accrued.a":
    "Calculated for the reporting period but not yet sent to your USDT TRC20 wallet.",

  "guide.faq.what-is-released.q": "What does paid mean?",
  "guide.faq.what-is-released.a":
    "Already transferred to unit holders in USDT TRC20.",

  "guide.faq.where-risks.q": "Where do I see release risks?",
  "guide.faq.where-risks.a":
    "In the release card and analytics — deal terms, payout history, secondary liquidity, and the Key risks section in this guide.",
};

const ES: Record<string, string> = {
  ...EN,
  "guide.hero.badge": "Guía · Spliton",
  "guide.hero.title": "Cómo elegir un lanzamiento en Spliton",
  "guide.hero.subtitle":
    "Revise la ficha, pagos en USDT TRC20, condiciones, mercado secundario y riesgos — antes de comprar units.",
  "guide.hero.cta.catalog": "Abrir catálogo",
  "guide.hero.cta.compare": "Comparar lanzamientos",
  "guide.topics.title": "Elija una sección",
  "guide.exchange.readMore": "Más información",
  "guide.checklist.title": "5 pasos antes de comprar units",
  "guide.releaseCard.cta": "Abrir catálogo",
  "guide.cta.catalog": "Abrir catálogo",
  "guide.cta.compare": "Comparar lanzamientos",
  "guide.cta.title": "¿Listo para elegir un lanzamiento?",
};

const PT: Record<string, string> = {
  ...EN,
  "guide.hero.badge": "Guia · Spliton",
  "guide.hero.title": "Como escolher um lançamento no Spliton",
  "guide.hero.subtitle":
    "Revise a ficha, pagamentos em USDT TRC20, condições, mercado secundário e riscos — antes de comprar units.",
  "guide.hero.cta.catalog": "Abrir catálogo",
  "guide.hero.cta.compare": "Comparar lançamentos",
  "guide.topics.title": "Escolha uma secção",
  "guide.exchange.readMore": "Saber mais",
  "guide.checklist.title": "5 passos antes de comprar units",
  "guide.releaseCard.cta": "Abrir catálogo",
  "guide.cta.catalog": "Abrir catálogo",
  "guide.cta.compare": "Comparar lançamentos",
  "guide.cta.title": "Pronto para escolher um lançamento?",
};

export const GUIDE_MESSAGES: Record<AppLocale, Record<string, string>> = {
  ru: RU,
  en: EN,
  es: ES,
  pt: PT,
};

export function guideText(locale: AppLocale, key: string): string {
  return GUIDE_MESSAGES[locale]?.[key] ?? GUIDE_MESSAGES.en[key] ?? key;
}
