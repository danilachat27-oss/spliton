import type { Metadata } from "next";

import { SecondaryMarketListingDetailPage } from "@/components/dashboard/secondary-market/secondary-market-listing-detail-page";
import { secondaryMarketPageMetaAsync } from "@/lib/i18n/page-metadata";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ listingId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await params;
  return secondaryMarketPageMetaAsync(
    "meta.secondaryMarket.listing.title",
    "meta.secondaryMarket.listing.description",
  );
}

export default async function SecondaryMarketListingInfoPage({ params }: PageProps) {
  const { listingId } = await params;
  return <SecondaryMarketListingDetailPage listingId={listingId} />;
}
