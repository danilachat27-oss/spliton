"use client";

import { ChevronDown } from "@/lib/lucide";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { parseProfilePageTabParam } from "@/constants/dashboard/profile-page";
import { useI18n } from "@/components/providers/i18n-provider";
import { profileTabLabel } from "@/lib/i18n/profile-messages";
import type { ProfilePageTabId } from "@/constants/dashboard/profile-page";

export function ProfilePageHeader() {
  const searchParams = useSearchParams();
  const { locale, t } = useI18n();
  const tab = useMemo(
    () => parseProfilePageTabParam(searchParams.get("tab")),
    [searchParams],
  );
  const title = profileTabLabel(tab as ProfilePageTabId, locale) || t("profile.header.fallbackTitle");

  return (
    <header className="-mx-4 border-b border-neutral-200/80 bg-white px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-1.5">
        <h1 className="text-[1.25rem] font-semibold tracking-tight text-neutral-900 sm:text-[1.35rem]">{title}</h1>
        <ChevronDown className="size-5 text-neutral-400" strokeWidth={2} aria-hidden />
      </div>
    </header>
  );
}
