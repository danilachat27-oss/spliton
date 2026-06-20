import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ReferralProgramScreen } from "@/components/referral/referral-program-screen";
import { referralPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return referralPageMetaAsync("meta.referral.title", "meta.referral.description");
}

export default function ReferralProgramPage() {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-black">
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain" data-mobile-scroll-root>
        <DashboardHeader sticky={false} />
        <ReferralProgramScreen />
      </div>
    </div>
  );
}
