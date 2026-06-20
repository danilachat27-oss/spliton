import Image from "next/image";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { TrustCenterContent } from "@/components/trust/trust-center-content";
import { TrustPageHero } from "@/components/trust/trust-page-hero";
import { trustPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return trustPageMetaAsync("meta.trust.title", "meta.trust.description");
}

/** Каркас как у `/fees` и `/support`: герой на фоне, затем светлая зона с карточками. */
export default function TrustPage() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-[#f6f7f9]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(46vh,400px)] overflow-hidden sm:h-[min(48vh,460px)] lg:h-[min(50vh,480px)]"
        aria-hidden
      >
        <Image
          src="/images/assetsunt/backgraund.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent via-[#f6f7f9]/55 to-[#f6f7f9] sm:h-28" />
      </div>
      <DashboardHeader elevatedOnScroll={false} />
      <main className="scheme-light relative z-10 flex-1 text-neutral-900">
        <div className="mx-auto w-full max-w-[1320px] px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-10 lg:px-8">
          <div className="space-y-0 pb-2 sm:space-y-8">
            <div className="min-h-[min(42vh,360px)] sm:min-h-[280px] lg:min-h-[320px]">
              <TrustPageHero />
            </div>

            <div className="relative mt-6 rounded-t-[1.75rem] bg-[#f6f7f9] pt-6 sm:mt-10 sm:rounded-none sm:pt-6 lg:mt-12">
              <TrustCenterContent />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
