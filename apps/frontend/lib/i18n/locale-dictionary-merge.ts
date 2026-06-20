import type { AppLocale } from "./types";
import { AUTH_MESSAGES } from "./auth-messages";
import { COMMON_MESSAGES } from "./common-messages";
import { CRITICAL_MESSAGES } from "./critical-messages";
import { DASHBOARD_MESSAGES } from "./dashboard-messages";
import { ARTIST_MESSAGES } from "./artist-messages";
import { STATEMENTS_MESSAGES } from "./statements-messages";
import { ERROR_MESSAGES } from "./error-messages";
import { FEES_MESSAGES } from "./fees-messages";
import { FINANCIAL_MESSAGES } from "./financial-messages";
import { CATALOG_MESSAGES } from "./catalog-messages";
import { ANALYTICS_MESSAGES } from "./analytics-messages";
import { ANALYTICS_DETAIL_PAGE_MESSAGES } from "./analytics-detail-page-messages";
import { DISPUTES_MESSAGES } from "./disputes-messages";
import { PROFILE_MESSAGES } from "./profile-messages";
import { MARKET_OVERVIEW_MESSAGES } from "./market-overview-messages";
import { NEWS_MESSAGES } from "./news-messages";
import { PARTNER_MESSAGES } from "./partner-messages";
import { REFERRAL_MESSAGES } from "./referral-messages";
import { SECONDARY_MARKET_MESSAGES } from "./secondary-market-messages";
import { SECONDARY_MARKET_RULES_MESSAGES } from "./secondary-market-rules-messages";
import { SHELL_MESSAGES } from "./shell-messages";
import { SUPPORT_MESSAGES } from "./support-messages";
import { SYSTEM_STATUS_MESSAGES } from "./system-status-messages";
import { TRUST_MESSAGES } from "./trust-messages";
import { LEGAL_MESSAGES } from "./legal-messages";
import { PREVIEW_MESSAGES } from "./preview-messages";
import { GUIDE_MESSAGES } from "./guide-messages";
import { WIDGET_MESSAGES } from "./widget-messages";
import { DOCUMENTS_MESSAGES } from "./documents-messages";

/** User-facing locales without admin portal strings (~194KB saved on non-admin routes). */
export function mergeAppLocale(
  locale: AppLocale,
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    ...COMMON_MESSAGES[locale],
    ...SHELL_MESSAGES[locale],
    ...CATALOG_MESSAGES[locale],
    ...SECONDARY_MARKET_MESSAGES[locale],
    ...SECONDARY_MARKET_RULES_MESSAGES[locale],
    ...DISPUTES_MESSAGES[locale],
    ...PROFILE_MESSAGES[locale],
    ...ANALYTICS_MESSAGES[locale],
    ...ANALYTICS_DETAIL_PAGE_MESSAGES[locale],
    ...CRITICAL_MESSAGES[locale],
    ...ERROR_MESSAGES[locale],
    ...AUTH_MESSAGES[locale],
    ...FINANCIAL_MESSAGES[locale],
    ...WIDGET_MESSAGES[locale],
    ...DASHBOARD_MESSAGES[locale],
    ...ARTIST_MESSAGES[locale],
    ...STATEMENTS_MESSAGES[locale],
    ...MARKET_OVERVIEW_MESSAGES[locale],
    ...NEWS_MESSAGES[locale],
    ...FEES_MESSAGES[locale],
    ...SUPPORT_MESSAGES[locale],
    ...SYSTEM_STATUS_MESSAGES[locale],
    ...TRUST_MESSAGES[locale],
    ...REFERRAL_MESSAGES[locale],
    ...PARTNER_MESSAGES[locale],
    ...LEGAL_MESSAGES[locale],
    ...PREVIEW_MESSAGES[locale],
    ...GUIDE_MESSAGES[locale],
    ...DOCUMENTS_MESSAGES[locale],
    ...extra,
  };
}
