"use client";

import Link from "next/link";
import { SplitonLoadingView } from "@/components/ui/spliton-loader";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Lock, Mail, ShieldCheck } from "@/lib/lucide";

import { ProductDemoBanner } from "@/components/shared/product-demo-banner";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { ROUTES } from "@/constants/routes";
import { FeesPageTabs } from "@/components/fees/fees-page-tabs";
import { ProfilePasswordChangePanel } from "@/components/dashboard/profile/profile-password-change-panel";
import { ProfileSecurityEventsList } from "@/components/dashboard/profile/profile-security-events-list";
import { ProfileSessionsList } from "@/components/dashboard/profile/profile-sessions-list";
import { ProfileTwoFactorPanel } from "@/components/dashboard/profile/profile-two-factor-panel";
import { profileCardClass, profileSecondaryButtonClass } from "@/components/dashboard/profile/profile-ui";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/i18n/formatters";
import { profileSecurityLastActive } from "@/lib/i18n/profile-messages";
import {
  securityLevelBadgeLabel,
  securityRecommendationText,
} from "@/lib/profile/security-labels";
import { isAccountCenterDemoMode, isLiveAccountEnabled } from "@/lib/public-env";
import { cn } from "@/lib/utils";
import {
  fetchNotificationPreferences,
  patchNotificationPreferences,
} from "@/services/notifications.service";
import {
  fetchSecurityEvents,
  fetchSecurityPreferences,
  fetchUserMe,
  fetchUserSessions,
  logoutAllUserSessions,
  patchSecurityPreferences,
  revokeUserSession,
  type AccountCenterSummary,
  type SecurityEventItem,
  type UserSecurityPreferences,
} from "@/services/user-me.service";
import type { SecuritySessionRow } from "@/constants/dashboard/profile-security";

type PageTab = "login" | "sessions" | "withdraw";

const PAGE_TABS: { id: PageTab; labelKey: string }[] = [
  { id: "login", labelKey: "profile.security.tab.login" },
  { id: "sessions", labelKey: "profile.security.tab.sessions" },
  { id: "withdraw", labelKey: "profile.security.tab.withdraw" },
];

