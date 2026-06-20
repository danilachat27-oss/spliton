import type { AppLocale } from "./types";

const RU: Record<string, string> = {
  "legal.notice.lawyerReview":
    "Черновик Spliton. Требует проверки юристом перед production и операциями с реальными деньгами.",

  "legal.privacy.title": "Политика конфиденциальности",
  "legal.privacy.description": "Политика конфиденциальности платформы {brand}.",
  "legal.privacy.updated": "Последнее обновление: июнь 2026",
  "legal.privacy.apiLink": "Актуальная версия из API Spliton",
  "legal.privacy.intro":
    "{brand} обрабатывает персональные данные для регистрации, верификации email, финансовых операций, поддержки и соблюдения требований compliance.",
  "legal.privacy.section.dataCollected": "Какие данные мы собираем",
  "legal.privacy.item.accountData": "Email, профиль аккаунта, журнал входов и audit-события безопасности",
  "legal.privacy.item.walletData": "Данные кошелька, транзакции, holdings и история сделок",
  "legal.privacy.item.supportData": "Обращения в поддержку и материалы compliance review (при необходимости)",
  "legal.privacy.section.usage": "Как мы используем данные",
  "legal.privacy.usage.body":
    "Для исполнения договора с пользователем, предотвращения мошенничества, расчёта комиссий, генерации отчётов для уполномоченных операторов и улучшения сервиса.",
  "legal.privacy.section.storage": "Хранение и передача",
  "legal.privacy.storage.body":
    "Данные хранятся в защищённой инфраструктуре (PostgreSQL / Supabase). Секреты и service role ключи не передаются во frontend. Экспорт отчётов доступен только авторизованным staff-ролям с audit-логированием.",
  "legal.privacy.section.rights": "Ваши права",
  "legal.privacy.rights.beforeSupport": "Вы можете запросить доступ, исправление или удаление данных через",
  "legal.privacy.rights.supportLink": "поддержку Spliton",
  "legal.privacy.rights.afterSupport": ", с учётом обязательств по хранению финансовых записей.",

  "legal.terms.title": "Условия использования",
  "legal.terms.description": "Условия использования платформы {brand}.",
  "legal.terms.updated": "Последнее обновление: июнь 2026",
  "legal.terms.apiLink": "Актуальная версия из API Spliton",
  "legal.terms.intro":
    "Настоящие условия регулируют доступ к платформе {brand} и использование сервисов учёта revenue share rights, кошелька USDT (TRC20) и внутреннего рынка units.",
  "legal.terms.section.platformRole": "1. Роль платформы",
  "legal.terms.platformRole.body":
    "{brand} предоставляет технологическую инфраструктуру для учёта долей в распределении дохода музыкальных релизов. Платформа не является брокером, банком или эмитентом ценных бумаг.",
  "legal.terms.section.accountSecurity": "2. Аккаунт и безопасность",
  "legal.terms.accountSecurity.body":
    "Вы отвечаете за сохранность учётных данных, включая пароль и второй фактор аутентификации. Операции с балансом и units выполняются от вашего имени после успешной авторизации.",
  "legal.terms.section.financialOps": "3. Финансовые операции",
  "legal.terms.financialOps.body":
    "Пополнение, вывод, первичные покупки и сделки на вторичном рынке подчиняются лимитам, комиссиям и процедурам compliance, описанным в кабинете и разделе «Комиссии».",
  "legal.terms.section.restrictions": "4. Ограничения",
  "legal.terms.restrictions.body":
    "Мы можем приостановить операции при подозрении на мошенничество, нарушение закона или условий использования. Решения compliance могут включать заморозку кошелька или отдельных операций.",
  "legal.terms.section.contacts": "5. Контакты",
  "legal.terms.contacts.beforeSupport": "По вопросам условий обращайтесь в",
  "legal.terms.contacts.supportLink": "поддержку Spliton",
  "legal.terms.contacts.afterSupport": ".",

  "legal.policy.loading": "Загрузка документа…",
  "legal.policy.notFound": "Активная версия документа не опубликована.",
  "legal.policy.unavailable": "Документ недоступен.",
  "legal.policy.adminHint": "Оператор может опубликовать политику в админке Spliton (Legal).",
  "legal.policy.versionPublished": "Версия {version} · опубликовано {date}",
  "legal.policy.versionOnly": "Версия {version}",

  "legal.policy.type.TERMS_OF_SERVICE": "Условия использования",
  "legal.policy.type.PRIVACY_POLICY": "Политика конфиденциальности",
  "legal.policy.type.RISK_DISCLOSURE": "Раскрытие рисков",
  "legal.policy.type.MARKET_RULES": "Правила рынка",
  "legal.policy.type.FEE_POLICY": "Политика комиссий",
  "legal.policy.type.AML_POLICY": "AML / противодействие отмыванию",
  "legal.policy.type.KYC_POLICY": "Политика KYC",
  "legal.policy.type.INVESTOR_AGREEMENT": "Соглашение инвестора",
  "legal.policy.type.ROYALTY_RIGHTS_DISCLOSURE": "Раскрытие прав на роялти",
  "legal.policy.type.SECONDARY_MARKET_RULES": "Правила вторичного рынка",
  "legal.policy.type.WITHDRAWAL_POLICY": "Политика вывода",
  "legal.policy.type.COOKIE_POLICY": "Cookie",

  "legal.document.titleSuffix": "Правовой документ",
  "legal.document.description": "Актуальная политика {brand}.",
};

