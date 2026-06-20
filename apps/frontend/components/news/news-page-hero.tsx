"use client";

import { useI18n } from "@/components/providers/i18n-provider";

export function NewsPageHero() {
  const { t } = useI18n();

  return (
    <header className="mb-2 text-center sm:mb-4">
      <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{t("news.hero.title")}</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-500">{t("news.hero.subtitle")}</p>
    </header>
  );
}
