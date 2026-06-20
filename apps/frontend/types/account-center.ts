import type { UserMeProfile } from "@/services/user-me.service";

/** Security recommendation shown in overview / security center (P0 backend extension). */
export type SecurityRecommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  /** i18n key under profile.security.recommendations.* */
  titleKey: string;
  /** Optional deep-link within account center or auth flow */
  actionHref?: string;
  completed: boolean;
};

/**
 * Server-computed security posture (planned P0: extend GET /users/me).
 * Until backend ships, UI must not show misleading scores in live mode.
 */
export type SecurityScoreSnapshot = {
  score: number;
  maxScore: number;
  level: "low" | "medium" | "high";
  recommendations: SecurityRecommendation[];
};

/**
 * Account setup completeness for overview gamification (planned P0).
 */
export type AccountCompletenessSnapshot = {
  score: number;
  maxScore: number;
  completedStepIds: string[];
  pendingStepIds: string[];
};

/** Aggregated overview payload — composes existing APIs + planned me extensions. */
export type ProfileOverviewSnapshot = {
  me: UserMeProfile;
  securityScore?: SecurityScoreSnapshot | null;
  completeness?: AccountCompletenessSnapshot | null;
  kycStatus?: string | null;
  kycLevel?: string | null;
  openSupportTickets?: number;
  unreadNotifications?: number;
  pendingWithdrawals?: number;
};