const EN: Record<string, string> = {
  "legal.notice.lawyerReview":
    "Spliton draft. Requires legal review before production and operations with real funds.",

  "legal.privacy.title": "Privacy Policy",
  "legal.privacy.description": "{brand} platform privacy policy.",
  "legal.privacy.updated": "Last updated: June 2026",
  "legal.privacy.apiLink": "Current version from the Spliton API",
  "legal.privacy.intro":
    "{brand} processes personal data for registration, email verification, financial operations, support, and compliance requirements.",
  "legal.privacy.section.dataCollected": "What data we collect",
  "legal.privacy.item.accountData": "Email, account profile, login history, and security audit events",
  "legal.privacy.item.walletData": "Wallet data, transactions, holdings, and trade history",
  "legal.privacy.item.supportData": "Support requests and compliance review materials (when required)",
  "legal.privacy.section.usage": "How we use data",
  "legal.privacy.usage.body":
    "To perform our contract with users, prevent fraud, calculate fees, generate reports for authorized operators, and improve the service.",
  "legal.privacy.section.storage": "Storage and sharing",
  "legal.privacy.storage.body":
    "Data is stored in secure infrastructure (PostgreSQL / Supabase). Secrets and service role keys are not exposed to the frontend. Report exports are available only to authorized staff roles with audit logging.",
  "legal.privacy.section.rights": "Your rights",
  "legal.privacy.rights.beforeSupport": "You may request access, correction, or deletion of data via",
  "legal.privacy.rights.supportLink": "Spliton support",
  "legal.privacy.rights.afterSupport": ", subject to obligations to retain financial records.",

  "legal.terms.title": "Terms of Service",
  "legal.terms.description": "{brand} platform terms of service.",
  "legal.terms.updated": "Last updated: June 2026",
  "legal.terms.apiLink": "Current version from the Spliton API",
  "legal.terms.intro":
    "These terms govern access to the {brand} platform and use of revenue share rights accounting, USDT (TRC20) wallet, and the internal units market.",
  "legal.terms.section.platformRole": "1. Platform role",
  "legal.terms.platformRole.body":
    "{brand} provides technology infrastructure for tracking shares in music release revenue distribution. The platform is not a broker, bank, or securities issuer.",
  "legal.terms.section.accountSecurity": "2. Account and security",
  "legal.terms.accountSecurity.body":
    "You are responsible for safeguarding credentials, including your password and second-factor authentication. Balance and unit operations are performed on your behalf after successful authorization.",
  "legal.terms.section.financialOps": "3. Financial operations",
  "legal.terms.financialOps.body":
    "Deposits, withdrawals, primary purchases, and secondary market trades are subject to limits, fees, and compliance procedures described in the dashboard and Fees section.",
  "legal.terms.section.restrictions": "4. Restrictions",
  "legal.terms.restrictions.body":
    "We may suspend operations if fraud, legal violations, or terms breaches are suspected. Compliance decisions may include freezing the wallet or specific operations.",
  "legal.terms.section.contacts": "5. Contact",
  "legal.terms.contacts.beforeSupport": "For questions about these terms, contact",
  "legal.terms.contacts.supportLink": "Spliton support",
  "legal.terms.contacts.afterSupport": ".",

  "legal.policy.loading": "Loading document…",
  "legal.policy.notFound": "No active version of this document has been published.",
  "legal.policy.unavailable": "Document unavailable.",
  "legal.policy.adminHint": "An operator can publish the policy in the Spliton admin panel (Legal).",
  "legal.policy.versionPublished": "Version {version} · published {date}",
  "legal.policy.versionOnly": "Version {version}",

  "legal.policy.type.TERMS_OF_SERVICE": "Terms of Service",
  "legal.policy.type.PRIVACY_POLICY": "Privacy Policy",
  "legal.policy.type.RISK_DISCLOSURE": "Risk Disclosure",
  "legal.policy.type.MARKET_RULES": "Market Rules",
  "legal.policy.type.FEE_POLICY": "Fee Policy",
  "legal.policy.type.AML_POLICY": "AML / Anti-Money Laundering",
  "legal.policy.type.KYC_POLICY": "KYC Policy",
  "legal.policy.type.INVESTOR_AGREEMENT": "Investor Agreement",
  "legal.policy.type.ROYALTY_RIGHTS_DISCLOSURE": "Royalty Rights Disclosure",
  "legal.policy.type.SECONDARY_MARKET_RULES": "Secondary Market Rules",
  "legal.policy.type.WITHDRAWAL_POLICY": "Withdrawal Policy",
  "legal.policy.type.COOKIE_POLICY": "Cookie Policy",

  "legal.document.titleSuffix": "Legal document",
  "legal.document.description": "Current {brand} policy.",
};

