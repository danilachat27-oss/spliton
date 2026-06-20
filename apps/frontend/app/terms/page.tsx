import { TermsPageContent } from "@/components/legal/terms-page-content";
import { BRAND } from "@/constants/brand";
import { legalPageMetaTfAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return legalPageMetaTfAsync("legal.terms.title", "legal.terms.description", {
    brand: BRAND.name,
  });
}

export default function TermsPage() {
  return <TermsPageContent />;
}
