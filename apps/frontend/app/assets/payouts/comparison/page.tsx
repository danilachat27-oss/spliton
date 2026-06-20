import { LocalizedSubpageHero } from "@/components/dashboard/assets/localized-subpage-hero";
import { PayoutsBalanceScale } from "@/components/dashboard/assets/payouts-balance-scale";
import { pageMeta } from "@/lib/i18n/page-metadata";

export const metadata = pageMeta("meta.payouts.comparison.title", "meta.payouts.comparison.description");

export default function AssetsPayoutsComparisonPage() {
  return (
    <div className="space-y-8 pb-8 sm:space-y-10">
      <LocalizedSubpageHero eyebrowKey="meta.payouts.comparisonEyebrow" titleKey="meta.payouts.comparison.hero" />

      <section className="scroll-mt-24">
        <PayoutsBalanceScale />
      </section>
    </div>
  );
}
