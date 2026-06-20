"use client";

import Link from "next/link";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useI18n } from "@/components/providers/i18n-provider";
import { BRAND } from "@/constants/brand";
import { ROUTES } from "@/constants/routes";
import { tf } from "@/lib/i18n/financial-messages";

export function PrivacyPageContent() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-dvh flex-col bg-[#f6f7f9]">
      <DashboardHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          {t("legal.privacy.title")}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">{t("legal.privacy.updated")}</p>

        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {t("legal.notice.lawyerReview")}{" "}
          <Link href="/legal/privacy_policy" className="font-medium underline underline-offset-2">
            {t("legal.privacy.apiLink")}
          </Link>
          .
        </p>

        <div className="prose prose-neutral mt-8 max-w-none text-[15px] leading-relaxed text-neutral-700">
          <p>{tf(t("legal.privacy.intro"), { brand: BRAND.name })}</p>

          <h2 className="mt-8 text-lg font-semibold text-neutral-900">
            {t("legal.privacy.section.dataCollected")}
          </h2>
          <ul className="list-disc pl-5">
            <li>{t("legal.privacy.item.accountData")}</li>
            <li>{t("legal.privacy.item.walletData")}</li>
            <li>{t("legal.privacy.item.supportData")}</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-neutral-900">
            {t("legal.privacy.section.usage")}
          </h2>
          <p>{t("legal.privacy.usage.body")}</p>

          <h2 className="mt-8 text-lg font-semibold text-neutral-900">
            {t("legal.privacy.section.storage")}
          </h2>
          <p>{t("legal.privacy.storage.body")}</p>

          <h2 className="mt-8 text-lg font-semibold text-neutral-900">
            {t("legal.privacy.section.rights")}
          </h2>
          <p>
            {t("legal.privacy.rights.beforeSupport")}{" "}
            <Link href={ROUTES.support} className="text-neutral-900 underline underline-offset-2">
              {t("legal.privacy.rights.supportLink")}
            </Link>
            {t("legal.privacy.rights.afterSupport")}
          </p>
        </div>
      </main>
    </div>
  );
}
