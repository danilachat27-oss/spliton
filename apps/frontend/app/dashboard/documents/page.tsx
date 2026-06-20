import type { Metadata } from "next";

import { DocumentsCenterContent } from "@/components/dashboard/documents/documents-center-content";
import { documentsPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return documentsPageMetaAsync("meta.documents.title", "meta.documents.description");
}

export default function DocumentsPage() {
  return <DocumentsCenterContent />;
}
