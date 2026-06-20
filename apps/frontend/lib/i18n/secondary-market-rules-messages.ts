import type { AppLocale } from "./types";

const RU: Record<string, string> = {
  "secondaryMarket.rules.onThisPage": "На этой странице",
  "secondaryMarket.rules.intro":
    "Внутренняя площадка заявок на передачу units и связанных rights по релизам. Расчёты в USDT (TRC20); матчинг проходит внутри Spliton.",
  "secondaryMarket.rules.summarySubtitle":
    "Ключевые числа и рамка расчётов — для быстрого сканирования перед размещением заявки.",
  "secondaryMarket.rules.takerLabel": "Комиссия taker",
  "secondaryMarket.rules.takerHint": "От номинала сделки при заборе ликвидности.",
  "secondaryMarket.rules.makerLabel": "Комиссия maker",
  "secondaryMarket.rules.makerHint": "При добавлении ликвидности в стакан.",
  "secondaryMarket.rules.minOrderLabel": "Мин. заявка",
  "secondaryMarket.rules.minOrderHint": "Номинал, демо-порог для макета.",
  "secondaryMarket.rules.riskSubtitle": "Короткая фиксация ограничений — в формате landing risk band.",
  "secondaryMarket.rules.riskR01":
    "Доли дохода треков — не токены и не ценные бумаги. Цены в стакане отражают спрос участников платформы.",
  "secondaryMarket.rules.riskR02":
    "Прошлая активность и выплаты по релизу не гарантируют будущий cashflow — учитывайте это в решениях на вторичном рынке.",
  "secondaryMarket.rules.principlesSubtitle":
    "Как сопоставляются заявки и как фиксируется владение внутри платформы.",
  "secondaryMarket.rules.matchingCardTitle": "Стакан и приоритет",
  "secondaryMarket.rules.matchingCardBody":
    "Заявки сопоставляются по цене и времени; частичное исполнение возможно, если это включено для типа заявки.",
  "secondaryMarket.rules.settlementCardTitle": "Units и rights",
  "secondaryMarket.rules.settlementCardBody":
    "После успешного settlement units и связанные права учитываются на вашем счёте внутри Spliton; внешний transfer токенов не выполняется.",
  "secondaryMarket.rules.detailsIntro":
    "Раскрывайте блоки ниже — формат как в FAQ гида, на полупрозрачном фоне для читаемости.",
  "secondaryMarket.rules.section.fees.title": "Комиссии и удержания",
  "secondaryMarket.rules.section.fees.b1":
    "Сбор удерживается в USDT при исполнении; отображается в истории сделок и влияет на итоговую сумму к зачислению или списанию.",
  "secondaryMarket.rules.section.fees.b2":
    "Ставки maker/taker и скидки по объёму могут обновляться политикой рынка с уведомлением в продукте.",
  "secondaryMarket.rules.section.fees.b3":
    "Отдельные операции (например, вывод на TRC20) могут иметь сетевую комиссию блокчейна вне стакана.",
  "secondaryMarket.rules.section.listing.title": "Листинги и объём",
  "secondaryMarket.rules.section.listing.b1":
    "Листинг привязан к релизу и доступному объёму units, выставленному на вторичный рынок.",
  "secondaryMarket.rules.section.listing.b2":
    "Несколько уровней цены в стакане могут относиться к одному релизу; глубина зависит от активности участников.",
  "secondaryMarket.rules.section.listing.b3":
    "Индикаторы ликвидности и «в стакане» units носят информационный характер и обновляются с задержкой.",
  "secondaryMarket.rules.section.listing.b4":
    "Автоистечение лота (EXPIRED): backend-job есть, но по умолчанию выключен (LISTING_EXPIRY_JOB_ENABLED). Срабатывает только для лотов с заполненным expiresAt; при создании листинга expiresAt пока не выставляется.",
  "secondaryMarket.rules.section.orders.title": "Заявки: лимит и рынок",
  "secondaryMarket.rules.section.orders.b1":
    "Лимит — цена и объём задаются вами; заявка стоит в стакане до исполнения, отмены или истечения срока.",
  "secondaryMarket.rules.section.orders.b2":
    "Рынок — исполнение по лучшим доступным уровням; итоговая средняя цена определяется фактическим матчингом.",
  "secondaryMarket.rules.section.orders.b3":
    "Доступный баланс USDT и доступные к продаже units проверяются при размещении заявки.",
  "secondaryMarket.rules.section.execution.title": "Матчинг и приоритет",
  "secondaryMarket.rules.section.execution.b1":
    "Цена-время: при равной цене раньше размещённая заявка исполняется первой.",
  "secondaryMarket.rules.section.execution.b2":
    "Частичное исполнение уменьшает остаток заявки; остаток остаётся активным с прежним сроком, если он задан.",
  "secondaryMarket.rules.section.execution.b3":
    "Рыночные заявки не гарантируют объём при низкой ликвидности — возможен отказ или исполнение меньшего объёма по политике.",
  "secondaryMarket.rules.section.settlement.title": "Расчёты и перенос units / rights",
  "secondaryMarket.rules.section.settlement.b1":
    "Резервирование средств или units происходит на этапе принятия заявки в обработку; окончательное списание — после подтверждения сделки.",
  "secondaryMarket.rules.section.settlement.b2":
    "Settlement фиксирует смену владельца units и учёт rights в соответствии с карточкой релиза и внутренними правилами Spliton.",
  "secondaryMarket.rules.section.settlement.b3":
    "Статус «В обработке» в истории означает, что клиринг ещё не завершён; не проводите повторную сделку с тем же объёмом до завершения.",
  "secondaryMarket.rules.section.cancel.title": "Отмена и срок действия",
  "secondaryMarket.rules.section.cancel.b1":
    "Активные и частично исполненные лимитные заявки можно отменить, пока они не полностью исполнены и не истекли.",
  "secondaryMarket.rules.section.cancel.b2":
    "По истечении TTL заявка снимается со стакана; неисполненный остаток освобождает зарезервированные средства или units.",
  "secondaryMarket.rules.section.cancel.b3":
    "Рыночная заявка после отправки обычно не отменяется — только до момента принятия системой (короткое окно).",
  "secondaryMarket.rules.section.limits.title": "Лимиты и ограничения",
  "secondaryMarket.rules.section.limits.b1":
    "Минимальный и максимальный размер заявки, дневной объём и количество открытых ордеров задаются политикой рынка и могут различаться по релизам.",
  "secondaryMarket.rules.section.limits.b2":
    "При аномальной волатильности или технических работах площадка может временно ограничить новые заявки или только рыночные типы.",
  "secondaryMarket.rules.section.limits.b3":
    "KYC / лимиты по уровню аккаунта применяются ко всем операциям с USDT на платформе.",
  "secondaryMarket.rules.section.prohibited.title": "Недопустимое поведение",
  "secondaryMarket.rules.section.prohibited.b1":
    "Манипуляции стаканом, согласованные сделки для искусственного объёма, эксплуатация ошибок ценообразования.",
  "secondaryMarket.rules.section.prohibited.b2":
    "Использование нескольких аккаунтов для обхода лимитов или комиссий.",
  "secondaryMarket.rules.section.prohibited.b3":
    "Spliton может приостановить торги, отменить подозрительные заявки и ограничить доступ после рассмотрения.",
  "secondaryMarket.rules.section.support.title": "Споры и поддержка",
  "secondaryMarket.rules.section.support.b1":
    "Спорные ситуации по исполнению, задержкам settlement или расхождениям баланса рассматриваются через службу поддержки в рамках правил платформы.",
  "secondaryMarket.rules.section.support.b2":
    "Не является арбитражом по ценным бумагам и не подменяет договор с правообладателем релиза — полные условия оферты и релиза смотрите в юридических документах.",
  "secondaryMarket.rules.ctaEyebrow": "Справочно",
  "secondaryMarket.rules.ctaTitle": "Итоговые комиссии и лимиты — в оферте и в интерфейсе заявки",
  "secondaryMarket.rules.linkTerms": "Условия платформы",
  "secondaryMarket.rules.linkFees": "Тарифы и комиссии",
};

