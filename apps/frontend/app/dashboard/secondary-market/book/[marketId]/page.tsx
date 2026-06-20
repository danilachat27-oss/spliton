import type { Metadata } from "next";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SecondaryMarketBookPage } from "@/components/dashboard/secondary-market/secondary-market-book-page";
import { secondaryMarketPageMetaTfAsync } from "@/lib/i18n/page-metadata";

type PageProps = { params: Promise<{ marketId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { marketId } = await params;
  const symbol = marketId.toUpperCase();
  return secondaryMarketPageMetaTfAsync(
    "meta.secondaryMarket.book.title",
    "meta.secondaryMarket.book.description",
    { symbol },
  );
}

export default async function SecondaryMarketBookRoutePage({ params }: PageProps) {
  const { marketId } = await params;

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-black">
      <div className="shrink-0">
        <DashboardHeader sticky={false} />
      </div>
      <SecondaryMarketBookPage marketId={marketId} />
    </div>
  );
}
