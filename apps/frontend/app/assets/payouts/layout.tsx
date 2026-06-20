import type { ReactNode } from "react";

import { AssetsPageShell } from "@/components/dashboard/assets/assets-page-shell";
import { PayoutsSectionHeader } from "@/components/dashboard/assets/payouts-section-header";

export default function AssetsPayoutsLayout({ children }: { children: ReactNode }) {
  return <AssetsPageShell subheader={<PayoutsSectionHeader />}>{children}</AssetsPageShell>;
}
