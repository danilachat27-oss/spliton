import type { AppLocale } from "./types";

const RU: Record<string, string> = {
  "meta.fees.title": "Комиссии",
  "meta.fees.description":
    "Platform fee, secondary fee, вывод USDT (TRC20): таблица тарифов, примеры расчёта и ответы на частые вопросы Spliton.",

  "fees.breadcrumb.learnMore": "Узнать больше",
  "fees.breadcrumb.current": "Комиссии",
  "fees.hero.title": "Комиссии и удержания",
  "fees.hero.subtitle": "Торговые ставки, программы и вывод USDT (TRC20) — в одном справочнике.",

  "fees.section.trading": "Торговые комиссии",
  "fees.tabs.navAria": "Разделы комиссий",
  "fees.section.depositWithdrawal": "Комиссии за ввод/вывод",
  "fees.section.other": "Другие комиссии",
  "fees.tab.overview": "Все операции",
  "fees.tab.primary": "Первичный рынок",
  "fees.tab.secondary": "Secondary market",

  "fees.loading": "Загрузка тарифов…",
  "fees.error.title": "Тарифы временно недоступны",
  "fees.retry": "Повторить",

  "fees.trading.title": "Комиссии за торговлю",
  "fees.trading.description":
    "Ставки platform fee и secondary fee применяются к операциям на первичном и вторичном рынке UNT. Фактическая комиссия всегда видна в превью ордера перед подтверждением.",
  "fees.trading.effectiveFrom": "Актуально с {date}",
  "fees.trading.primaryHint": "Покупка rights / UNT на первичном рынке",
  "fees.trading.secondaryHint": "Исполнение сделок на внутреннем secondary market",
  "fees.trading.updateHistory": "История обновлений",

  "fees.table.col.tier": "Уровень",
  "fees.table.col.balanceUsdt": "Активы на балансе (USDT)",
  "fees.table.col.volume30d": "Объём торгов 30 дн. (USDT)",
  "fees.table.col.or": "или",
  "fees.table.col.operation": "Операция",
  "fees.table.col.feeType": "Тип комиссии",
  "fees.table.col.rate": "Ставка",
  "fees.table.col.calculation": "Расчёт",
  "fees.table.col.platformFee": "Platform fee",
  "fees.table.col.note": "Примечание",
  "fees.table.col.secondaryVolume30d": "Объём secondary 30 дн. (USDT)",
  "fees.table.col.secondaryFee": "Secondary fee",
  "fees.table.col.withdrawLimit24h": "Лимит на снятие 24 ч (USDT)",
  "fees.table.col.withdrawalFee": "Withdrawal fee",
  "fees.table.col.verification": "Верификация",
  "fees.table.col.depositFee": "Deposit fee",
  "fees.table.regularUsers": "Стандартный пользователь",
  "fees.table.allOperations": "Сводная таблица комиссий",
  "fees.table.kycLimits": "Суточные лимиты вывода по уровню верификации",

  "fees.tier.standard": "Стандартный",
  "fees.tier.from0Usdt": "от 0 USDT",
  "fees.tier.primaryNote": "Все верифицированные пользователи; ставка единая для первичного рынка.",
  "fees.tier.secondaryNote": "Удержание при исполнении сделки на secondary; отдельно от platform fee.",
  "fees.tier.withdrawLimitNote": "Лимит справочный; может зависеть от верификации и истории операций.",
  "fees.tier.kyc.unverified": "Без верификации",
  "fees.tier.kyc.basic": "Базовая верификация",
  "fees.tier.kyc.full": "Полная верификация",
  "fees.tier.kyc.unverifiedNote": "Вывод недоступен до прохождения верификации.",
  "fees.tier.kyc.basicNote": "Справочный лимит для базового уровня KYC.",
  "fees.tier.kyc.fullNote": "Справочный лимит для полной верификации; фактический лимит — в форме вывода.",

  "fees.stat.platformFee": "Platform fee",
  "fees.stat.secondaryFee": "Secondary fee",
  "fees.stat.depositFee": "Deposit fee",
  "fees.stat.calculator": "Калькулятор",
  "fees.stat.openCalculator": "Открыть",

  "fees.examples.title": "Примеры расчёта",
  "fees.examples.subtitle": "Сумма, комиссия и итог — как в превью операции в кабинете.",
  "fees.examples.primaryMarket": "Первичный рынок",
  "fees.examples.buyTitle": "Покупка на {amount} USDT",
  "fees.examples.paymentAmount": "Сумма платежа",
  "fees.examples.platformFeeLine": "Platform fee ({rate})",
  "fees.examples.creditedUnt": "К зачёту в UNT (net)",
  "fees.examples.totalFeeHeld": "Итого удержано комиссией",
  "fees.examples.secondaryMarket": "Secondary market",
  "fees.examples.sellTitle": "Продажа {units} UNT × {price} USDT",
  "fees.examples.grossAmount": "Сумма сделки (gross)",
  "fees.examples.secondaryFeeLine": "Secondary fee ({rate})",
  "fees.examples.netReceive": "К получению (net)",
  "fees.examples.withdrawal": "Вывод",
  "fees.examples.withdrawTitle": "Заявка на {amount} USDT",
  "fees.examples.requestedWithdraw": "Запрошено к выводу",
  "fees.examples.withdrawalFee": "Withdrawal fee",
  "fees.examples.netToTrc20": "К получению на адрес TRC20",
  "fees.examples.example": "Пример",

  "fees.sections.title": "По разделам продукта",

  "fees.block.wallet.title": "Wallet & Balance",
  "fees.block.wallet.subtitle": "Пополнение, баланс и зачисления",
  "fees.block.wallet.bullet1": "Пополнение: комиссия платформы 0 % — см. строку «Deposit fee».",
  "fees.block.wallet.bullet2": "Входящие выплаты по rights: зачисление на баланс без отдельной строки «trading fee».",
  "fees.block.wallet.bullet3":
    "Итоговые суммы по депозиту и балансу всегда видны до подтверждения входящего перевода (где применимо).",
  "fees.block.market.title": "Market & Trading",
  "fees.block.market.subtitle": "Первичный и вторичный рынок UNT",
  "fees.block.market.bullet1": "Первичная покупка: platform fee {rate} от платежа.",
  "fees.block.market.bullet2": "Secondary: secondary fee {rate} от суммы сделки при исполнении.",
  "fees.block.market.bullet3": "Категории комиссий разделены: рыночные удержания не смешиваются с комиссией вывода.",
  "fees.block.payouts.title": "Payouts & Withdrawals",
  "fees.block.payouts.subtitle": "Вывод на кошелёк",
  "fees.block.payouts.bullet1": "Вывод: max({min} USDT; {rate}) от заявленной суммы.",
  "fees.block.payouts.bullet2":
    "Перед отправкой заявки показывается итог «к получению на адрес» за вычетом комиссии платформы.",
  "fees.block.payouts.bullet3": "Сетевая комиссия TRC20 не устанавливается Spliton и может меняться в сети.",

  "fees.operation.primaryPurchase": "Покупка rights / UNT (первичный рынок)",
  "fees.operation.secondarySale": "Продажа UNT на secondary market",
  "fees.operation.withdrawal": "Вывод USDT на внешний адрес (TRC20)",
  "fees.operation.deposit": "Пополнение баланса USDT (TRC20)",
  "fees.operation.payoutSettlement": "Зачисление выплат по доле дохода на баланс",
  "fees.feeType.platformFee": "Platform fee",
  "fees.feeType.secondaryMarketFee": "Secondary market fee",
  "fees.feeType.withdrawalFee": "Withdrawal fee",
  "fees.feeType.depositFee": "Deposit fee",
  "fees.feeType.payoutSettlement": "Payout settlement",
  "fees.calculation.primaryPurchase": "Процент от суммы платежа в USDT до подтверждения сделки.",
  "fees.calculation.secondarySale": "Процент от суммы исполненной сделки (gross) в USDT.",
  "fees.calculation.withdrawal":
    "Берётся большая из двух величин: минимум или процент от запрошенной суммы вывода.",
  "fees.calculation.deposit": "Платформа не удерживает комиссию с входящего депозита.",
  "fees.calculation.payoutSettlement": "Начисление на внутренний баланс; иллюстративная строка для прозрачности.",
  "fees.note.primaryPurchase": "Отображается в превью ордера и в итоговой строке перед оплатой.",
  "fees.note.secondarySale": "Удерживается при исполнении; итог «к получению» уже за вычетом комиссии.",
  "fees.note.withdrawal":
    "Комиссия сети TRC20 оплачивается отдельно на стороне кошелька / сети и не входит в таблицу платформы.",
  "fees.note.deposit": "Перевод в блокчейне может иметь стороннюю комиссию сети — зависит от вашего кошелька.",
  "fees.note.payoutSettlement": "Условия конкретного релиза и налоговая отчётность — в карточке сделки и документах.",
  "fees.rateLabel.payoutSettlement": "0 % (удержание платформы в примере)",

  "fees.program.title": "Программные и реферальные комиссии",
  "fees.program.description":
    "Реферальные и партнёрские вознаграждения не входят в торговые тарифы кабинета. Условия программ описаны отдельно и могут отличаться от ставок platform fee / secondary fee.",
  "fees.program.table.program": "Программа",
  "fees.program.table.rewardModel": "Модель вознаграждения",
  "fees.program.table.calculationBase": "База расчёта",
  "fees.program.referralProgram": "Реферальная программа",
  "fees.program.partnerProgram": "Партнёрская программа",
  "fees.program.rules.title": "Как это соотносится с торговыми комиссиями",
  "fees.program.rules.p1":
    "Торговые комиссии (platform fee, secondary fee) удерживаются с операций пользователя в кабинете независимо от участия в реферальной или партнёрской программе.",
  "fees.program.rules.p2":
    "Вознаграждение реферера или партнёра рассчитывается по правилам соответствующей программы и не изменяет публичную таблицу торговых ставок на этой странице.",
  "fees.programRow.referral.program": "Реферальная программа",
  "fees.programRow.referral.rewardModel": "Бонус за действия приглашённого пользователя",
  "fees.programRow.referral.platformShare": "Фиксированные события (регистрация, пополнение, покупка UNT)",
  "fees.programRow.referral.note": "Размер награды зависит от типа события; подробности — в разделе реферальной программы.",
  "fees.programRow.partner.program": "Партнёрская программа",
  "fees.programRow.partner.rewardModel": "Revenue share / affiliate по согласованным условиям",
  "fees.programRow.partner.platformShare": "Индивидуально после рассмотрения заявки",
  "fees.programRow.partner.note":
    "Комиссия платформы с операций рефералов не дублируется в публичной таблице торговых тарифов.",

  "fees.withdrawal.title": "Комиссии за вывод",
  "fees.withdrawal.description":
    "Вывод USDT (TRC20) на внешний адрес: комиссия платформы и справочный суточный лимит. Сетевая комиссия Tron оплачивается отдельно.",
  "fees.depositWithdrawal.title": "Комиссии за ввод и вывод",
  "fees.depositWithdrawal.description":
    "Пополнение баланса USDT (TRC20) и вывод на внешний адрес. Комиссия платформы и лимиты указаны ниже; сетевая комиссия Tron оплачивается отдельно.",
  "fees.deposit.title": "Комиссии за ввод",
  "fees.deposit.description": "Платформа не удерживает комиссию с входящего депозита USDT (TRC20).",

  "fees.rules.definitions.title": "Основные определения",
  "fees.rules.definitions.p1":
    "Platform fee — удержание платформы при покупке rights / UNT на первичном рынке. Считается от суммы платежа в USDT до подтверждения сделки.",
  "fees.rules.definitions.p2":
    "Secondary market fee — удержание при исполнении сделки на внутреннем вторичном рынке. Считается от суммы сделки (gross) в USDT.",
  "fees.rules.definitions.p3":
    "Withdrawal fee — комиссия платформы за вывод USDT на внешний адрес TRC20. Не включает комиссию сети Tron.",
  "fees.rules.primaryCalc.title": "Расчёт platform fee (первичный рынок)",
  "fees.rules.primaryCalc.p1":
    "Комиссия = сумма платежа × ставка platform fee. Итог к зачёту в UNT рассчитывается после удержания.",
  "fees.rules.primaryCalc.p2":
    "Ставка отображается в превью ордера и в итоговой строке перед оплатой. Фактическое значение может отличаться при промо-акциях или индивидуальных условиях релиза.",
  "fees.rules.secondaryCalc.title": "Расчёт secondary fee",
  "fees.rules.secondaryCalc.p1":
    "При исполнении лимитной или рыночной заявки комиссия удерживается из суммы сделки. В истории ордера видны gross, fee и net (к получению).",
  "fees.rules.secondaryCalc.p2":
    "Комиссия не смешивается с platform fee первичного рынка — это отдельная категория удержаний.",
  "fees.rules.withdrawCalc.title": "Расчёт withdrawal fee и лимиты",
  "fees.rules.withdrawCalc.p1":
    "Комиссия вывода = max(минимальная фиксированная сумма USDT; процент от запрошенной суммы). Итог «к получению на адрес» показывается до подтверждения заявки.",
  "fees.rules.withdrawCalc.p2":
    "Суточный лимит вывода в таблице носит справочный характер и может зависеть от уровня верификации, истории операций и настроек безопасности аккаунта.",
  "fees.rules.withdrawCalc.p3": "Комиссия сети TRC20 оплачивается отдельно и не устанавливается Spliton.",
  "fees.rules.updates.title": "Обновление тарифов",
  "fees.rules.updates.p1":
    "Публичные ставки могут обновляться администратором платформы. Дата вступления в силу указывается в блоке «Актуальные тарифы» при подключении live API.",
  "fees.rules.updates.p2":
    "Перед каждой операцией в кабинете показывается превью с итоговой комиссией — ориентируйтесь на него при подтверждении.",
  "fees.rules.volumeCalc.title": "Как считается объём торгов за 30 дней",
  "fees.rules.volumeCalc.p1":
    "В расчёт входят исполненные операции на первичном и вторичном рынке в USDT за скользящие 30 календарных дней. Неисполненные заявки не учитываются.",
  "fees.rules.volumeCalc.p2":
    "На текущем этапе для всех верифицированных пользователей действует единая ставка platform fee и secondary fee независимо от объёма. Таблица уровней подготовлена для прозрачности и будущих программ лояльности.",
  "fees.rules.buyerSeller.title": "Покупатель и продавец на рынке",
  "fees.rules.buyerSeller.p1":
    "На первичном рынке platform fee удерживается с покупателя при оплате ордера. Продавец (эмитент релиза) не платит отдельную торговую комиссию платформе в этой категории.",
  "fees.rules.buyerSeller.p2":
    "На secondary market secondary fee удерживается с продавца при исполнении сделки. Покупатель видит полную сумму сделки; комиссия отражается в деталях ордера продавца.",
  "fees.rules.accounts.title": "Основной и связанные аккаунты",
  "fees.rules.accounts.p1":
    "Объём торгов и лимиты вывода рассчитываются по основному аккаунту пользователя. Операции в кабинете Spliton выполняются под вашей учётной записью после авторизации.",
  "fees.rules.accounts.p2":
    "При изменении уровня верификации или настроек безопасности лимиты вывода могут пересчитываться — актуальное значение показывается в форме вывода перед подтверждением.",

  "fees.faq.title": "Частые вопросы",
  "fees.faq.subtitle": "Типичные ситуации в кабинете.",
  "fees.faq.f1.question": "Есть ли комиссия за пополнение?",
  "fees.faq.f1.answer":
    "В текущей модели UI комиссия платформы на входящий депозит USDT (TRC20) равна 0 %. Отдельно может взиматься сеть при отправке с вашего внешнего кошелька.",
  "fees.faq.f2.question": "Когда удерживается secondary fee?",
  "fees.faq.f2.answer":
    "При исполнении сделки на внутреннем secondary market: комиссия считается от суммы сделки и отражается в деталях ордера до и после исполнения.",
  "fees.faq.f3.question": "Почему сумма к получению меньше суммы сделки?",
  "fees.faq.f3.answer":
    "На secondary отображается gross (полная сумма сделки) и отдельной строкой — комиссия. К получению (net) — это gross минус secondary fee и прочие удержания по конкретному сценарию.",
  "fees.faq.f4.question": "Есть ли комиссия за вывод?",
  "fees.faq.f4.answer":
    "Да: применяется withdrawal fee по правилам max(минимум USDT, процент от суммы). Точное значение показывается в форме вывода перед подтверждением.",
  "fees.faq.f5.question": "Где посмотреть итоговую сумму до подтверждения?",
  "fees.faq.f5.answer":
    "В превью операции: покупка units, продажа на secondary и вывод USDT — перед финальным подтверждением отображаются строки amount, fee и итог (total / net).",

  "fees.disclaimer":
    "Тарифы носят справочный характер. Фактическая комиссия отображается в превью сделки перед подтверждением.",
};

