"use client";

import "@/features/guide/selection/ui/guide-page.css";

import { ReleaseParametersCardExplainer } from "./release-parameters-card-explainer";
import { ReleaseParametersExample } from "./release-parameters-example";
import { ReleaseParametersFaq } from "./release-parameters-faq";
import { ReleaseParametersGrid } from "./release-parameters-grid";
import { ReleaseParametersHero } from "./release-parameters-hero";
import { ReleaseParametersInPageNav } from "./release-parameters-in-page-nav";
import { ReleaseParametersMobileNav } from "./release-parameters-mobile-nav";
import { ReleaseParametersPriority } from "./release-parameters-priority";

export function ReleaseParametersScreen() {
  return (
    <div
      className="guide-page h-full min-h-0 overflow-x-hidden overflow-y-auto scroll-smooth bg-black font-sans tabular-nums"
      data-mobile-scroll-root
    >
      <ReleaseParametersMobileNav />

      <div className="mx-auto w-full max-w-[1400px] px-4 pb-14 pt-1 sm:pb-16 md:px-6 lg:px-8 lg:pb-12 lg:pt-2">
        <div className="flex gap-5 xl:gap-6">
          <div className="min-w-0 flex-1 space-y-6 md:space-y-7 lg:space-y-8">
            <ReleaseParametersHero />
            <ReleaseParametersCardExplainer />
            <ReleaseParametersGrid />
            <ReleaseParametersPriority />
            <ReleaseParametersExample />
            <ReleaseParametersFaq />
          </div>

          <aside className="hidden w-[min(17.5rem,22vw)] shrink-0 xl:block">
            <ReleaseParametersInPageNav />
          </aside>
        </div>
      </div>
    </div>
  );
}
