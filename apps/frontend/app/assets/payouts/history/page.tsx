import { PayoutsHistoryPageContent } from "@/components/dashboard/assets/payouts-history-page-content";
import { pageMeta } from "@/lib/i18n/page-metadata";

export const metadata = pageMeta("meta.payouts.history.title", "meta.payouts.history.description");

export default function AssetsPayoutsHistoryPage() {
  return (
    <div className="pb-2">
      <section className="scroll-mt-24">
        <PayoutsHistoryPageContent />
      </section>
    </div>
  );
}
