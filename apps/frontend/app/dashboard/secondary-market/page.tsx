import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { secondaryMarketPageMetaAsync } from "@/lib/i18n/page-metadata";

const SecondaryMarketScreen = dynamic(
  () =>
    import("@/components/dashboard/secondary-market/secondary-market-screen").then(
      (mod) => ({ default: mod.SecondaryMarketScreen }),
    ),
);

export async function generateMetadata(): Promise<Metadata> {
  return secondaryMarketPageMetaAsync("meta.secondaryMarket.title", "meta.secondaryMarket.description");
}

export default function SecondaryMarketPage() {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-black">
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain" data-mobile-scroll-root>
        <DashboardHeader sticky={false} />
        <SecondaryMarketScreen />
      </div>
    </div>
  );
}