const EN: Record<string, string> = {
  "meta.fees.title": "Fees",
  "meta.fees.description":
    "Platform fee, secondary fee, USDT (TRC20) withdrawal: rate table, calculation examples, and Spliton FAQ.",

  "fees.breadcrumb.learnMore": "Learn more",
  "fees.breadcrumb.current": "Fees",
  "fees.hero.title": "Fees and deductions",
  "fees.hero.subtitle": "Trading rates, programs, and USDT (TRC20) withdrawal — in one reference.",

  "fees.section.trading": "Trading fees",
  "fees.tabs.navAria": "Fee sections",
  "fees.section.depositWithdrawal": "Deposit and withdrawal fees",
  "fees.section.other": "Other fees",
  "fees.tab.overview": "All operations",
  "fees.tab.primary": "Primary market",
  "fees.tab.secondary": "Secondary market",

  "fees.loading": "Loading fee rates…",
  "fees.error.title": "Fee rates temporarily unavailable",
  "fees.retry": "Retry",

  "fees.trading.title": "Trading fees",
  "fees.trading.description":
    "Platform fee and secondary fee rates apply to primary and secondary UNT market operations. The actual fee is always shown in the order preview before confirmation.",
  "fees.trading.effectiveFrom": "Effective from {date}",
  "fees.trading.primaryHint": "Purchase of rights / UNT on the primary market",
  "fees.trading.secondaryHint": "Execution of trades on the internal secondary market",
  "fees.trading.updateHistory": "Update history",

  "fees.table.col.tier": "Tier",
  "fees.table.col.balanceUsdt": "Balance assets (USDT)",
  "fees.table.col.volume30d": "30-day trading volume (USDT)",
  "fees.table.col.or": "or",
  "fees.table.col.operation": "Operation",
  "fees.table.col.feeType": "Fee type",
  "fees.table.col.rate": "Rate",
  "fees.table.col.calculation": "Calculation",
  "fees.table.col.platformFee": "Platform fee",
  "fees.table.col.note": "Note",
  "fees.table.col.secondaryVolume30d": "30-day secondary volume (USDT)",
  "fees.table.col.secondaryFee": "Secondary fee",
  "fees.table.col.withdrawLimit24h": "24h withdrawal limit (USDT)",
  "fees.table.col.withdrawalFee": "Withdrawal fee",
  "fees.table.col.verification": "Verification",
  "fees.table.col.depositFee": "Deposit fee",
  "fees.table.regularUsers": "Standard user",
  "fees.table.allOperations": "Fee summary table",
  "fees.table.kycLimits": "Daily withdrawal limits by verification level",

  "fees.tier.standard": "Standard",
  "fees.tier.from0Usdt": "from 0 USDT",
  "fees.tier.primaryNote": "All verified users; a single rate for the primary market.",
  "fees.tier.secondaryNote": "Deducted on secondary trade execution; separate from platform fee.",
  "fees.tier.withdrawLimitNote": "Reference limit; may depend on verification and transaction history.",
  "fees.tier.kyc.unverified": "Unverified",
  "fees.tier.kyc.basic": "Basic verification",
  "fees.tier.kyc.full": "Full verification",
  "fees.tier.kyc.unverifiedNote": "Withdrawal unavailable until verification is completed.",
  "fees.tier.kyc.basicNote": "Reference limit for basic KYC level.",
  "fees.tier.kyc.fullNote": "Reference limit for full verification; actual limit is shown in the withdrawal form.",

  "fees.stat.platformFee": "Platform fee",
  "fees.stat.secondaryFee": "Secondary fee",
  "fees.stat.depositFee": "Deposit fee",
  "fees.stat.calculator": "Calculator",
  "fees.stat.openCalculator": "Open",

  "fees.examples.title": "Calculation examples",
  "fees.examples.subtitle": "Amount, fee, and total — as in the operation preview in your account.",
  "fees.examples.primaryMarket": "Primary market",
  "fees.examples.buyTitle": "Purchase for {amount} USDT",
  "fees.examples.paymentAmount": "Payment amount",
  "fees.examples.platformFeeLine": "Platform fee ({rate})",
  "fees.examples.creditedUnt": "Credited to UNT (net)",
  "fees.examples.totalFeeHeld": "Total fee deducted",
  "fees.examples.secondaryMarket": "Secondary market",
  "fees.examples.sellTitle": "Sell {units} UNT × {price} USDT",
  "fees.examples.grossAmount": "Trade amount (gross)",
  "fees.examples.secondaryFeeLine": "Secondary fee ({rate})",
  "fees.examples.netReceive": "To receive (net)",
  "fees.examples.withdrawal": "Withdrawal",
  "fees.examples.withdrawTitle": "Withdrawal request for {amount} USDT",
  "fees.examples.requestedWithdraw": "Requested for withdrawal",
  "fees.examples.withdrawalFee": "Withdrawal fee",
  "fees.examples.netToTrc20": "To receive at TRC20 address",
  "fees.examples.example": "Example",

  "fees.sections.title": "By product area",

  "fees.block.wallet.title": "Wallet & Balance",
  "fees.block.wallet.subtitle": "Deposits, balance, and credits",
  "fees.block.wallet.bullet1": "Deposit: platform fee 0% — see the «Deposit fee» row.",
  "fees.block.wallet.bullet2": "Incoming rights payouts: credited to balance without a separate «trading fee» line.",
  "fees.block.wallet.bullet3":
    "Final deposit and balance amounts are always visible before confirming an incoming transfer (where applicable).",
  "fees.block.market.title": "Market & Trading",
  "fees.block.market.subtitle": "Primary and secondary UNT market",
  "fees.block.market.bullet1": "Primary purchase: platform fee {rate} of payment.",
  "fees.block.market.bullet2": "Secondary: secondary fee {rate} of trade amount on execution.",
  "fees.block.market.bullet3": "Fee categories are separate: market deductions are not mixed with withdrawal fees.",
  "fees.block.payouts.title": "Payouts & Withdrawals",
  "fees.block.payouts.subtitle": "Withdrawal to wallet",
  "fees.block.payouts.bullet1": "Withdrawal: max({min} USDT; {rate}) of requested amount.",
  "fees.block.payouts.bullet2":
    "Before submitting a request, the «to receive at address» total is shown net of platform fee.",
  "fees.block.payouts.bullet3": "TRC20 network fee is not set by Spliton and may change on the network.",

  "fees.operation.primaryPurchase": "Purchase of rights / UNT (primary market)",
  "fees.operation.secondarySale": "Sell UNT on secondary market",
  "fees.operation.withdrawal": "Withdraw USDT to external address (TRC20)",
  "fees.operation.deposit": "Top up USDT balance (TRC20)",
  "fees.operation.payoutSettlement": "Credit revenue-share payouts to balance",
  "fees.feeType.platformFee": "Platform fee",
  "fees.feeType.secondaryMarketFee": "Secondary market fee",
  "fees.feeType.withdrawalFee": "Withdrawal fee",
  "fees.feeType.depositFee": "Deposit fee",
  "fees.feeType.payoutSettlement": "Payout settlement",
  "fees.calculation.primaryPurchase": "Percentage of payment amount in USDT before trade confirmation.",
  "fees.calculation.secondarySale": "Percentage of executed trade amount (gross) in USDT.",
  "fees.calculation.withdrawal": "The greater of the minimum or a percentage of the requested withdrawal amount.",
  "fees.calculation.deposit": "The platform does not deduct a fee from incoming deposits.",
  "fees.calculation.payoutSettlement": "Credit to internal balance; illustrative row for transparency.",
  "fees.note.primaryPurchase": "Shown in order preview and in the total line before payment.",
  "fees.note.secondarySale": "Deducted on execution; the «to receive» total is already net of fee.",
  "fees.note.withdrawal":
    "TRC20 network fee is paid separately by your wallet / network and is not included in the platform table.",
  "fees.note.deposit": "On-chain transfers may incur third-party network fees — depends on your wallet.",
  "fees.note.payoutSettlement": "Specific release terms and tax reporting — in the deal card and documents.",
  "fees.rateLabel.payoutSettlement": "0% (platform deduction in example)",

  "fees.program.title": "Program and referral fees",
  "fees.program.description":
    "Referral and partner rewards are not part of account trading rates. Program terms are described separately and may differ from platform fee / secondary fee rates.",
  "fees.program.table.program": "Program",
  "fees.program.table.rewardModel": "Reward model",
  "fees.program.table.calculationBase": "Calculation base",
  "fees.program.referralProgram": "Referral program",
  "fees.program.partnerProgram": "Partner program",
  "fees.program.rules.title": "How this relates to trading fees",
  "fees.program.rules.p1":
    "Trading fees (platform fee, secondary fee) are deducted from user operations in the account regardless of referral or partner program participation.",
  "fees.program.rules.p2":
    "Referrer or partner rewards are calculated under the relevant program rules and do not change the public trading rate table on this page.",
  "fees.programRow.referral.program": "Referral program",
  "fees.programRow.referral.rewardModel": "Bonus for invited user actions",
  "fees.programRow.referral.platformShare": "Fixed events (registration, deposit, UNT purchase)",
  "fees.programRow.referral.note": "Reward size depends on event type; details in the referral program section.",
  "fees.programRow.partner.program": "Partner program",
  "fees.programRow.partner.rewardModel": "Revenue share / affiliate under agreed terms",
  "fees.programRow.partner.platformShare": "Individual after application review",
  "fees.programRow.partner.note":
    "Platform fee on referral operations is not duplicated in the public trading rate table.",

  "fees.withdrawal.title": "Withdrawal fees",
  "fees.withdrawal.description":
    "USDT (TRC20) withdrawal to an external address: platform fee and reference daily limit. Tron network fee is paid separately.",
  "fees.depositWithdrawal.title": "Deposit and withdrawal fees",
  "fees.depositWithdrawal.description":
    "USDT (TRC20) balance top-up and withdrawal to an external address. Platform fees and limits are listed below; Tron network fee is paid separately.",
  "fees.deposit.title": "Deposit fees",
  "fees.deposit.description": "The platform does not deduct a fee from incoming USDT (TRC20) deposits.",

  "fees.rules.definitions.title": "Key definitions",
  "fees.rules.definitions.p1":
    "Platform fee — platform deduction when purchasing rights / UNT on the primary market. Calculated from payment amount in USDT before trade confirmation.",
  "fees.rules.definitions.p2":
    "Secondary market fee — deduction on internal secondary market trade execution. Calculated from trade amount (gross) in USDT.",
  "fees.rules.definitions.p3":
    "Withdrawal fee — platform fee for USDT withdrawal to external TRC20 address. Does not include Tron network fee.",
  "fees.rules.primaryCalc.title": "Platform fee calculation (primary market)",
  "fees.rules.primaryCalc.p1":
    "Fee = payment amount × platform fee rate. UNT credit total is calculated after deduction.",
  "fees.rules.primaryCalc.p2":
    "Rate is shown in order preview and total line before payment. Actual value may differ with promos or individual release terms.",
  "fees.rules.secondaryCalc.title": "Secondary fee calculation",
  "fees.rules.secondaryCalc.p1":
    "On limit or market order execution, fee is deducted from trade amount. Order history shows gross, fee, and net (to receive).",
  "fees.rules.secondaryCalc.p2":
    "Fee is not mixed with primary market platform fee — a separate deduction category.",
  "fees.rules.withdrawCalc.title": "Withdrawal fee calculation and limits",
  "fees.rules.withdrawCalc.p1":
    "Withdrawal fee = max(minimum fixed USDT amount; percentage of requested amount). «To receive at address» total is shown before confirming the request.",
  "fees.rules.withdrawCalc.p2":
    "Daily withdrawal limit in the table is reference only and may depend on verification level, transaction history, and account security settings.",
  "fees.rules.withdrawCalc.p3": "TRC20 network fee is paid separately and is not set by Spliton.",
  "fees.rules.updates.title": "Rate updates",
  "fees.rules.updates.p1":
    "Public rates may be updated by the platform administrator. Effective date is shown in the «Current rates» block when live API is connected.",
  "fees.rules.updates.p2":
    "Before each account operation, a preview with the final fee is shown — use it when confirming.",
  "fees.rules.volumeCalc.title": "How 30-day trading volume is calculated",
  "fees.rules.volumeCalc.p1":
    "Executed primary and secondary market operations in USDT over a rolling 30 calendar days are included. Unfilled orders are not counted.",
  "fees.rules.volumeCalc.p2":
    "At this stage, all verified users have a single platform fee and secondary fee rate regardless of volume. The tier table is provided for transparency and future loyalty programs.",
  "fees.rules.buyerSeller.title": "Buyer and seller on the market",
  "fees.rules.buyerSeller.p1":
    "On the primary market, platform fee is deducted from the buyer when paying for an order. The seller (release issuer) does not pay a separate platform trading fee in this category.",
  "fees.rules.buyerSeller.p2":
    "On the secondary market, secondary fee is deducted from the seller on trade execution. The buyer sees the full trade amount; the fee is reflected in the seller's order details.",
  "fees.rules.accounts.title": "Main and linked accounts",
  "fees.rules.accounts.p1":
    "Trading volume and withdrawal limits are calculated for the user's main account. Spliton account operations are performed under your account after sign-in.",
  "fees.rules.accounts.p2":
    "When verification level or security settings change, withdrawal limits may be recalculated — the current value is shown in the withdrawal form before confirmation.",

  "fees.faq.title": "FAQ",
  "fees.faq.subtitle": "Typical account scenarios.",
  "fees.faq.f1.question": "Is there a deposit fee?",
  "fees.faq.f1.answer":
    "In the current UI model, platform fee on incoming USDT (TRC20) deposit is 0%. Network fees may apply when sending from your external wallet.",
  "fees.faq.f2.question": "When is secondary fee deducted?",
  "fees.faq.f2.answer":
    "On internal secondary market trade execution: fee is calculated from trade amount and shown in order details before and after execution.",
  "fees.faq.f3.question": "Why is the amount to receive less than the trade amount?",
  "fees.faq.f3.answer":
    "On secondary, gross (full trade amount) and fee are shown separately. To receive (net) is gross minus secondary fee and other deductions for the scenario.",
  "fees.faq.f4.question": "Is there a withdrawal fee?",
  "fees.faq.f4.answer":
    "Yes: withdrawal fee applies as max(minimum USDT, percentage of amount). Exact value is shown in the withdrawal form before confirmation.",
  "fees.faq.f5.question": "Where can I see the final amount before confirming?",
  "fees.faq.f5.answer":
    "In the operation preview: unit purchase, secondary sale, and USDT withdrawal — amount, fee, and total (total / net) lines are shown before final confirmation.",

  "fees.disclaimer":
    "Rates are for reference. Actual fee is shown in the trade preview before confirmation.",
};