const EN: Record<string, string> = {
  "secondaryMarket.rules.onThisPage": "On this page",
  "secondaryMarket.rules.intro":
    "Internal order book for transferring units and related rights on releases. Settlements in USDT (TRC20); matching runs inside Spliton.",
  "secondaryMarket.rules.summarySubtitle":
    "Key figures and calculation frame — for a quick scan before placing an order.",
  "secondaryMarket.rules.takerLabel": "Taker fee",
  "secondaryMarket.rules.takerHint": "On trade notional when taking liquidity.",
  "secondaryMarket.rules.makerLabel": "Maker fee",
  "secondaryMarket.rules.makerHint": "When adding liquidity to the book.",
  "secondaryMarket.rules.minOrderLabel": "Min. order",
  "secondaryMarket.rules.minOrderHint": "Notional demo threshold for the layout.",
  "secondaryMarket.rules.riskSubtitle": "Short risk band — landing-style constraints.",
  "secondaryMarket.rules.riskR01":
    "Track revenue shares are not tokens or securities. Book prices reflect platform participant demand.",
  "secondaryMarket.rules.riskR02":
    "Past activity and release payouts do not guarantee future cashflow — consider this on the secondary market.",
  "secondaryMarket.rules.principlesSubtitle":
    "How orders are matched and ownership is recorded inside the platform.",
  "secondaryMarket.rules.matchingCardTitle": "Book and priority",
  "secondaryMarket.rules.matchingCardBody":
    "Orders match by price and time; partial fills are possible when enabled for the order type.",
  "secondaryMarket.rules.settlementCardTitle": "Units and rights",
  "secondaryMarket.rules.settlementCardBody":
    "After successful settlement, units and related rights are credited to your Spliton account; no external token transfer occurs.",
  "secondaryMarket.rules.detailsIntro":
    "Expand sections below — FAQ-style layout on a semi-transparent background for readability.",
  "secondaryMarket.rules.section.fees.title": "Fees and withholdings",
  "secondaryMarket.rules.section.fees.b1":
    "Fees are withheld in USDT on execution; shown in trade history and affect net credit or debit.",
  "secondaryMarket.rules.section.fees.b2":
    "Maker/taker rates and volume discounts may change per market policy with in-product notice.",
  "secondaryMarket.rules.section.fees.b3":
    "Some operations (e.g. TRC20 withdrawal) may incur on-chain network fees outside the book.",
  "secondaryMarket.rules.section.listing.title": "Listings and volume",
  "secondaryMarket.rules.section.listing.b1":
    "A listing is tied to a release and available units offered on the secondary market.",
  "secondaryMarket.rules.section.listing.b2":
    "Multiple price levels may refer to one release; depth depends on participant activity.",
  "secondaryMarket.rules.section.listing.b3":
    "Liquidity indicators and units in book are informational and may update with delay.",
  "secondaryMarket.rules.section.listing.b4":
    "Automatic listing expiry (EXPIRED): backend job exists but is off by default (LISTING_EXPIRY_JOB_ENABLED). Only listings with expiresAt set are processed; create-listing does not set expiresAt yet.",
  "secondaryMarket.rules.section.orders.title": "Orders: limit and market",
  "secondaryMarket.rules.section.orders.b1":
    "Limit — you set price and size; the order stays in the book until fill, cancel, or expiry.",
  "secondaryMarket.rules.section.orders.b2":
    "Market — execution at best available levels; average price is determined by actual matching.",
  "secondaryMarket.rules.section.orders.b3":
    "Available USDT balance and sellable units are checked when placing an order.",
  "secondaryMarket.rules.section.execution.title": "Matching and priority",
  "secondaryMarket.rules.section.execution.b1":
    "Price-time: at the same price, the earlier order executes first.",
  "secondaryMarket.rules.section.execution.b2":
    "Partial fill reduces remaining size; remainder stays active with the same TTL if set.",
  "secondaryMarket.rules.section.execution.b3":
    "Market orders do not guarantee size in low liquidity — rejection or partial fill per policy is possible.",
  "secondaryMarket.rules.section.settlement.title": "Settlement and units / rights transfer",
  "secondaryMarket.rules.section.settlement.b1":
    "Funds or units are reserved when the order is accepted; final debit occurs after trade confirmation.",
  "secondaryMarket.rules.section.settlement.b2":
    "Settlement records unit ownership and rights per release card and Spliton internal rules.",
  "secondaryMarket.rules.section.settlement.b3":
    "Processing status in history means clearing is not complete; do not repeat the same size until done.",
  "secondaryMarket.rules.section.cancel.title": "Cancel and validity",
  "secondaryMarket.rules.section.cancel.b1":
    "Active and partially filled limit orders can be cancelled until fully filled or expired.",
  "secondaryMarket.rules.section.cancel.b2":
    "After TTL expiry the order leaves the book; unfilled remainder releases reserved funds or units.",
  "secondaryMarket.rules.section.cancel.b3":
    "Market orders after submit usually cannot be cancelled — only before system acceptance (short window).",
  "secondaryMarket.rules.section.limits.title": "Limits and restrictions",
  "secondaryMarket.rules.section.limits.b1":
    "Min/max order size, daily volume and open order count are set by market policy and may vary by release.",
  "secondaryMarket.rules.section.limits.b2":
    "During abnormal volatility or maintenance the venue may restrict new orders or market types only.",
  "secondaryMarket.rules.section.limits.b3":
    "KYC / account tier limits apply to all USDT operations on the platform.",
  "secondaryMarket.rules.section.prohibited.title": "Prohibited behavior",
  "secondaryMarket.rules.section.prohibited.b1":
    "Book manipulation, coordinated trades for artificial volume, exploiting pricing errors.",
  "secondaryMarket.rules.section.prohibited.b2":
    "Using multiple accounts to bypass limits or fees.",
  "secondaryMarket.rules.section.prohibited.b3":
    "Spliton may suspend trading, cancel suspicious orders and restrict access after review.",
  "secondaryMarket.rules.section.support.title": "Disputes and support",
  "secondaryMarket.rules.section.support.b1":
    "Disputes on execution, settlement delays or balance discrepancies are handled via support under platform rules.",
  "secondaryMarket.rules.section.support.b2":
    "Not securities arbitration and does not replace the release rights holder agreement — see legal documents for full terms.",
  "secondaryMarket.rules.ctaEyebrow": "Reference",
  "secondaryMarket.rules.ctaTitle": "Final fees and limits — in the offer and order UI",
  "secondaryMarket.rules.linkTerms": "Platform terms",
  "secondaryMarket.rules.linkFees": "Fees and tariffs",
};

