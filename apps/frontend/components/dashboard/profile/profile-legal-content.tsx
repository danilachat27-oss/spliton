"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, ExternalLink, FileText, RefreshCw, Shield } from "@/lib/lucide";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ProfileSectionSkeleton } from "@/components/dashboard/profile/profile-section-skeleton";
import { profileCardClass, profilePrimaryButtonClass } from "@/components/dashboard/profile/profile-ui";
import { ROUTES } from "@/constants/routes";
import { formatDate } from "@/lib/i18n/formatters";
import { cn } from "@/lib/utils";
import {
  acceptLegalConsents,
  buildProfileLegalFallback,
  fetchLegalCenter,
  getAllMissingConsents,
  isFallbackPolicyId,
  policyPublicHref,
  policyTypeLabel,
  type LegalCenterResponse,
  type MissingConsentItem,
} from "@/services/legal.service";

function PolicyStatusBadge({ accepted, t }: { accepted: boolean; t: (k: string) => string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        accepted ? "bg-lime-100/90 text-lime-950" : "bg-amber-50 text-amber-900",
      )}
    >
      {accepted ? t("profile.legal.badge.accepted") : t("profile.legal.badge.missing")}
    </span>
  );
}

export function ProfileLegalContent() {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { t, locale } = useI18n();
  const [data, setData] = useState<LegalCenterResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [confirmIds, setConfirmIds] = useState<Record<string, boolean>>({});
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const center = await fetchLegalCenter(authorizedFetch);
      if (center.activePolicies.length === 0) {
        setData(buildProfileLegalFallback(t));
        setOffline(true);
      } else {
        setData(center);
        setOffline(false);
      }
    } catch {
      setData(buildProfileLegalFallback(t));
      setOffline(true);
      setLoadError(t("profile.legal.loadError"));
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, isAuthenticated, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const allMissing = useMemo(
    () => (data && !offline ? getAllMissingConsents(data).filter((item) => !isFallbackPolicyId(item.policyId)) : []),
    [data, offline],
  );

  const acceptedSet = useMemo(() => {
    if (!data) return new Set<string>();
    return new Set(data.acceptedConsents.map((c) => `${c.policyType}:${c.policyVersion}`));
  }, [data]);

  const displayPolicies = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const items = [...data.activePolicies];
    for (const fallback of buildProfileLegalFallback(t).activePolicies) {
      if (!items.some((p) => p.type === fallback.type)) {
        items.push(fallback);
      }
    }
    return items.filter((p) => {
      if (seen.has(p.type)) return false;
      seen.add(p.type);
      return true;
    });
  }, [data, t]);

  const acceptOne = useCallback(
    async (item: MissingConsentItem) => {
      if (!confirmIds[item.policyId] || isFallbackPolicyId(item.policyId)) return;
      setAcceptingId(item.policyId);
      setAcceptError(null);
      try {
        await acceptLegalConsents([item.policyId], "PROFILE", authorizedFetch);
        await load();
        setConfirmIds((prev) => {
          const next = { ...prev };
          delete next[item.policyId];
          return next;
        });
      } catch {
        setAcceptError(t("profile.legal.acceptError"));
      } finally {
        setAcceptingId(null);
      }
    },
    [authorizedFetch, confirmIds, load, t],
  );

  if (!isAuthenticated) {
    return (
      <section className={cn(profileCardClass, "text-center")}>
        <p className="text-sm text-neutral-600">{t("profile.legal.signInRequired")}</p>
        <Link
          href={ROUTES.login}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-black px-5 text-sm font-semibold text-white"
        >
          {t("auth.login.submit")}
        </Link>
      </section>
    );
  }

  if (loading) {
    return <ProfileSectionSkeleton variant="list" rows={3} />;
  }

  if (!data) {
    return <p className="text-sm text-neutral-600">{t("profile.legal.empty")}</p>;
  }

  return (
    <div className="space-y-4">
      <section className={profileCardClass}>
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 size-5 shrink-0 text-[#3d7a00]" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-neutral-950">{t("profile.legal.title")}</h2>
            <p className="mt-1 text-sm text-neutral-600">{t("profile.legal.description")}</p>
            <p
              className={cn(
                "mt-3 rounded-xl px-3 py-2 text-sm font-medium",
                offline
                  ? "bg-neutral-100 text-neutral-800"
                  : allMissing.length > 0
                    ? "bg-amber-50 text-amber-950"
                    : "bg-lime-50 text-lime-950",
              )}
            >
              {offline
                ? t("profile.legal.offlineStatus")
                : allMissing.length > 0
                  ? t("profile.legal.missingBanner").replace("{count}", String(allMissing.length))
                  : t("profile.legal.allAccepted")}
            </p>
            {loadError ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <p className="text-xs text-amber-900">{t("profile.legal.offlineHint")}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200"
                >
                  <RefreshCw className="size-3" aria-hidden />
                  {t("profile.legal.retry")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {allMissing.length > 0 ? (
        <section className={profileCardClass}>
          <h3 className="text-sm font-semibold text-neutral-900">{t("profile.legal.acceptSection.title")}</h3>
          <p className="mt-1 text-xs text-neutral-500">{t("profile.legal.acceptSection.hint")}</p>
          <ul className="mt-4 space-y-3">
            {allMissing.map((item) => (
              <li key={`${item.type}-${item.activeVersion}`} className="rounded-xl bg-neutral-50 px-4 py-3">
                <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                <Link
                  href={policyPublicHref(item.type)}
                  target="_blank"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 hover:underline"
                >
                  {t("profile.legal.readDocument")}
                  <ExternalLink className="size-3" aria-hidden />
                </Link>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-xs text-neutral-600">
                    <input
                      type="checkbox"
                      checked={Boolean(confirmIds[item.policyId])}
                      onChange={(e) =>
                        setConfirmIds((prev) => ({ ...prev, [item.policyId]: e.target.checked }))
                      }
                      className="size-4 rounded border-neutral-300"
                    />
                    {t("profile.legal.acceptCheckbox")}
                  </label>
                  <button
                    type="button"
                    disabled={!confirmIds[item.policyId] || acceptingId === item.policyId}
                    onClick={() => void acceptOne(item)}
                    className={cn(profilePrimaryButtonClass, "h-9 text-xs disabled:opacity-60")}
                  >
                    {acceptingId === item.policyId ? t("profile.legal.accepting") : t("profile.legal.acceptButton")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {acceptError ? (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {acceptError}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className={profileCardClass}>
        <h3 className="text-sm font-semibold text-neutral-900">{t("profile.legal.activeTitle")}</h3>
        <p className="mt-1 text-xs text-neutral-500">{t("profile.legal.documentsHint")}</p>
        <ul className="mt-3 space-y-2">
          {displayPolicies.map((p) => {
            const accepted = acceptedSet.has(`${p.type}:${p.version}`) && !isFallbackPolicyId(p.id);
            const title = p.title || policyTypeLabel(p.type, t);
            return (
              <li key={p.type}>
                <Link
                  href={policyPublicHref(p.type)}
                  target="_blank"
                  className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-4 py-3 transition hover:bg-neutral-100/80"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <FileText className="size-4 shrink-0 text-neutral-400" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-neutral-900">{title}</span>
                      {!isFallbackPolicyId(p.id) && p.version !== "—" ? (
                        <span className="text-xs text-neutral-500">v{p.version}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {!offline && p.requiresUserConsent ? (
                      <PolicyStatusBadge accepted={accepted} t={t} />
                    ) : null}
                    <ChevronRight className="size-4 text-neutral-400" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href={ROUTES.trust}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 hover:underline"
        >
          {t("profile.legal.trustLink")}
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </section>

      {data.acceptedConsents.length > 0 ? (
        <section className={profileCardClass}>
          <h3 className="text-sm font-semibold text-neutral-900">{t("profile.legal.historyTitle")}</h3>
          <ul className="mt-3 divide-y divide-neutral-100">
            {data.acceptedConsents.map((row) => (
              <li key={`${row.policyType}-${row.policyVersion}-${row.acceptedAt}`} className="py-3 text-sm first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-neutral-900">{row.policy?.title ?? policyTypeLabel(row.policyType, t)}</span>
                  <span className="text-neutral-500">v{row.policyVersion}</span>
                  <Check className="size-3.5 text-lime-700" aria-hidden />
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {formatDate(new Date(row.acceptedAt), locale, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
