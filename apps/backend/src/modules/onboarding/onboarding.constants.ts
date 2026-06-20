export type OnboardingStepId =
  | 'verify_email'
  | 'complete_profile'
  | 'explore_catalog'
  | 'deposit_wallet'
  | 'first_purchase'
  | 'view_portfolio'
  | 'explore_secondary'
  | 'enable_2fa'
  | 'open_support';

export type OnboardingStepDef = {
  id: OnboardingStepId;
  title: string;
  description: string;
  actionUrl: string;
  priority: number;
  required: boolean;
};

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    id: 'verify_email',
    title: 'Подтвердите email',
    description: 'Подтверждение почты нужно для безопасности аккаунта и финансовых операций.',
    actionUrl: '/dashboard/profile?tab=verification',
    priority: 1,
    required: true,
  },
  {
    id: 'complete_profile',
    title: 'Заполните профиль',
    description: 'Укажите отображаемое имя и регион — так мы персонализируем кабинет.',
    actionUrl: '/dashboard/profile?tab=settings',
    priority: 2,
    required: true,
  },
  {
    id: 'explore_catalog',
    title: 'Откройте каталог релизов',
    description: 'Посмотрите доступные релизы и условия revenue share.',
    actionUrl: '/dashboard/catalog',
    priority: 3,
    required: true,
  },
  {
    id: 'deposit_wallet',
    title: 'Пополните кошелёк USDT',
    description: 'Для покупки units нужен баланс USDT (TRC20) на платформе.',
    actionUrl: '/assets/payouts/deposit',
    priority: 4,
    required: true,
  },
  {
    id: 'first_purchase',
    title: 'Купите первые units',
    description: 'Примите участие в первичном раунде или купите на вторичном рынке.',
    actionUrl: '/dashboard/catalog',
    priority: 5,
    required: true,
  },
  {
    id: 'view_portfolio',
    title: 'Посмотрите портфель',
    description: 'Проверьте позиции, выплаты и историю операций.',
    actionUrl: '/assets/payouts',
    priority: 6,
    required: true,
  },
  {
    id: 'explore_secondary',
    title: 'Изучите вторичный рынок',
    description: 'Передача units между пользователями — по правилам Spliton.',
    actionUrl: '/dashboard/secondary-market',
    priority: 7,
    required: false,
  },
  {
    id: 'enable_2fa',
    title: 'Включите 2FA',
    description: 'Дополнительная защита входа и чувствительных операций.',
    actionUrl: '/dashboard/profile?tab=security',
    priority: 8,
    required: false,
  },
  {
    id: 'open_support',
    title: 'Знайте, как связаться с поддержкой',
    description: 'Центр поддержки и FAQ — если понадобится помощь.',
    actionUrl: '/dashboard/support',
    priority: 9,
    required: false,
  },
];