const ES: Record<string, string> = {
  ...EN,
  "secondaryMarket.rules.onThisPage": "En esta página",
  "secondaryMarket.rules.intro":
    "Plataforma interna de órdenes para transferir units y rights relacionados en lanzamientos. Liquidación en USDT (TRC20); matching dentro de Spliton.",
  "secondaryMarket.rules.summarySubtitle":
    "Cifras clave y marco de cálculo — para revisar antes de colocar una orden.",
  "secondaryMarket.rules.takerLabel": "Comisión taker",
  "secondaryMarket.rules.takerHint": "Sobre el nominal al tomar liquidez.",
  "secondaryMarket.rules.makerLabel": "Comisión maker",
  "secondaryMarket.rules.makerHint": "Al añadir liquidez al libro.",
  "secondaryMarket.rules.minOrderLabel": "Orden mín.",
  "secondaryMarket.rules.minOrderHint": "Umbral demo de nominal para el diseño.",
  "secondaryMarket.rules.riskSubtitle": "Banda de riesgo breve — restricciones estilo landing.",
  "secondaryMarket.rules.riskR01":
    "Las participaciones en ingresos de pistas no son tokens ni valores. Los precios del libro reflejan la demanda de participantes.",
  "secondaryMarket.rules.riskR02":
    "La actividad pasada y los pagos del lanzamiento no garantizan cashflow futuro — considérelo en el mercado secundario.",
  "secondaryMarket.rules.principlesSubtitle":
    "Cómo se emparejan las órdenes y se registra la propiedad en la plataforma.",
  "secondaryMarket.rules.matchingCardTitle": "Libro y prioridad",
  "secondaryMarket.rules.matchingCardBody":
    "Las órdenes se emparejan por precio y tiempo; ejecución parcial posible si está habilitada.",
  "secondaryMarket.rules.settlementCardTitle": "Units y rights",
  "secondaryMarket.rules.settlementCardBody":
    "Tras settlement exitoso, units y derechos se acreditan en su cuenta Spliton; no hay transferencia externa de tokens.",
  "secondaryMarket.rules.detailsIntro":
    "Despliegue las secciones — formato FAQ sobre fondo semitransparente.",
  "secondaryMarket.rules.section.fees.title": "Comisiones y retenciones",
  "secondaryMarket.rules.section.listing.title": "Listados y volumen",
  "secondaryMarket.rules.section.orders.title": "Órdenes: límite y mercado",
  "secondaryMarket.rules.section.execution.title": "Matching y prioridad",
  "secondaryMarket.rules.section.settlement.title": "Liquidación y transferencia units / rights",
  "secondaryMarket.rules.section.cancel.title": "Cancelación y validez",
  "secondaryMarket.rules.section.limits.title": "Límites y restricciones",
  "secondaryMarket.rules.section.prohibited.title": "Comportamiento prohibido",
  "secondaryMarket.rules.section.support.title": "Disputas y soporte",
  "secondaryMarket.rules.ctaEyebrow": "Referencia",
  "secondaryMarket.rules.ctaTitle": "Comisiones y límites finales — en la oferta y la UI de la orden",
  "secondaryMarket.rules.linkTerms": "Condiciones de la plataforma",
  "secondaryMarket.rules.linkFees": "Tarifas y comisiones",
};