const ES: Record<string, string> = {
  "legal.notice.lawyerReview":
    "Borrador de Spliton. Requiere revisión legal antes de producción y operaciones con fondos reales.",

  "legal.privacy.title": "Política de privacidad",
  "legal.privacy.description": "Política de privacidad de la plataforma {brand}.",
  "legal.privacy.updated": "Última actualización: junio de 2026",
  "legal.privacy.apiLink": "Versión actual desde la API de Spliton",
  "legal.privacy.intro":
    "{brand} procesa datos personales para registro, verificación de email, operaciones financieras, soporte y cumplimiento normativo.",
  "legal.privacy.section.dataCollected": "Qué datos recopilamos",
  "legal.privacy.item.accountData": "Email, perfil de cuenta, historial de accesos y eventos de auditoría de seguridad",
  "legal.privacy.item.walletData": "Datos de billetera, transacciones, holdings e historial de operaciones",
  "legal.privacy.item.supportData": "Solicitudes de soporte y materiales de revisión de compliance (cuando sea necesario)",
  "legal.privacy.section.usage": "Cómo usamos los datos",
  "legal.privacy.usage.body":
    "Para ejecutar el contrato con el usuario, prevenir fraude, calcular comisiones, generar informes para operadores autorizados y mejorar el servicio.",
  "legal.privacy.section.storage": "Almacenamiento y transferencia",
  "legal.privacy.storage.body":
    "Los datos se almacenan en infraestructura segura (PostgreSQL / Supabase). Los secretos y claves service role no se exponen en el frontend. La exportación de informes está disponible solo para roles staff autorizados con registro de auditoría.",
  "legal.privacy.section.rights": "Sus derechos",
  "legal.privacy.rights.beforeSupport": "Puede solicitar acceso, corrección o eliminación de datos a través de",
  "legal.privacy.rights.supportLink": "soporte de Spliton",
  "legal.privacy.rights.afterSupport": ", sujeto a las obligaciones de conservación de registros financieros.",

  "legal.terms.title": "Términos de servicio",
  "legal.terms.description": "Términos de servicio de la plataforma {brand}.",
  "legal.terms.updated": "Última actualización: junio de 2026",
  "legal.terms.apiLink": "Versión actual desde la API de Spliton",
  "legal.terms.intro":
    "Estos términos regulan el acceso a la plataforma {brand} y el uso de servicios de contabilidad de revenue share rights, billetera USDT (TRC20) y mercado interno de units.",
  "legal.terms.section.platformRole": "1. Rol de la plataforma",
  "legal.terms.platformRole.body":
    "{brand} proporciona infraestructura tecnológica para el seguimiento de participaciones en la distribución de ingresos de lanzamientos musicales. La plataforma no es un bróker, banco ni emisor de valores.",
  "legal.terms.section.accountSecurity": "2. Cuenta y seguridad",
  "legal.terms.accountSecurity.body":
    "Usted es responsable de la seguridad de sus credenciales, incluida la contraseña y la autenticación de segundo factor. Las operaciones con saldo y units se realizan en su nombre tras la autorización exitosa.",
  "legal.terms.section.financialOps": "3. Operaciones financieras",
  "legal.terms.financialOps.body":
    "Depósitos, retiros, compras primarias y operaciones en el mercado secundario están sujetos a límites, comisiones y procedimientos de compliance descritos en el panel y la sección de Comisiones.",
  "legal.terms.section.restrictions": "4. Restricciones",
  "legal.terms.restrictions.body":
    "Podemos suspender operaciones ante sospecha de fraude, incumplimiento legal o de los términos. Las decisiones de compliance pueden incluir la congelación de la billetera u operaciones específicas.",
  "legal.terms.section.contacts": "5. Contacto",
  "legal.terms.contacts.beforeSupport": "Para consultas sobre los términos, contacte con",
  "legal.terms.contacts.supportLink": "soporte de Spliton",
  "legal.terms.contacts.afterSupport": ".",

  "legal.policy.loading": "Cargando documento…",
  "legal.policy.notFound": "No se ha publicado una versión activa del documento.",
  "legal.policy.unavailable": "Documento no disponible.",
  "legal.policy.adminHint": "Un operador puede publicar la política en el panel de administración de Spliton (Legal).",
  "legal.policy.versionPublished": "Versión {version} · publicado {date}",
  "legal.policy.versionOnly": "Versión {version}",

  "legal.policy.type.TERMS_OF_SERVICE": "Términos de servicio",
  "legal.policy.type.PRIVACY_POLICY": "Política de privacidad",
  "legal.policy.type.RISK_DISCLOSURE": "Divulgación de riesgos",
  "legal.policy.type.MARKET_RULES": "Reglas del mercado",
  "legal.policy.type.FEE_POLICY": "Política de comisiones",
  "legal.policy.type.AML_POLICY": "AML / prevención de lavado de dinero",
  "legal.policy.type.KYC_POLICY": "Política KYC",
  "legal.policy.type.INVESTOR_AGREEMENT": "Acuerdo de inversor",
  "legal.policy.type.ROYALTY_RIGHTS_DISCLOSURE": "Divulgación de derechos de regalías",
  "legal.policy.type.SECONDARY_MARKET_RULES": "Reglas del mercado secundario",
  "legal.policy.type.WITHDRAWAL_POLICY": "Política de retiros",
  "legal.policy.type.COOKIE_POLICY": "Política de cookies",

  "legal.document.titleSuffix": "Documento legal",
  "legal.document.description": "Política actual de {brand}.",
};

