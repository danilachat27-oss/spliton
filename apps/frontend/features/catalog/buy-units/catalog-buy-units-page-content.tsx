import { CatalogBuyNotFoundScreen } from "@/features/catalog/buy-units/catalog-buy-not-found-screen";
import { CatalogBuyUnitsScreen } from "@/features/catalog/buy-units/catalog-buy-units-screen";
import { resolveCatalogBuyPageData } from "@/lib/catalog/release-buy";

export async function CatalogBuyUnitsPageContent({ id }: { id: string }) {
  const buy = await resolveCatalogBuyPageData(id);
  const row = buy?.row;

  if (!row) {
    return <CatalogBuyNotFoundScreen />;
  }

  return (
    <CatalogBuyUnitsScreen
      row={row}
      detail={buy.detail}
      primaryRound={buy.primaryRound}
      purchaseState={buy.purchaseState}
    />
  );
}
