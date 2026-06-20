"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Save } from "@/lib/lucide";

import { TimezoneSelect } from "@/components/dashboard/profile/timezone-select";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  ProfileSettingsEditableRow,
  ProfileSettingsList,
  ProfileSettingsToggleRow,
} from "@/components/dashboard/profile/profile-settings-rows";
import { SETTINGS_LANGUAGE_OPTIONS } from "@/constants/dashboard/profile-settings";
import { ROUTES } from "@/constants/routes";
import { ProfileSectionSkeleton } from "@/components/dashboard/profile/profile-section-skeleton";
import {
  profileCardClass,
  profileInputClass,
  profilePrimaryButtonClass,
} from "@/components/dashboard/profile/profile-ui";
import {
  fetchNotificationPreferences,
  patchNotificationPreferences,
} from "@/services/notifications.service";
import { fetchUserMe, patchUserPreferences } from "@/services/user-me.service";
import { isLiveAccountEnabled } from "@/lib/public-env";
import { resolveTimezoneLabel } from "@/lib/i18n/timezones";

type EditingField = "displayName" | "timezone" | "language" | null;

function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function ProfileSettingsContent() {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { locale, t } = useI18n();
  const live = isLiveAccountEnabled() && isAuthenticated;

  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("Europe/Moscow");
  const [emailFinance, setEmailFinance] = useState(true);
  const [emailMarket, setEmailMarket] = useState(false);
  const [emailNews, setEmailNews] = useState(true);
  const [emailSecurity, setEmailSecurity] = useState(true);
  const [emailSupport, setEmailSupport] = useState(true);
  const [inAppFinance, setInAppFinance] = useState(true);
  const [inAppMarket, setInAppMarket] = useState(true);
  const [inAppSupport, setInAppSupport] = useState(true);
  const [inAppNews, setInAppNews] = useState(true);

  const [editingField, setEditingField] = useState<EditingField>(null);
  const [savedHint, setSavedHint] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const languageLabel = useMemo(
    () => optionLabel(SETTINGS_LANGUAGE_OPTIONS, locale),
    [locale],
  );
  const timezoneLabel = useMemo(() => resolveTimezoneLabel(timezone, locale), [timezone, locale]);

  useEffect(() => {
    if (!live) return;
    setLoading(true);
    setLoadError(null);
    void Promise.all([
      fetchUserMe(authorizedFetch),
      fetchNotificationPreferences(authorizedFetch),
    ])
      .then(([me, prefs]) => {
        setDisplayName(me.profile?.displayName?.trim() ?? "");
        setTimezone(me.profile?.timezone?.trim() || "Europe/Moscow");
        setEmailFinance(prefs.emailFinance);
        setEmailMarket(prefs.emailMarket);
        setEmailNews(prefs.emailNews);
        setEmailSecurity(prefs.emailSecurity);
        setEmailSupport(prefs.emailSupport);
        setInAppFinance(prefs.inAppFinance);
        setInAppMarket(prefs.inAppMarket);
        setInAppSupport(prefs.inAppSupport);
        setInAppNews(prefs.inAppNews);
      })
      .catch(() => setLoadError(t("profile.settings.loadError")))
      .finally(() => setLoading(false));
  }, [authorizedFetch, live, t]);

  const save = useCallback(async () => {
    if (!live) {
      setSavedHint(t("settings.saved"));
      window.setTimeout(() => setSavedHint(null), 2200);
      return;
    }
    setSaving(true);
    setLoadError(null);
    try {
      await patchUserPreferences(authorizedFetch, {
        displayName: displayName.trim() || undefined,
        timezone,
        preferredLocale: locale,
      });
      await patchNotificationPreferences(authorizedFetch, {
        emailFinance,
        emailMarket,
        emailNews,
        emailSupport,
        emailSecurity,
        inAppFinance,
        inAppMarket,
        inAppSupport,
        inAppNews,
      });
      setSavedHint(t("settings.saved"));
      setEditingField(null);
      window.setTimeout(() => setSavedHint(null), 2200);
    } catch {
      setLoadError(t("profile.settings.saveError"));
    } finally {
      setSaving(false);
    }
  }, [
    authorizedFetch,
    displayName,
    emailFinance,
    emailMarket,
    emailNews,
    emailSecurity,
    emailSupport,
    inAppFinance,
    inAppMarket,
    inAppNews,
    inAppSupport,
    live,
    locale,
    t,
    timezone,
  ]);

  return (
    <div className="space-y-3 pb-28 sm:space-y-4 sm:pb-4">
      {loading ? <ProfileSectionSkeleton variant="form" /> : null}
      {loadError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      ) : null}

      <section className={profileCardClass}>
        <h2 className="text-base font-semibold tracking-tight text-neutral-900">
          {t("profile.settings.profileHeading")}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">{t("profile.settings.profileDescription")}</p>

        <ProfileSettingsList>
          <ProfileSettingsEditableRow
            label={t("profile.settings.displayName.label")}
            hint={t("profile.settings.displayName.hint")}
            displayValue={displayName.trim() || t("profile.settings.displayName.empty")}
            editing={editingField === "displayName"}
            onStartEdit={() => setEditingField("displayName")}
            onDone={() => setEditingField(null)}
            editControl={
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="nickname"
                autoFocus
                className={profileInputClass}
              />
            }
          />
          <ProfileSettingsEditableRow
            label={t("language.label")}
            hint={t("language.select")}
            displayValue={languageLabel}
            editing={editingField === "language"}
            onStartEdit={() => setEditingField("language")}
            onDone={() => setEditingField(null)}
            editControl={<LanguageSelector variant="light" placement="inline" className="w-full" />}
          />
          <ProfileSettingsEditableRow
            label={t("profile.settings.timezone.label")}
            hint={t("profile.settings.timezone.hint")}
            displayValue={timezoneLabel}
            editing={editingField === "timezone"}
            onStartEdit={() => setEditingField("timezone")}
            onDone={() => setEditingField(null)}
            editControl={<TimezoneSelect id="tz" value={timezone} onChange={setTimezone} />}
          />
        </ProfileSettingsList>
      </section>

      <section className={profileCardClass}>
        <h2 className="text-base font-semibold tracking-tight text-neutral-900">
          {t("profile.settings.communicationsHeading")}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">{t("profile.settings.communicationsDescription")}</p>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {t("profile.settings.emailGroup")}
        </p>
        <ProfileSettingsList>
          <ProfileSettingsToggleRow
            title={t("profile.settings.payouts.title")}
            description={t("profile.settings.payouts.description")}
            checked={emailFinance}
            onChange={setEmailFinance}
            disabled={loading || !live}
          />
          <ProfileSettingsToggleRow
            title={t("profile.settings.market.title")}
            description={t("profile.settings.market.description")}
            checked={emailMarket}
            onChange={setEmailMarket}
            disabled={loading || !live}
          />
          <ProfileSettingsToggleRow
            title={t("profile.settings.product.title")}
            description={t("profile.settings.product.description")}
            checked={emailNews}
            onChange={setEmailNews}
            disabled={loading || !live}
          />
          <ProfileSettingsToggleRow
            title={t("profile.settings.support.title")}
            description={t("profile.settings.support.description")}
            checked={emailSupport}
            onChange={setEmailSupport}
            disabled={loading || !live}
          />
          <ProfileSettingsToggleRow
            title={t("profile.settings.securityEmail.title")}
            description={t("profile.settings.securityEmail.description")}
            checked={emailSecurity}
            onChange={() => undefined}
            disabled
          />
        </ProfileSettingsList>
        <p className="mt-1 text-xs text-neutral-400">{t("profile.settings.securityEmail.locked")}</p>

        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {t("profile.settings.inAppGroup")}
        </p>
        <ProfileSettingsList>
          <ProfileSettingsToggleRow
            title={t("profile.settings.inAppFinance.title")}
            description={t("profile.settings.inAppFinance.description")}
            checked={inAppFinance}
            onChange={setInAppFinance}
            disabled={loading || !live}
          />
          <ProfileSettingsToggleRow
            title={t("profile.settings.inAppMarket.title")}
            description={t("profile.settings.inAppMarket.description")}
            checked={inAppMarket}
            onChange={setInAppMarket}
            disabled={loading || !live}
          />
          <ProfileSettingsToggleRow
            title={t("profile.settings.inAppSupport.title")}
            description={t("profile.settings.inAppSupport.description")}
            checked={inAppSupport}
            onChange={setInAppSupport}
            disabled={loading || !live}
          />
          <ProfileSettingsToggleRow
            title={t("profile.settings.digest.title")}
            description={t("profile.settings.digest.description")}
            checked={inAppNews}
            onChange={setInAppNews}
            disabled={loading || !live}
          />
        </ProfileSettingsList>
      </section>

      <section className={profileCardClass}>
        <h2 className="text-base font-semibold tracking-tight text-neutral-900">
          {t("profile.settings.privacy.title")}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">{t("profile.settings.privacy.description")}</p>
        <Link
          href={ROUTES.dashboardSupport}
          className="mt-3 inline-flex text-sm font-medium text-neutral-900 hover:text-neutral-600"
        >
          {t("profile.settings.privacy.supportLink")}
        </Link>
      </section>

      <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px)+0.5rem)] z-20 -mx-1 flex flex-col gap-3 border-t border-neutral-200/90 bg-[#f6f7f9] px-4 py-3 sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <p className="text-xs leading-relaxed text-neutral-500">{t("profile.settings.saveHint")}</p>
        <div className="flex items-center gap-3">
          {savedHint ? <span className="text-xs font-medium text-[#3d7a00]">{savedHint}</span> : null}
          <button
            type="button"
            disabled={saving || loading}
            onClick={() => void save()}
            className={`${profilePrimaryButtonClass} gap-2 disabled:opacity-60`}
          >
            <Save className="size-4" aria-hidden />
            {saving ? t("profile.settings.saving") : t("profile.settings.saveButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
