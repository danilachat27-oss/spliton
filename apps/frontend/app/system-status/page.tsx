import type { Metadata } from "next";
import Image from "next/image";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SystemStatusPageContent } from "@/components/system-status/system-status-page-content";
import { SystemStatusPageHero } from "@/components/system-status/system-status-page-hero";
import { systemStatusPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return systemStatusPageMetaAsync("meta.systemStatus.title", "meta.systemStatus.description");
}

export default function SystemStatusPage() {
  return (
    <div className="relative min-h-dvh bg-[#0b0b0b] text-white">
      <DashboardHeader />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(44vh,380px)] overflow-hidden" aria-hidden>
        <Image src="/images/fees/back.png" alt="" fill className="object-cover object-top opacity-35" priority />
      </div>
      <main className="relative z-10 pb-10">
        <SystemStatusPageHero />
        <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="pb-8 sm:pb-10">
            <SystemStatusPageContent />
          </div>
        </div>
      </main>
    </div>
  );
}
