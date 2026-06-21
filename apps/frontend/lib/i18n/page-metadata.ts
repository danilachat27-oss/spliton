import type { Metadata } from "next";



import { CRITICAL_MESSAGES } from "@/lib/i18n/critical-messages";

import { DASHBOARD_MESSAGES } from "@/lib/i18n/dashboard-messages";
import { ANALYTICS_MESSAGES } from "@/lib/i18n/analytics-messages";
import { DISPUTES_MESSAGES } from "@/lib/i18n/disputes-messages";
import { PROFILE_MESSAGES } from "@/lib/i18n/profile-messages";
import { FEES_MESSAGES } from "@/lib/i18n/fees-messages";
import { FINANCIAL_MESSAGES, tf } from "@/lib/i18n/financial-messages";
import { MARKET_OVERVIEW_MESSAGES } from "@/lib/i18n/market-overview-messages";
import { NEWS_MESSAGES } from "@/lib/i18n/news-messages";
import { PARTNER_MESSAGES } from "@/lib/i18n/partner-messages";
import { REFERRAL_MESSAGES } from "@/lib/i18n/referral-messages";
import { SECONDARY_MARKET_MESSAGES } from "@/lib/i18n/secondary-market-messages";
import { SUPPORT_MESSAGES } from "@/lib/i18n/support-messages";
import { SYSTEM_STATUS_MESSAGES } from "@/lib/i18n/system-status-messages";
import { TRUST_MESSAGES } from "@/lib/i18n/trust-messages";
import { LEGAL_MESSAGES } from "@/lib/i18n/legal-messages";
import { DOCUMENTS_MESSAGES } from "@/lib/i18n/documents-messages";
import { SHELL_MESSAGES } from "@/lib/i18n/shell-messages";

import { resolveServerLocale } from "@/lib/i18n/server-locale";

import type { AppLocale } from "@/lib/i18n/types";



const DEFAULT_LOCALE: AppLocale = "ru";



export function pageMeta(

  titleKey: string,

  descriptionKey: string,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = FINANCIAL_MESSAGES[locale];

  return {

    title: m[titleKey] ?? titleKey,

    description: m[descriptionKey] ?? descriptionKey,

  };

}



export function pageMetaTf(

  titleKey: string,

  descriptionKey: string,

  vars: Record<string, string>,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = FINANCIAL_MESSAGES[locale];

  return {

    title: tf(m[titleKey] ?? titleKey, vars),

    description: tf(m[descriptionKey] ?? descriptionKey, vars),

  };

}



export function criticalPageMeta(

  titleKey: string,

  descriptionKey: string,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = CRITICAL_MESSAGES[locale];

  return {

    title: m[titleKey] ?? titleKey,

    description: m[descriptionKey] ?? descriptionKey,

  };

}



export function criticalPageMetaTf(

  titleKey: string,

  descriptionKey: string,

  vars: Record<string, string>,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = CRITICAL_MESSAGES[locale];

  return {

    title: tf(m[titleKey] ?? titleKey, vars),

    description: tf(m[descriptionKey] ?? descriptionKey, vars),

  };

}



export function rootLayoutMeta(locale: AppLocale = DEFAULT_LOCALE): Metadata {

  const m = CRITICAL_MESSAGES[locale];

  const brand = m["meta.root.title"] ?? "Spliton";

  return {

    title: {

      default: brand,

      template: `%s · ${brand}`,

    },

    description: m["meta.root.description"] ?? "",

    manifest: "/manifest.json",

    icons: {
      icon: [
        {
          url: "/images/LOGO/mini-logo.png",
          type: "image/png",
          sizes: "any",
        },
      ],
      shortcut: "/images/LOGO/mini-logo.png",
      apple: "/images/LOGO/mini-logo.png",
    },

    appleWebApp: {

      capable: true,

      title: brand,

    },

  };

}



export async function pageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return pageMeta(titleKey, descriptionKey, locale);

}



