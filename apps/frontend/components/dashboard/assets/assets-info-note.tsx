"use client";

import { Info } from "@/lib/lucide";

import { assetsMutedCardClass } from "@/components/dashboard/assets/assets-ui";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export function AssetsInfoNote() {
  const { t } = useI18n();

  return (
    <section
      className={cn("flex gap-3", assetsMutedCardClass)}
      aria-label={t("assets.widgets.infoNoteAria")}
    >
      <span className="mt-0.5 inline-flex shrink-0 text-neutral-400" aria-hidden>
        <Info className="size-4" strokeWidth={2} />
      </span>
      <p className="text-xs leading-relaxed text-neutral-600 sm:text-sm">{t("assets.widgets.infoNoteBody")}</p>
    </section>
  );
}
