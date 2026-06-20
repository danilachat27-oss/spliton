"use client";

import { useI18n } from "@/components/providers/i18n-provider";

export function LoginPageFallback() {
  const { t } = useI18n();

  return <p className="text-sm text-neutral-500">{t("common.loading")}</p>;
}
