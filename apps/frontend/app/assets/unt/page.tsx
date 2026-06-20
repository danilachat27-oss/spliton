import Image from "next/image";

import { UntExplainer } from "@/components/shared/unt-explainer";
import { DashboardCabinetHeaderStack } from "@/components/layout/dashboard-cabinet-header-stack";
import { pageMeta } from "@/lib/i18n/page-metadata";

export const metadata = pageMeta("meta.unt.title", "meta.unt.description");

export default function AssetsUntPage() {
  return (
    <>
      <DashboardCabinetHeaderStack />
      <div className="relative left-1/2 w-screen -translate-x-1/2">

      <div className="relative min-h-dvh bg-[#f5f5f5]">

        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(52vh,520px)] overflow-hidden" aria-hidden>

          <Image

            src="/images/fees/back.png"

            alt=""

            fill

            className="object-cover object-center"

            priority

          />

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#f5f5f5]" />

        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1320px] px-4 pb-16 pt-2 sm:px-6 sm:pb-20 lg:px-8">

          <UntExplainer />

        </div>

      </div>
    </div>
    </>
  );
}


