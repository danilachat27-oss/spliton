"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";

export function CalculatorPageHero() {
  const { t } = useI18n();

  return (
    <section className="rounded-2xl bg-white px-4 py-5 sm:px-6 sm:py-6">
      <h1 className="text-[1.5rem] font-semibold leading-tight tracking-tight text-neutral-900 sm:text-[1.75rem]">
        {t("calculator.hero.title")}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500 sm:text-[15px]">
        {t("calculator.hero.subtitle")}
        {" "}
        <Link
          href={ROUTES.assetsUnt}
          className="font-medium text-neutral-800 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-500"
        >
          {t("calculator.hero.untLink")}
        </Link>
      </p>
    </section>
  );
}
