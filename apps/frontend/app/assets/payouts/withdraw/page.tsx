import { PayoutWithdrawCard } from "@/components/dashboard/assets/payout-withdraw-card";
import { pageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return pageMetaAsync("meta.payouts.withdraw.title", "meta.payouts.withdraw.description");
}

export default function AssetsPayoutsWithdrawPage() {
  return (
    <div className="pb-8">
      <PayoutWithdrawCard />
    </div>
  );
}
