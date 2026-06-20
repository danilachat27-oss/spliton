import type { Metadata } from "next";
import Image from "next/image";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { FeesLiveRatesBanner } from "@/components/fees/fees-live-rates-banner";
import { FeesPageContent } from "@/components/fees/fees-page-content";
import { FeesPageHero } from "@/components/fees/fees-page-hero";
import { feesPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return feesPageMetaAsync("meta.fees.title", "meta.fees.description");
}

export default function FeesPage() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-[#f6f7f9]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(42vh,400px)] overflow-hidden sm:h-[min(44vh,440px)] lg:h-[min(46vh,480px)]"
        aria-hidden
      >
        <Image src="/images/assetsunt/backgraund.png" alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#f6f7f9] sm:h-20" />
      </div>
      <DashboardHeader />
      <main className="scheme-light relative z-10 flex-1 text-neutral-900">
        <div className="mx-auto w-full max-w-[1320px] px-4 pb-5 sm:px-6 lg:px-8">
          <div className="pb-8 sm:pb-10">
            <FeesPageHero />
            <div className="relative bg-[#f6f7f9] pt-2 sm:pt-4">
              <FeesLiveRatesBanner />
              <FeesPageContent />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