function PreferenceToggle({
  id,
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  const interactive = Boolean(onChange) && !disabled;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-4 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900">{title}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={!interactive}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-lime-400" : "bg-neutral-200",
          !interactive && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

function mapApiSessions(
  items: Awaited<ReturnType<typeof fetchUserSessions>>["items"],
  locale: import("@/lib/i18n/types").AppLocale,
  browserLabel: string,
): SecuritySessionRow[] {
  if (items.length === 0) return [];
  const active = items.filter((s) => s.active);
  const sorted = [...active].sort(
    (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime(),
  );
  return sorted.map((row, index) => ({
    id: row.id,
    device: row.device?.trim() || row.userAgent?.slice(0, 48) || browserLabel,
    location: "—",
    ip: row.ip ?? "—",
    lastActive: profileSecurityLastActive(row.lastActiveAt, locale),
    current: index === 0,
  }));
}

export function ProfileSecurityContent() {
  const { user, authorizedFetch, isAuthenticated, resendEmail } = useAuth();
  const { locale, t } = useI18n();
  const live = isLiveAccountEnabled() && isAuthenticated;
  const demo = isAccountCenterDemoMode();

  const [tab, setTab] = useState<PageTab>("login");
  const [loading, setLoading] = useState(live);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [accountCenter, setAccountCenter] = useState<AccountCenterSummary | null>(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [passwordChangedAt, setPasswordChangedAt] = useState<string | null>(null);
  const [passwordSet, setPasswordSet] = useState(true);

  const [sessions, setSessions] = useState<SecuritySessionRow[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEventItem[]>([]);
  const [prefs, setPrefs] = useState<UserSecurityPreferences | null>(null);
  const [emailSecurityEnabled, setEmailSecurityEnabled] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState<string | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  const [passwordPanelOpen, setPasswordPanelOpen] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [userTimezone, setUserTimezone] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!live) {
      setLoading(false);
      setSessions([]);
      setTwoFaEnabled(false);
      setEmailVerified(true);
      return;
    }
    setLoading(true);
    setLoadError(null);
    setSessionsError(null);
    try {
      const [me, sessionData, events, secPrefs, notifPrefs] = await Promise.all([
        fetchUserMe(authorizedFetch),
        fetchUserSessions(authorizedFetch),
        fetchSecurityEvents(authorizedFetch),
        fetchSecurityPreferences(authorizedFetch),
        fetchNotificationPreferences(authorizedFetch),
      ]);
      const ac = me.accountCenter ?? null;
      setAccountCenter(ac);
      setEmailVerified(Boolean(ac?.security.emailVerified ?? me.emailVerified));
      setTwoFaEnabled(Boolean(ac?.security.twoFactorEnabled ?? me.security?.twoFaEnabled));
      setPasswordChangedAt(ac?.security.passwordChangedAt ?? null);
      setPasswordSet(Boolean(ac?.security.passwordSet ?? true));
      setUserTimezone(me.profile?.timezone?.trim() || "Europe/Moscow");
      setSessions(mapApiSessions(sessionData.items, locale, t("profile.security.session.browser")));
      setSecurityEvents(events.items);
      setPrefs(secPrefs);
      setEmailSecurityEnabled(Boolean(notifPrefs.emailSecurity ?? true));
    } catch (err) {
      setLoadError(err);
      setAccountCenter(null);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live, locale, t]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const security = accountCenter?.security;
  const level = security?.level ?? "LOW";
  const topRec = security?.recommendations?.find((r) => !r.isCompleted);

  const patchPref = useCallback(
    async (key: keyof UserSecurityPreferences | "emailSecurity", value: boolean) => {
      if (!live) return;
      setPrefsError(null);
      setPrefsSaving(key);
      try {
        if (key === "emailSecurity") {
          const updated = await patchNotificationPreferences(authorizedFetch, { emailSecurity: value });
          setEmailSecurityEnabled(Boolean(updated.emailSecurity));
        } else {
          const updated = await patchSecurityPreferences(authorizedFetch, { [key]: value });
          setPrefs(updated);
        }
        await loadAll();
      } catch {
        setPrefsError(t("profile.security.preferences.saveError"));
      } finally {
        setPrefsSaving(null);
      }
    },
    [authorizedFetch, live, loadAll, t],
  );

  const handleResendEmail = useCallback(async () => {
    if (!user?.email) return;
    setResendBusy(true);
    setResendMsg(null);
    try {
      await resendEmail(user.email);
      setResendMsg(t("profile.security.email.resendSuccess"));
    } catch {
      setResendMsg(t("profile.security.email.resendError"));
    } finally {
      setResendBusy(false);
    }
  }, [resendEmail, t, user?.email]);

  const revoke = useCallback(
    (id: string) => {
      if (!live) return;
      void revokeUserSession(authorizedFetch, id)
        .then(() => loadAll())
        .catch(() => setSessionsError(t("profile.security.revokeError")));
    },
    [authorizedFetch, live, loadAll, t],
  );

  const logoutOthers = useCallback(() => {
    if (!live) return;
    void logoutAllUserSessions(authorizedFetch)
      .then(() => loadAll())
      .catch(() => setSessionsError(t("profile.security.revokeAllError")));
  }, [authorizedFetch, live, loadAll, t]);

  const passwordMeta = passwordChangedAt
    ? t("profile.security.password.changedAt").replace(
        "{date}",
        formatDate(new Date(passwordChangedAt), locale, {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      )
    : t("profile.security.password.neverChanged");

  const tabItems = useMemo(
    () => PAGE_TABS.map((item) => ({ id: item.id, label: t(item.labelKey) })),
    [t],
  );

  const statusText = live && security
    ? `${securityLevelBadgeLabel(level, locale)}${topRec ? ` · ${securityRecommendationText(topRec.code, locale).title}` : ""}`
    : t("profile.security.demoDescription");

  if (live && loading) {
    return (
      <SplitonLoadingView
        variant="light"
        size="lg"
        minHeight="min-h-[40vh]"
        label={t("common.loading")}
        className="bg-transparent"
      />
    );
  }

  return (
    <div className="space-y-4">
      {demo ? <ProductDemoBanner messageKey="profile.security.demoBanner" /> : null}

      {loadError ? (
        <ReadOnlySectionError
          sectionId="profile-security"
          error={loadError}
          onRetry={() => void loadAll()}
        />
      ) : null}

      {passwordSuccess ? (
        <p className="rounded-xl bg-lime-50 px-4 py-3 text-sm text-lime-900" role="status">
          {t("profile.security.password.success")}
        </p>
      ) : null}

      <p className="text-sm text-neutral-600">{statusText}</p>

      <FeesPageTabs items={tabItems} active={tab} onChange={setTab} />

      {tab === "login" ? (
        <section className={cn(profileCardClass, "divide-y divide-neutral-100")}>
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-neutral-400" aria-hidden />
              <div>
                <p className="text-sm font-medium text-neutral-900">{t("profile.security.email.title")}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{user?.email ?? "—"}</p>
                <span
                  className={cn(
                    "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    emailVerified ? "bg-lime-100 text-lime-950" : "bg-amber-50 text-amber-900",
                  )}
                >
                  {emailVerified ? <Check className="size-3" aria-hidden /> : null}
                  {emailVerified ? t("profile.security.email.verified") : t("profile.security.email.unverified")}
                </span>
                {resendMsg ? <p className="mt-1 text-xs text-neutral-600">{resendMsg}</p> : null}
              </div>
            </div>
            {live && !emailVerified ? (
              <button
                type="button"
                disabled={resendBusy}
                onClick={() => void handleResendEmail()}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-black px-4 text-xs font-semibold text-white disabled:opacity-60"
              >
                {resendBusy ? t("profile.security.email.resendSending") : t("profile.security.email.resend")}
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Lock className="mt-0.5 size-4 shrink-0 text-neutral-400" aria-hidden />
              <div>
                <p className="text-sm font-medium text-neutral-900">{t("profile.security.password.title")}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{passwordMeta}</p>
              </div>
            </div>
            {live && passwordSet ? (
              <button
                type="button"
                onClick={() => setPasswordPanelOpen(true)}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-black px-4 text-xs font-semibold text-white"
              >
                {t("profile.security.changePassword")}
              </button>
            ) : null}
          </div>
          <ProfilePasswordChangePanel
            open={passwordPanelOpen}
            onOpenChange={setPasswordPanelOpen}
            onSuccess={() => {
              setPasswordSuccess(true);
              void loadAll();
            }}
          />

          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-lime-700" aria-hidden />
              <div>
                <p className="text-sm font-medium text-neutral-900">{t("profile.security.twoFa.title")}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{t("profile.security.twoFa.descriptionShort")}</p>
              </div>
            </div>
            {live ? (
              <ProfileTwoFactorPanel
                enabled={twoFaEnabled}
                onEnabledChange={(v) => {
                  setTwoFaEnabled(v);
                  void loadAll();
                }}
              />
            ) : (
              <span className="text-xs font-medium text-neutral-500">{t("profile.security.twoFa.disabled")}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 py-4">
            <Link
              href={ROUTES.forgotPassword}
              className="text-xs font-semibold text-neutral-800 hover:underline"
            >
              {t("profile.security.recoverAccess")}
            </Link>
            <span className="text-neutral-300">·</span>
            <Link
              href={ROUTES.dashboardSupport}
              className="text-xs font-semibold text-neutral-800 hover:underline"
            >
              {t("profile.security.reportSuspicious")}
            </Link>
          </div>
        </section>
      ) : null}

      {tab === "sessions" ? (
        <section className={profileCardClass}>
          <p className="text-xs text-neutral-500">{t("profile.security.access.descriptionShort")}</p>
          {sessionsError ? (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
              {String(sessionsError)}
            </p>
          ) : null}
          <ProfileSessionsList sessions={sessions} onRevoke={revoke} live={live} />
          {live ? (
            <button
              type="button"
              onClick={logoutOthers}
              className={cn(profileSecondaryButtonClass, "mt-4 h-9 w-full text-xs sm:w-auto")}
            >
              {t("profile.security.revokeAll")}
            </button>
          ) : null}

          {live && securityEvents.length > 0 ? (
            <div className="mt-6 border-t border-neutral-100 pt-4">
              <h3 className="text-sm font-semibold text-neutral-900">{t("profile.security.events.title")}</h3>
              <ProfileSecurityEventsList events={securityEvents} timeZone={userTimezone} />
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "withdraw" ? (
        <section className={profileCardClass}>
          <p className="text-xs text-neutral-500">{t("profile.security.balance.descriptionShort")}</p>
          <div className="mt-3">
            <PreferenceToggle
              id="withdraw-email"
              title={t("profile.security.withdrawEmail.title")}
              description={t("profile.security.withdrawEmail.descriptionShort")}
              checked={prefs?.withdrawalEmailConfirmationEnabled ?? false}
              onChange={live ? (v) => void patchPref("withdrawalEmailConfirmationEnabled", v) : undefined}
              disabled={!live || prefsSaving === "withdrawalEmailConfirmationEnabled"}
            />
            <PreferenceToggle
              id="whitelist"
              title={t("profile.security.whitelist.title")}
              description={t("profile.security.whitelist.descriptionShort")}
              checked={prefs?.withdrawalAddressWhitelistEnabled ?? false}
              onChange={live ? (v) => void patchPref("withdrawalAddressWhitelistEnabled", v) : undefined}
              disabled={!live || prefsSaving === "withdrawalAddressWhitelistEnabled"}
            />
            <PreferenceToggle
              id="al-dev"
              title={t("profile.security.alertNewDevice.title")}
              description={t("profile.security.alertNewDevice.descriptionShort")}
              checked={prefs?.suspiciousLoginAlertsEnabled ?? true}
              onChange={live ? (v) => void patchPref("suspiciousLoginAlertsEnabled", v) : undefined}
              disabled={!live || prefsSaving === "suspiciousLoginAlertsEnabled"}
            />
            <PreferenceToggle
              id="email-sec"
              title={t("profile.security.preferences.emailSecurity.title")}
              description={t("profile.security.preferences.emailSecurity.descriptionShort")}
              checked={emailSecurityEnabled}
              onChange={live ? (v) => void patchPref("emailSecurity", v) : undefined}
              disabled={!live || prefsSaving === "emailSecurity"}
            />
          </div>
          {prefsError ? (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {prefsError}
            </p>
          ) : null}
          <Link
            href={ROUTES.dashboardPayouts}
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 hover:underline"
          >
            {t("profile.security.withdrawManageLink")}
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </section>
      ) : null}
    </div>
  );
}