export async function pageMetaTfAsync(

  titleKey: string,

  descriptionKey: string,

  vars: Record<string, string>,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return pageMetaTf(titleKey, descriptionKey, vars, locale);

}



export async function criticalPageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return criticalPageMeta(titleKey, descriptionKey, locale);

}



export async function criticalPageMetaTfAsync(

  titleKey: string,

  descriptionKey: string,

  vars: Record<string, string>,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return criticalPageMetaTf(titleKey, descriptionKey, vars, locale);

}



export async function rootLayoutMetaAsync(): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return rootLayoutMeta(locale);

}



export function secondaryMarketPageMeta(

  titleKey: string,

  descriptionKey: string,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = SECONDARY_MARKET_MESSAGES[locale];

  return {

    title: m[titleKey] ?? titleKey,

    description: m[descriptionKey] ?? descriptionKey,

  };

}



export function secondaryMarketPageMetaTf(

  titleKey: string,

  descriptionKey: string,

  vars: Record<string, string>,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = SECONDARY_MARKET_MESSAGES[locale];

  return {

    title: tf(m[titleKey] ?? titleKey, vars),

    description: tf(m[descriptionKey] ?? descriptionKey, vars),

  };

}



export async function secondaryMarketPageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return secondaryMarketPageMeta(titleKey, descriptionKey, locale);

}



export async function secondaryMarketPageMetaTfAsync(

  titleKey: string,

  descriptionKey: string,

  vars: Record<string, string>,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return secondaryMarketPageMetaTf(titleKey, descriptionKey, vars, locale);

}



export function disputesPageMeta(

  titleKey: string,

  descriptionKey: string,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = DISPUTES_MESSAGES[locale];

  return {

    title: m[titleKey] ?? titleKey,

    description: m[descriptionKey] ?? descriptionKey,

  };

}



export async function disputesPageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return disputesPageMeta(titleKey, descriptionKey, locale);

}



export function profilePageMeta(

  titleKey: string,

  descriptionKey: string,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = PROFILE_MESSAGES[locale];

  return {

    title: m[titleKey] ?? titleKey,

    description: m[descriptionKey] ?? descriptionKey,

  };

}



export async function profilePageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return profilePageMeta(titleKey, descriptionKey, locale);

}



export function analyticsReleasePageMeta(

  titleKey: string,

  descriptionKey: string,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = ANALYTICS_MESSAGES[locale];

  return {

    title: m[titleKey] ?? titleKey,

    description: m[descriptionKey] ?? descriptionKey,

  };

}



export function analyticsReleasePageMetaTf(

  titleKey: string,

  descriptionKey: string,

  vars: Record<string, string>,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = ANALYTICS_MESSAGES[locale];

  return {

    title: tf(m[titleKey] ?? titleKey, vars),

    description: tf(m[descriptionKey] ?? descriptionKey, vars),

  };

}



export async function analyticsReleasePageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return analyticsReleasePageMeta(titleKey, descriptionKey, locale);

}



export async function analyticsReleasePageMetaTfAsync(

  titleKey: string,

  descriptionKey: string,

  vars: Record<string, string>,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return analyticsReleasePageMetaTf(titleKey, descriptionKey, vars, locale);

}



function domainPageMeta(

  messages: Record<AppLocale, Record<string, string>>,

  titleKey: string,

  descriptionKey: string,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = messages[locale];

  return {

    title: m[titleKey] ?? titleKey,

    description: m[descriptionKey] ?? descriptionKey,

  };

}



async function domainPageMetaAsync(

  messages: Record<AppLocale, Record<string, string>>,

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return domainPageMeta(messages, titleKey, descriptionKey, locale);

}



export async function dashboardPageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  return domainPageMetaAsync(DASHBOARD_MESSAGES, titleKey, descriptionKey);

}



