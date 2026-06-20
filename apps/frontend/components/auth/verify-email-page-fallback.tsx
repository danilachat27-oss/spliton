"use client";

import { useI18n } from "@/components/providers/i18n-provider";

export function VerifyEmailPageFallback() {
  const { t } = useI18n();

  return (
    <div className="w-full text-neutral-900">
      <h2 className="text-[2.25rem] font-semibold leading-none tracking-tight sm:text-[2.5rem]">{t("auth.verify.title")}</h2>
      <p className="mt-6 text-[15px] leading-relaxed text-neutral-600">{t("auth.verify.loadingBody")}</p>
    </div>
  );
}
