import { LegalPolicyType } from '@prisma/client';
import { LAWYER_REVIEW_NOTICE } from './legal-consent-requirements';

const prefix = `${LAWYER_REVIEW_NOTICE}\n\n`;

export const DEFAULT_POLICY_SEEDS: Array<{
  type: LegalPolicyType;
  version: string;
  title: string;
  content: string;
}> = [
  {
    type: LegalPolicyType.TERMS_OF_SERVICE,
    version: '2026.06.1',
    title: 'Условия использования Spliton',
    content: `${prefix}Spliton предоставляет технологическую инфраструктуру учёта долей в распределении дохода музыкальных релизов. Платформа не является брокером, банком или эмитентом ценных бумаг. Пользователь обязан соблюдать применимое законодательство своей юрисдикции.`,
  },
  {
    type: LegalPolicyType.PRIVACY_POLICY,
    version: '2026.06.1',
    title: 'Политика конфиденциальности Spliton',
    content: `${prefix}Мы обрабатываем персональные данные для регистрации, финансовых операций, поддержки и compliance. Документы KYC хранятся только при наличии отдельной политики хранения.`,
  },
  {
    type: LegalPolicyType.RISK_DISCLOSURE,
    version: '2026.06.1',
    title: 'Раскрытие рисков',
    content: `${prefix}Доход по музыкальным активам не гарантирован. Стоимость units на вторичном рынке может снижаться. Операции в USDT (TRC20) связаны с сетевыми и контрагентскими рисками.`,
  },
  {
    type: LegalPolicyType.INVESTOR_AGREEMENT,
    version: '2026.06.1',
    title: 'Соглашение инвестора',
    content: `${prefix}Покупая units на первичном рынке, вы подтверждаете понимание модели revenue share и отсутствие гарантий ликвидности до появления вторичного рынка по релизу.`,
  },
  {
    type: LegalPolicyType.FEE_POLICY,
    version: '2026.06.1',
    title: 'Политика комиссий',
    content: `${prefix}Комиссии платформы, вторичного рынка и вывода USDT публикуются в разделе «Комиссии» и могут изменяться с уведомлением.`,
  },
  {
    type: LegalPolicyType.SECONDARY_MARKET_RULES,
    version: '2026.06.1',
    title: 'Правила вторичного рынка',
    content: `${prefix}Сделки исполняются по правилам внутреннего стакана. Запрещены манипуляции, self-trade и обход compliance-ограничений.`,
  },
  {
    type: LegalPolicyType.WITHDRAWAL_POLICY,
    version: '2026.06.1',
    title: 'Политика вывода средств',
    content: `${prefix}Вывод USDT может требовать KYC, проверки AML и ручного review. Минимальные суммы и сетевые комиссии применяются согласно тарифам.`,
  },
  {
    type: LegalPolicyType.AML_POLICY,
    version: '2026.06.1',
    title: 'AML / противодействие отмыванию',
    content: `${prefix}Spliton может запрашивать источник средств, приостанавливать операции и сообщать о подозрительной активности в соответствии с применимым правом.`,
  },
  {
    type: LegalPolicyType.KYC_POLICY,
    version: '2026.06.1',
    title: 'Политика KYC',
    content: `${prefix}Верификация личности может быть обязательной для вывода и крупных операций. Документы обрабатываются с минимизацией хранения чувствительных данных.`,
  },
  {
    type: LegalPolicyType.MARKET_RULES,
    version: '2026.06.1',
    title: 'Общие правила рынка',
    content: `${prefix}Правила каталога, раундов и торгов едины для первичного и вторичного рынка Spliton.`,
  },
  {
    type: LegalPolicyType.ROYALTY_RIGHTS_DISCLOSURE,
    version: '2026.06.1',
    title: 'Раскрытие прав на роялти',
    content: `${prefix}Units отражают долю в пуле распределения дохода, а не владение фонограммой или авторскими правами.`,
  },
];
