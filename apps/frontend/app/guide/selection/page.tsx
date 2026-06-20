import type { Metadata } from "next";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { GuideSelectionPage } from "@/components/guide/guide-selection-page";

export const metadata: Metadata = {
  title: "Гид по выбору",
  description:
    "Практический guide Spliton: как выбирать релизы, оценивать структуру сделки, payout history, риски и liquidity potential.",
};

export default function GuideSelectionRoutePage() {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <div className="sticky top-0 z-120 shrink-0 bg-black">
        <DashboardHeader />
      </div>
      <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
        <GuideSelectionPage />
      </div>
    </div>
  );
}
