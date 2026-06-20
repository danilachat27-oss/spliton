"use client";

import { useI18n } from "@/components/providers/i18n-provider";

export function SystemStatusPageHero() {
  const { t } = useI18n();

  return (
    <section className="mx-auto flex h-[min(34vh,300px)] w-full max-w-[1320px] items-center justify-center px-4 text-center sm:px-6 lg:px-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{t("systemStatus.hero.title")}</h1>
        <p className="mt-3 text-sm text-zinc-300 sm:text-base">{t("systemStatus.hero.subtitle")}</p>
      </div>
    </section>
  );
}
