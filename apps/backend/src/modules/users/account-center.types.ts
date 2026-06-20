export type AccountCompletenessLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'COMPLETE';
export type SecurityLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type RecommendationSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type SecurityRecommendation = {
  code: string;
  title: string;
  description: string;
  severity: RecommendationSeverity;
  isCompleted: boolean;
  actionHref?: string;
};

export type AccountCenterSummary = {
  accountCompleteness: {
    score: number;
    maxScore: number;
    level: AccountCompletenessLevel;
    completedItems: string[];
    missingItems: string[];
  };
  security: {
    score: number;
    maxScore: number;
    level: SecurityLevel;
    recommendations: SecurityRecommendation[];
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    passwordSet: boolean;
    passwordChangedAt?: string | null;
    activeSessionsCount?: number;
    lastLoginAt?: string | null;
  };
  verification: {
    status: string;
    level?: string | null;
    canDeposit?: boolean;
    canWithdraw?: boolean;
    canBuyPrimary?: boolean;
    canTradeSecondary?: boolean;
  };
  legal: {
    missingRequiredConsentsCount: number;
    hasAcceptedCurrentRequiredPolicies: boolean;
  };
  activity: {
    openSupportTicketsCount?: number;
    openDisputesCount?: number;
    unreadNotificationsCount?: number;
    pendingWithdrawalsCount?: number;
  };
  securityPreferences: {
    withdrawalEmailConfirmationEnabled: boolean;
    withdrawalAddressWhitelistEnabled: boolean;
    suspiciousLoginAlertsEnabled: boolean;
    emailSecurityNotificationsEnabled: boolean;
    enforcementReady: boolean;
  };
  recentSecurityEvents: Array<{
    id: string;
    action: string;
    ip: string | null;
    userAgent: string | null;
    createdAt: string;
  }>;
};

export type UserSecurityPreferencesDto = {
  withdrawalEmailConfirmationEnabled: boolean;
  withdrawalAddressWhitelistEnabled: boolean;
  suspiciousLoginAlertsEnabled: boolean;
};
