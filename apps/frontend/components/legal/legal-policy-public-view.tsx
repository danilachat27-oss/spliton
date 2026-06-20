"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { tf } from "@/lib/i18n/financial-messages";
import type { AppLocale } from "@/lib/i18n/types";
import { fetchActivePolicies, type LegalPolicyPublic } from "@/services/legal.service";

const LOCALE_DATE: Record<AppLocale, string> = {
  ru: "ru-RU",
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
};

function normalizeTypeParam(param: string): string {
  return param.toUpperCase().replace(/-/g, "_");
}

export function LegalPolicyPublicView({ typeParam }: { typeParam: string }) {
  const { t, locale } = useI18n();
  const [policy, setPolicy] = useState<LegalPolicyPublic | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const apiType = normalizeTypeParam(typeParam);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/v1/legal/policies/${encodeURIComponent(apiType)}/active`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("not found");
        return res.json() as Promise<LegalPolicyPublic>;
      })
      .then(setPolicy)
      .catch(async () => {
        const all = await fetchActivePolicies();
        const hit = all.find((p) => p.type === apiType);
        if (hit) setPolicy(hit);
        else setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [apiType]);

  if (loading) {
    return <p className="text-sm text-neutral-500">{t("legal.policy.loading")}</p>;
  }

  if (notFound || !policy) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
        {notFound ? t("legal.policy.notFound") : t("legal.policy.unavailable")}
        <p className="mt-2 text-xs text-neutral-500">{t("legal.policy.adminHint")}</p>
      </div>
    );
  }

  const title = t(`legal.policy.type.${policy.type}`, policy.title);
  const publishedDate = policy.publishedAt
    ? new Date(policy.publishedAt).toLocaleDateString(LOCALE_DATE[locale])
    : "";

  return (
    <article>
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        {publishedDate
          ? tf(t("legal.policy.versionPublished"), {
              version: policy.version,
              date: publishedDate,
            })
          : tf(t("legal.policy.versionOnly"), { version: policy.version })}
      </p>
      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        {t("legal.notice.lawyerReview")}
      </p>
      <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-700">
        {policy.content}
      </div>
    </article>
  );
}
