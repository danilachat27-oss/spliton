/**
 * Generates admin-analytics-messages.ts and admin-drawer-messages.ts
 */
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const i18nDir = path.join(root, "lib", "i18n");

/** @type {Record<string, { ru: string; en: string; es?: string; pt?: string }>} */
const KEYS = {
  // ── Analytics common ──
  "admin.analytics.common.refresh": { ru: "Обновить", en: "Refresh" },
  "admin.analytics.common.refreshing": { ru: "Обновление…", en: "Refreshing…" },
  "admin.analytics.common.reset": { ru: "Сбросить", en: "Reset" },
  "admin.analytics.common.report": { ru: "Отчёт", en: "Report" },
  "admin.analytics.common.generateReport": { ru: "Сформировать отчёт", en: "Generate report" },
  "admin.analytics.common.all": { ru: "Все", en: "All" },
  "admin.analytics.common.allStatuses": { ru: "Все статусы", en: "All statuses" },
  "admin.analytics.common.allCategories": { ru: "Все категории", en: "All categories" },
  "admin.analytics.common.allPriorities": { ru: "Все приоритеты", en: "All priorities" },
  "admin.analytics.common.allTeams": { ru: "Все команды", en: "All teams" },
  "admin.analytics.common.allSegments": { ru: "Все сегменты", en: "All segments" },
  "admin.analytics.common.allRoles": { ru: "Все роли", en: "All roles" },
  "admin.analytics.common.allTypes": { ru: "Все типы", en: "All types" },
  "admin.analytics.common.allRules": { ru: "Все правила", en: "All rules" },
  "admin.analytics.common.allSeverity": { ru: "Все severity", en: "All severity" },
  "admin.analytics.common.status": { ru: "Статус", en: "Status" },
  "admin.analytics.common.category": { ru: "Категория", en: "Category" },
  "admin.analytics.common.priority": { ru: "Приоритет", en: "Priority" },
  "admin.analytics.common.team": { ru: "Команда", en: "Team" },
  "admin.analytics.common.manager": { ru: "Менеджер", en: "Manager" },
  "admin.analytics.common.groupBy": { ru: "Группировка", en: "Group by" },
  "admin.analytics.common.segment": { ru: "Сегмент", en: "Segment" },
  "admin.analytics.common.role": { ru: "Роль", en: "Role" },
  "admin.analytics.common.severity": { ru: "Severity", en: "Severity" },
  "admin.analytics.common.entityType": { ru: "Тип объекта", en: "Entity type" },
  "admin.analytics.common.rule": { ru: "Правило", en: "Rule" },
  "admin.analytics.common.keyMetrics": { ru: "Ключевые показатели", en: "Key metrics" },
  "admin.analytics.common.keyMetricsDesc": { ru: "Главные KPI за выбранный период.", en: "Main KPIs for the selected period." },
  "admin.analytics.common.detail": { ru: "Детализация", en: "Details" },
  "admin.analytics.common.noData": { ru: "Нет данных", en: "No data" },
  "admin.analytics.common.none": { ru: "Нет", en: "None" },
  "admin.analytics.readOnlyArea": { ru: "аналитика", en: "analytics" },

  // Period
  "admin.analytics.period.ariaLabel": { ru: "Период аналитики", en: "Analytics period" },
  "admin.analytics.period.24h": { ru: "24 ч", en: "24h" },
  "admin.analytics.period.7d": { ru: "7 дн.", en: "7d" },
  "admin.analytics.period.30d": { ru: "30 дн.", en: "30d" },
  "admin.analytics.period.90d": { ru: "90 дн.", en: "90d" },
  "admin.analytics.period.byDay": { ru: "По дням", en: "By day" },
  "admin.analytics.period.day": { ru: "День", en: "Day" },
  "admin.analytics.period.week": { ru: "Неделя", en: "Week" },
  "admin.analytics.period.month": { ru: "Месяц", en: "Month" },

  // Export
  "admin.analytics.export.defaultLabel": { ru: "Экспорт CSV", en: "Export CSV" },
  "admin.analytics.export.creating": { ru: "Создание…", en: "Creating…" },
  "admin.analytics.export.ready": { ru: "Отчёт готов — скачайте в разделе «Отчёты»", en: "Report ready — download in Reports" },
  "admin.analytics.export.queued": { ru: "Задача в очереди — обновите список в «Отчётах»", en: "Job queued — refresh the Reports list" },
  "admin.analytics.export.failed": { ru: "Не удалось создать экспорт", en: "Failed to create export" },
  "admin.analytics.export.noPermission": { ru: "Нет прав на экспорт", en: "No export permission" },

  // Nav hints
  "admin.analytics.nav.overview.hint": { ru: "Сводный BI-обзор Spliton", en: "Spliton executive BI overview" },
  "admin.analytics.nav.finance.hint": { ru: "Cashflow, комиссии, выводы", en: "Cashflow, fees, withdrawals" },
  "admin.analytics.nav.users.hint": { ru: "Рост, воронка, сегменты", en: "Growth, funnel, segments" },
  "admin.analytics.nav.tracks.hint": { ru: "Релизы и раунды", en: "Releases and rounds" },
  "admin.analytics.nav.market.hint": { ru: "Листинги, сделки, ликвидность", en: "Listings, trades, liquidity" },
  "admin.analytics.nav.revenue.hint": { ru: "Начисления держателям", en: "Holder accruals" },
  "admin.analytics.nav.risk.hint": { ru: "Risk flags, freeze, compliance", en: "Risk flags, freeze, compliance" },
  "admin.analytics.nav.operations.hint": { ru: "Support SLA и операции", en: "Support SLA and operations" },

  // Filter options - operations
  "admin.analytics.filters.ops.toggle.escalated": { ru: "Эскалации", en: "Escalations" },
  "admin.analytics.filters.ops.toggle.unassigned": { ru: "Не назначены", en: "Unassigned" },
  "admin.analytics.filters.ops.category.deposit": { ru: "Пополнение", en: "Deposit" },
  "admin.analytics.filters.ops.category.withdrawal": { ru: "Вывод", en: "Withdrawal" },
  "admin.analytics.filters.ops.category.wallet": { ru: "Кошелёк", en: "Wallet" },
  "admin.analytics.filters.ops.category.primary_purchase": { ru: "Покупка юнитов", en: "Unit purchase" },
  "admin.analytics.filters.ops.category.secondary_market": { ru: "Вторичный рынок", en: "Secondary market" },
  "admin.analytics.filters.ops.category.revenue_distribution": { ru: "Начисления", en: "Accruals" },
  "admin.analytics.filters.ops.category.account": { ru: "Аккаунт", en: "Account" },
  "admin.analytics.filters.ops.category.technical": { ru: "Техническая", en: "Technical" },
  "admin.analytics.filters.ops.category.other": { ru: "Другое", en: "Other" },

  // Filter options - user segments
  "admin.analytics.filters.user.segment.new": { ru: "Новые", en: "New" },
  "admin.analytics.filters.user.segment.deposited": { ru: "С депозитом", en: "Deposited" },
  "admin.analytics.filters.user.segment.holders": { ru: "Держатели", en: "Holders" },

  // Chart empty states
  "admin.analytics.chartEmpty.finance.title": { ru: "Финансовых операций за период нет", en: "No financial activity for this period" },
  "admin.analytics.chartEmpty.finance.description": { ru: "Попробуйте выбрать 30 или 90 дней либо проверьте, включён ли live-режим данных.", en: "Try 30 or 90 days or check whether live data mode is enabled." },
  "admin.analytics.chartEmpty.users.title": { ru: "Новых регистраций за период нет", en: "No new registrations for this period" },
  "admin.analytics.chartEmpty.users.description": { ru: "Данные появятся после регистраций или активности пользователей.", en: "Data will appear after registrations or user activity." },
  "admin.analytics.chartEmpty.market.title": { ru: "Сделок на вторичном рынке пока нет", en: "No secondary market trades yet" },
  "admin.analytics.chartEmpty.market.description": { ru: "Данные появятся после создания и покупки листингов.", en: "Data will appear after listings are created and bought." },
  "admin.analytics.chartEmpty.risk.title": { ru: "Активных риск-сигналов нет", en: "No active risk signals" },
  "admin.analytics.chartEmpty.risk.description": { ru: "Это нормальное состояние, если подозрительных операций не найдено.", en: "This is normal when no suspicious activity is found." },
  "admin.analytics.chartEmpty.support.title": { ru: "Открытых обращений нет", en: "No open tickets" },
  "admin.analytics.chartEmpty.support.description": { ru: "Новые тикеты появятся после обращения пользователей.", en: "New tickets will appear after users contact support." },
  "admin.analytics.chartEmpty.revenue.title": { ru: "Доход платформы за период не зафиксирован", en: "No platform revenue recorded for this period" },
  "admin.analytics.chartEmpty.revenue.description": { ru: "Комиссии появятся после операций пользователей на Spliton.", en: "Fees will appear after user activity on Spliton." },
  "admin.analytics.chartEmpty.default.title": { ru: "Нет данных за период", en: "No data for this period" },
  "admin.analytics.chartEmpty.default.description": { ru: "Измените период или проверьте подключение к API.", en: "Change the period or check the API connection." },

  // KPI tooltips
  "admin.analytics.kpi.deposits": { ru: "Сумма успешных пополнений USDT за выбранный период.", en: "Total successful USDT deposits for the selected period." },
  "admin.analytics.kpi.withdrawals": { ru: "Сумма успешных выводов USDT за период.", en: "Total successful USDT withdrawals for the period." },
  "admin.analytics.kpi.netFlow": { ru: "Пополнения минус выводы — net flow казначейства.", en: "Deposits minus withdrawals — treasury net flow." },
  "admin.analytics.kpi.platformRevenue": { ru: "Сумма комиссий и fee Spliton за период.", en: "Total Spliton fees for the period." },
  "admin.analytics.kpi.pendingWithdrawals": { ru: "Выводы в очереди на settlement / on hold.", en: "Withdrawals queued for settlement / on hold." },
  "admin.analytics.kpi.newUsers": { ru: "Новые регистрации за период.", en: "New registrations for the period." },
  "admin.analytics.kpi.activeUsers": { ru: "Пользователи с активностью (депозит, сделка, вывод) за период.", en: "Users with activity (deposit, trade, withdrawal) in the period." },
  "admin.analytics.kpi.firstDeposit": { ru: "Пользователи с первым подтверждённым депозитом за период.", en: "Users with first confirmed deposit in the period." },
  "admin.analytics.kpi.firstPurchase": { ru: "Пользователи с первой покупкой юнитов за период.", en: "Users with first unit purchase in the period." },
  "admin.analytics.kpi.marketVolume": { ru: "Сумма сделок вторичного рынка за период.", en: "Secondary market trade volume for the period." },
  "admin.analytics.kpi.tradesCount": { ru: "Количество завершённых сделок.", en: "Number of completed trades." },
  "admin.analytics.kpi.activeListings": { ru: "Листинги в статусе active.", en: "Listings in active status." },
  "admin.analytics.kpi.avgPrice": { ru: "Средняя цена сделки за юнит за период.", en: "Average trade price per unit for the period." },
  "admin.analytics.kpi.openFlags": { ru: "Активные risk flags, требующие review.", en: "Active risk flags requiring review." },
  "admin.analytics.kpi.criticalRisk": { ru: "Открытые флаги severity critical.", en: "Open flags with critical severity." },
  "admin.analytics.kpi.openTickets": { ru: "Тикеты поддержки без закрытия.", en: "Support tickets without closure." },
  "admin.analytics.kpi.overdueSla": { ru: "Тикеты с просроченным SLA.", en: "Tickets with overdue SLA." },
  "admin.analytics.kpi.lockedBalance": { ru: "Средства под выводы, листинги и операции.", en: "Funds locked for withdrawals, listings, and operations." },

  // Executive summary
  "admin.analytics.summary.platformState": { ru: "Состояние платформы", en: "Platform status" },
  "admin.analytics.summary.needsAttention": { ru: "Есть зоны, требующие внимания", en: "Areas need attention" },
  "admin.analytics.summary.noActivity": { ru: "За выбранный период активности нет. Выберите больший период (30 или 90 дней) или проверьте live-данные Spliton.", en: "No activity for the selected period. Choose 30 or 90 days or check Spliton live data." },
  "admin.analytics.summary.noCritical": { ru: "За выбранный период критических отклонений не обнаружено. Детали — в блоках ниже.", en: "No critical deviations for the selected period. See blocks below for details." },
  "admin.analytics.summary.depositsExceed": { ru: "Пополнения превышают выводы на {amount}.", en: "Deposits exceed withdrawals by {amount}." },
  "admin.analytics.summary.withdrawalsExceed": { ru: "Выводы превышают пополнения — контролируйте ликвидность.", en: "Withdrawals exceed deposits — monitor liquidity." },
  "admin.analytics.summary.openRiskFlags": { ru: "Открыто {count} риск-флаг(ов){critical}.", en: "{count} open risk flag(s){critical}." },
  "admin.analytics.summary.criticalSuffix": { ru: ", из них {count} critical", en: ", {count} critical" },
  "admin.analytics.summary.marketTrades": { ru: "На вторичном рынке {count} сделок ({volume}).", en: "Secondary market: {count} trades ({volume})." },
  "admin.analytics.summary.supportOpen": { ru: "В поддержке {count} открытых обращений.", en: "Support has {count} open tickets." },

  // Attention items
  "admin.analytics.attention.pendingWithdrawals": { ru: "Выводы в очереди на settlement", en: "Withdrawals queued for settlement" },
  "admin.analytics.attention.manualDeposits": { ru: "Пополнения на ручной проверке", en: "Deposits pending manual review" },
  "admin.analytics.attention.criticalRisk": { ru: "Critical risk flags", en: "Critical risk flags" },
  "admin.analytics.attention.highRisk": { ru: "High/Critical risk flags", en: "High/Critical risk flags" },
  "admin.analytics.attention.openRisk": { ru: "Открытые риск-флаги", en: "Open risk flags" },
  "admin.analytics.attention.frozenOps": { ru: "Замороженные операции", en: "Frozen operations" },
  "admin.analytics.attention.supportOpen": { ru: "Открытые обращения в поддержку", en: "Open support tickets" },
  "admin.analytics.attention.overdueSla": { ru: "Просроченные SLA", en: "Overdue SLA" },
  "admin.analytics.attention.reportsFailed": { ru: "Сбойные отчёты за 24 ч", en: "Failed reports in 24h" },

  // Fee labels
  "admin.analytics.fee.primaryPurchase": { ru: "Комиссия первичной покупки", en: "Primary purchase fee" },
  "admin.analytics.fee.withdrawal": { ru: "Комиссия вывода", en: "Withdrawal fee" },
  "admin.analytics.fee.secondaryTrade": { ru: "Комиссия вторичного рынка", en: "Secondary market fee" },

  // Section: finance
  "admin.analytics.finance.title": { ru: "Финансовая аналитика", en: "Financial analytics" },
  "admin.analytics.finance.description": { ru: "Движение денег, чистый поток, комиссии и операционные задержки для бухгалтерии Spliton.", en: "Money movement, net flow, fees, and operational delays for Spliton accounting." },
  "admin.analytics.finance.loading": { ru: "Загрузка финансовой аналитики…", en: "Loading financial analytics…" },
  "admin.analytics.finance.netFlow": { ru: "Чистый поток", en: "Net flow" },
  "admin.analytics.finance.pendingQueue": { ru: "Выводы в очереди", en: "Queued withdrawals" },
  "admin.analytics.finance.fees": { ru: "Комиссии", en: "Fees" },
  "admin.analytics.finance.lockedBalance": { ru: "Заблокированный баланс", en: "Locked balance" },
  "admin.analytics.finance.cashflowTitle": { ru: "Денежный поток: пополнения и выводы", en: "Cash flow: deposits and withdrawals" },
  "admin.analytics.finance.cashflowDesc": { ru: "Ежедневный приток и отток USDT.", en: "Daily USDT inflow and outflow." },
  "admin.analytics.finance.depositsWithdrawalsDaily": { ru: "Пополнения и выводы по дням", en: "Deposits and withdrawals by day" },
  "admin.analytics.finance.netFlowDaily": { ru: "Чистый поток по дням", en: "Net flow by day" },
  "admin.analytics.finance.netFlowDailyDesc": { ru: "Пополнения минус выводы.", en: "Deposits minus withdrawals." },
  "admin.analytics.finance.feesByType": { ru: "Комиссии по типам", en: "Fees by type" },
  "admin.analytics.finance.feesByTypeDesc": { ru: "Вывод, вторичный рынок, первичная покупка.", en: "Withdrawal, secondary market, primary purchase." },
  "admin.analytics.finance.depositsSection": { ru: "Пополнения", en: "Deposits" },
  "admin.analytics.finance.depositsPeriod": { ru: "Пополнения за период", en: "Deposits for period" },
  "admin.analytics.finance.manualReview": { ru: "На ручной проверке", en: "Manual review" },
  "admin.analytics.finance.manualReviewTooltip": { ru: "Пополнения, требующие проверки оператором.", en: "Deposits requiring operator review." },
  "admin.analytics.finance.withdrawalsSection": { ru: "Выводы", en: "Withdrawals" },
  "admin.analytics.finance.withdrawalsPeriod": { ru: "Выводы за период", en: "Withdrawals for period" },
  "admin.analytics.finance.inQueue": { ru: "В очереди", en: "In queue" },
  "admin.analytics.finance.processingSpeed": { ru: "Скорость обработки выводов", en: "Withdrawal processing speed" },
  "admin.analytics.finance.processingSpeedDesc": { ru: "Среднее и медианное время settlement.", en: "Average and median settlement time." },
  "admin.analytics.finance.avgHours": { ru: "Среднее, ч", en: "Average, h" },
  "admin.analytics.finance.medianHours": { ru: "Медиана, ч", en: "Median, h" },
  "admin.analytics.finance.sample": { ru: "Выборка", en: "Sample" },
  "admin.analytics.finance.manualDepositReview": { ru: "Ручная проверка депозитов", en: "Manual deposit review" },
  "admin.analytics.finance.failedOps": { ru: "Неуспешные операции", en: "Failed operations" },
  "admin.analytics.finance.failedOpsDesc": { ru: "Ошибки пополнений и выводов за период.", en: "Deposit and withdrawal errors for the period." },
  "admin.analytics.finance.detailDesc": { ru: "Сводные балансы и ссылки на операционные разделы.", en: "Balance summary and links to operational sections." },
  "admin.analytics.finance.availableBalance": { ru: "Доступный баланс", en: "Available balance" },
  "admin.analytics.finance.locked": { ru: "Заблокировано", en: "Locked" },

  // Section: overview (subset - most visible)
  "admin.analytics.overview.title": { ru: "Общая аналитика", en: "Analytics overview" },
  "admin.analytics.overview.description": { ru: "Сводный обзор финансов, пользователей, рынка, рисков и операционной активности Spliton.", en: "Executive overview of Spliton finance, users, market, risk, and operations." },
  "admin.analytics.overview.loading": { ru: "Загрузка общей аналитики Spliton…", en: "Loading Spliton analytics overview…" },
  "admin.analytics.common.updatedAt": { ru: "Обновлено:", en: "Updated:" },
  "admin.analytics.common.export": { ru: "Экспорт", en: "Export" },

  // Section: users
  "admin.analytics.users.title": { ru: "Аналитика пользователей", en: "User analytics" },
  "admin.analytics.users.description": { ru: "Рост, активация, сегменты, удержание и финансовая активность пользователей Spliton.", en: "Growth, activation, segments, retention, and user financial activity on Spliton." },
  "admin.analytics.users.loading": { ru: "Загрузка аналитики пользователей Spliton…", en: "Loading Spliton user analytics…" },

  // Section: tracks
  "admin.analytics.tracks.title": { ru: "Аналитика треков и раундов", en: "Track and round analytics" },
  "admin.analytics.tracks.description": { ru: "Эффективность релизов, первичных раундов, продажи юнитов, держатели, начисления и активность вторичного рынка.", en: "Release and round performance, unit sales, holders, accruals, and secondary market activity." },
  "admin.analytics.tracks.loading": { ru: "Загрузка аналитики треков и раундов Spliton…", en: "Loading Spliton track and round analytics…" },

  // Section: market
  "admin.analytics.market.title": { ru: "Аналитика вторичного рынка", en: "Secondary market analytics" },
  "admin.analytics.market.description": { ru: "Ликвидность, листинги, сделки, цены, комиссии и риск-сигналы по вторичному рынку юнитов Spliton.", en: "Liquidity, listings, trades, prices, fees, and risk signals on Spliton secondary market." },
  "admin.analytics.market.loading": { ru: "Загрузка аналитики вторичного рынка Spliton…", en: "Loading Spliton secondary market analytics…" },
  "admin.analytics.market.liquidity": { ru: "Ликвидность", en: "Liquidity" },
  "admin.analytics.market.trades": { ru: "Сделки", en: "Trades" },
  "admin.analytics.market.fees": { ru: "Комиссии", en: "Fees" },
  "admin.analytics.market.risk": { ru: "Риск", en: "Risk" },

  // Section: revenue
  "admin.analytics.revenue.title": { ru: "Аналитика начислений", en: "Accrual analytics" },
  "admin.analytics.revenue.description": { ru: "Доходы релизов, распределения держателям, доля артиста, доля платформы, ошибки начислений и wallet ledger.", en: "Release revenue, holder distributions, artist share, platform share, accrual errors, and wallet ledger." },
  "admin.analytics.operations.description": { ru: "Очередь поддержки, SLA, эскалации, финансовые обращения, нагрузка менеджеров и качество обработки тикетов Spliton.", en: "Support queue, SLA, escalations, finance tickets, manager workload, and Spliton ticket handling quality." },
  "admin.analytics.revenue.loading": { ru: "Загрузка аналитики начислений Spliton…", en: "Loading Spliton accrual analytics…" },

  // Section: risk
  "admin.analytics.risk.title": { ru: "Риск-аналитика", en: "Risk analytics" },
  "admin.analytics.risk.description": { ru: "Аналитика риск-сигналов, замороженных операций, подозрительных сделок, выводов на удержании и эффективности compliance-проверок.", en: "Risk signals, frozen operations, suspicious trades, held withdrawals, and compliance review efficiency." },
  "admin.analytics.risk.loading": { ru: "Загрузка риск-аналитики Spliton…", en: "Loading Spliton risk analytics…" },

  // Section: operations
  "admin.analytics.operations.title": { ru: "Операционная аналитика", en: "Operations analytics" },
  "admin.analytics.operations.loading": { ru: "Загрузка операционной аналитики Spliton…", en: "Loading Spliton operations analytics…" },

  // ── Drawer common ──
  "admin.drawer.common.close": { ru: "Закрыть", en: "Close" },
  "admin.drawer.common.cancel": { ru: "Отмена", en: "Cancel" },
  "admin.drawer.common.overview": { ru: "Обзор", en: "Overview" },
  "admin.drawer.common.audit": { ru: "Audit", en: "Audit" },
  "admin.drawer.common.blockchain": { ru: "Blockchain", en: "Blockchain" },
  "admin.drawer.common.ledger": { ru: "Ledger", en: "Ledger" },
  "admin.drawer.common.user": { ru: "Пользователь", en: "User" },
  "admin.drawer.common.saving": { ru: "Сохранение…", en: "Saving…" },
  "admin.drawer.common.loading": { ru: "Загрузка…", en: "Loading…" },
  "admin.drawer.common.status": { ru: "Статус", en: "Status" },
  "admin.drawer.common.amount": { ru: "Сумма", en: "Amount" },
  "admin.drawer.common.fee": { ru: "Комиссия", en: "Fee" },
  "admin.drawer.common.net": { ru: "К зачислению", en: "Net amount" },
  "admin.drawer.common.requested": { ru: "Запрошено", en: "Requested" },
  "admin.drawer.common.updated": { ru: "Обновлено", en: "Updated" },
  "admin.drawer.common.processed": { ru: "Обработано", en: "Processed" },
  "admin.drawer.common.completed": { ru: "Завершено", en: "Completed" },
  "admin.drawer.common.date": { ru: "Дата", en: "Date" },
  "admin.drawer.common.reference": { ru: "Ссылка", en: "Reference" },
  "admin.drawer.common.direction": { ru: "Направление", en: "Direction" },
  "admin.drawer.common.operation": { ru: "Операция", en: "Operation" },
  "admin.drawer.common.noCover": { ru: "Нет обложки", en: "No cover" },
  "admin.drawer.common.actionFailed": { ru: "Не удалось выполнить действие", en: "Action failed" },

  // Withdrawal drawer
  "admin.drawer.withdrawal.title": { ru: "Вывод", en: "Withdrawal" },
  "admin.drawer.withdrawal.titleWithAmount": { ru: "Вывод {amount}", en: "Withdrawal {amount}" },
  "admin.drawer.withdrawal.loading": { ru: "Загрузка вывода…", en: "Loading withdrawal…" },
  "admin.drawer.withdrawal.adminNote": { ru: "Комментарий (audit)", en: "Comment (audit)" },
  "admin.drawer.withdrawal.adminNotePlaceholder": { ru: "Причина / note для журнала…", en: "Reason / note for audit log…" },
  "admin.drawer.withdrawal.txHash": { ru: "Tx hash (TRC20)", en: "Tx hash (TRC20)" },
  "admin.drawer.withdrawal.txHashPlaceholder": { ru: "Hash исходящей транзакции…", en: "Outgoing transaction hash…" },
  "admin.drawer.withdrawal.approve": { ru: "Одобрить", en: "Approve" },
  "admin.drawer.withdrawal.complete": { ru: "Завершить", en: "Complete" },
  "admin.drawer.withdrawal.hold": { ru: "На удержание", en: "Hold" },
  "admin.drawer.withdrawal.reject": { ru: "Отклонить", en: "Reject" },
  "admin.drawer.withdrawal.confirmApproveTitle": { ru: "Одобрить вывод?", en: "Approve withdrawal?" },
  "admin.drawer.withdrawal.confirmApproveDesc": { ru: "Сумма будет заблокирована на кошельке пользователя и переведена в обработку. Действие записывается в audit log.", en: "The amount will be locked on the user wallet and moved to processing. Logged in audit." },
  "admin.drawer.withdrawal.confirmCompleteTitle": { ru: "Завершить вывод?", en: "Complete withdrawal?" },
  "admin.drawer.withdrawal.confirmCompleteDesc": { ru: "Locked баланс будет списан через wallet ledger. Укажите tx hash отправки в сеть TRC20.", en: "Locked balance will be debited via wallet ledger. Provide TRC20 tx hash." },
  "admin.drawer.withdrawal.confirmHoldTitle": { ru: "Поставить на удержание?", en: "Put on hold?" },
  "admin.drawer.withdrawal.confirmRejectTitle": { ru: "Отклонить вывод?", en: "Reject withdrawal?" },
  "admin.drawer.withdrawal.confirmRejectDesc": { ru: "Средства вернутся на available баланс. Укажите причину для audit log.", en: "Funds return to available balance. Provide a reason for audit log." },
  "admin.drawer.withdrawal.treasuryApprovals": { ru: "Treasury approvals", en: "Treasury approvals" },
  "admin.drawer.withdrawal.allApprovalsReceived": { ru: "Все подтверждения получены", en: "All approvals received" },
  "admin.drawer.withdrawal.moreApprovalsNeeded": { ru: "Требуются доп. подтверждения", en: "Additional approvals required" },
  "admin.drawer.withdrawal.required": { ru: "Нужно:", en: "Required:" },
  "admin.drawer.withdrawal.noApprovalsYet": { ru: "Подтверждений пока нет", en: "No approvals yet" },
  "admin.drawer.withdrawal.recipientAddress": { ru: "TRC20 адрес получателя", en: "TRC20 recipient address" },
  "admin.drawer.withdrawal.noTxHash": { ru: "Нет tx hash", en: "No tx hash" },
  "admin.drawer.withdrawal.emptyLedger": { ru: "Нет записей ledger.", en: "No ledger entries." },
  "admin.drawer.withdrawal.emptyUser": { ru: "Нет данных пользователя.", en: "No user data." },
  "admin.drawer.withdrawal.emptyAudit": { ru: "Нет записей audit.", en: "No audit entries." },

  // Wallet drawer
  "admin.drawer.wallet.title": { ru: "Кошелёк", en: "Wallet" },
  "admin.drawer.wallet.loading": { ru: "Загрузка кошелька…", en: "Loading wallet…" },
  "admin.drawer.wallet.deposits": { ru: "Пополнения", en: "Deposits" },
  "admin.drawer.wallet.withdrawals": { ru: "Выводы", en: "Withdrawals" },
  "admin.drawer.wallet.market": { ru: "Покупки и рынок", en: "Purchases & market" },
  "admin.drawer.wallet.risk": { ru: "Risk / Compliance", en: "Risk / Compliance" },
  "admin.drawer.wallet.holdings": { ru: "Владения", en: "Holdings" },
  "admin.drawer.wallet.available": { ru: "Доступно", en: "Available" },
  "admin.drawer.wallet.locked": { ru: "Заблокировано", en: "Locked" },
  "admin.drawer.wallet.earned": { ru: "Начислено", en: "Earned" },
  "admin.drawer.wallet.withdrawn": { ru: "Выведено", en: "Withdrawn" },
  "admin.drawer.wallet.deposited": { ru: "Пополнено", en: "Deposited" },
  "admin.drawer.wallet.walletStatus": { ru: "Статус кошелька", en: "Wallet status" },
  "admin.drawer.wallet.lastActivity": { ru: "Последняя активность", en: "Last activity" },
  "admin.drawer.wallet.createdUpdated": { ru: "Создан / обновлён", en: "Created / updated" },
  "admin.drawer.wallet.emptyLedger": { ru: "Нет операций в ledger.", en: "No ledger operations." },
  "admin.drawer.wallet.emptyDeposits": { ru: "Нет пополнений.", en: "No deposits." },
  "admin.drawer.wallet.emptyWithdrawals": { ru: "Нет заявок на вывод.", en: "No withdrawal requests." },
  "admin.drawer.wallet.emptyMarket": { ru: "Нет покупок и сделок.", en: "No purchases or trades." },
  "admin.drawer.wallet.emptyRisk": { ru: "Risk flags не найдены.", en: "No risk flags found." },
  "admin.drawer.wallet.emptyAudit": { ru: "Нет записей audit для этого кошелька.", en: "No audit entries for this wallet." },

  // Compliance drawer
  "admin.drawer.compliance.title": { ru: "Риск-сигнал", en: "Risk signal" },
  "admin.drawer.compliance.loading": { ru: "Загрузка риск-сигнала…", en: "Loading risk signal…" },
  "admin.drawer.compliance.relatedObject": { ru: "Связанный объект", en: "Related object" },
  "admin.drawer.compliance.evidence": { ru: "Доказательства", en: "Evidence" },
  "admin.drawer.compliance.timeline": { ru: "Timeline", en: "Timeline" },
  "admin.drawer.compliance.notes": { ru: "Compliance notes", en: "Compliance notes" },
  "admin.drawer.compliance.activity": { ru: "Related activity", en: "Related activity" },
  "admin.drawer.compliance.adminNote": { ru: "Комментарий / причина", en: "Comment / reason" },
  "admin.drawer.compliance.adminNotePlaceholder": { ru: "Результат проверки, причина действия…", en: "Review outcome, action reason…" },
  "admin.drawer.compliance.assignee": { ru: "Назначить (email)", en: "Assign (email)" },

  // Track drawer
  "admin.drawer.track.create": { ru: "Создать релиз", en: "Create release" },
  "admin.drawer.track.edit": { ru: "Редактировать релиз", en: "Edit release" },
  "admin.drawer.track.view": { ru: "Просмотр релиза", en: "View release" },
  "admin.drawer.track.createSubtitle": { ru: "Spliton Operator Portal · новый релиз", en: "Spliton Operator Portal · new release" },
  "admin.drawer.track.loading": { ru: "Загрузка релиза…", en: "Loading release…" },
  "admin.drawer.track.saveDraft": { ru: "Сохранить черновик", en: "Save draft" },
  "admin.drawer.track.submitReview": { ru: "Отправить на проверку", en: "Submit for review" },
  "admin.drawer.track.publish": { ru: "Опубликовать", en: "Publish" },
  "admin.drawer.track.pause": { ru: "Приостановить", en: "Pause" },
  "admin.drawer.track.archive": { ru: "Архивировать", en: "Archive" },
  "admin.drawer.track.creating": { ru: "Создание…", en: "Creating…" },
  "admin.drawer.track.saveChanges": { ru: "Сохранить изменения", en: "Save changes" },
  "admin.drawer.track.shareHolders": { ru: "Держатели", en: "Holders" },
  "admin.drawer.track.shareArtist": { ru: "Артист", en: "Artist" },
  "admin.drawer.track.sharePlatform": { ru: "Платформа", en: "Platform" },
  "admin.drawer.track.shareTotal": { ru: "Итого: {total}% {ok}", en: "Total: {total}% {ok}" },
  "admin.drawer.track.shareMustBe100": { ru: "— должно быть 100%", en: "— must equal 100%" },
  "admin.drawer.track.section.basicInfo": { ru: "1. Основная информация", en: "1. Basic information" },
  "admin.drawer.track.confirm.publishTitle": { ru: "Опубликовать релиз?", en: "Publish release?" },
  "admin.drawer.track.confirm.publishDesc": { ru: "Релиз станет активным в Spliton. Убедитесь, что checklist заполнен и параметры раунда согласованы.", en: "Release becomes active on Spliton. Ensure checklist and round parameters are ready." },
  "admin.drawer.track.confirm.pauseTitle": { ru: "Приостановить релиз?", en: "Pause release?" },
  "admin.drawer.track.confirm.pauseDesc": { ru: "Новые покупки юнитов будут недоступны до возобновления.", en: "New unit purchases unavailable until resumed." },
  "admin.drawer.track.confirm.archiveTitle": { ru: "Архивировать релиз?", en: "Archive release?" },
  "admin.drawer.track.confirm.archiveDesc": { ru: "Релиз будет скрыт из операторской работы. Действие фиксируется в журнале.", en: "Release hidden from operator work. Logged in audit." },

  // Rounds drawer
  "admin.rounds.create.title": { ru: "Создать раунд", en: "Create round" },
  "admin.rounds.edit.title": { ru: "Раунд · {name}", en: "Round · {name}" },
  "admin.rounds.create.subtitle": { ru: "Spliton Operator Portal · первичное размещение юнитов", en: "Spliton Operator Portal · primary unit offering" },
  "admin.rounds.loading": { ru: "Загрузка раунда…", en: "Loading round…" },
  "admin.rounds.saving": { ru: "Сохранение раунда…", en: "Saving round…" },
  "admin.rounds.publish": { ru: "Опубликовать", en: "Publish" },
  "admin.rounds.pause": { ru: "Приостановить", en: "Pause" },
  "admin.rounds.close": { ru: "Завершить раунд", en: "Close round" },
  "admin.rounds.saveDraft": { ru: "Сохранить черновик", en: "Save draft" },
  "admin.rounds.createBtn": { ru: "Создать раунд", en: "Create round" },
  "admin.rounds.saveChanges": { ru: "Сохранить изменения", en: "Save changes" },
  "admin.rounds.selectRelease": { ru: "Выберите релиз для настройки раунда", en: "Select a release to configure the round" },
  "admin.rounds.raisedProgress": { ru: "Собрано {raised} · {progress}% от цели · {available} доступно", en: "Raised {raised} · {progress}% of target · {available} available" },
  "admin.rounds.paramsAfterSelect": { ru: "Параметры юнитов и финансов появятся после выбора релиза", en: "Unit and financial parameters appear after selecting a release" },
  "admin.rounds.section.release": { ru: "1. Релиз", en: "1. Release" },
  "admin.rounds.section.releaseDesc": { ru: "Раунд привязан к одному релизу. Выберите релиз и проверьте его карточку.", en: "A round is tied to one release. Select a release and review its card." },
  "admin.rounds.searchRelease": { ru: "Поиск релиза", en: "Search release" },
  "admin.rounds.searchPlaceholder": { ru: "Название, артист, ID…", en: "Title, artist, ID…" },
  "admin.rounds.releaseLabel": { ru: "Релиз *", en: "Release *" },
  "admin.rounds.selectReleasePlaceholder": { ru: "Выберите релиз", en: "Select release" },
  "admin.rounds.releaseHint": { ru: "Первичное размещение юнитов и прав на долю дохода по выбранному релизу.", en: "Primary placement of units and revenue share rights for the selected release." },
  "admin.rounds.loadingRelease": { ru: "Загрузка данных релиза…", en: "Loading release data…" },
  "admin.rounds.releaseLoading": { ru: "Данные релиза загружаются…", en: "Release data loading…" },
  "admin.rounds.holderShare": { ru: "Доля держателей: {pct}%", en: "Holder share: {pct}%" },
  "admin.rounds.totalUnits": { ru: "Всего юнитов: {units}", en: "Total units: {units}" },
  "admin.rounds.availablePrimary": { ru: "Доступно для первичного: {units}", en: "Available for primary: {units}" },
  "admin.rounds.noCoverWarning": { ru: "Нет обложки — добавьте в карточке релиза", en: "No cover — add in release card" },
  "admin.rounds.noArtistWarning": { ru: "Артист не указан", en: "Artist not specified" },
  "admin.rounds.section.params": { ru: "2. Основные параметры", en: "2. Main parameters" },
  "admin.rounds.section.paramsDesc": { ru: "Название для операторов, статус и период раунда.", en: "Operator name, status, and round period." },
  "admin.rounds.nameLabel": { ru: "Название раунда", en: "Round name" },
  "admin.rounds.namePlaceholder": { ru: "Первичный раунд, Раунд 1, Early access…", en: "Primary round, Round 1, Early access…" },
  "admin.rounds.statusHint": { ru: "Статус меняется через «Опубликовать», «Приостановить» или «Завершить».", en: "Status changes via Publish, Pause, or Close." },
  "admin.rounds.startDate": { ru: "Дата начала *", en: "Start date *" },
  "admin.rounds.endDate": { ru: "Дата окончания", en: "End date" },
  "admin.rounds.endDateHint": { ru: "Дата окончания не может быть раньше даты начала.", en: "End date cannot be before start date." },
  "admin.rounds.section.units": { ru: "3. Юниты и цена", en: "3. Units and price" },
  "admin.rounds.section.unitsDesc": { ru: "Сколько юнитов в раунде и по какой цене они продаются.", en: "How many units in the round and at what price." },
  "admin.rounds.totalUnitsLabel": { ru: "Всего юнитов в раунде *", en: "Total units in round *" },
  "admin.rounds.availableForSale": { ru: "Доступно к продаже", en: "Available for sale" },
  "admin.rounds.availableCalcHint": { ru: "Рассчитывается: всего − продано.", en: "Calculated: total − sold." },
  "admin.rounds.alreadySold": { ru: "Уже продано", en: "Already sold" },
  "admin.rounds.soldHint": { ru: "Обновляется при покупках. Редактирование только для миграции данных.", en: "Updated on purchases. Edit only for data migration." },
  "admin.rounds.unitPrice": { ru: "Цена за юнит (USDT) *", en: "Price per unit (USDT) *" },
  "admin.rounds.minPurchase": { ru: "Минимальная покупка (юнитов)", en: "Minimum purchase (units)" },
  "admin.rounds.maxPurchase": { ru: "Максимальная покупка (юнитов)", en: "Maximum purchase (units)" },
  "admin.rounds.noLimit": { ru: "Без ограничения", en: "No limit" },
  "admin.rounds.section.limits": { ru: "4. Финансовые лимиты", en: "4. Financial limits" },
  "admin.rounds.section.limitsDesc": { ru: "Цель сбора, hard cap и прогресс первичного раунда.", en: "Raise target, hard cap, and primary round progress." },
  "admin.rounds.raiseTarget": { ru: "Цель раунда (USDT) *", en: "Round target (USDT) *" },
  "admin.rounds.hardCap": { ru: "Максимальный лимит (USDT)", en: "Maximum cap (USDT)" },
  "admin.rounds.alreadyRaised": { ru: "Уже собрано", en: "Already raised" },
  "admin.rounds.progress": { ru: "Прогресс", en: "Progress" },
  "admin.rounds.fullSalePotential": { ru: "Потенциал при полной продаже", en: "Full sale potential" },
  "admin.rounds.section.userTerms": { ru: "5. Условия для пользователей", en: "5. User terms" },
  "admin.rounds.minPurchaseTerm": { ru: "Минимальная покупка", en: "Minimum purchase" },
  "admin.rounds.maxPurchaseTerm": { ru: "Максимальная покупка", en: "Maximum purchase" },
  "admin.rounds.platformFee": { ru: "Комиссия платформы", en: "Platform fee" },
  "admin.rounds.platformFeeValue": { ru: "По настройкам Spliton", en: "Per Spliton settings" },
  "admin.rounds.whoCanBuy": { ru: "Кто может покупать", en: "Who can buy" },
  "admin.rounds.allUsers": { ru: "Все пользователи", en: "All users" },
  "admin.rounds.section.checklist": { ru: "7. Проверка перед публикацией", en: "7. Pre-publish checklist" },
  "admin.rounds.cannotPublish": { ru: "Опубликовать нельзя: {reason}", en: "Cannot publish: {reason}" },
  "admin.rounds.section.paramsEmpty": { ru: "Параметры раунда", en: "Round parameters" },
  "admin.rounds.paramsEmptyDesc": { ru: "Выберите релиз выше, чтобы настроить юниты, цену, финансовые лимиты и период раунда.", en: "Select a release above to configure units, price, limits, and round period." },
  "admin.rounds.endsAt": { ru: "Окончание: {date}", en: "Ends: {date}" },
  "admin.rounds.confirm.publishTitle": { ru: "Опубликовать раунд?", en: "Publish round?" },
  "admin.rounds.confirm.publishDesc": { ru: "После публикации раунд станет доступен пользователям для покупки юнитов. Проверьте цену, количество юнитов и финансовые лимиты.", en: "After publishing, users can buy units. Verify price, unit count, and financial limits." },
  "admin.rounds.confirm.pauseTitle": { ru: "Приостановить раунд?", en: "Pause round?" },
  "admin.rounds.confirm.pauseDesc": { ru: "Пользователи временно не смогут покупать юниты в этом раунде. Уже совершённые покупки не изменятся.", en: "Users cannot buy units temporarily. Existing purchases unchanged." },
  "admin.rounds.confirm.closeTitle": { ru: "Завершить раунд?", en: "Close round?" },
  "admin.rounds.confirm.closeDesc": { ru: "Раунд будет закрыт для новых покупок. Это действие будет записано в журнал действий.", en: "Round closed for new purchases. Logged in audit trail." },
};

