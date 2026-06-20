import { PrivacyPageContent } from "@/components/legal/privacy-page-content";
import { BRAND } from "@/constants/brand";
import { legalPageMetaTfAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return legalPageMetaTfAsync("legal.privacy.title", "legal.privacy.description", {
    brand: BRAND.name,
  });
}

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