const PT: Record<string, string> = {
  ...EN,
  "secondaryMarket.rules.onThisPage": "Nesta página",
  "secondaryMarket.rules.intro":
    "Plataforma interna de ordens para transferir units e rights relacionados em lançamentos. Liquidação em USDT (TRC20); matching dentro da Spliton.",
  "secondaryMarket.rules.summarySubtitle":
    "Números-chave e enquadramento — para rever antes de colocar uma ordem.",
  "secondaryMarket.rules.takerLabel": "Comissão taker",
  "secondaryMarket.rules.takerHint": "Sobre o nominal ao retirar liquidez.",
  "secondaryMarket.rules.makerLabel": "Comissão maker",
  "secondaryMarket.rules.makerHint": "Ao adicionar liquidez ao livro.",
  "secondaryMarket.rules.minOrderLabel": "Ordem mín.",
  "secondaryMarket.rules.minOrderHint": "Limiar demo de nominal para o layout.",
  "secondaryMarket.rules.riskSubtitle": "Faixa de risco breve — restrições estilo landing.",
  "secondaryMarket.rules.riskR01":
    "Participações na receita de faixas não são tokens nem valores mobiliários. Preços no livro refletem procura dos participantes.",
  "secondaryMarket.rules.riskR02":
    "Atividade passada e pagamentos do lançamento não garantem cashflow futuro — considere no mercado secundário.",
  "secondaryMarket.rules.principlesSubtitle":
    "Como as ordens são emparelhadas e a propriedade é registada na plataforma.",
  "secondaryMarket.rules.matchingCardTitle": "Livro e prioridade",
  "secondaryMarket.rules.matchingCardBody":
    "Ordens emparelhadas por preço e tempo; execução parcial possível se ativada.",
  "secondaryMarket.rules.settlementCardTitle": "Units e rights",
  "secondaryMarket.rules.settlementCardBody":
    "Após settlement, units e direitos são creditados na sua conta Spliton; sem transferência externa de tokens.",
  "secondaryMarket.rules.detailsIntro":
    "Expanda as secções — formato FAQ sobre fundo semitransparente.",
  "secondaryMarket.rules.section.fees.title": "Comissões e retenções",
  "secondaryMarket.rules.section.listing.title": "Listagens e volume",
  "secondaryMarket.rules.section.orders.title": "Ordens: limite e mercado",
  "secondaryMarket.rules.section.execution.title": "Matching e prioridade",
  "secondaryMarket.rules.section.settlement.title": "Liquidação e transferência units / rights",
  "secondaryMarket.rules.section.cancel.title": "Cancelamento e validade",
  "secondaryMarket.rules.section.limits.title": "Limites e restrições",
  "secondaryMarket.rules.section.prohibited.title": "Comportamento proibido",
  "secondaryMarket.rules.section.support.title": "Disputas e suporte",
  "secondaryMarket.rules.ctaEyebrow": "Referência",
  "secondaryMarket.rules.ctaTitle": "Comissões e limites finais — na oferta e na UI da ordem",
  "secondaryMarket.rules.linkTerms": "Condições da plataforma",
  "secondaryMarket.rules.linkFees": "Tarifas e comissões",
};

export const SECONDARY_MARKET_RULES_MESSAGES: Record<AppLocale, Record<string, string>> = {
  ru: RU,
  en: EN,
  es: ES,
  pt: PT,
};
