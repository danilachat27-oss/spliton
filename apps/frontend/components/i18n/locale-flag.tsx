import ES from "country-flag-icons/react/3x2/ES";
import GB from "country-flag-icons/react/3x2/GB";
import PT from "country-flag-icons/react/3x2/PT";
import RU from "country-flag-icons/react/3x2/RU";

import type { AppLocale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

const FLAGS = {
  ru: RU,
  en: GB,
  es: ES,
  pt: PT,
} as const;

type LocaleFlagProps = {
  locale: AppLocale;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass: Record<NonNullable<LocaleFlagProps["size"]>, string> = {
  sm: "h-3.5 w-[1.3125rem]",
  md: "h-4 w-6",
  lg: "h-5 w-[1.875rem]",
};

export function LocaleFlag({ locale, className, size = "md" }: LocaleFlagProps) {
  const Flag = FLAGS[locale];
  return (
    <Flag
      aria-hidden
      className={cn("shrink-0 rounded-[2px] object-cover shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]", sizeClass[size], className)}
    />
  );
}
