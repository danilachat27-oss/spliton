import { Suspense } from "react";

import { assetsSellUnitsPath } from "@/constants/routes";
import {
  AssetsSellUnitsPageContentLoader,
  AssetsSellUnitsPageSkeleton,
} from "@/features/assets/sell-units/assets-sell-units-page-loader";
import { resolveSellPageCatalogRow } from "@/lib/assets/resolve-sell-page-data";
import { pageMetaAsync, pageMetaTfAsync } from "@/lib/i18n/page-metadata";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const row = await resolveSellPageCatalogRow(id);
  if (!row) {
    return pageMetaAsync("meta.sell.title", "meta.sell.description");
  }
  const meta = await pageMetaTfAsync(
    "meta.sell.titleWithSymbol",
    "meta.sell.descriptionWithRelease",
    { symbol: row.symbol, title: row.title },
  );
  return { ...meta, alternates: { canonical: assetsSellUnitsPath(id) } };
}

export default async function AssetsSellUnitsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<AssetsSellUnitsPageSkeleton />}>
      <AssetsSellUnitsPageContentLoader id={id} />
    </Suspense>
  );
}
