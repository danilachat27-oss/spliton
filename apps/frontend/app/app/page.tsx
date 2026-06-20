import { DashboardCatalogSection } from "@/components/dashboard/dashboard-catalog";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import {
  DashboardLandingCta,
  DashboardMarketsRow,
  DashboardUnifiedJourneyBlock,
  DashboardValueGrid,
} from "@/components/dashboard/dashboard-landing-sections";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { OnboardingChecklistCard } from "@/components/dashboard/onboarding/onboarding-checklist-card";
import { ReferralSummaryCard } from "@/components/referral/referral-summary-card";
import { dashboardPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return dashboardPageMetaAsync("meta.dashboard.title", "meta.dashboard.description");
}

export default function DashboardMainPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-black font-sans text-white antialiased *:font-sans">
      <DashboardHeader />
      <div className="overflow-hidden rounded-b-[28px] bg-black shadow-[0_18px_40px_-34px_rgba(0,0,0,0.85)] sm:rounded-b-[44px] md:rounded-b-[56px]">
        <main className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <DashboardHero />
        </main>
      </div>

      <div className="relative z-10 bg-[#f6f7f9]">
        <div className="mx-auto w-full max-w-[1400px] px-4 pb-6 sm:px-6 sm:pb-10 lg:px-8 lg:pb-12">
          <div className="flex flex-col gap-8 pt-6 sm:gap-12 sm:pt-10 lg:gap-14">
            <OnboardingChecklistCard />
            <ReferralSummaryCard />
          </div>
          <DashboardStats className="mt-8 sm:mt-12 lg:mt-14" />
        </div>
      </div>

      <div className="relative z-0 bg-black">
        <DashboardValueGrid />
        <DashboardCatalogSection />
        <div className="mx-auto w-full max-w-[1400px] border-t border-white/10 px-4 pb-8 sm:px-6 sm:pb-12 md:pb-16 lg:px-8 lg:pb-20">
          <DashboardUnifiedJourneyBlock className="pt-8 sm:pt-10 md:pt-12" />
          <DashboardMarketsRow />
          <DashboardLandingCta />
        </div>
      </div>
    </div>
  );
}