const PT: Record<string, string> = {
  "legal.notice.lawyerReview":
    "Rascunho Spliton. Requer revisão jurídica antes de produção e operações com fundos reais.",

  "legal.privacy.title": "Política de privacidade",
  "legal.privacy.description": "Política de privacidade da plataforma {brand}.",
  "legal.privacy.updated": "Última atualização: junho de 2026",
  "legal.privacy.apiLink": "Versão atual da API Spliton",
  "legal.privacy.intro":
    "A {brand} processa dados pessoais para registo, verificação de email, operações financeiras, suporte e conformidade regulatória.",
  "legal.privacy.section.dataCollected": "Quais dados recolhemos",
  "legal.privacy.item.accountData": "Email, perfil da conta, histórico de acessos e eventos de auditoria de segurança",
  "legal.privacy.item.walletData": "Dados da carteira, transações, holdings e histórico de negociações",
  "legal.privacy.item.supportData": "Pedidos de suporte e materiais de revisão de compliance (quando necessário)",
  "legal.privacy.section.usage": "Como usamos os dados",
  "legal.privacy.usage.body":
    "Para cumprir o contrato com o utilizador, prevenir fraude, calcular comissões, gerar relatórios para operadores autorizados e melhorar o serviço.",
  "legal.privacy.section.storage": "Armazenamento e partilha",
  "legal.privacy.storage.body":
    "Os dados são armazenados em infraestrutura segura (PostgreSQL / Supabase). Segredos e chaves service role não são expostos no frontend. Exportação de relatórios disponível apenas para funções staff autorizadas com registo de auditoria.",
  "legal.privacy.section.rights": "Os seus direitos",
  "legal.privacy.rights.beforeSupport": "Pode solicitar acesso, correção ou eliminação de dados através do",
  "legal.privacy.rights.supportLink": "suporte Spliton",
  "legal.privacy.rights.afterSupport": ", sujeito às obrigações de retenção de registos financeiros.",

  "legal.terms.title": "Termos de utilização",
  "legal.terms.description": "Termos de utilização da plataforma {brand}.",
  "legal.terms.updated": "Última atualização: junho de 2026",
  "legal.terms.apiLink": "Versão atual da API Spliton",
  "legal.terms.intro":
    "Estes termos regulam o acesso à plataforma {brand} e a utilização dos serviços de contabilização de revenue share rights, carteira USDT (TRC20) e mercado interno de units.",
  "legal.terms.section.platformRole": "1. Papel da plataforma",
  "legal.terms.platformRole.body":
    "A {brand} fornece infraestrutura tecnológica para o registo de participações na distribuição de receitas de lançamentos musicais. A plataforma não é corretora, banco nem emissora de valores mobiliários.",
  "legal.terms.section.accountSecurity": "2. Conta e segurança",
  "legal.terms.accountSecurity.body":
    "É responsável pela segurança das credenciais, incluindo palavra-passe e autenticação de segundo fator. Operações com saldo e units são executadas em seu nome após autorização bem-sucedida.",
  "legal.terms.section.financialOps": "3. Operações financeiras",
  "legal.terms.financialOps.body":
    "Depósitos, levantamentos, compras primárias e negociações no mercado secundário estão sujeitos a limites, comissões e procedimentos de compliance descritos no painel e na secção de Comissões.",
  "legal.terms.section.restrictions": "4. Restrições",
  "legal.terms.restrictions.body":
    "Podemos suspender operações em caso de suspeita de fraude, violação legal ou dos termos. Decisões de compliance podem incluir congelamento da carteira ou de operações específicas.",
  "legal.terms.section.contacts": "5. Contactos",
  "legal.terms.contacts.beforeSupport": "Para questões sobre os termos, contacte o",
  "legal.terms.contacts.supportLink": "suporte Spliton",
  "legal.terms.contacts.afterSupport": ".",

  "legal.policy.loading": "A carregar documento…",
  "legal.policy.notFound": "Nenhuma versão ativa do documento foi publicada.",
  "legal.policy.unavailable": "Documento indisponível.",
  "legal.policy.adminHint": "Um operador pode publicar a política no painel de administração Spliton (Legal).",
  "legal.policy.versionPublished": "Versão {version} · publicado {date}",
  "legal.policy.versionOnly": "Versão {version}",

  "legal.policy.type.TERMS_OF_SERVICE": "Termos de utilização",
  "legal.policy.type.PRIVACY_POLICY": "Política de privacidade",
  "legal.policy.type.RISK_DISCLOSURE": "Divulgação de riscos",
  "legal.policy.type.MARKET_RULES": "Regras do mercado",
  "legal.policy.type.FEE_POLICY": "Política de comissões",
  "legal.policy.type.AML_POLICY": "AML / combate ao branqueamento de capitais",
  "legal.policy.type.KYC_POLICY": "Política KYC",
  "legal.policy.type.INVESTOR_AGREEMENT": "Acordo de investidor",
  "legal.policy.type.ROYALTY_RIGHTS_DISCLOSURE": "Divulgação de direitos de royalties",
  "legal.policy.type.SECONDARY_MARKET_RULES": "Regras do mercado secundário",
  "legal.policy.type.WITHDRAWAL_POLICY": "Política de levantamentos",
  "legal.policy.type.COOKIE_POLICY": "Política de cookies",

  "legal.document.titleSuffix": "Documento legal",
  "legal.document.description": "Política atual da {brand}.",
};

export const LEGAL_MESSAGES: Record<AppLocale, Record<string, string>> = {
  ru: RU,
  en: EN,
  es: ES,
  pt: PT,
};

export const LEGAL_POLICY_TYPES = [
  "TERMS_OF_SERVICE",
  "PRIVACY_POLICY",
  "RISK_DISCLOSURE",
  "MARKET_RULES",
  "FEE_POLICY",
  "AML_POLICY",
  "KYC_POLICY",
  "INVESTOR_AGREEMENT",
  "ROYALTY_RIGHTS_DISCLOSURE",
  "SECONDARY_MARKET_RULES",
  "WITHDRAWAL_POLICY",
  "COOKIE_POLICY",
] as const;
