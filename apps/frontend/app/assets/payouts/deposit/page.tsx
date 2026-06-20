import { PayoutDepositCard } from "@/components/dashboard/assets/payout-deposit-card";
import { pageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return pageMetaAsync("meta.payouts.deposit.title", "meta.payouts.deposit.description");
}

export default function AssetsPayoutsDepositPage() {
  return (
    <div className="pb-8">
      <PayoutDepositCard />
    </div>
  );
}
