import type { Metadata } from "next";

import { disputesPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return disputesPageMetaAsync("meta.disputes.detail.title", "meta.disputes.detail.description");
}

export default function DisputeDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
