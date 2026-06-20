import type { Metadata } from "next";

import { DashboardCatalog } from "@/components/dashboard/dashboard-catalog";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import {
  DashboardUnifiedJourneyBlock,
  DashboardValueGrid,
} from "@/components/dashboard/dashboard-landing-sections";
import { DashboardPayouts } from "@/components/dashboard/dashboard-payouts";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";

export const metadata: Metadata = {
  title: "Кабинет",
  description:
    "Кабинет Spliton: баланс USDT, доли в треках, выплаты, каталог релизов и вторичный рынок в одном лендинге.",
};

export default function DashboardPage() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-[#f6f7f9] font-sans text-white antialiased **:font-sans">
      <DashboardHeader />
      <div className="overflow-hidden rounded-b-[44px] bg-black shadow-[0_18px_40px_-34px_rgba(0,0,0,0.85)] md:rounded-b-[56px]">
        <main className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <DashboardHero />
        </main>
      </div>
      <main className="relative mx-auto w-full max-w-[1400px] px-4 pb-0 sm:px-6 lg:px-8">
        <DashboardStats />
        <DashboardValueGrid />
        <div className="relative left-1/2 right-1/2 -mx-[50vw] mt-4 w-screen bg-black py-12 md:mt-6 md:py-16 lg:py-20">
          <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,2.15fr)_minmax(280px,1fr)] lg:items-start lg:gap-12 xl:gap-14">
              <DashboardCatalog />
              <DashboardPayouts />
            </div>
            <DashboardUnifiedJourneyBlock />
          </div>
        </div>
      </main>
    </div>
  );
}
