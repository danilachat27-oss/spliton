import type {
  AppLocale,
  SystemAnnouncement,
  SystemAnnouncementAudience,
} from '@prisma/client';
import { normalizeAppLocale } from '../../common/i18n/app-locale';

export type AnnouncementSurface = 'public' | 'app' | 'admin';

export type AnnouncementTranslation = {
  title?: string;
  message?: string;
  shortMessage?: string;
  actionLabel?: string;
};

export type AnnouncementTranslations = Partial<
  Record<AppLocale, AnnouncementTranslation>
>;

export function parseTranslations(raw: unknown): AnnouncementTranslations {
  if (!raw || typeof raw !== 'object') return {};
  return raw as AnnouncementTranslations;
}

export function resolveAnnouncementLocale(
  requested: string | undefined,
): AppLocale {
  return normalizeAppLocale(requested);
}

export function localizedAnnouncementFields(
  row: Pick<
    SystemAnnouncement,
    'title' | 'message' | 'shortMessage' | 'actionLabel' | 'translations'
  >,
  locale: AppLocale,
) {
  const translations = parseTranslations(row.translations);
  const localized =
    translations[locale] ?? translations.en ?? translations.ru ?? {};
  return {
    title: localized.title?.trim() || row.title,
    message: localized.message?.trim() || row.message,
    shortMessage: localized.shortMessage?.trim() || row.shortMessage,
    actionLabel: localized.actionLabel?.trim() || row.actionLabel,
  };
}

export function isAnnouncementActiveNow(
  row: Pick<SystemAnnouncement, 'status' | 'startsAt' | 'endsAt'>,
  now = new Date(),
): boolean {
  if (row.status !== 'ACTIVE' && row.status !== 'SCHEDULED') return false;
  if (row.startsAt && row.startsAt > now) return false;
  if (row.endsAt && row.endsAt < now) return false;
  return true;
}

export function matchesAnnouncementAudience(params: {
  audience: SystemAnnouncementAudience;
  targetRoles: string[];
  isAuthenticated: boolean;
  userRoles: string[];
  isAdminSurface: boolean;
}): boolean {
  const { audience, targetRoles, isAuthenticated, userRoles, isAdminSurface } =
    params;

  switch (audience) {
    case 'ALL':
      return true;
    case 'GUESTS':
      return !isAuthenticated;
    case 'USERS':
      return isAuthenticated && !isAdminSurface;
    case 'ADMINS':
      return isAdminSurface || userRoles.some((r) => r.endsWith('_MANAGER') || r === 'ADMIN' || r === 'SUPER_ADMIN');
    case 'ROLE':
      if (!targetRoles.length) return false;
      return targetRoles.some((role) => userRoles.includes(role));
    default:
      return false;
  }
}

export function matchesAnnouncementSurface(
  row: Pick<SystemAnnouncement, 'showOnPublic' | 'showInApp' | 'showInAdmin'>,
  surface: AnnouncementSurface,
): boolean {
  if (surface === 'public') return row.showOnPublic;
  if (surface === 'admin') return row.showInAdmin;
  return row.showInApp;
}

export function isSafeAnnouncementActionUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return url.startsWith('/');
  }
}
