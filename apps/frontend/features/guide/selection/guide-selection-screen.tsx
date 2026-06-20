"use client";

import { GuideChecklistSection } from "./sections/guide-checklist-section";
import { GuideComparisonSection } from "./sections/guide-comparison-section";
import { GuideDealStructureSection } from "./sections/guide-deal-structure-section";
import { GuideEvaluationFactorsSection } from "./sections/guide-evaluation-factors-section";
import { GuideFaqSection } from "./sections/guide-faq-section";
import { GuideFooterCtaSection } from "./sections/guide-footer-cta-section";
import { GuideHeroSection } from "./sections/guide-hero-section";
import { GuidePayoutsSection } from "./sections/guide-payouts-section";
import { GuideReleaseCardBridgeSection } from "./sections/guide-release-card-bridge-section";
import { GuideRisksSection } from "./sections/guide-risks-section";
import { GuideTopicGridSection } from "./sections/guide-topic-grid-section";
import { GuideInPageNav } from "./ui/guide-in-page-nav";
import { GuideMobileNav } from "./ui/guide-mobile-nav";
import "./ui/guide-page.css";
import "./ui/guide-reveal.css";

export function GuideSelectionScreen() {
  return (
    <div
      className="guide-page h-full min-h-0 overflow-x-hidden overflow-y-auto scroll-smooth bg-black font-sans tabular-nums"
      data-mobile-scroll-root
    >
      <GuideMobileNav />

      <div className="mx-auto w-full max-w-[1400px] px-4 pb-14 pt-1 sm:pb-16 md:px-6 lg:px-8 lg:pb-12 lg:pt-2">
        <div className="flex gap-5 xl:gap-6">
          <div className="min-w-0 flex-1 space-y-6 md:space-y-7 lg:space-y-8">
            <GuideHeroSection />
            <GuideTopicGridSection />
            <GuideChecklistSection />
            <GuideReleaseCardBridgeSection />
            <GuideEvaluationFactorsSection />
            <GuideDealStructureSection />
            <GuidePayoutsSection />
            <GuideRisksSection />
            <GuideComparisonSection />
            <GuideFaqSection />
            <GuideFooterCtaSection />
          </div>

          <aside className="hidden w-[min(17.5rem,22vw)] shrink-0 xl:block">
            <GuideInPageNav />
          </aside>
        </div>
      </div>
    </div>
  );
}
