export type EligibilityResult = {
  allowed: boolean;
  blockingCode?: string;
  userMessage: string;
  adminMessage?: string;
  requiredActions?: string[];
  policyLinks?: string[];
  missingPolicyTypes?: string[];
};

export const ELIGIBILITY_MESSAGES = {
  EMAIL_NOT_VERIFIED: 'Подтвердите email для доступа к операциям.',
  CONSENT_REQUIRED: 'Примите актуальные условия и раскрытия рисков в профиле.',
  LEGAL_POLICY_MISSING:
    'Юридические документы обновляются. Операция временно недоступна.',
  KYC_REQUIRED: 'Требуется верификация личности (KYC).',
  KYC_IN_REVIEW: 'Ваш аккаунт на проверке compliance.',
  KYC_REJECTED: 'Верификация отклонена. Обратитесь в поддержку.',
  COUNTRY_BLOCKED: 'Операция недоступна в вашей юрисдикции.',
  AML_BLOCKED: 'Операция ограничена по решению AML.',
  ACCOUNT_RESTRICTED: 'Операция временно недоступна. Обратитесь в поддержку.',
  FEATURE_DISABLED: 'Операция временно отключена на платформе.',
} as const;