const ES: Record<string, string> = {
  ...EN,
  "meta.fees.title": "Comisiones",
  "meta.fees.description":
    "Platform fee, secondary fee, retiro USDT (TRC20): tabla de tarifas, ejemplos de cálculo y preguntas frecuentes de Spliton.",

  "fees.breadcrumb.learnMore": "Saber más",
  "fees.breadcrumb.current": "Comisiones",
  "fees.hero.title": "Comisiones y retenciones",
  "fees.hero.subtitle": "Tarifas de trading, programas y retiro USDT (TRC20) — en una sola referencia.",

  "fees.section.trading": "Comisiones de trading",
  "fees.tabs.navAria": "Secciones de comisiones",
  "fees.section.depositWithdrawal": "Comisiones de depósito y retiro",
  "fees.section.other": "Otras comisiones",
  "fees.tab.overview": "Todas las operaciones",
  "fees.tab.primary": "Mercado primario",
  "fees.tab.secondary": "Secondary market",

  "fees.loading": "Cargando tarifas…",
  "fees.error.title": "Tarifas temporalmente no disponibles",
  "fees.retry": "Reintentar",

  "fees.trading.title": "Comisiones de trading",
  "fees.trading.description":
    "Las tarifas platform fee y secondary fee se aplican a operaciones en el mercado primario y secundario de UNT. La comisión real siempre se ve en la vista previa del orden antes de confirmar.",
  "fees.trading.effectiveFrom": "Vigente desde {date}",
  "fees.trading.primaryHint": "Compra de rights / UNT en el mercado primario",
  "fees.trading.secondaryHint": "Ejecución de operaciones en el secondary market interno",
  "fees.trading.updateHistory": "Historial de actualizaciones",

  "fees.table.col.tier": "Nivel",
  "fees.table.col.balanceUsdt": "Activos en balance (USDT)",
  "fees.table.col.volume30d": "Volumen de trading 30 días (USDT)",
  "fees.table.col.platformFee": "Platform fee",
  "fees.table.col.note": "Nota",
  "fees.table.col.secondaryVolume30d": "Volumen secondary 30 días (USDT)",
  "fees.table.col.secondaryFee": "Secondary fee",
  "fees.table.col.withdrawLimit24h": "Límite de retiro 24 h (USDT)",
  "fees.table.col.withdrawalFee": "Withdrawal fee",

  "fees.tier.standard": "Estándar",
  "fees.tier.from0Usdt": "desde 0 USDT",
  "fees.tier.primaryNote": "Todos los usuarios verificados; tarifa única para el mercado primario.",
  "fees.tier.secondaryNote": "Retención al ejecutar operación en secondary; separada de platform fee.",
  "fees.tier.withdrawLimitNote": "Límite de referencia; puede depender de verificación e historial de operaciones.",

  "fees.stat.platformFee": "Platform fee",
  "fees.stat.secondaryFee": "Secondary fee",
  "fees.stat.depositFee": "Deposit fee",
  "fees.stat.calculator": "Calculadora",
  "fees.stat.openCalculator": "Abrir",

  "fees.examples.title": "Ejemplos de cálculo",
  "fees.examples.subtitle": "Importe, comisión y total — como en la vista previa de operación en la cuenta.",
  "fees.examples.primaryMarket": "Mercado primario",
  "fees.examples.buyTitle": "Compra por {amount} USDT",
  "fees.examples.paymentAmount": "Importe del pago",
  "fees.examples.platformFeeLine": "Platform fee ({rate})",
  "fees.examples.creditedUnt": "A acreditar en UNT (net)",
  "fees.examples.totalFeeHeld": "Total retenido en comisiones",
  "fees.examples.secondaryMarket": "Secondary market",
  "fees.examples.sellTitle": "Venta de {units} UNT × {price} USDT",
  "fees.examples.grossAmount": "Importe de operación (gross)",
  "fees.examples.secondaryFeeLine": "Secondary fee ({rate})",
  "fees.examples.netReceive": "A recibir (net)",
  "fees.examples.withdrawal": "Retiro",
  "fees.examples.withdrawTitle": "Solicitud de retiro por {amount} USDT",
  "fees.examples.requestedWithdraw": "Solicitado para retiro",
  "fees.examples.withdrawalFee": "Withdrawal fee",
  "fees.examples.netToTrc20": "A recibir en dirección TRC20",
  "fees.examples.example": "Ejemplo",

  "fees.sections.title": "Por área del producto",

  "fees.block.wallet.title": "Wallet & Balance",
  "fees.block.wallet.subtitle": "Depósitos, balance y acreditaciones",
  "fees.block.wallet.bullet1": "Depósito: comisión de plataforma 0 % — ver fila «Deposit fee».",
  "fees.block.wallet.bullet2": "Pagos entrantes por rights: acreditación al balance sin línea «trading fee» separada.",
  "fees.block.wallet.bullet3":
    "Los importes finales de depósito y balance siempre son visibles antes de confirmar la transferencia entrante (cuando aplique).",
  "fees.block.market.title": "Market & Trading",
  "fees.block.market.subtitle": "Mercado primario y secundario de UNT",
  "fees.block.market.bullet1": "Compra primaria: platform fee {rate} del pago.",
  "fees.block.market.bullet2": "Secondary: secondary fee {rate} del importe de operación al ejecutar.",
  "fees.block.market.bullet3": "Las categorías de comisión están separadas: retenciones de mercado no se mezclan con comisión de retiro.",
  "fees.block.payouts.title": "Payouts & Withdrawals",
  "fees.block.payouts.subtitle": "Retiro a monedero",
  "fees.block.payouts.bullet1": "Retiro: max({min} USDT; {rate}) del importe solicitado.",
  "fees.block.payouts.bullet2":
    "Antes de enviar la solicitud se muestra el total «a recibir en dirección» neto de comisión de plataforma.",
  "fees.block.payouts.bullet3": "La comisión de red TRC20 no la fija Spliton y puede cambiar en la red.",

  "fees.operation.primaryPurchase": "Compra de rights / UNT (mercado primario)",
  "fees.operation.secondarySale": "Venta de UNT en secondary market",
  "fees.operation.withdrawal": "Retiro de USDT a dirección externa (TRC20)",
  "fees.operation.deposit": "Recarga de balance USDT (TRC20)",
  "fees.operation.payoutSettlement": "Acreditación de pagos por participación en ingresos al balance",
  "fees.feeType.platformFee": "Platform fee",
  "fees.feeType.secondaryMarketFee": "Secondary market fee",
  "fees.feeType.withdrawalFee": "Withdrawal fee",
  "fees.feeType.depositFee": "Deposit fee",
  "fees.feeType.payoutSettlement": "Payout settlement",
  "fees.calculation.primaryPurchase": "Porcentaje del importe del pago en USDT antes de confirmar la operación.",
  "fees.calculation.secondarySale": "Porcentaje del importe ejecutado de la operación (gross) en USDT.",
  "fees.calculation.withdrawal": "Se toma el mayor entre el mínimo o un porcentaje del importe solicitado de retiro.",
  "fees.calculation.deposit": "La plataforma no retiene comisión del depósito entrante.",
  "fees.calculation.payoutSettlement": "Acreditación al balance interno; fila ilustrativa para transparencia.",
  "fees.note.primaryPurchase": "Se muestra en la vista previa del orden y en la línea total antes del pago.",
  "fees.note.secondarySale": "Se retiene al ejecutar; el total «a recibir» ya es neto de comisión.",
  "fees.note.withdrawal":
    "La comisión de red TRC20 se paga por separado en el monedero / red y no entra en la tabla de la plataforma.",
  "fees.note.deposit": "La transferencia en blockchain puede tener comisión de red de terceros — depende de su monedero.",
  "fees.note.payoutSettlement": "Condiciones del release y reporte fiscal — en la ficha de operación y documentos.",
  "fees.rateLabel.payoutSettlement": "0 % (retención de plataforma en el ejemplo)",

  "fees.program.title": "Comisiones de programas y referidos",
  "fees.program.description":
    "Las recompensas de referidos y socios no forman parte de las tarifas de trading de la cuenta. Las condiciones de programas se describen por separado y pueden diferir de platform fee / secondary fee.",
  "fees.program.table.program": "Programa",
  "fees.program.table.rewardModel": "Modelo de recompensa",
  "fees.program.table.calculationBase": "Base de cálculo",
  "fees.program.referralProgram": "Programa de referidos",
  "fees.program.partnerProgram": "Programa de socios",
  "fees.program.rules.title": "Cómo se relaciona con las comisiones de trading",
  "fees.program.rules.p1":
    "Las comisiones de trading (platform fee, secondary fee) se retienen de operaciones del usuario en la cuenta independientemente de participación en programas de referidos o socios.",
  "fees.program.rules.p2":
    "La recompensa del referidor o socio se calcula según las reglas del programa correspondiente y no modifica la tabla pública de tarifas de trading en esta página.",
  "fees.programRow.referral.program": "Programa de referidos",
  "fees.programRow.referral.rewardModel": "Bono por acciones del usuario invitado",
  "fees.programRow.referral.platformShare": "Eventos fijos (registro, depósito, compra de UNT)",
  "fees.programRow.referral.note": "El tamaño de la recompensa depende del tipo de evento; detalles en la sección del programa de referidos.",
  "fees.programRow.partner.program": "Programa de socios",
  "fees.programRow.partner.rewardModel": "Revenue share / affiliate según condiciones acordadas",
  "fees.programRow.partner.platformShare": "Individual tras revisión de solicitud",
  "fees.programRow.partner.note":
    "La comisión de plataforma sobre operaciones de referidos no se duplica en la tabla pública de tarifas de trading.",

  "fees.withdrawal.title": "Comisiones de retiro",
  "fees.withdrawal.description":
    "Retiro USDT (TRC20) a dirección externa: comisión de plataforma y límite diario de referencia. La comisión de red Tron se paga por separado.",

  "fees.rules.definitions.title": "Definiciones clave",
  "fees.rules.definitions.p1":
    "Platform fee — retención de la plataforma al comprar rights / UNT en el mercado primario. Se calcula del importe del pago en USDT antes de confirmar la operación.",
  "fees.rules.definitions.p2":
    "Secondary market fee — retención al ejecutar operación en el mercado secundario interno. Se calcula del importe de la operación (gross) en USDT.",
  "fees.rules.definitions.p3":
    "Withdrawal fee — comisión de plataforma por retiro de USDT a dirección externa TRC20. No incluye comisión de red Tron.",
  "fees.rules.primaryCalc.title": "Cálculo de platform fee (mercado primario)",
  "fees.rules.primaryCalc.p1":
    "Comisión = importe del pago × tarifa platform fee. El total a acreditar en UNT se calcula tras la retención.",
  "fees.rules.primaryCalc.p2":
    "La tarifa se muestra en la vista previa del orden y en la línea total antes del pago. El valor real puede diferir con promociones o condiciones individuales del release.",
  "fees.rules.secondaryCalc.title": "Cálculo de secondary fee",
  "fees.rules.secondaryCalc.p1":
    "Al ejecutar orden limitada o de mercado, la comisión se retiene del importe de la operación. En el historial del orden se ven gross, fee y net (a recibir).",
  "fees.rules.secondaryCalc.p2":
    "La comisión no se mezcla con platform fee del mercado primario — es una categoría de retención separada.",
  "fees.rules.withdrawCalc.title": "Cálculo de withdrawal fee y límites",
  "fees.rules.withdrawCalc.p1":
    "Comisión de retiro = max(importe fijo mínimo USDT; porcentaje del importe solicitado). El total «a recibir en dirección» se muestra antes de confirmar la solicitud.",
  "fees.rules.withdrawCalc.p2":
    "El límite diario de retiro en la tabla es de referencia y puede depender del nivel de verificación, historial de operaciones y ajustes de seguridad de la cuenta.",
  "fees.rules.withdrawCalc.p3": "La comisión de red TRC20 se paga por separado y no la fija Spliton.",
  "fees.rules.updates.title": "Actualización de tarifas",
  "fees.rules.updates.p1":
    "Las tarifas públicas pueden actualizarse por el administrador de la plataforma. La fecha de vigencia se indica en el bloque «Tarifas actuales» al conectar la API live.",
  "fees.rules.updates.p2":
    "Antes de cada operación en la cuenta se muestra una vista previa con la comisión final — oriente su confirmación por ella.",

  "fees.faq.title": "Preguntas frecuentes",
  "fees.faq.subtitle": "Situaciones típicas en la cuenta.",
  "fees.faq.f1.question": "¿Hay comisión por depósito?",
  "fees.faq.f1.answer":
    "En el modelo UI actual, la comisión de plataforma sobre depósito entrante USDT (TRC20) es 0 %. Por separado puede aplicarse la red al enviar desde su monedero externo.",
  "fees.faq.f2.question": "¿Cuándo se retiene secondary fee?",
  "fees.faq.f2.answer":
    "Al ejecutar operación en el secondary market interno: la comisión se calcula del importe de la operación y se refleja en los detalles del orden antes y después de la ejecución.",
  "fees.faq.f3.question": "¿Por qué el importe a recibir es menor que el de la operación?",
  "fees.faq.f3.answer":
    "En secondary se muestra gross (importe total de la operación) y la comisión por separado. A recibir (net) es gross menos secondary fee y otras retenciones del escenario.",
  "fees.faq.f4.question": "¿Hay comisión por retiro?",
  "fees.faq.f4.answer":
    "Sí: se aplica withdrawal fee según max(mínimo USDT, porcentaje del importe). El valor exacto se muestra en el formulario de retiro antes de confirmar.",
  "fees.faq.f5.question": "¿Dónde ver el importe final antes de confirmar?",
  "fees.faq.f5.answer":
    "En la vista previa de operación: compra de units, venta en secondary y retiro USDT — antes de la confirmación final se muestran las líneas amount, fee e importe (total / net).",

  "fees.disclaimer":
    "Las tarifas son de referencia. La comisión real se muestra en la vista previa de la operación antes de confirmar.",
};

