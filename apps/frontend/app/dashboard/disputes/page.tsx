import type { Metadata } from "next";

import { DisputesPageContent } from "@/components/dashboard/disputes/disputes-page-content";
import { disputesPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return disputesPageMetaAsync("meta.disputes.title", "meta.disputes.description");
}

export default function DisputesPage() {
  return <DisputesPageContent />;
}