export async function marketOverviewPageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  return domainPageMetaAsync(MARKET_OVERVIEW_MESSAGES, titleKey, descriptionKey);

}



export async function supportPageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  return domainPageMetaAsync(SUPPORT_MESSAGES, titleKey, descriptionKey);

}



export async function trustPageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  return domainPageMetaAsync(TRUST_MESSAGES, titleKey, descriptionKey);

}



export async function referralPageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  return domainPageMetaAsync(REFERRAL_MESSAGES, titleKey, descriptionKey);

}



export async function partnerPageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  return domainPageMetaAsync(PARTNER_MESSAGES, titleKey, descriptionKey);

}



export function systemStatusPageMeta(

  titleKey: string,

  descriptionKey: string,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = SYSTEM_STATUS_MESSAGES[locale];

  return {

    title: m[titleKey] ?? titleKey,

    description: m[descriptionKey] ?? descriptionKey,

  };

}



export async function systemStatusPageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return systemStatusPageMeta(titleKey, descriptionKey, locale);

}



export function newsPageMeta(

  titleKey: string,

  descriptionKey: string,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = NEWS_MESSAGES[locale];

  return {

    title: m[titleKey] ?? titleKey,

    description: m[descriptionKey] ?? descriptionKey,

  };

}



export async function newsPageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return newsPageMeta(titleKey, descriptionKey, locale);

}



export function feesPageMeta(

  titleKey: string,

  descriptionKey: string,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = FEES_MESSAGES[locale];

  return {

    title: m[titleKey] ?? titleKey,

    description: m[descriptionKey] ?? descriptionKey,

  };

}



export async function feesPageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return feesPageMeta(titleKey, descriptionKey, locale);

}



function legalPageMeta(

  titleKey: string,

  descriptionKey: string,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = LEGAL_MESSAGES[locale];

  return {

    title: m[titleKey] ?? titleKey,

    description: m[descriptionKey] ?? descriptionKey,

  };

}



function legalPageMetaTf(

  titleKey: string,

  descriptionKey: string,

  vars: Record<string, string>,

  locale: AppLocale = DEFAULT_LOCALE,

): Metadata {

  const m = LEGAL_MESSAGES[locale];

  return {

    title: m[titleKey] ?? titleKey,

    description: tf(m[descriptionKey] ?? descriptionKey, vars),

  };

}



export async function legalPageMetaAsync(

  titleKey: string,

  descriptionKey: string,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return legalPageMeta(titleKey, descriptionKey, locale);

}



export async function legalPageMetaTfAsync(

  titleKey: string,

  descriptionKey: string,

  vars: Record<string, string>,

): Promise<Metadata> {

  const locale = await resolveServerLocale();

  return legalPageMetaTf(titleKey, descriptionKey, vars, locale);

}

export function documentsPageMeta(
  titleKey: string,
  descriptionKey: string,
  locale: AppLocale = DEFAULT_LOCALE,
): Metadata {
  const m = DOCUMENTS_MESSAGES[locale];
  return {
    title: m[titleKey] ?? titleKey,
    description: m[descriptionKey] ?? descriptionKey,
  };
}

export async function documentsPageMetaAsync(
  titleKey: string,
  descriptionKey: string,
): Promise<Metadata> {
  const locale = await resolveServerLocale();
  return documentsPageMeta(titleKey, descriptionKey, locale);
}

export function notificationsPageMeta(
  titleKey: string,
  descriptionKey: string,
  locale: AppLocale = DEFAULT_LOCALE,
): Metadata {
  const m = SHELL_MESSAGES[locale];
  return {
    title: m[titleKey] ?? titleKey,
    description: m[descriptionKey] ?? descriptionKey,
  };
}

export async function notificationsPageMetaAsync(
  titleKey: string,
  descriptionKey: string,
): Promise<Metadata> {
  const locale = await resolveServerLocale();
  return notificationsPageMeta(titleKey, descriptionKey, locale);
}


