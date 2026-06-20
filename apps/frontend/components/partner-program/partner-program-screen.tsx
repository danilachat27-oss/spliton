"use client";

import * as React from "react";
import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PartnerProgramPageContentLive } from "@/components/partner-program/partner-program-page-content-live";
import { useI18n } from "@/components/providers/i18n-provider";
import { UnderlineTab } from "@/components/shared/exchange/underline-tab";
import {
  parsePartnerProgramTabParam,
  PARTNER_PROGRAM_TABS,
  type PartnerProgramTabId,
} from "@/constants/dashboard/partner-program";

function PartnerProgramScreenInner() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tab, setTabState] = React.useState<PartnerProgramTabId>(() => {
    return parsePartnerProgramTabParam(searchParams.get("tab")) ?? "about";
  });

  React.useEffect(() => {
    const p = parsePartnerProgramTabParam(searchParams.get("tab"));
    if (p) setTabState(p);
  }, [searchParams]);

  const setTab = React.useCallback(
    (id: PartnerProgramTabId) => {
      setTabState(id);
      const next = new URLSearchParams(searchParams.toString());
      next.set("tab", id);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const documentTitle = t(`partner.tabMeta.${tab}.documentTitle`);

  React.useEffect(() => {
    document.title = `${documentTitle} · ${t("partner.screen.documentSuffix")}`;
  }, [documentTitle, t]);

  return (
    <div className="flex min-h-0 flex-col bg-black font-sans tabular-nums text-white antialiased">
      <header className="sticky top-0 z-40 shrink-0 border-b border-white/6 bg-black/95 backdrop-blur-sm supports-backdrop-filter:bg-black/85">
        <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:py-3.5">
            <p className="text-xl font-semibold tracking-tight text-white md:text-2xl">{t("partner.screen.title")}</p>
          </div>

          <nav
            className="flex min-h-10 w-full flex-wrap items-center gap-x-1 gap-y-1 overflow-x-auto border-t border-white/6 pb-3 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-x-2 [&::-webkit-scrollbar]:hidden"
            aria-label={t("partner.screen.navAria")}
          >
            {PARTNER_PROGRAM_TABS.map((tabItem) => (
              <UnderlineTab
                key={tabItem.id}
                active={tab === tabItem.id}
                onClick={() => setTab(tabItem.id)}
                tone="neutral"
              >
                {t(`partner.tab.${tabItem.id}`)}
              </UnderlineTab>
            ))}
          </nav>
        </div>
      </header>

      <main className="min-h-0 flex-1" aria-labelledby="partner-surface-title">
        <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8">
          <div key={`${tab}-body`} className="animate-secondary-market-surface-in pb-20 pt-6">
            <PartnerProgramPageContentLive activeTab={tab} />
          </div>
        </div>
      </main>
    </div>
  );
}

export function PartnerProgramScreen() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-black" aria-hidden />}>
      <PartnerProgramScreenInner />
    </Suspense>
  );
}
