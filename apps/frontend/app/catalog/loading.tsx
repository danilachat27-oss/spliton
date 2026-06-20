import { CatalogCardsSkeleton } from "@/features/catalog/ui/catalog-skeleton";

export default function CatalogLoading() {
  return (
    <div className="py-6 sm:py-8">
      <CatalogCardsSkeleton />
    </div>
  );
}