import type { ReactNode } from "react";

import { AssetsPageShell } from "@/components/dashboard/assets/assets-page-shell";
import { AssetsSectionNav } from "@/components/dashboard/assets/assets-section-nav";

export default function AssetsPortfolioLayout({ children }: { children: ReactNode }) {
  return <AssetsPageShell subheader={<AssetsSectionNav />}>{children}</AssetsPageShell>;
}