function esPt(en) {
  return en; // ES/PT inherit EN — parity for tests; can refine later
}

function buildLocale(locale) {
  const out = {};
  for (const [key, v] of Object.entries(KEYS)) {
    if (locale === "ru") out[key] = v.ru;
    else if (locale === "en") out[key] = v.en;
    else out[key] = v[locale] ?? esPt(v.en);
  }
  return out;
}

function emitFile(exportName, locales) {
  const blocks = ["import type { AppLocale } from \"./types\";", ""];
  for (const [name, data] of Object.entries(locales)) {
    blocks.push(`const ${name}: Record<string, string> = {`);
    for (const [k, v] of Object.entries(data)) {
      blocks.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
    }
    blocks.push("};", "");
  }
  blocks.push(
    `export const ${exportName}: Record<AppLocale, Record<string, string>> = {`,
    "  ru: RU,",
    "  en: EN,",
    "  es: ES,",
    "  pt: PT,",
    "};",
    "",
  );
  return blocks.join("\n");
}

const ru = buildLocale("ru");
const en = buildLocale("en");
const es = buildLocale("es");
const pt = buildLocale("pt");

// Split analytics vs drawer
const analyticsKeys = Object.fromEntries(Object.entries(KEYS).filter(([k]) => k.startsWith("admin.analytics.")));
const drawerKeys = Object.fromEntries(Object.entries(KEYS).filter(([k]) => k.startsWith("admin.drawer.") || k.startsWith("admin.rounds.")));

function subset(data, keys) {
  const out = {};
  for (const k of Object.keys(keys)) out[k] = data[k];
  return out;
}

fs.writeFileSync(
  path.join(i18nDir, "admin-analytics-messages.ts"),
  emitFile("ADMIN_ANALYTICS_MESSAGES", { RU: subset(ru, analyticsKeys), EN: subset(en, analyticsKeys), ES: subset(es, analyticsKeys), PT: subset(pt, analyticsKeys) }),
  "utf8",
);
fs.writeFileSync(
  path.join(i18nDir, "admin-drawer-messages.ts"),
  emitFile("ADMIN_DRAWER_MESSAGES", { RU: subset(ru, drawerKeys), EN: subset(en, drawerKeys), ES: subset(es, drawerKeys), PT: subset(pt, drawerKeys) }),
  "utf8",
);
console.log("analytics keys:", Object.keys(analyticsKeys).length);
console.log("drawer keys:", Object.keys(drawerKeys).length);
