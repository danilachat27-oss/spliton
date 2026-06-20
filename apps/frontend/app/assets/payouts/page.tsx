import { PayoutsAccrualChartSection } from "@/components/dashboard/assets/payouts-accrual-chart-section";
import { PayoutsOverviewSummary } from "@/components/dashboard/assets/payouts-overview-summary";
import { LocalizedSubpageHero } from "@/components/dashboard/assets/localized-subpage-hero";
import { pageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return pageMetaAsync("meta.payouts.title", "meta.payouts.description");
}

export default function AssetsPayoutsPage() {
  return (
    <div className="space-y-8 pb-8 sm:space-y-10">
      <LocalizedSubpageHero eyebrowKey="meta.payouts.overviewEyebrow" titleKey="meta.payouts.overviewTitle" />

      <PayoutsOverviewSummary />

      <section className="scroll-mt-24">
        <PayoutsAccrualChartSection />
      </section>
    </div>
  );
}