const PT: Record<string, string> = {
  ...EN,
  "meta.fees.title": "Taxas",
  "meta.fees.description":
    "Platform fee, secondary fee, levantamento USDT (TRC20): tabela de tarifas, exemplos de cálculo e perguntas frequentes Spliton.",

  "fees.breadcrumb.learnMore": "Saber mais",
  "fees.breadcrumb.current": "Taxas",
  "fees.hero.title": "Taxas e retenções",
  "fees.hero.subtitle": "Tarifas de trading, programas e levantamento USDT (TRC20) — numa única referência.",

  "fees.section.trading": "Taxas de trading",
  "fees.tabs.navAria": "Secções de taxas",
  "fees.section.depositWithdrawal": "Taxas de depósito e levantamento",
  "fees.section.other": "Outras taxas",
  "fees.tab.overview": "Todas as operações",
  "fees.tab.primary": "Mercado primário",
  "fees.tab.secondary": "Secondary market",

  "fees.loading": "A carregar tarifas…",
  "fees.error.title": "Tarifas temporariamente indisponíveis",
  "fees.retry": "Tentar novamente",

  "fees.trading.title": "Taxas de trading",
  "fees.trading.description":
    "As tarifas platform fee e secondary fee aplicam-se a operações no mercado primário e secundário de UNT. A comissão real é sempre visível na pré-visualização da ordem antes da confirmação.",
  "fees.trading.effectiveFrom": "Vigente desde {date}",
  "fees.trading.primaryHint": "Compra de rights / UNT no mercado primário",
  "fees.trading.secondaryHint": "Execução de operações no secondary market interno",
  "fees.trading.updateHistory": "Histórico de atualizações",

  "fees.table.col.tier": "Nível",
  "fees.table.col.balanceUsdt": "Ativos no saldo (USDT)",
  "fees.table.col.volume30d": "Volume de trading 30 dias (USDT)",
  "fees.table.col.platformFee": "Platform fee",
  "fees.table.col.note": "Nota",
  "fees.table.col.secondaryVolume30d": "Volume secondary 30 dias (USDT)",
  "fees.table.col.secondaryFee": "Secondary fee",
  "fees.table.col.withdrawLimit24h": "Limite de levantamento 24 h (USDT)",
  "fees.table.col.withdrawalFee": "Withdrawal fee",

  "fees.tier.standard": "Padrão",
  "fees.tier.from0Usdt": "desde 0 USDT",
  "fees.tier.primaryNote": "Todos os utilizadores verificados; tarifa única para o mercado primário.",
  "fees.tier.secondaryNote": "Retenção na execução de operação em secondary; separada de platform fee.",
  "fees.tier.withdrawLimitNote": "Limite de referência; pode depender de verificação e histórico de operações.",

  "fees.stat.platformFee": "Platform fee",
  "fees.stat.secondaryFee": "Secondary fee",
  "fees.stat.depositFee": "Deposit fee",
  "fees.stat.calculator": "Calculadora",
  "fees.stat.openCalculator": "Abrir",

  "fees.examples.title": "Exemplos de cálculo",
  "fees.examples.subtitle": "Montante, comissão e total — como na pré-visualização de operação na conta.",
  "fees.examples.primaryMarket": "Mercado primário",
  "fees.examples.buyTitle": "Compra por {amount} USDT",
  "fees.examples.paymentAmount": "Montante do pagamento",
  "fees.examples.platformFeeLine": "Platform fee ({rate})",
  "fees.examples.creditedUnt": "A creditar em UNT (net)",
  "fees.examples.totalFeeHeld": "Total retido em comissões",
  "fees.examples.secondaryMarket": "Secondary market",
  "fees.examples.sellTitle": "Venda de {units} UNT × {price} USDT",
  "fees.examples.grossAmount": "Montante da operação (gross)",
  "fees.examples.secondaryFeeLine": "Secondary fee ({rate})",
  "fees.examples.netReceive": "A receber (net)",
  "fees.examples.withdrawal": "Levantamento",
  "fees.examples.withdrawTitle": "Pedido de levantamento de {amount} USDT",
  "fees.examples.requestedWithdraw": "Solicitado para levantamento",
  "fees.examples.withdrawalFee": "Withdrawal fee",
  "fees.examples.netToTrc20": "A receber no endereço TRC20",
  "fees.examples.example": "Exemplo",

  "fees.sections.title": "Por área do produto",

  "fees.block.wallet.title": "Wallet & Balance",
  "fees.block.wallet.subtitle": "Depósitos, saldo e créditos",
  "fees.block.wallet.bullet1": "Depósito: comissão da plataforma 0 % — ver linha «Deposit fee».",
  "fees.block.wallet.bullet2": "Pagamentos entrantes por rights: crédito no saldo sem linha «trading fee» separada.",
  "fees.block.wallet.bullet3":
    "Os montantes finais de depósito e saldo são sempre visíveis antes de confirmar a transferência entrante (quando aplicável).",
  "fees.block.market.title": "Market & Trading",
  "fees.block.market.subtitle": "Mercado primário e secundário de UNT",
  "fees.block.market.bullet1": "Compra primária: platform fee {rate} do pagamento.",
  "fees.block.market.bullet2": "Secondary: secondary fee {rate} do montante da operação na execução.",
  "fees.block.market.bullet3": "As categorias de comissão estão separadas: retenções de mercado não se misturam com comissão de levantamento.",
  "fees.block.payouts.title": "Payouts & Withdrawals",
  "fees.block.payouts.subtitle": "Levantamento para carteira",
  "fees.block.payouts.bullet1": "Levantamento: max({min} USDT; {rate}) do montante solicitado.",
  "fees.block.payouts.bullet2":
    "Antes de enviar o pedido é mostrado o total «a receber no endereço» líquido de comissão da plataforma.",
  "fees.block.payouts.bullet3": "A comissão de rede TRC20 não é definida pela Spliton e pode mudar na rede.",

  "fees.operation.primaryPurchase": "Compra de rights / UNT (mercado primário)",
  "fees.operation.secondarySale": "Venda de UNT no secondary market",
  "fees.operation.withdrawal": "Levantamento de USDT para endereço externo (TRC20)",
  "fees.operation.deposit": "Carregamento de saldo USDT (TRC20)",
  "fees.operation.payoutSettlement": "Crédito de pagamentos por participação nos rendimentos no saldo",
  "fees.feeType.platformFee": "Platform fee",
  "fees.feeType.secondaryMarketFee": "Secondary market fee",
  "fees.feeType.withdrawalFee": "Withdrawal fee",
  "fees.feeType.depositFee": "Deposit fee",
  "fees.feeType.payoutSettlement": "Payout settlement",
  "fees.calculation.primaryPurchase": "Percentagem do montante do pagamento em USDT antes de confirmar a operação.",
  "fees.calculation.secondarySale": "Percentagem do montante executado da operação (gross) em USDT.",
  "fees.calculation.withdrawal": "Toma-se o maior entre o mínimo ou uma percentagem do montante solicitado de levantamento.",
  "fees.calculation.deposit": "A plataforma não retém comissão do depósito entrante.",
  "fees.calculation.payoutSettlement": "Crédito no saldo interno; linha ilustrativa para transparência.",
  "fees.note.primaryPurchase": "Mostrado na pré-visualização da ordem e na linha total antes do pagamento.",
  "fees.note.secondarySale": "Retido na execução; o total «a receber» já é líquido de comissão.",
  "fees.note.withdrawal":
    "A comissão de rede TRC20 é paga separadamente pela carteira / rede e não entra na tabela da plataforma.",
  "fees.note.deposit": "A transferência na blockchain pode ter comissão de rede de terceiros — depende da sua carteira.",
  "fees.note.payoutSettlement": "Condições do release e reporte fiscal — na ficha da operação e documentos.",
  "fees.rateLabel.payoutSettlement": "0 % (retenção da plataforma no exemplo)",

  "fees.program.title": "Comissões de programas e referências",
  "fees.program.description":
    "Recompensas de referência e parceiros não fazem parte das tarifas de trading da conta. As condições dos programas são descritas separadamente e podem diferir de platform fee / secondary fee.",
  "fees.program.table.program": "Programa",
  "fees.program.table.rewardModel": "Modelo de recompensa",
  "fees.program.table.calculationBase": "Base de cálculo",
  "fees.program.referralProgram": "Programa de referências",
  "fees.program.partnerProgram": "Programa de parceiros",
  "fees.program.rules.title": "Como se relaciona com as comissões de trading",
  "fees.program.rules.p1":
    "As comissões de trading (platform fee, secondary fee) são retidas das operações do utilizador na conta independentemente da participação em programas de referência ou parceiros.",
  "fees.program.rules.p2":
    "A recompensa do referidor ou parceiro é calculada segundo as regras do programa correspondente e não altera a tabela pública de tarifas de trading nesta página.",
  "fees.programRow.referral.program": "Programa de referências",
  "fees.programRow.referral.rewardModel": "Bónus por ações do utilizador convidado",
  "fees.programRow.referral.platformShare": "Eventos fixos (registo, depósito, compra de UNT)",
  "fees.programRow.referral.note": "O tamanho da recompensa depende do tipo de evento; detalhes na secção do programa de referências.",
  "fees.programRow.partner.program": "Programa de parceiros",
  "fees.programRow.partner.rewardModel": "Revenue share / affiliate segundo condições acordadas",
  "fees.programRow.partner.platformShare": "Individual após revisão do pedido",
  "fees.programRow.partner.note":
    "A comissão da plataforma sobre operações de referidos não se duplica na tabela pública de tarifas de trading.",

  "fees.withdrawal.title": "Taxas de levantamento",
  "fees.withdrawal.description":
    "Levantamento USDT (TRC20) para endereço externo: comissão da plataforma e limite diário de referência. A comissão de rede Tron é paga separadamente.",

  "fees.rules.definitions.title": "Definições principais",
  "fees.rules.definitions.p1":
    "Platform fee — retenção da plataforma ao comprar rights / UNT no mercado primário. Calculada do montante do pagamento em USDT antes de confirmar a operação.",
  "fees.rules.definitions.p2":
    "Secondary market fee — retenção na execução de operação no mercado secundário interno. Calculada do montante da operação (gross) em USDT.",
  "fees.rules.definitions.p3":
    "Withdrawal fee — comissão da plataforma por levantamento de USDT para endereço externo TRC20. Não inclui comissão de rede Tron.",
  "fees.rules.primaryCalc.title": "Cálculo de platform fee (mercado primário)",
  "fees.rules.primaryCalc.p1":
    "Comissão = montante do pagamento × tarifa platform fee. O total a creditar em UNT é calculado após a retenção.",
  "fees.rules.primaryCalc.p2":
    "A tarifa é mostrada na pré-visualização da ordem e na linha total antes do pagamento. O valor real pode diferir com promoções ou condições individuais do release.",
  "fees.rules.secondaryCalc.title": "Cálculo de secondary fee",
  "fees.rules.secondaryCalc.p1":
    "Na execução de ordem limitada ou de mercado, a comissão é retida do montante da operação. No histórico da ordem vê-se gross, fee e net (a receber).",
  "fees.rules.secondaryCalc.p2":
    "A comissão não se mistura com platform fee do mercado primário — é uma categoria de retenção separada.",
  "fees.rules.withdrawCalc.title": "Cálculo de withdrawal fee e limites",
  "fees.rules.withdrawCalc.p1":
    "Comissão de levantamento = max(montante fixo mínimo USDT; percentagem do montante solicitado). O total «a receber no endereço» é mostrado antes de confirmar o pedido.",
  "fees.rules.withdrawCalc.p2":
    "O limite diário de levantamento na tabela é de referência e pode depender do nível de verificação, histórico de operações e definições de segurança da conta.",
  "fees.rules.withdrawCalc.p3": "A comissão de rede TRC20 é paga separadamente e não é definida pela Spliton.",
  "fees.rules.updates.title": "Atualização de tarifas",
  "fees.rules.updates.p1":
    "As tarifas públicas podem ser atualizadas pelo administrador da plataforma. A data de vigência é indicada no bloco «Tarifas atuais» ao ligar a API live.",
  "fees.rules.updates.p2":
    "Antes de cada operação na conta é mostrada uma pré-visualização com a comissão final — oriente a confirmação por ela.",

  "fees.faq.title": "Perguntas frequentes",
  "fees.faq.subtitle": "Situações típicas na conta.",
  "fees.faq.f1.question": "Há comissão por depósito?",
  "fees.faq.f1.answer":
    "No modelo UI atual, a comissão da plataforma sobre depósito entrante USDT (TRC20) é 0 %. Separadamente pode aplicar-se a rede ao enviar da sua carteira externa.",
  "fees.faq.f2.question": "Quando é retida secondary fee?",
  "fees.faq.f2.answer":
    "Na execução de operação no secondary market interno: a comissão é calculada do montante da operação e refletida nos detalhes da ordem antes e depois da execução.",
  "fees.faq.f3.question": "Por que o montante a receber é menor que o da operação?",
  "fees.faq.f3.answer":
    "No secondary mostra-se gross (montante total da operação) e a comissão em separado. A receber (net) é gross menos secondary fee e outras retenções do cenário.",
  "fees.faq.f4.question": "Há comissão por levantamento?",
  "fees.faq.f4.answer":
    "Sim: aplica-se withdrawal fee segundo max(mínimo USDT, percentagem do montante). O valor exato é mostrado no formulário de levantamento antes de confirmar.",
  "fees.faq.f5.question": "Onde ver o montante final antes de confirmar?",
  "fees.faq.f5.answer":
    "Na pré-visualização de operação: compra de units, venda no secondary e levantamento USDT — antes da confirmação final são mostradas as linhas amount, fee e total (total / net).",

  "fees.disclaimer":
    "As tarifas são de referência. A comissão real é mostrada na pré-visualização da operação antes de confirmar.",
};

export const FEES_MESSAGES: Record<AppLocale, Record<string, string>> = {
  ru: RU,
  en: EN,
  es: ES,
  pt: PT,
};
